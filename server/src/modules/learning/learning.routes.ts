import { Router } from 'express';

import { authenticate } from '../../middleware/auth';
import validate from '../../middleware/validate';
import { quizSubmissionSchema } from './learning.schema';
import {
  completeLessonController,
  getLesson,
  getModules,
  getProgressController,
  getQuizController,
  submitQuizController
} from './learning.controller';

const router = Router();

router.get('/modules', authenticate, getModules);
router.get('/progress', authenticate, getProgressController);
router.get('/lessons/:moduleId/:lessonId', authenticate, getLesson);
router.post('/lessons/:moduleId/:lessonId/complete', authenticate, completeLessonController);
router.get('/quizzes/:moduleId', authenticate, getQuizController);
router.post('/quizzes/:moduleId/submit', authenticate, validate(quizSubmissionSchema), submitQuizController);

export default router;

