'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

interface Stats {
  todaySales: number;
  monthSales: number;
  totalSales: number;
  totalReceivables: number;
  criticalStockCount: number;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<Stats>({
    todaySales: 0,
    monthSales: 0,
    totalSales: 0,
    totalReceivables: 0,
    criticalStockCount: 0,
  });

  useEffect(() => {
    async function loadStats() {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/api/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    }

    loadStats();
  }, [token]);

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>
          Olá, {user?.name.split(' ')[0]}! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Aqui está o resumo completo do seu negócio.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* Card Vendas Totais (Histórico) */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Vendas Totais
          </h3>
          <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.5rem' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalSales)}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Todo o histórico importado e novas vendas
          </p>
        </div>
        
        {/* Card A Receber */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Total a Receber
          </h3>
          <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--warning)', marginTop: '0.5rem' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalReceivables)}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Valores pendentes de pagamento (Fiado)
          </p>
        </div>
        
        {/* Card Estoque Crítico */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Estoque Crítico
          </h3>
          <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--danger)', marginTop: '0.5rem' }}>
            {stats.criticalStockCount} {stats.criticalStockCount === 1 ? 'Produto' : 'Produtos'}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Itens abaixo do estoque mínimo
          </p>
        </div>
      </div>

      {/* Mini Cards Secundários */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1rem', opacity: 0.8 }}>
          <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Vendas Hoje</h4>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.todaySales)}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '1rem', opacity: 0.8 }}>
          <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Vendas no Mês</h4>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthSales)}
          </p>
        </div>
      </div>

      {/* Seção Ações Rápidas */}
      <div style={{ marginTop: '3rem' }} className="glass-panel p-8">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Ações Rápidas</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/dashboard/sales" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Registrar Nova Venda
          </a>
          <a href="/dashboard/inventory" className="btn" style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.1)', color: 'white' }}>
            Repor Estoque
          </a>
          <a href="/dashboard/receivables" className="btn" style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.1)', color: 'white' }}>
            Cobranças Pendentes
          </a>
        </div>
      </div>
    </div>
  );
}
