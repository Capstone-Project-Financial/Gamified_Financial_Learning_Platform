"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradeSchema = void 0;
const zod_1 = require("zod");
exports.tradeSchema = zod_1.z.object({
    shares: zod_1.z.number().int().positive()
});
