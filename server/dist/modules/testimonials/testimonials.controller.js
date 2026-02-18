"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestimonials = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const response_1 = __importDefault(require("../../utils/response"));
const Testimonial_1 = __importDefault(require("../../models/Testimonial"));
exports.getTestimonials = (0, asyncHandler_1.default)(async (req, res) => {
    const testimonials = await Testimonial_1.default.find({ isActive: true }).sort({ order: 1 });
    return (0, response_1.default)(res, testimonials);
});
