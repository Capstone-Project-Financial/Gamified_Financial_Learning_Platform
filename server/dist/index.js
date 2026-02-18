"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const logger_1 = __importDefault(require("./utils/logger"));
const env_1 = require("./config/env");
// Diagnostic: log email config presence at startup
logger_1.default.info({
    emailConfigured: !!(env_1.env.EMAIL_HOST && env_1.env.EMAIL_USER && env_1.env.EMAIL_PASSWORD),
    EMAIL_HOST: env_1.env.EMAIL_HOST || 'NOT SET',
    EMAIL_PORT: env_1.env.EMAIL_PORT || 'NOT SET',
    EMAIL_USER: env_1.env.EMAIL_USER ? env_1.env.EMAIL_USER.slice(0, 8) + '...' : 'NOT SET',
    EMAIL_PASSWORD: env_1.env.EMAIL_PASSWORD ? 'SET (' + env_1.env.EMAIL_PASSWORD.length + ' chars)' : 'NOT SET',
    EMAIL_FROM: env_1.env.EMAIL_FROM || 'NOT SET',
}, 'Email configuration at startup');
(0, server_1.startServer)().catch((error) => {
    logger_1.default.error({ err: error }, 'Failed to start server');
    process.exit(1);
});
