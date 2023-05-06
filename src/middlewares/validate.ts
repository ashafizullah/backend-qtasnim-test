import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({
      params: req.params,
      query: req.query,
      body: req.body,
    });

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: 'failed',
        errors: error.errors,
      });
    } else {
      next(error);
    }
  }
};
