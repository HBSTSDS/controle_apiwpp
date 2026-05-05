'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
}

interface Transaction {
  id: string;
  createdAt: string;
  type: 'IN' | 'OUT';
  quantity: number;
  notes: string | null;
  product: {
    name: string;
    sku: string | null;
  };
  user: {
    name: string;
  };
}

export default function InventoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  // Form states
  const [productId, setProductId] = useState('');
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/inventory/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  };

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
    fetchTransactions();
    fetchProducts();
  }, [token]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/inventory/adjust', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ productId, type, quantity: Number(quantity), notes }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setProductId('');
        setType('IN');
        setQuantity('');
        setNotes('');
        fetchTransactions();
        fetchProducts();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Erro ao ajustar estoque');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao ajustar estoque');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary)' }}>Estoque</h1>
          <p>Controle de entrada e saída de produtos.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Ajustar Estoque
        </button>
      </header>

      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Usuário</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhuma movimentação registrada.
                </td>
              </tr>
            ) : (
              transactions.map(t => (
                <tr key={t.id}>
                  <td>{new Date(t.createdAt).toLocaleString()}</td>
                  <td>{t.product.name} {t.product.sku ? `(${t.product.sku})` : ''}</td>
                  <td>
                    {t.type === 'IN' ? (
                      <span className="badge badge-success">Entrada</span>
                    ) : (
                      <span className="badge badge-danger">Saída</span>
                    )}
                  </td>
                  <td>{t.quantity}</td>
                  <td>{t.user.name}</td>
                  <td>{t.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Ajuste de Estoque</h2>
            <form onSubmit={handleAdjust}>
              <div className="input-group">
                <label className="input-label">Produto</label>
                <select 
                  className="input-field" 
                  value={productId} 
                  onChange={e => setProductId(e.target.value)} 
                  required
                >
                  <option value="">Selecione um produto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Estoque: {p.currentStock})
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Tipo de Movimentação</label>
                  <select 
                    className="input-field" 
                    value={type} 
                    onChange={e => setType(e.target.value as 'IN' | 'OUT')} 
                    required
                  >
                    <option value="IN">Entrada (Adicionar)</option>
                    <option value="OUT">Saída (Remover)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Quantidade</label>
                  <input 
                    type="number" 
                    min="1"
                    className="input-field" 
                    value={quantity} 
                    onChange={e => setQuantity(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Observações (Opcional)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Ex: Recebimento de fornecedor, devolução, etc."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ background: 'var(--border)', flex: 1, color: 'white' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Salvando...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
