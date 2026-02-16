import { Router } from 'express';

import { authenticate } from '../../middleware/auth';
import { getLeaderboardController, getMyStandingController } from './leaderboard.controller';

const router = Router();

router.get('/', getLeaderboardController);
router.get('/me', authenticate, getMyStandingController);

export default router;

