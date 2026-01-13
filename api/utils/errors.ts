// Custom error classes for better error classification
// Provides type-safe error handling with proper HTTP status codes

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNSUPPORTED_OUTPUT_FORMAT = 'UNSUPPORTED_OUTPUT_FORMAT',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RENDER_ERROR = 'RENDER_ERROR',
  EXCEL_GENERATION_ERROR = 'EXCEL_GENERATION_ERROR',
}

/**
 * Base API error class
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    public readonly details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    // Capture stack trace if available (not in all Node.js versions)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
  }
}

/**
 * Timeout error (504)
 */
export class TimeoutError extends ApiError {
  constructor(message: string = 'Request timeout', details?: any) {
    super(message, ErrorCode.TIMEOUT_ERROR, 504, details);
  }
}

/**
 * Service unavailable error (503)
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message: string = 'Service temporarily unavailable', details?: any) {
    super(message, ErrorCode.SERVICE_UNAVAILABLE, 503, details);
  }
}

/**
 * Render error (500)
 */
export class RenderError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.RENDER_ERROR, 500, details);
  }
}

/**
 * Excel generation error (500)
 */
export class ExcelGenerationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.EXCEL_GENERATION_ERROR, 500, details);
  }
}

/**
 * Internal server error (500)
 */
export class InternalError extends ApiError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, ErrorCode.INTERNAL_ERROR, 500, details);
  }
}

/**
 * Classify an error to determine its type and HTTP status
 * Supports both custom ApiError instances and generic Error objects
 */
export function classifyError(error: Error): { status: number; code: ErrorCode } {
  // If it's already an ApiError, use its properties
  if (error instanceof ApiError) {
    return { status: error.statusCode, code: error.code };
  }

  // Otherwise, classify based on error message and type
  const message = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  // Validation errors
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('missing') ||
    errorName.includes('validation')
  ) {
    return { status: 400, code: ErrorCode.VALIDATION_ERROR };
  }

  // Timeout errors
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    errorName.includes('timeout')
  ) {
    return { status: 504, code: ErrorCode.TIMEOUT_ERROR };
  }

  // Service unavailable errors
  if (
    message.includes('browser') ||
    message.includes('unavailable') ||
    message.includes('crashed') ||
    message.includes('disconnected') ||
    errorName.includes('browser')
  ) {
    return { status: 503, code: ErrorCode.SERVICE_UNAVAILABLE };
  }

  // Render errors
  if (
    message.includes('render') ||
    message.includes('renderer') ||
    message.includes('container not found')
  ) {
    return { status: 500, code: ErrorCode.RENDER_ERROR };
  }

  // Excel generation errors
  if (message.includes('excel generation') || message.includes('exporttoxlsx')) {
    return { status: 500, code: ErrorCode.EXCEL_GENERATION_ERROR };
  }

  // Default to internal error
  return { status: 500, code: ErrorCode.INTERNAL_ERROR };
}