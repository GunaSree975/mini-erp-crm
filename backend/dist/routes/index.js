"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const customerRoutes_1 = __importDefault(require("./customerRoutes"));
const productRoutes_1 = __importDefault(require("./productRoutes"));
const challanRoutes_1 = __importDefault(require("./challanRoutes"));
const dashboardRoutes_1 = __importDefault(require("./dashboardRoutes"));
const router = (0, express_1.Router)();
router.use('/auth', authRoutes_1.default);
router.use('/customers', customerRoutes_1.default);
router.use('/products', productRoutes_1.default);
router.use('/challans', challanRoutes_1.default);
router.use('/dashboard', dashboardRoutes_1.default);
exports.default = router;
