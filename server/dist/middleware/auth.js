"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const User_1 = require("../models/User");
const authenticate = async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new ApiError_1.default(401, 'Authentication required'));
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const user = await User_1.UserModel.findById(decoded.sub);
        if (!user) {
            return next(new ApiError_1.default(401, 'User not found'));
        }
        req.user = user;
        return next();
    }
    catch (error) {
        return next(new ApiError_1.default(401, 'Invalid or expired token'));
    }
};
exports.authenticate = authenticate;
