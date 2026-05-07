'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API_URL from '../../../config/api';

interface Receivable {
  id: string;
  amount: number;
  dueDate: string;
  installmentNumber: number;
  totalInstallments: number;
  status: 'PENDING' | 'PAID' | 'LATE';
  paidAt: string | null;
  customer: { name: string; phone: string };
  sale: { totalAmount: number };
}

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('PENDING');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchData = async () => {
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
    fetchData();
  }, [token]);

  const handlePay = async (id: string) => {
    if (!confirm('Deseja confirmar o recebimento deste valor?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/receivables/${id}/pay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Erro ao dar baixa na conta');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = receivables.filter(r => {
    if (filter === 'ALL') return true;
    return r.status === filter || (filter === 'PENDING' && r.status === 'LATE');
  });

  const totalPending = receivables
    .filter(r => r.status !== 'PAID')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary)' }}>Contas a Receber</h1>
          <p>Gerencie pagamentos pendentes e cobranças.</p>
        </div>
        <div className="glass-panel" style={{ padding: '0.75rem 1.5rem', textAlign: 'right', borderLeft: '4px solid var(--warning)' }}>
          <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Pendente</small>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>
            R$ {totalPending.toFixed(2)}
          </div>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button className={`btn ${filter === 'PENDING' ? 'btn-primary' : ''}`} style={{ background: filter !== 'PENDING' ? 'rgba(255,255,255,0.05)' : '' }} onClick={() => setFilter('PENDING')}>Pendentes</button>
          <button className={`btn ${filter === 'PAID' ? 'btn-primary' : ''}`} style={{ background: filter !== 'PAID' ? 'rgba(255,255,255,0.05)' : '' }} onClick={() => setFilter('PAID')}>Recebidos</button>
          <button className={`btn ${filter === 'ALL' ? 'btn-primary' : ''}`} style={{ background: filter !== 'ALL' ? 'rgba(255,255,255,0.05)' : '' }} onClick={() => setFilter('ALL')}>Todos</button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Parcela</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td>
                  <strong>{r.customer.name}</strong>
                  <br /><small style={{ color: 'var(--text-muted)' }}>{r.customer.phone || 'Sem telefone'}</small>
                </td>
                <td>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{r.installmentNumber} / {r.totalInstallments}</span>
                </td>
                <td>
                  {new Date(r.dueDate).toLocaleDateString('pt-BR')}
                  {r.status === 'LATE' && <span style={{ color: 'var(--danger)', fontSize: '0.7rem', display: 'block', fontWeight: 'bold' }}>ATRASADO</span>}
                </td>
                <td style={{ fontWeight: 'bold' }}>R$ {r.amount.toFixed(2)}</td>
                <td>
                  <span className={`badge ${r.status === 'PAID' ? 'badge-success' : (r.status === 'LATE' ? 'badge-danger' : 'badge-warning')}`}>
                    {r.status === 'PAID' ? 'Pago' : (r.status === 'LATE' ? 'Atrasado' : 'Pendente')}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  {r.status !== 'PAID' && (
                    <>
                      <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handlePay(r.id)} disabled={loading}>
                        Baixar
                      </button>
                      <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#25D366', color: 'white' }}>
                        WhatsApp
                      </button>
                    </>
                  )}
                  {r.status === 'PAID' && (
                    <small style={{ color: 'var(--text-muted)' }}>Recebido em {new Date(r.paidAt!).toLocaleDateString('pt-BR')}</small>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nenhum registro encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
