"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = __importDefault(require("../../middleware/validate"));
const wallet_schema_1 = require("./wallet.schema");
const wallet_controller_1 = require("./wallet.controller");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, wallet_controller_1.getWalletSummary);
router.post('/earn', auth_1.authenticate, (0, validate_1.default)(wallet_schema_1.amountSchema), wallet_controller_1.earnLucre);
router.post('/discretionary/add', auth_1.authenticate, (0, validate_1.default)(wallet_schema_1.amountSchema), wallet_controller_1.addDiscretionaryFunds);
router.post('/discretionary/deduct', auth_1.authenticate, (0, validate_1.default)(wallet_schema_1.deductSchema), wallet_controller_1.deductDiscretionaryFunds);
router.post('/payout', auth_1.authenticate, wallet_controller_1.payout);
router.put('/expenses', auth_1.authenticate, (0, validate_1.default)(wallet_schema_1.expensesSchema), wallet_controller_1.setExpenses);
exports.default = router;
