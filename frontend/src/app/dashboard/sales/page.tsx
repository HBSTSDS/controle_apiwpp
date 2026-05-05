'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  currentStock: number;
}

interface Sale {
  id: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  customer: { name: string };
  user: { name: string };
}

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  // Form states
  const [customerId, setCustomerId] = useState('');
  
  // Cart states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Receivable states
  const [generateReceivable, setGenerateReceivable] = useState(true);
  const [dueDate, setDueDate] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');

  const fetchSales = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/sales', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchProducts();
  }, [token]);

  const handleAddToCart = () => {
    if (!selectedProductId || !quantity) return;
    const qty = parseInt(quantity);
    if (qty <= 0) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    // Check if already in cart
    const existing = cart.find(c => c.productId === selectedProductId);
    if (existing) {
      if (existing.quantity + qty > product.currentStock) {
        return alert(`Estoque insuficiente. Disponível: ${product.currentStock}`);
      }
      setCart(cart.map(c => 
        c.productId === selectedProductId 
          ? { ...c, quantity: c.quantity + qty, subtotal: (c.quantity + qty) * c.unitPrice }
          : c
      ));
    } else {
      if (qty > product.currentStock) {
        return alert(`Estoque insuficiente. Disponível: ${product.currentStock}`);
      }
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        quantity: qty,
        unitPrice: product.price,
        subtotal: qty * product.price
      }]);
    }
    setSelectedProductId('');
    setQuantity('1');
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.productId !== productId));
  };

  const totalCartAmount = cart.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return alert('Selecione um cliente.');
    if (cart.length === 0) return alert('O carrinho está vazio.');
    if (generateReceivable && !dueDate) return alert('Informe a data de vencimento.');

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/sales', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          customerId,
          items: cart.map(c => ({
            productId: c.productId,
            quantity: c.quantity,
            unitPrice: c.unitPrice
          })),
          generateReceivable,
          dueDate: generateReceivable ? dueDate : null,
          amountPaid: generateReceivable ? parseFloat(amountPaid || '0') : 0
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setCart([]);
        setCustomerId('');
        setGenerateReceivable(true);
        setDueDate('');
        setAmountPaid('0');
        fetchSales();
        fetchProducts(); // Refresh stock
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Erro ao registrar venda');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar venda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary)' }}>Vendas</h1>
          <p>Registre novas vendas e visualize o histórico.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Nova Venda
        </button>
      </header>

      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th>Valor Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhuma venda registrada.
                </td>
              </tr>
            ) : (
              sales.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  <td>{s.customer.name}</td>
                  <td>{s.user.name}</td>
                  <td style={{ fontWeight: 'bold' }}>R$ {s.totalAmount.toFixed(2)}</td>
                  <td>
                    <span className="badge badge-success">{s.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Nova Venda</h2>
            <form onSubmit={handleSubmit}>
              
              <div className="input-group">
                <label className="input-label">Cliente</label>
                <select 
                  className="input-field" 
                  value={customerId} 
                  onChange={e => setCustomerId(e.target.value)} 
                  required
                >
                  <option value="">Selecione um cliente...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Adicionar Produtos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Produto</label>
                    <select 
                      className="input-field" 
                      value={selectedProductId} 
                      onChange={e => setSelectedProductId(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.currentStock <= 0}>
                          {p.name} (R$ {p.price.toFixed(2)}) - Estoque: {p.currentStock}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Quantidade</label>
                    <input 
                      type="number" 
                      min="1"
                      className="input-field" 
                      value={quantity} 
                      onChange={e => setQuantity(e.target.value)} 
                    />
                  </div>
                  <button type="button" className="btn btn-primary" onClick={handleAddToCart}>
                    Adicionar
                  </button>
                </div>

                {cart.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <table className="data-table" style={{ fontSize: '0.875rem' }}>
                      <thead>
                        <tr>
                          <th>Produto</th>
                          <th>Qtd</th>
                          <th>Preço Un.</th>
                          <th>Subtotal</th>
                          <th>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map(c => (
                          <tr key={c.productId}>
                            <td>{c.name}</td>
                            <td>{c.quantity}</td>
                            <td>R$ {c.unitPrice.toFixed(2)}</td>
                            <td style={{ fontWeight: 'bold' }}>R$ {c.subtotal.toFixed(2)}</td>
                            <td>
                              <button type="button" style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => removeFromCart(c.productId)}>
                                Remover
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ textAlign: 'right', marginTop: '1rem', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                      Total: R$ {totalCartAmount.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <input 
                    type="checkbox" 
                    id="genReceivable"
                    checked={generateReceivable}
                    onChange={e => setGenerateReceivable(e.target.checked)}
                    style={{ width: '1.2rem', height: '1.2rem' }}
                  />
                  <label htmlFor="genReceivable" style={{ fontWeight: 'bold', cursor: 'pointer' }}>Gerar Conta a Receber no Financeiro?</label>
                </div>

                {generateReceivable && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">Data de Vencimento</label>
                      <input 
                        type="date" 
                        className="input-field" 
                        value={dueDate} 
                        onChange={e => setDueDate(e.target.value)} 
                        required={generateReceivable}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Valor já pago (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        className="input-field" 
                        value={amountPaid} 
                        onChange={e => setAmountPaid(e.target.value)} 
                      />
                      <small style={{ color: 'var(--text-muted)' }}>Se preencher o valor total, será marcado como PAGO.</small>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ background: 'var(--border)', flex: 1, color: 'white' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Processando...' : 'Finalizar Venda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
