import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import ApiError from '../utils/ApiError';

export const validate =
  (schema: z.ZodType, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errorDetails = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      return next(new ApiError(400, 'Validation failed: ' + errorDetails.join(', ')));
    }

    req[source] = result.data;
    return next();
  };

export default validate;
