"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const prisma_1 = require("../utils/prisma");
class ProductController {
    async create(req, res) {
        try {
            const { name, description, sku, price, currentStock, minStock, photoUrl } = req.body;
            const companyId = req.user?.companyId;
            if (!companyId)
                return res.status(401).json({ error: 'Não autorizado' });
            const product = await prisma_1.prisma.product.create({
                data: {
                    companyId,
                    name,
                    description,
                    sku,
                    price: Number(price),
                    currentStock: Number(currentStock || 0),
                    minStock: Number(minStock || 0),
                    photoUrl
                },
            });
            return res.status(201).json(product);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar produto' });
        }
    }
    async list(req, res) {
        try {
            const companyId = req.user?.companyId;
            if (!companyId)
                return res.status(401).json({ error: 'Não autorizado' });
            const products = await prisma_1.prisma.product.findMany({
                where: { companyId },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(products);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao listar produtos' });
        }
    }
    async bulkCreate(req, res) {
        try {
            const { products } = req.body;
            const companyId = req.user?.companyId;
            if (!companyId)
                return res.status(401).json({ error: 'Não autorizado' });
            if (!Array.isArray(products) || products.length === 0) {
                return res.status(400).json({ error: 'Nenhum produto enviado' });
            }
            // Format data for bulk insert
            const dataToInsert = products.map((p) => ({
                companyId,
                name: p.name,
                description: p.description || '',
                sku: p.sku || '',
                price: Number(p.price || 0),
                currentStock: Number(p.currentStock || 0),
                minStock: Number(p.minStock || 0),
            }));
            const result = await prisma_1.prisma.product.createMany({
                data: dataToInsert,
            });
            return res.status(201).json({ message: `${result.count} produtos importados com sucesso!` });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao importar produtos' });
        }
    }
}
exports.ProductController = ProductController;
