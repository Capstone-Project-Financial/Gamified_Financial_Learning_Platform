"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const logger_1 = __importDefault(require("./utils/logger"));
(0, server_1.startServer)().catch((error) => {
    logger_1.default.error({ err: error }, 'Failed to start server');
    process.exit(1);
});
