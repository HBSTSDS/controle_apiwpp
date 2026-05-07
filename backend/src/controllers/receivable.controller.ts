import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export class ReceivableController {
  async list(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return res.status(401).json({ error: 'Não autorizado' });

      const receivables = await prisma.receivable.findMany({
        where: { companyId },
        include: {
          customer: { select: { name: true, phone: true } },
          sale: { select: { totalAmount: true } }
        },
        orderBy: [
          { dueDate: 'asc' },
          { installmentNumber: 'asc' }
        ]
      });

      return res.json(receivables);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar contas a receber' });
    }
  }

  async markAsPaid(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) return res.status(401).json({ error: 'Não autorizado' });

      const receivable = await prisma.receivable.findFirst({ where: { id, companyId } });
      if (!receivable) return res.status(404).json({ error: 'Conta não encontrada' });

      const updated = await prisma.receivable.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      });

      return res.json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao dar baixa na conta' });
    }
  }
}
