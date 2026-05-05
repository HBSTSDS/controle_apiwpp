'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/login.module.css';
import API_URL from '../../config/api';

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState('');
  const [companyDocument, setCompanyDocument] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, companyDocument, userName, userEmail, userPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar empresa');
      }

      alert('Empresa registrada com sucesso! Faça login.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={`glass-panel animate-fade-in ${styles.loginCard}`} style={{ maxWidth: '500px' }}>
        <div className={styles.loginHeader}>
          <h2>Crie sua Conta</h2>
          <p>Registre sua empresa no GestãoPro.</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleRegister} className={styles.loginForm}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Nome da Empresa</label>
              <input type="text" className="input-field" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">CNPJ/CPF</label>
              <input type="text" className="input-field" value={companyDocument} onChange={e => setCompanyDocument(e.target.value)} />
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label">Seu Nome</label>
            <input type="text" className="input-field" value={userName} onChange={e => setUserName(e.target.value)} required />
          </div>

          <div className="input-group">
            <label className="input-label">E-mail Administrativo</label>
            <input type="email" className="input-field" value={userEmail} onChange={e => setUserEmail(e.target.value)} required />
          </div>
          
          <div className="input-group">
            <label className="input-label">Senha</label>
            <input type="password" className="input-field" value={userPassword} onChange={e => setUserPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Empresa'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
            Já tem uma conta? <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Faça login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
