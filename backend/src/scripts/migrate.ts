import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parsePortugueseNumber(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/R\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
  return parseFloat(cleaned) || 0;
}

function parseCSVLine(line: string, separator: string): string[] {
  let cleanLine = line.trim();
  if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
    cleanLine = cleanLine.substring(1, cleanLine.length - 1);
  }
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < cleanLine.length; i++) {
    const char = cleanLine[i];
    if (char === '"') {
      if (inQuotes && cleanLine[i+1] === '"') {
        current += '"'; i++;
      } else inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(current);
      current = '';
    } else current += char;
  }
  result.push(current);
  return result.map(s => s.trim().replace(/^"|"$/g, ''));
}

async function migrate() {
  try {
    const company = await prisma.company.findFirst();
    const user = await prisma.user.findFirst();
    if (!company || !user) return console.error('ERRO: Nenhuma empresa ou usuário encontrado.');

    const companyId = company.id;
    const userId = user.id;

    console.log(`>>> Reiniciando Migração para: ${company.name} <<<`);

    // --- LIMPAR DADOS ANTERIORES (Para evitar duplicidade ao re-rodar) ---
    console.log('Limpando dados antigos de migração...');
    await prisma.receivable.deleteMany({ where: { companyId } });
    await prisma.saleItem.deleteMany({ where: { sale: { companyId } } });
    await prisma.sale.deleteMany({ where: { companyId } });
    await prisma.inventoryTransaction.deleteMany({ where: { companyId } });
    // Não vamos deletar clientes e produtos para não perder IDs se o usuário já fez algo manual, 
    // mas o script vai dar upsert neles.

    // --- 1. PRODUTOS (estoque.csv) ---
    let estoquePath = path.join(process.cwd(), 'estoque.csv');
    if (!fs.existsSync(estoquePath)) estoquePath = path.join(process.cwd(), '..', 'estoque.csv');

    if (fs.existsSync(estoquePath)) {
      console.log('--- Importando Produtos e Saldo Inicial ---');
      const content = fs.readFileSync(estoquePath, 'utf-8');
      const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
      const separator = lines[0].includes(';') ? ';' : ',';
      const headers = parseCSVLine(lines[0], separator).map(h => h.toUpperCase());
      
      const idxName = headers.indexOf('PRODUTO');
      const idxSKU = headers.indexOf('COD');
      const idxPrice = headers.indexOf('P.VENDA UNIT');
      const idxStock = headers.indexOf('EST.ATUAL');

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i], separator);
        if (cols.length <= 1) continue;

        const name = cols[idxName];
        if (!name) continue;

        const sku = cols[idxSKU];
        const price = parsePortugueseNumber(cols[idxPrice]);
        const stock = parseInt(cols[idxStock]) || 0;

        let product = await prisma.product.findFirst({
          where: { companyId, OR: [{ sku: sku || undefined }, { name }] }
        });

        if (product) {
          product = await prisma.product.update({
            where: { id: product.id },
            data: { price, currentStock: stock, sku: sku || product.sku }
          });
        } else {
          product = await prisma.product.create({
            data: { companyId, name, sku: sku || null, price, currentStock: stock }
          });
        }

        await prisma.inventoryTransaction.create({
          data: {
            companyId, productId: product.id, userId, type: 'IN', quantity: stock,
            notes: 'Carga Inicial via Planilha Mary Kay'
          }
        });
      }
      console.log('✅ Produtos e Histórico de Estoque OK.');
    }

    // --- 2. VENDAS (vendas.csv) ---
    let vendasPath = path.join(process.cwd(), 'vendas.csv');
    if (!fs.existsSync(vendasPath)) vendasPath = path.join(process.cwd(), '..', 'vendas.csv');

    if (fs.existsSync(vendasPath)) {
      console.log('--- Importando Vendas ---');
      const content = fs.readFileSync(vendasPath, 'utf-8');
      const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
      const separator = lines[0].includes(';') ? ';' : ',';
      const headers = parseCSVLine(lines[0], separator).map(h => h.toUpperCase());

      const idxData = headers.indexOf('DATA');
      const idxProd = headers.indexOf('PROD');
      const idxCustomer = headers.indexOf('CLIENTE');
      const idxQty = headers.indexOf('QTDE');
      const idxTotal = headers.indexOf('TOTAL');
      const idxStatus = headers.indexOf('STATUS');

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i], separator);
        if (cols.length <= 5) continue;

        const dataStr = cols[idxData];
        const productName = cols[idxProd];
        const customerName = cols[idxCustomer];
        const qty = parseInt(cols[idxQty]) || 0;
        const totalAmount = parsePortugueseNumber(cols[idxTotal]);
        const statusStr = cols[idxStatus]?.toUpperCase();

        if (!productName || !customerName || !dataStr) continue;

        let customer = await prisma.customer.findFirst({ where: { companyId, name: customerName } });
        if (!customer) customer = await prisma.customer.create({ data: { companyId, name: customerName } });

        const product = await prisma.product.findFirst({ where: { companyId, name: productName } });
        if (!product) continue;

        let createdAt = new Date();
        if (dataStr.includes('/')) {
          const parts = dataStr.split('/');
          if (parts.length === 3) createdAt = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }

        const sale = await prisma.sale.create({
          data: {
            companyId, customerId: customer.id, userId, totalAmount, status: 'COMPLETED', createdAt,
            items: { create: { productId: product.id, quantity: qty, unitPrice: totalAmount / (qty || 1), subtotal: totalAmount } }
          }
        });

        await prisma.receivable.create({
          data: {
            companyId, saleId: sale.id, customerId: customer.id, amount: totalAmount, dueDate: createdAt,
            status: statusStr === 'PAGO' ? 'PAID' : 'PENDING',
            paidAt: statusStr === 'PAGO' ? createdAt : null,
            createdAt
          }
        });
      }
      console.log('✅ Vendas OK.');
    }

    console.log('\n🚀 MIGRAÇÃO RE-CONCLUÍDA!');
  } catch (error) {
    console.error('❌ ERRO:', error);
  } finally {
    await prisma.$disconnect();
  }
}
migrate();
