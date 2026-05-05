"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.DashboardController = {
    getStats: async (req, res) => {
        try {
            const { companyId } = req.user;
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            // Vendas de hoje
            const salesToday = await prisma.sale.aggregate({
                where: { companyId, createdAt: { gte: startOfDay } },
                _sum: { totalAmount: true },
            });
            // Vendas do mês
            const salesMonth = await prisma.sale.aggregate({
                where: { companyId, createdAt: { gte: startOfMonth } },
                _sum: { totalAmount: true },
            });
            // Vendas Totais (Histórico Completo)
            const totalSales = await prisma.sale.aggregate({
                where: { companyId },
                _sum: { totalAmount: true },
            });
            // Total a receber (PENDING ou LATE)
            const totalReceivables = await prisma.receivable.aggregate({
                where: {
                    companyId,
                    status: { in: ['PENDING', 'LATE'] },
                },
                _sum: { amount: true },
            });
            // Estoque crítico
            const products = await prisma.product.findMany({
                where: { companyId },
                select: { currentStock: true, minStock: true }
            });
            const criticalCount = products.filter(p => p.currentStock <= p.minStock).length;
            res.json({
                todaySales: salesToday._sum.totalAmount || 0,
                monthSales: salesMonth._sum.totalAmount || 0,
                totalSales: totalSales._sum.totalAmount || 0,
                totalReceivables: totalReceivables._sum.amount || 0,
                criticalStockCount: criticalCount,
            });
        }
        catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};
