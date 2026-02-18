"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const achievements_controller_1 = require("./achievements.controller");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, achievements_controller_1.listAchievements);
router.post('/check', auth_1.authenticate, achievements_controller_1.recalcAchievements);
exports.default = router;
