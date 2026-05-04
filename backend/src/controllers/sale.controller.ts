import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export class SaleController {
  async create(req: Request, res: Response) {
    try {
      const { customerId, items, generateReceivable, dueDate, amountPaid } = req.body;
      // items = [{ productId, quantity, unitPrice }]
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) return res.status(401).json({ error: 'Não autorizado' });

      let totalAmount = 0;
      const saleItemsData = [];

      // Calculate total and prepare items
      for (const item of items) {
        const subtotal = item.quantity * item.unitPrice;
        totalAmount += subtotal;
        saleItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal
        });
      }

      // Execute in a transaction to ensure data integrity
      const result = await prisma.$transaction(async (prisma) => {
        // 1. Create Sale
        const sale = await prisma.sale.create({
          data: {
            companyId,
            customerId,
            userId,
            totalAmount,
            status: 'COMPLETED',
            items: {
              create: saleItemsData
            }
          }
        });

        // 2. Adjust Stock and create inventory transactions
        for (const item of items) {
          const product = await prisma.product.findUnique({ where: { id: item.productId } });
          if (!product || product.currentStock < item.quantity) {
            throw new Error(`Estoque insuficiente para o produto ID: ${item.productId}`);
          }

          await prisma.product.update({
            where: { id: item.productId },
            data: { currentStock: product.currentStock - item.quantity }
          });

          await prisma.inventoryTransaction.create({
            data: {
              companyId,
              productId: item.productId,
              userId,
              type: 'OUT',
              quantity: item.quantity,
              notes: `Venda ${sale.id}`
            }
          });
        }

        // 3. Generate Receivable (Conta a Receber) if requested
        if (generateReceivable && dueDate) {
          await prisma.receivable.create({
            data: {
              companyId,
              saleId: sale.id,
              customerId,
              amount: totalAmount, // Assuming single installment for MVP, can be adjusted
              dueDate: new Date(dueDate),
              status: amountPaid >= totalAmount ? 'PAID' : 'PENDING',
              paidAt: amountPaid >= totalAmount ? new Date() : null
            }
          });
        }

        return sale;
      });

      return res.status(201).json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({ error: error.message || 'Erro ao criar venda' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return res.status(401).json({ error: 'Não autorizado' });

      const sales = await prisma.sale.findMany({
        where: { companyId },
        include: {
          customer: { select: { name: true } },
          user: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json(sales);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar vendas' });
    }
  }
}
