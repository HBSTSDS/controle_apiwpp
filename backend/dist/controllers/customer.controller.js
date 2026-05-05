"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const prisma_1 = require("../utils/prisma");
class CustomerController {
    async create(req, res) {
        try {
            const { name, document, phone, email, photoUrl } = req.body;
            const companyId = req.user?.companyId;
            if (!companyId)
                return res.status(401).json({ error: 'Não autorizado' });
            const customer = await prisma_1.prisma.customer.create({
                data: {
                    companyId,
                    name,
                    document,
                    phone,
                    email,
                    photoUrl
                },
            });
            return res.status(201).json(customer);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar cliente' });
        }
    }
    async list(req, res) {
        try {
            const companyId = req.user?.companyId;
            if (!companyId)
                return res.status(401).json({ error: 'Não autorizado' });
            const customers = await prisma_1.prisma.customer.findMany({
                where: { companyId },
                orderBy: { createdAt: 'desc' }
            });
            console.log(`[DEBUG] Listando ${customers.length} clientes para a empresa ${companyId}`);
            return res.json(customers);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao listar clientes' });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId;
            if (!companyId)
                return res.status(401).json({ error: 'Não autorizado' });
            const customer = await prisma_1.prisma.customer.findFirst({
                where: { id, companyId }
            });
            if (!customer)
                return res.status(404).json({ error: 'Cliente não encontrado' });
            return res.json(customer);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar cliente' });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, document, phone, email, photoUrl } = req.body;
            const companyId = req.user?.companyId;
            if (!companyId)
                return res.status(401).json({ error: 'Não autorizado' });
            // Check if it belongs to the company
            const exists = await prisma_1.prisma.customer.findFirst({ where: { id, companyId } });
            if (!exists)
                return res.status(404).json({ error: 'Cliente não encontrado' });
            const customer = await prisma_1.prisma.customer.update({
                where: { id },
                data: { name, document, phone, email, photoUrl }
            });
            return res.json(customer);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar cliente' });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId;
            const role = req.user?.role;
            if (!companyId)
                return res.status(401).json({ error: 'Não autorizado' });
            if (role !== 'ADMIN')
                return res.status(403).json({ error: 'Apenas administradores podem excluir registros' });
            const exists = await prisma_1.prisma.customer.findFirst({ where: { id, companyId } });
            if (!exists)
                return res.status(404).json({ error: 'Cliente não encontrado' });
            await prisma_1.prisma.customer.delete({ where: { id } });
            return res.status(204).send();
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao excluir cliente' });
        }
    }
}
exports.CustomerController = CustomerController;
