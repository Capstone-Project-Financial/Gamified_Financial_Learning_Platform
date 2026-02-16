import { z } from 'zod';

export const tradeSchema = z.object({
  shares: z.number().int().positive()
});

