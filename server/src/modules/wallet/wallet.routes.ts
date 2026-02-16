import { Router } from 'express';

import { authenticate } from '../../middleware/auth';
import validate from '../../middleware/validate';
import { amountSchema, deductSchema, expensesSchema } from './wallet.schema';
import {
  addDiscretionaryFunds,
  deductDiscretionaryFunds,
  earnLucre,
  getWalletSummary,
  payout,
  setExpenses
} from './wallet.controller';

const router = Router();

router.get('/', authenticate, getWalletSummary);
router.post('/earn', authenticate, validate(amountSchema), earnLucre);
router.post('/discretionary/add', authenticate, validate(amountSchema), addDiscretionaryFunds);
router.post('/discretionary/deduct', authenticate, validate(deductSchema), deductDiscretionaryFunds);
router.post('/payout', authenticate, payout);
router.put('/expenses', authenticate, validate(expensesSchema), setExpenses);

export default router;

