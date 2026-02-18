"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const logger_1 = __importDefault(require("../utils/logger"));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const notFoundHandler = (req, res, _next) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`
    });
};
exports.notFoundHandler = notFoundHandler;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (err, _req, res, _next) => {
    const statusCode = err instanceof ApiError_1.default ? err.statusCode : 500;
    const message = err.message || 'Something went wrong';
    logger_1.default.error({ err }, message);
    res.status(statusCode).json({
        status: 'error',
        message,
        details: err instanceof ApiError_1.default ? err.details : undefined
    });
};
exports.errorHandler = errorHandler;
