'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API_URL from '../../../config/api';

interface InventoryTransaction {
  id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  notes: string;
  createdAt: string;
  product: { name: string; sku: string };
  user: { name: string };
}

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
}

export default function InventoryPage() {
  const [history, setHistory] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  // Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    if (!token) return;
    try {
      const [histRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/api/inventory/history`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/products`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (histRes.ok) setHistory(await histRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (err) {
      console.error('Failed to fetch inventory data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/inventory/adjust`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ productId: selectedProductId, type, quantity, notes }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setSelectedProductId(''); setQuantity(''); setNotes('');
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao ajustar estoque');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary)' }}>Controle de Estoque</h1>
          <p>Ajustes manuais e histórico de movimentações.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Novo Ajuste
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        {/* Histórico */}
        <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Movimentações Recentes</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Qtd</th>
                <th>Usuário</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td>{new Date(h.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <strong>{h.product.name}</strong>
                    <br /><small style={{ color: 'var(--text-muted)' }}>{h.product.sku}</small>
                  </td>
                  <td>
                    <span className={`badge ${h.type === 'IN' ? 'badge-success' : 'badge-danger'}`}>
                      {h.type === 'IN' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td>{h.quantity}</td>
                  <td>{h.user.name}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumo de Alerta */}
        <div>
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>⚠️ Atenção</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Produtos com estoque abaixo do mínimo precisam de reposição imediata.
            </p>
            <div style={{ marginTop: '1rem' }}>
              {products.filter(p => p.currentStock <= p.minStock).map(p => (
                <div key={p.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.9rem' }}>{p.name}</span>
                    <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{p.currentStock} / {p.minStock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Novo Ajuste de Estoque</h2>
            <form onSubmit={handleAdjust}>
              <div className="input-group">
                <label className="input-label">Produto</label>
                <select 
                  className="input-field" 
                  value={selectedProductId} 
                  onChange={e => setSelectedProductId(e.target.value)}
                  required
                >
                  <option value="">Selecione um produto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.currentStock} un)</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Tipo de Movimento</label>
                  <select className="input-field" value={type} onChange={e => setType(e.target.value as any)}>
                    <option value="IN">Entrada (+)</option>
                    <option value="OUT">Saída (-)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Quantidade</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={quantity} 
                    onChange={e => setQuantity(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Observações</label>
                <textarea 
                  className="input-field" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: Compra de estoque, Ajuste de inventário..."
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
