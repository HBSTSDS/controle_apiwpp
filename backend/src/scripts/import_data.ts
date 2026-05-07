import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importData() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('Nenhuma empresa encontrada no banco. Cadastre-se no sistema primeiro!');
    process.exit(1);
  }
  const companyId = company.id;
  const user = await prisma.user.findFirst({ where: { companyId } });
  if (!user) {
    console.error('Nenhum usuário encontrado para a empresa.');
    process.exit(1);
  }
  const userId = user.id;

  console.log(`Iniciando importação para a empresa: ${company.name} (${companyId})`);

  // --- IMPORTAR ESTOQUE (PRODUTOS) ---
  const estoquePath = path.join(__dirname, '../../../estoque.csv');
  if (fs.existsSync(estoquePath)) {
    console.log('Lendo estoque.csv...');
    const data = fs.readFileSync(estoquePath, 'utf-8');
    const lines = data.split('\n').filter(l => l.trim() !== '');
    
    // Header: PRODUTO;COD;MEDIDA;DATA;FORNECEDOR;P.CUSTO UNIT;P.VENDA UNIT;ENTRADA;MINIMO;SAIDAS;EST.ATUAL;...
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';');
      if (cols.length < 11) continue;

      const name = cols[0];
      const sku = cols[1];
      const price = parseFloat(cols[6].replace('R$ ', '').replace(',', '.'));
      const minStock = parseInt(cols[8]) || 0;
      const currentStock = parseInt(cols[10]) || 0;

      await prisma.product.upsert({
        where: { id: `import-${sku}` }, // Usando SKU como chave de importação única
        update: {
          name,
          price,
          minStock,
          currentStock,
        },
        create: {
          id: `import-${sku}`,
          companyId,
          name,
          sku,
          price,
          minStock,
          currentStock,
        }
      });
    }
    console.log('Produtos importados/atualizados com sucesso!');
  }

  // --- IMPORTAR VENDAS (CLIENTES E VENDAS) ---
  const vendasPath = path.join(__dirname, '../../../vendas.csv');
  if (fs.existsSync(vendasPath)) {
    console.log('Lendo vendas.csv...');
    const data = fs.readFileSync(vendasPath, 'utf-8');
    const lines = data.split('\n').filter(l => l.trim() !== '');

    for (let i = 1; i < lines.length; i++) {
      // Remover aspas do início e fim da linha se existirem
      let line = lines[i].trim();
      if (line.startsWith('"') && line.endsWith('"')) {
        line = line.substring(1, line.length - 1);
      }
      
      const cols = line.split(';');
      if (cols.length < 10) continue;

      const dataVenda = cols[0]; // DD/MM/YYYY
      const prodName = cols[1];
      const sku = cols[2];
      const clienteName = cols[4];
      const qtde = parseInt(cols[5]) || 0;
      const valorUnit = parseFloat(cols[6].replace('R$ ', '').replace(',', '.'));
      const statusVenda = cols[9]; // PAGO | FIADO | etc

      // 1. Garantir Cliente
      const customer = await prisma.customer.upsert({
        where: { id: `import-cust-${clienteName}` },
        update: { name: clienteName },
        create: {
          id: `import-cust-${clienteName}`,
          companyId,
          name: clienteName
        }
      });

      // 2. Buscar Produto
      const product = await prisma.product.findFirst({ where: { sku, companyId } });
      if (!product) {
        console.warn(`Produto SKU ${sku} não encontrado para a venda da linha ${i+1}`);
        continue;
      }

      // 3. Criar Venda
      const [day, month, year] = dataVenda.split('/');
      const saleDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      const sale = await prisma.sale.create({
        data: {
          companyId,
          customerId: customer.id,
          userId,
          totalAmount: valorUnit * qtde,
          status: 'COMPLETED',
          createdAt: saleDate,
          items: {
            create: {
              productId: product.id,
              quantity: qtde,
              unitPrice: valorUnit,
              subtotal: valorUnit * qtde
            }
          }
        }
      });

      // 4. Se for FIADO, criar Recebível
      if (statusVenda === 'FIADO') {
        await prisma.receivable.create({
          data: {
            companyId,
            saleId: sale.id,
            customerId: customer.id,
            amount: valorUnit * qtde,
            dueDate: new Date(saleDate.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 dias padrão
            status: 'PENDING'
          }
        });
      }
    }
    console.log('Vendas e Clientes importados com sucesso!');
  }

  console.log('=== Importação concluída! ===');
  await prisma.$disconnect();
}

importData().catch(e => {
  console.error(error);
  process.exit(1);
});
