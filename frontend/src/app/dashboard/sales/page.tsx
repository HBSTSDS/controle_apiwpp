'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API_URL from '../../../config/api';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  currentStock: number;
}

interface Customer {
  id: string;
  name: string;
}

interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [generateReceivable, setGenerateReceivable] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  // Helper for adding items
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQty, setCurrentQty] = useState(1);

  const fetchData = async () => {
    if (!token) return;
    try {
      const [prodRes, custRes] = await Promise.all([
        fetch(`${API_URL}/api/products`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/customers`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (prodRes.ok) setProducts(await prodRes.ok ? await prodRes.json() : []);
      if (custRes.ok) setCustomers(await custRes.ok ? await custRes.json() : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const addItem = () => {
    const product = products.find(p => p.id === currentProductId);
    if (!product) return;
    
    const existing = items.find(i => i.productId === currentProductId);
    if (existing) {
      setItems(items.map(i => i.productId === currentProductId ? {
        ...i,
        quantity: i.quantity + Number(currentQty),
        subtotal: (i.quantity + Number(currentQty)) * i.unitPrice
      } : i));
    } else {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        quantity: Number(currentQty),
        unitPrice: product.price,
        subtotal: product.price * Number(currentQty)
      }]);
    }
    setCurrentProductId('');
    setCurrentQty(1);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.productId !== id));
  };

  const total = items.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !customerId) return alert('Selecione um cliente e ao menos um produto');
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/sales`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          customerId, 
          items, 
          generateReceivable, 
          dueDate: generateReceivable ? dueDate : null,
          amountPaid: Number(amountPaid || 0)
        }),
      });
      if (res.ok) {
        alert('Venda registrada com sucesso!');
        setItems([]); setCustomerId(''); setGenerateReceivable(false); setAmountPaid(''); setDueDate('');
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao registrar venda');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary)' }}>Nova Venda</h1>
        <p>Registre pedidos e gere contas a receber.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
        {/* Lado Esquerdo: Itens da Venda */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Itens do Pedido</h2>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <select 
              className="input-field" 
              style={{ flex: 2 }}
              value={currentProductId}
              onChange={e => setCurrentProductId(e.target.value)}
            >
              <option value="">Buscar Produto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)} ({p.currentStock} un)</option>
              ))}
            </select>
            <input 
              type="number" 
              className="input-field" 
              style={{ flex: 0.5 }}
              value={currentQty}
              onChange={e => setCurrentQty(Number(e.target.value))}
              min="1"
            />
            <button className="btn btn-primary" onClick={addItem}>Add</button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Unitário</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.productId}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>R$ {item.unitPrice.toFixed(2)}</td>
                  <td>R$ {item.subtotal.toFixed(2)}</td>
                  <td>
                    <button onClick={() => removeItem(item.productId)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>✖</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Nenhum item adicionado</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Lado Direito: Finalização */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Finalizar Venda</h2>
          
          <div className="input-group">
            <label className="input-label">Cliente</label>
            <select className="input-field" value={customerId} onChange={e => setCustomerId(e.target.value)} required>
              <option value="">Selecionar Cliente...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ margin: '2rem 0', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Subtotal:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              <span>TOTAL:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={generateReceivable} onChange={e => setGenerateReceivable(e.target.checked)} />
              Venda Fiada / Gerar Contas a Receber
            </label>
          </div>

          {generateReceivable && (
            <div className="animate-fade-in" style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label">Valor Pago na Hora (Opcional)</label>
                <input type="number" className="input-field" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="0.00" />
              </div>
              <div className="input-group">
                <label className="input-label">Data de Vencimento</label>
                <input type="date" className="input-field" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
              </div>
            </div>
          )}

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            disabled={loading || items.length === 0}
            onClick={handleSale}
          >
            {loading ? 'Processando...' : 'Confirmar Venda'}
          </button>
        </div>
      </div>
    </div>
  );
}
