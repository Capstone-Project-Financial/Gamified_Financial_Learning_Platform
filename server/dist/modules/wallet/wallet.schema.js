"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expensesSchema = exports.deductSchema = exports.amountSchema = void 0;
const zod_1 = require("zod");
exports.amountSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    description: zod_1.z.string().min(3)
});
exports.deductSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    description: zod_1.z.string().min(3)
});
exports.expensesSchema = zod_1.z.object({
    tax: zod_1.z.number().min(0),
    rent: zod_1.z.number().min(0),
    food: zod_1.z.number().min(0),
    utilities: zod_1.z.number().min(0),
    other: zod_1.z.number().min(0)
});
