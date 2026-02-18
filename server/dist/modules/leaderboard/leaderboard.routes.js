"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const leaderboard_controller_1 = require("./leaderboard.controller");
const router = (0, express_1.Router)();
router.get('/', leaderboard_controller_1.getLeaderboardController);
router.get('/me', auth_1.authenticate, leaderboard_controller_1.getMyStandingController);
exports.default = router;
