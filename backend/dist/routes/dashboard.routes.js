"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
exports.dashboardRoutes = router;
router.get('/stats', authMiddleware_1.authMiddleware, dashboard_controller_1.DashboardController.getStats);
