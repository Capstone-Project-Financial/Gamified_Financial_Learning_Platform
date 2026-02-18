"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = void 0;
const sendSuccess = (res, data, message, statusCode = 200) => {
    const payload = {
        status: 'success',
        data,
        message
    };
    return res.status(statusCode).json(payload);
};
exports.sendSuccess = sendSuccess;
exports.default = exports.sendSuccess;
