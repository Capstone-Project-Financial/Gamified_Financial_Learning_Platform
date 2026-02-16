import { Router } from 'express';

import { authenticate } from '../../middleware/auth';
import { listAchievements, recalcAchievements } from './achievements.controller';

const router = Router();

router.get('/', authenticate, listAchievements);
router.post('/check', authenticate, recalcAchievements);

export default router;

