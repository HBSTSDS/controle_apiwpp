'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './login.module.css'; // We'll create this to keep it scoped, but use globals where possible

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={`glass-panel animate-fade-in ${styles.loginCard}`}>
        <div className={styles.loginHeader}>
          <h2>Bem-vindo de volta</h2>
          <p>Acesse o sistema de gestão.</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.loginForm}>
          <div className="input-group">
            <label className="input-label">E-mail</label>
            <input 
              type="email" 
              className="input-field" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Senha</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
            Não tem uma conta? <a href="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Registre sua empresa</a>
          </p>
        </form>
      </div>
    </div>
  );
}
