'use client';

import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1>Dashboard</h1>
        <p>Visão geral da sua empresa.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>Vendas Hoje</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>R$ 0,00</p>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>A Receber</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>R$ 0,00</p>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>Estoque Crítico</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)' }}>0 Produtos</p>
        </div>
      </div>
    </div>
  );
}
