"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = __importDefault(require("../../middleware/validate"));
const stocks_schema_1 = require("./stocks.schema");
const stocks_controller_1 = require("./stocks.controller");
const router = (0, express_1.Router)();
router.get('/', stocks_controller_1.listStocksController);
router.get('/portfolio', auth_1.authenticate, stocks_controller_1.portfolioController);
router.post('/refresh', auth_1.authenticate, stocks_controller_1.refreshStocksController);
router.post('/:symbol/buy', auth_1.authenticate, (0, validate_1.default)(stocks_schema_1.tradeSchema), stocks_controller_1.buyStockController);
router.post('/:symbol/sell', auth_1.authenticate, (0, validate_1.default)(stocks_schema_1.tradeSchema), stocks_controller_1.sellStockController);
exports.default = router;
