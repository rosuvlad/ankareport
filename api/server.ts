import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { chromium, Browser, Page } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import { exportToExcel } from './handlers/excel-export.js';
import { classifyError, ErrorCode, ServiceUnavailableError, TimeoutError, RenderError, ExcelGenerationError } from './utils/errors.js';
import { storeReportData, cleanupReportData, cleanupStaleFiles } from './utils/temp-storage.js';
import { startInternalServer, getInternalServerUrl, stopInternalServer } from './utils/internal-server.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_REQUEST_SIZE = process.env.MAX_REQUEST_SIZE || '50mb';
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100');
const MAX_CONCURRENT_PAGES = parseInt(process.env.MAX_CONCURRENT_PAGES || '10');
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '120000'); // 2 minutes default
const LARGE_PAYLOAD_THRESHOLD = parseInt(process.env.LARGE_PAYLOAD_THRESHOLD || '1048576'); // 1MB default
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const CLEANUP_INTERVAL_MS = parseInt(process.env.CLEANUP_INTERVAL_MS || '1800000'); // 30 minutes default

let browser: Browser | null = null;
let activePages = 0;
let cleanupIntervalId: NodeJS.Timeout | null = null;
const serverStartTime = Date.now();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS === '*' ? true : process.env.ALLOWED_ORIGINS?.split(',') || '*',
}));

app.use(express.json({ limit: MAX_REQUEST_SIZE }));

// Request timeout middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({
        error: {
          code: ErrorCode.TIMEOUT_ERROR,
          message: 'Request timeout',
        },
      });
      res.end();
    }
  }, REQUEST_TIMEOUT_MS);

  // Clear timeout when response is sent
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    clearTimeout(timeout);
    originalEnd.apply(res, args);
  };

  next();
});

// Static file serving for AnkaReport assets (bundled in public/libs)
app.use('/assets', express.static(join(__dirname, 'public/libs'), {
  maxAge: '1y', // Cache for 1 year
  etag: true,
  lastModified: true,
}));

// Static file serving for public assets (index.html template)
app.use(express.static(join(__dirname, 'public'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: RATE_LIMIT_MAX,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AnkaReport API',
      version: '1.0.0',
      description: 'API for generating reports in HTML, PDF, and Excel formats',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./server.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    browser: browser ? 'connected' : 'disconnected',
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
  });
});

// Browser management
async function getBrowser(): Promise<Browser> {
  // Check if browser exists and is still connected (recovery from crash)
  if (!browser || !browser.isConnected()) {
    // Close disconnected browser if it exists
    if (browser && !browser.isConnected()) {
      try {
        await browser.close();
      } catch (error) {
        // Ignore errors when closing disconnected browser
      }
    }
    
    // Launch new browser instance
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    // Handle browser disconnection
    browser.on('disconnected', () => {
      browser = null;
    });
  }
  return browser;
}

interface PageWithErrors {
  page: Page;
  errors: Error[];
}

async function createPageWithErrorHandling(): Promise<PageWithErrors> {
  // Atomically increment activePages and check limit (prevents race condition)
  // If limit exceeded, throw error immediately (caller will handle)
  activePages++;
  
  // Check limit after increment (fail-safe: we'll decrement on error)
  if (activePages > MAX_CONCURRENT_PAGES) {
    activePages--;
    throw new ServiceUnavailableError(
      `Service temporarily unavailable. Maximum concurrent pages (${MAX_CONCURRENT_PAGES}) exceeded. Please try again later.`
    );
  }
  
  try {
    const browserInstance = await getBrowser();
    const page = await browserInstance.newPage();
    const errors: Error[] = [];

    page.on('pageerror', (error: Error) => {
      errors.push(error);
    });

    page.on('console', (msg: { type: () => string; text: () => string }) => {
      if (msg.type() === 'error') {
        errors.push(new Error(msg.text()));
      }
    });

    page.on('crash', () => {
      errors.push(new Error('Page crashed'));
    });

    return { page, errors };
  } catch (error) {
    // If page creation fails, decrement counter
    activePages--;
    throw error;
  }
}

async function closePage(page: Page): Promise<void> {
  await page.close();
  activePages--;
}

// Error classification is now handled by utils/errors.ts

// Load index.html template (cached after first load)
let indexHtmlTemplate: string | null = null;
function getIndexHtmlTemplate(): string {
  if (!indexHtmlTemplate) {
    const templatePath = join(__dirname, 'public/index.html');
    indexHtmlTemplate = readFileSync(templatePath, 'utf-8');
  }
  return indexHtmlTemplate!;
}

// HTML Export Handler
async function exportToHtml(layout: any, data: any): Promise<string> {
  const { page, errors } = await createPageWithErrorHandling();
  try {
    // Load template and inject layout/data
    const template = getIndexHtmlTemplate();
    
    // Inject layout and data into the template as window variables
    const html = template.replace(
      '</head>',
      `<script>
        window.__ANKAREPORT_LAYOUT__ = ${JSON.stringify(layout).replace(/</g, '\\u003c')};
        window.__ANKAREPORT_DATA__ = ${JSON.stringify(data).replace(/</g, '\\u003c')};
      </script>
      </head>`
    );

    await page.setContent(html, { waitUntil: 'networkidle', baseURL: BASE_URL });
    
    // Wait for renderer to be ready or error
    await page.waitForFunction(
      () => (window as any).rendererReady === true || (window as any).renderError !== undefined,
      { timeout: 30000 }
    ).catch(() => {
      // Timeout - check if there was an error
      if (errors.length > 0) {
        throw errors[0];
      }
      throw new TimeoutError('Renderer timeout');
    });

    // Check for errors
    const renderError = await page.evaluate(() => (window as any).renderError);
    if (renderError) {
      throw new RenderError(renderError);
    }

    if (errors.length > 0) {
      throw errors[0];
    }

    const containerHandle = await page.$('#report-container');
    if (!containerHandle) {
      throw new RenderError('Report container not found');
    }

    const htmlContent = await containerHandle.innerHTML();
    return htmlContent;
  } finally {
    await closePage(page);
  }
}

// PDF Export Handler
async function exportToPdf(layout: any, data: any): Promise<Buffer> {
  const { page, errors } = await createPageWithErrorHandling();
  try {
    // Load template and inject layout/data
    const template = getIndexHtmlTemplate();
    
    // Inject layout and data into the template as window variables
    const html = template.replace(
      '</head>',
      `<script>
        window.__ANKAREPORT_LAYOUT__ = ${JSON.stringify(layout).replace(/</g, '\\u003c')};
        window.__ANKAREPORT_DATA__ = ${JSON.stringify(data).replace(/</g, '\\u003c')};
      </script>
      </head>`
    );

    await page.setContent(html, { waitUntil: 'networkidle', baseURL: BASE_URL });
    
    // Wait for renderer to be ready or error
    await page.waitForFunction(
      () => (window as any).rendererReady === true || (window as any).renderError !== undefined,
      { timeout: 30000 }
    ).catch(() => {
      if (errors.length > 0) {
        throw errors[0];
      }
      throw new TimeoutError('Renderer timeout');
    });

    // Check for errors
    const renderError = await page.evaluate(() => (window as any).renderError);
    if (renderError) {
      throw new RenderError(renderError);
    }

    if (errors.length > 0) {
      throw errors[0];
    }

    // Get page dimensions from layout
    const pageSize = layout.pageSize || 'A4';
    const width = layout.width;
    const height = layout.height;

    const pdfOptions: any = {
      printBackground: true,
    };

    if (width && height) {
      pdfOptions.width = `${width}px`;
      pdfOptions.height = `${height}px`;
    } else {
      pdfOptions.format = pageSize;
    }

    const pdf = await page.pdf(pdfOptions);

    return Buffer.from(pdf);
  } finally {
    await closePage(page);
  }
}

// Main endpoint
/**
 * @swagger
 * /api/v1/report-generator:
 *   post:
 *     summary: Generate report in HTML, PDF, or Excel format
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [html, pdf, excel]
 *         description: Output format
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *               - layout
 *             properties:
 *               data:
 *                 type: object
 *                 description: Report data
 *               layout:
 *                 type: object
 *                 description: AnkaReport layout configuration
 *               filename:
 *                 type: string
 *                 description: Optional filename for Content-Disposition header
 *     responses:
 *       200:
 *         description: Report generated successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
app.post('/api/v1/report-generator', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Note: Concurrent page limit is now checked atomically in createPageWithErrorHandling()
    
    const { format } = req.query;
    const { data, layout, filename } = req.body;

    // Validation
    if (!format || !['html', 'pdf', 'excel'].includes(format as string)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid format parameter. Must be html, pdf, or excel',
        },
      });
    }

    if (!data || !layout) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: data and layout are required',
        },
      });
    }

    if (Array.isArray(data)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data must be an object, not an array',
        },
      });
    }

    // Sanitize filename
    const safeFilename = filename
      ? filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255)
      : 'report';

    // Generate report based on format
    if (format === 'html') {
      const html = await exportToHtml(layout, data);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename}.html"`);
      res.send(html);
    } else if (format === 'pdf') {
      const pdf = await exportToPdf(layout, data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"`);
      res.send(pdf);
    } else if (format === 'excel') {
      const { page, errors } = await createPageWithErrorHandling();
      try {
        // Check for errors before loading library
        if (errors.length > 0) {
          throw errors[0];
        }
        
        // Load template and inject layout/data for Excel export
        const template = getIndexHtmlTemplate();
        const html = template.replace(
          '</head>',
          `<script>
            window.__ANKAREPORT_LAYOUT__ = ${JSON.stringify(layout).replace(/</g, '\\u003c')};
            window.__ANKAREPORT_DATA__ = ${JSON.stringify(data).replace(/</g, '\\u003c')};
          </script>
          </head>`
        );
        await page.setContent(html, { waitUntil: 'networkidle', baseURL: BASE_URL });
        
        // Check for errors after loading library
        if (errors.length > 0) {
          throw errors[0];
        }
        
        // Generate Excel with timeout
        const excel = await Promise.race([
          exportToExcel(page, layout, data),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new TimeoutError('Excel generation timeout')), 60000)
          ),
        ]);
        
        // Check for errors after Excel generation
        if (errors.length > 0) {
          throw errors[0];
        }
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.xlsx"`);
        res.send(excel);
      } finally {
        await closePage(page);
      }
    }
  } catch (error: any) {
    next(error);
  }
});

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const { status, code } = classifyError(err);
  res.status(status).json({
    error: {
      code,
      message: err.message || 'An error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
};

app.use(errorHandler);

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down server...');
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
  await stopInternalServer();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function startServer() {
  try {
    // Clean up stale temp files at startup (older than 1 hour)
    try {
      const cleanedCount = await cleanupStaleFiles();
      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} stale temp file(s) at startup`);
      }
    } catch (error) {
      console.error('Error during startup cleanup:', error);
      // Don't fail startup if cleanup fails
    }
    
    // Start internal server for temporary JSON storage (localhost only)
    const internalPort = await startInternalServer();
    console.log(`Internal server running on 127.0.0.1:${internalPort}`);
    
    // Pre-load browser
    await getBrowser();
    console.log('Browser initialized');

    // Set up periodic cleanup
    cleanupIntervalId = setInterval(async () => {
      try {
        const cleanedCount = await cleanupStaleFiles();
        if (cleanedCount > 0) {
          console.log(`Periodic cleanup: cleaned up ${cleanedCount} stale temp file(s)`);
        }
      } catch (error) {
        console.error('Error during periodic cleanup:', error);
      }
    }, CLEANUP_INTERVAL_MS);

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/swagger`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
