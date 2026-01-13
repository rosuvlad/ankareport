# AnkaReport API

Express API server for AnkaReport export functionality, supporting HTML, PDF, and Excel generation via Playwright.

## Features

- **HTML Export**: Generate rendered HTML reports
- **PDF Export**: Generate PDF reports from layouts
- **Excel Export**: Generate Excel files (requires utility functions from AnkaReport library)
- **Swagger Documentation**: Interactive API documentation at `/swagger`
- **Health Check**: Monitor API health at `/health`

## Prerequisites

- Node.js 20+
- AnkaReport library built (`npm run build` from project root)
- Playwright browsers installed (`npx playwright install chromium`)

## Installation

```bash
# From project root
npm run api:install
```

## Development

```bash
# From project root
npm run api:dev
```

The API will be available at `http://localhost:3000`

## Production

```bash
# Build
npm run api:build

# Start
npm run api:start
```

## Environment Variables

Create `api/.env` file:

```env
PORT=3000
NODE_ENV=production
MAX_REQUEST_SIZE=50mb
REQUEST_TIMEOUT=60000
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
ALLOWED_ORIGINS=*
MAX_CONCURRENT_PAGES=10
NODE_OPTIONS=--max-old-space-size=4096
```

## API Endpoints

### POST /api/v1/report-generator

Generate report in HTML, PDF, or Excel format.

**Query Parameters:**
- `format` (required): `html`, `pdf`, or `excel`

**Request Body:**
```json
{
  "data": { ... },
  "layout": {
    "supportedOutputs": "PDF_AND_EXCEL",
    ...
  },
  "filename": "report"
}
```

**Layout `supportedOutputs` Property:**
- `PDF_AND_EXCEL` (default): Both PDF and Excel exports are allowed
- `PDF`: Only PDF export is allowed
- `EXCEL`: Only Excel export is allowed
- HTML format is always allowed regardless of this setting

**Response:**
- HTML: `text/html`
- PDF: `application/pdf`
- Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Error Response (400):**
```json
{
  "error": {
    "code": "UNSUPPORTED_OUTPUT_FORMAT",
    "message": "This report only supports PDF output. Excel export is not allowed."
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "browser": "connected",
  "uptime": 12345
}
```

### GET /swagger

Interactive API documentation.

## Docker

### Build

```bash
docker build -t ankareport-api .
```

### Run

```bash
docker run -p 3000:3000 ankareport-api
```

### Docker Compose

```bash
docker-compose up
```

## Notes

- Excel export currently returns a placeholder. Full implementation requires copying utility functions (`generateItems`, `getExcelMeta`, `getExcelPaperSize`, `hexToArgb`) from the AnkaReport library.
- The API uses a single Playwright browser instance with multiple pages for concurrency.
- Maximum concurrent pages is configurable via `MAX_CONCURRENT_PAGES` environment variable.
