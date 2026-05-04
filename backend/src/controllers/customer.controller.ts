import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export class CustomerController {
  async create(req: Request, res: Response) {
    try {
      const { name, document, phone, email, photoUrl } = req.body;
      const companyId = req.user?.companyId;

      if (!companyId) return res.status(401).json({ error: 'Não autorizado' });

      const customer = await prisma.customer.create({
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
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar cliente' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return res.status(401).json({ error: 'Não autorizado' });

      const customers = await prisma.customer.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' }
      });

      return res.json(customers);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar clientes' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      if (!companyId) return res.status(401).json({ error: 'Não autorizado' });

      const customer = await prisma.customer.findFirst({
        where: { id, companyId }
      });

      if (!customer) return res.status(404).json({ error: 'Cliente não encontrado' });

      return res.json(customer);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, document, phone, email, photoUrl } = req.body;
      const companyId = req.user?.companyId;

      if (!companyId) return res.status(401).json({ error: 'Não autorizado' });

      // Check if it belongs to the company
      const exists = await prisma.customer.findFirst({ where: { id, companyId } });
      if (!exists) return res.status(404).json({ error: 'Cliente não encontrado' });

      const customer = await prisma.customer.update({
        where: { id },
        data: { name, document, phone, email, photoUrl }
      });

      return res.json(customer);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      const role = req.user?.role;

      if (!companyId) return res.status(401).json({ error: 'Não autorizado' });
      if (role !== 'ADMIN') return res.status(403).json({ error: 'Apenas administradores podem excluir registros' });

      const exists = await prisma.customer.findFirst({ where: { id, companyId } });
      if (!exists) return res.status(404).json({ error: 'Cliente não encontrado' });

      await prisma.customer.delete({ where: { id } });

      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao excluir cliente' });
    }
  }
}
