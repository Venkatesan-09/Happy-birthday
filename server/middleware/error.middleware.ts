import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Do not expose internal stack traces or secrets in production
  const isProduction = config.nodeEnv === 'production';

  // Log error internally
  console.error(`[Error] ${req.method} ${req.url} - ${code} (${statusCode}):`, err.message);
  if (!isProduction && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: isProduction && statusCode === 500 ? 'Internal server error' : message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
