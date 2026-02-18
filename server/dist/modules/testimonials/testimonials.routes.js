"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testimonials_controller_1 = require("./testimonials.controller");
const router = (0, express_1.Router)();
router.get('/', testimonials_controller_1.getTestimonials);
exports.default = router;
