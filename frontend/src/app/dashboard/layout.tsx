'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth() as any; // Loading comes from context internally or we check token
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('@App:token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content glass-panel" style={{ margin: '1rem 1rem 1rem 0' }}>
        {children}
      </main>
    </div>
  );
}
