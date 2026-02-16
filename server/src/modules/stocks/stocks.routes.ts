import { Router } from 'express';

import { authenticate } from '../../middleware/auth';
import validate from '../../middleware/validate';
import { tradeSchema } from './stocks.schema';
import {
  buyStockController,
  listStocksController,
  portfolioController,
  refreshStocksController,
  sellStockController
} from './stocks.controller';

const router = Router();

router.get('/', listStocksController);
router.get('/portfolio', authenticate, portfolioController);
router.post('/refresh', authenticate, refreshStocksController);
router.post('/:symbol/buy', authenticate, validate(tradeSchema), buyStockController);
router.post('/:symbol/sell', authenticate, validate(tradeSchema), sellStockController);

export default router;

