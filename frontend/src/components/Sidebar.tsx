'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <h3>GestãoPro</h3>
        <p className="company-badge">{user?.companyId.substring(0, 8)}</p>
      </div>

      <nav className="sidebar-nav">
        <Link href="/dashboard" className="nav-link">Dashboard</Link>
        <Link href="/dashboard/customers" className="nav-link">Clientes</Link>
        <Link href="/dashboard/products" className="nav-link">Produtos</Link>
        <Link href="/dashboard/inventory" className="nav-link">Estoque</Link>
        <Link href="/dashboard/sales" className="nav-link">Vendas</Link>
        <Link href="/dashboard/receivables" className="nav-link">Contas a Receber</Link>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <p className="user-name">{user?.name}</p>
          <span className="user-role">{user?.role}</span>
        </div>
        <button onClick={logout} className="btn-logout">Sair</button>
      </div>

    </aside>
  );
}
