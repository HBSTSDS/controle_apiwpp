'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  currentStock: number;
  minStock: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const fetchProducts = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name, sku, price, currentStock, minStock }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName(''); setSku(''); setPrice(''); setCurrentStock(''); setMinStock('');
        fetchProducts();
      } else {
        alert('Erro ao criar produto');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "Nome do Produto,Preco,Estoque Atual,Estoque Minimo,SKU\nCamiseta Preta,49.90,50,10,CAM-PR-01\nCaneca Personalizada,25.00,100,20,CAN-01";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_produtos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return alert('Selecione um arquivo CSV primeiro.');
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      const parsedProducts = [];
      // Skip header line (i = 1)
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        if (columns.length >= 4) {
          parsedProducts.push({
            name: columns[0].trim(),
            price: parseFloat(columns[1].trim() || '0'),
            currentStock: parseInt(columns[2].trim() || '0'),
            minStock: parseInt(columns[3].trim() || '0'),
            sku: columns[4] ? columns[4].trim() : ''
          });
        }
      }

      if (parsedProducts.length === 0) {
        setLoading(false);
        return alert('Nenhum produto válido encontrado no arquivo.');
      }

      try {
        const res = await fetch('http://localhost:3001/api/products/bulk', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ products: parsedProducts }),
        });
        
        const data = await res.json();
        if (res.ok) {
          alert(data.message);
          setIsCsvModalOpen(false);
          setCsvFile(null);
          fetchProducts();
        } else {
          alert(data.error || 'Erro ao importar produtos');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(csvFile);
  };

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary)' }}>Produtos</h1>
          <p>Gerencie o catálogo de produtos do sistema.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)' }} onClick={() => setIsCsvModalOpen(true)}>
            + Importar Planilha (CSV)
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Novo Produto
          </button>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>SKU</th>
              <th>Preço (R$)</th>
              <th>Estoque Atual</th>
              <th>Estoque Mínimo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhum produto cadastrado.
                </td>
              </tr>
            ) : (
              products.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.sku || '-'}</td>
                  <td>R$ {p.price.toFixed(2)}</td>
                  <td>{p.currentStock}</td>
                  <td>{p.minStock}</td>
                  <td>
                    {p.currentStock <= p.minStock ? (
                      <span className="badge badge-danger">Baixo</span>
                    ) : (
                      <span className="badge badge-success">OK</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Cadastrar Produto Manual</h2>
            <form onSubmit={handleCreate}>
              <div className="input-group">
                <label className="input-label">Nome do Produto</label>
                <input type="text" className="input-field" value={name} onChange={e=>setName(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Código (SKU)</label>
                  <input type="text" className="input-field" value={sku} onChange={e=>setSku(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Preço de Venda</label>
                  <input type="number" step="0.01" className="input-field" value={price} onChange={e=>setPrice(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Estoque Atual</label>
                  <input type="number" className="input-field" value={currentStock} onChange={e=>setCurrentStock(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Estoque Mínimo</label>
                  <input type="number" className="input-field" value={minStock} onChange={e=>setMinStock(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ background: 'var(--border)', flex: 1, color: 'white' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCsvModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Importar Planilha</h2>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <p style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Como importar produtos facilmente:</p>
              <ol style={{ marginLeft: '1.25rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                <li>Baixe o arquivo de modelo pelo botão abaixo.</li>
                <li>Abra no Excel, preencha as linhas seguindo as colunas exatas.</li>
                <li>Salve o arquivo como <strong>CSV (separado por vírgulas)</strong>.</li>
                <li>Selecione o arquivo e clique em Importar.</li>
              </ol>
            </div>

            <button type="button" className="btn" onClick={handleDownloadTemplate} style={{ width: '100%', marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)' }}>
              ⬇️ Baixar Planilha Modelo
            </button>

            <form onSubmit={handleCsvUpload}>
              <div className="input-group">
                <label className="input-label">Arquivo CSV preenchido</label>
                <input 
                  type="file" 
                  accept=".csv"
                  className="input-field" 
                  onChange={e => setCsvFile(e.target.files ? e.target.files[0] : null)}
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn" onClick={() => setIsCsvModalOpen(false)} style={{ background: 'var(--border)', flex: 1, color: 'white' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Importando...' : 'Importar Produtos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
