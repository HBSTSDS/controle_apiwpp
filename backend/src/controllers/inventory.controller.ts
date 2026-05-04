import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export class InventoryController {
  async adjust(req: Request, res: Response) {
    try {
      const { productId, type, quantity, notes } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) return res.status(401).json({ error: 'Não autorizado' });

      // Verify product belongs to company
      const product = await prisma.product.findFirst({ where: { id: productId, companyId } });
      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

      // Update product stock
      const newStock = type === 'IN' 
        ? product.currentStock + Number(quantity)
        : product.currentStock - Number(quantity);

      if (newStock < 0) {
        return res.status(400).json({ error: 'Estoque não pode ficar negativo' });
      }

      // Start transaction
      const result = await prisma.$transaction(async (prisma) => {
        const updatedProduct = await prisma.product.update({
          where: { id: productId },
          data: { currentStock: newStock }
        });

        const transaction = await prisma.inventoryTransaction.create({
          data: {
            companyId,
            productId,
            userId,
            type, // IN | OUT
            quantity: Number(quantity),
            notes
          }
        });

        return { product: updatedProduct, transaction };
      });

      return res.status(201).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao ajustar estoque' });
    }
  }

  async history(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return res.status(401).json({ error: 'Não autorizado' });

      const transactions = await prisma.inventoryTransaction.findMany({
        where: { companyId },
        include: {
          product: { select: { name: true, sku: true } },
          user: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json(transactions);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
  }
}
