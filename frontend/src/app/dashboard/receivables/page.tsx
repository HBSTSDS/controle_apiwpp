'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API_URL from '../../../config/api';

interface Receivable {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  customer: {
    name: string;
    phone: string | null;
  };
}

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchReceivables = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/receivables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReceivables(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, [token]);

  const handlePay = async (id: string) => {
    if (!confirm('Tem certeza que deseja marcar esta conta como Paga?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/receivables/${id}/pay`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchReceivables();
      } else {
        alert('Erro ao processar baixa.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, dueDateStr: string) => {
    if (status === 'PAID') {
      return <span className="badge badge-success">PAGO</span>;
    }
    
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (status === 'PENDING' && dueDate < today) {
      return <span className="badge badge-danger">ATRASADO</span>;
    }
    
    return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)' }}>PENDENTE</span>;
  };

  const handleWhatsApp = (phone: string | null, name: string, amount: number) => {
    if (!phone) return alert('Cliente não possui telefone cadastrado.');
    // Clean up phone number (remove non-digits)
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Olá ${name}, tudo bem? Identificamos uma fatura pendente no valor de R$ ${amount.toFixed(2)}. Como podemos ajudar?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Resumo financeiro rápido
  const totalReceivable = receivables.filter(r => r.status !== 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
  const totalLate = receivables.filter(r => {
    if (r.status === 'PAID') return false;
    const dueDate = new Date(r.dueDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    return dueDate < today;
  }).reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary)' }}>Contas a Receber</h1>
          <p>Acompanhe os pagamentos pendentes e faturados.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>Total a Receber</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)', margin: 0 }}>R$ {totalReceivable.toFixed(2)}</p>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>Em Atraso</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)', margin: 0 }}>R$ {totalLate.toFixed(2)}</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Vencimento</th>
              <th>Cliente</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {receivables.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhuma conta a receber encontrada.
                </td>
              </tr>
            ) : (
              receivables.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.dueDate).toLocaleDateString()}</td>
                  <td>
                    {r.customer.name}
                    <br />
                    <small style={{ color: 'var(--text-muted)' }}>{r.customer.phone || 'Sem telefone'}</small>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>R$ {r.amount.toFixed(2)}</td>
                  <td>
                    {getStatusBadge(r.status, r.dueDate)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {r.status !== 'PAID' && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => handlePay(r.id)}
                          disabled={loading}
                        >
                          Dar Baixa
                        </button>
                      )}
                      <button 
                        className="btn" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#25D366', color: '#fff' }}
                        onClick={() => handleWhatsApp(r.customer.phone, r.customer.name, r.amount)}
                      >
                        WhatsApp
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
