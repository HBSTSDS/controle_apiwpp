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

  // Tentar encontrar os arquivos na raiz do projeto ou na pasta backend
  const findFile = (name: string) => {
    const paths = [
      path.join(__dirname, `../../../${name}`),
      path.join(__dirname, `../../${name}`),
      path.join(process.cwd(), name),
      path.join(process.cwd(), 'backend', name)
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  };

  // --- IMPORTAR ESTOQUE (PRODUTOS) ---
  const estoquePath = findFile('estoque.csv');
  if (estoquePath) {
    console.log(`Lendo ${estoquePath}...`);
    const data = fs.readFileSync(estoquePath, 'utf-8');
    const lines = data.split('\n').filter(l => l.trim() !== '');
    
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';');
      if (cols.length < 11) continue;

      const name = cols[0].trim();
      const sku = cols[1].trim();
      const priceStr = cols[6].replace('R$ ', '').replace('.', '').replace(',', '.');
      const price = parseFloat(priceStr) || 0;
      const minStock = parseInt(cols[8]) || 0;
      const currentStock = parseInt(cols[10]) || 0;

      await prisma.product.upsert({
        where: { id: `import-${sku}` },
        update: { name, price, minStock, currentStock },
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
  } else {
    console.warn('estoque.csv não encontrado.');
  }

  // --- IMPORTAR VENDAS (CLIENTES E VENDAS) ---
  const vendasPath = findFile('vendas.csv');
  if (vendasPath) {
    console.log(`Lendo ${vendasPath}...`);
    const data = fs.readFileSync(vendasPath, 'utf-8');
    const lines = data.split('\n').filter(l => l.trim() !== '');

    for (let i = 1; i < lines.length; i++) {
      let line = lines[i].trim();
      if (line.startsWith('"') && line.endsWith('"')) {
        line = line.substring(1, line.length - 1);
      }
      
      const cols = line.split(';');
      if (cols.length < 10) continue;

      const dataVenda = cols[0].trim(); 
      const prodName = cols[1].trim();
      const sku = cols[2].trim();
      const clienteName = cols[4].trim();
      const qtde = parseInt(cols[5]) || 0;
      const valorUnitStr = cols[6].replace('R$ ', '').replace('.', '').replace(',', '.');
      const valorUnit = parseFloat(valorUnitStr) || 0;
      
      const formaPagto = cols[8].trim(); // FIADO | PIX | etc
      const statusVenda = cols[9].trim(); // PAGO | FIADO | etc

      if (!clienteName || clienteName === '') continue;

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
        // Se não achar pelo SKU, tenta pelo nome
        const productByName = await prisma.product.findFirst({ where: { name: prodName, companyId } });
        if (!productByName) {
          console.warn(`Produto ${prodName} (SKU ${sku}) não encontrado. Pulando venda.`);
          continue;
        }
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
              productId: product?.id || (await prisma.product.findFirst({ where: { name: prodName } }))?.id || '',
              quantity: qtde,
              unitPrice: valorUnit,
              subtotal: valorUnit * qtde
            }
          }
        }
      });

      // 4. Se for FIADO, criar Recebível
      if (formaPagto === 'FIADO') {
        await prisma.receivable.create({
          data: {
            companyId,
            saleId: sale.id,
            customerId: customer.id,
            amount: valorUnit * qtde,
            dueDate: new Date(saleDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            status: statusVenda === 'PAGO' ? 'PAID' : 'PENDING',
            paidAt: statusVenda === 'PAGO' ? saleDate : null
          }
        });
      }
    }
    console.log('Vendas e Clientes importados com sucesso!');
  } else {
    console.warn('vendas.csv não encontrado.');
  }

  console.log('=== Importação concluída! ===');
  await prisma.$disconnect();
}

importData().catch(e => {
  console.error(error);
  process.exit(1);
});
