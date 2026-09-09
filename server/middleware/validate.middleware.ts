import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      if (err instanceof ZodError || err.issues) {
        const issues = err.issues || err.errors || [];
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: issues.map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message}`).join(', '),
            details: issues,
          },
        });
      }
      next(err);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed as any;
      next();
    } catch (err: any) {
      if (err instanceof ZodError || err.issues) {
        const issues = err.issues || err.errors || [];
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: issues.map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message}`).join(', '),
          },
        });
      }
      next(err);
    }
  };
}
