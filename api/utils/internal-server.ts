// Internal Express server for serving temporary JSON files
// Binds to localhost only (127.0.0.1) - not accessible externally
// Playwright browser context can access it via HTTP

import express, { Request, Response } from 'express';
import { createServer, Server } from 'net';
import { createLayoutFileStream, createDataFileStream, readLayoutFile, readDataFile } from './temp-storage.js';
import { ErrorCode } from './errors.js';

let internalServer: any = null;
let internalPort: number = 0;
const INTERNAL_PORT_START = 30000;

/**
 * Find an available port starting from a given port number
 */
async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });

    server.listen(startPort, '127.0.0.1', () => {
      const port = (server.address() as any)?.port || startPort;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

/**
 * Start internal server on localhost only
 * Returns the port number the server is listening on
 */
export async function startInternalServer(assetsPath?: string): Promise<number> {
  if (internalServer) {
    return internalPort; // Already started
  }

  const app = express();

  if (assetsPath) {
    // assetsPath should be the path to the 'public' directory
    app.use(express.static(assetsPath));
    // Serve library assets at /assets to match index.html expected paths
    const { join } = await import('path');
    app.use('/assets', express.static(join(assetsPath, 'libs')));
  }

  // Endpoint for layout (streaming)
  app.get('/layout/:guid', (req: Request, res: Response) => {
    try {
      const { guid } = req.params;
      res.setHeader('Content-Type', 'application/json');
      const stream = createLayoutFileStream(guid);
      stream.pipe(res);
      stream.on('error', (error: any) => {
        if (!res.headersSent) {
          res.status(404).json({
            error: {
              code: ErrorCode.VALIDATION_ERROR,
              message: error.message || 'Layout not found',
            },
          });
        }
      });
    } catch (error: any) {
      res.status(404).json({
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: error.message || 'Layout not found',
        },
      });
    }
  });

  // Endpoint for data (streaming)
  app.get('/data/:guid', (req: Request, res: Response) => {
    try {
      const { guid } = req.params;
      res.setHeader('Content-Type', 'application/json');
      const stream = createDataFileStream(guid);
      stream.pipe(res);
      stream.on('error', (error: any) => {
        if (!res.headersSent) {
          res.status(404).json({
            error: {
              code: ErrorCode.VALIDATION_ERROR,
              message: error.message || 'Data not found',
            },
          });
        }
      });
    } catch (error: any) {
      res.status(404).json({
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: error.message || 'Data not found',
        },
      });
    }
  });

  // Find available port
  const port = await findAvailablePort(INTERNAL_PORT_START);

  // Start server
  internalServer = app.listen(port, '127.0.0.1', () => {
    // Server is listening
  });

  internalPort = port;

  return internalPort;
}

/**
 * Get the base URL for the internal server
 */
export function getInternalServerUrl(): string {
  if (!internalPort) {
    throw new Error('Internal server not started');
  }
  return `http://127.0.0.1:${internalPort}`;
}

/**
 * Stop the internal server
 */
export async function stopInternalServer(): Promise<void> {
  if (internalServer) {
    return new Promise((resolve) => {
      internalServer.close(() => {
        internalServer = null;
        internalPort = 0;
        resolve();
      });
    });
  }
}
