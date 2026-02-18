"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const logger_1 = __importDefault(require("./utils/logger"));
const startServer = async () => {
    await (0, database_1.connectDatabase)();
    const server = http_1.default.createServer(app_1.default);
    server.listen(env_1.env.PORT, () => {
        logger_1.default.info(`Server running on port ${env_1.env.PORT}`);
    });
    const shutdown = async () => {
        logger_1.default.info('Shutting down server...');
        server.close(async () => {
            await (0, database_1.disconnectDatabase)();
            process.exit(0);
        });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    return server;
};
exports.startServer = startServer;
