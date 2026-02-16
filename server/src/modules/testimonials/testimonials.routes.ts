import { Router } from 'express';
import { getTestimonials } from './testimonials.controller';

const router = Router();

router.get('/', getTestimonials);

export default router;
