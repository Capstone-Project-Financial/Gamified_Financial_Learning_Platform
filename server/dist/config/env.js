"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5000'),
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: zod_1.z.string().min(1, 'JWT_SECRET is required'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    CLIENT_URL: zod_1.z.string().optional(),
    EMAIL_HOST: zod_1.z.string().optional(),
    EMAIL_PORT: zod_1.z.string().optional(),
    EMAIL_USER: zod_1.z.string().optional(),
    EMAIL_PASSWORD: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().optional(),
    BREVO_API_KEY: zod_1.z.string().optional()
});
exports.env = envSchema.parse(process.env);
