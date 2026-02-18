"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
const stocks_1 = require("../data/stocks");
const Stock_1 = require("../models/Stock");
const run = async () => {
    await (0, database_1.connectDatabase)();
    logger_1.default.info('Seeding data...');
    for (const seed of stocks_1.stockSeeds) {
        await Stock_1.StockModel.findOneAndUpdate({ symbol: seed.symbol }, seed, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        });
    }
    logger_1.default.info('Seed completed');
    await (0, database_1.disconnectDatabase)();
    process.exit(0);
};
run().catch((error) => {
    logger_1.default.error({ err: error }, 'Seed failed');
    process.exit(1);
});
