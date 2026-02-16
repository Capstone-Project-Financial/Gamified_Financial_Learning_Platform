import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import sendSuccess from '../../utils/response';
import Testimonial from '../../models/Testimonial';

export const getTestimonials = asyncHandler(async (req: Request, res: Response) => {
  const testimonials = await Testimonial.find({ isActive: true }).sort({ order: 1 });
  return sendSuccess(res, testimonials);
});
