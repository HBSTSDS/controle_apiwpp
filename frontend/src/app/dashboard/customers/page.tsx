'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

interface Customer {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  photoUrl: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  // Form states
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

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
      console.error('Failed to fetch customers', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalPhotoUrl = '';

      // Upload photo first if selected
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);

        const uploadRes = await fetch('http://localhost:3001/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalPhotoUrl = uploadData.url;
        } else {
          alert('Erro ao fazer upload da foto. O cliente será salvo sem foto.');
        }
      }

      // Create customer
      const res = await fetch('http://localhost:3001/api/customers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name, document, email, phone, photoUrl: finalPhotoUrl }),
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setName(''); setDocument(''); setEmail(''); setPhone(''); setPhotoFile(null);
        fetchCustomers();
      } else {
        alert('Erro ao criar cliente');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary)' }}>Clientes</h1>
          <p>Gerencie sua base de clientes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Novo Cliente
        </button>
      </header>

      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nome</th>
              <th>CPF/CNPJ</th>
              <th>E-mail</th>
              <th>Telefone</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            ) : (
              customers.map(c => (
                <tr key={c.id}>
                  <td>
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={c.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>
                        {c.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>{c.document || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>{c.phone || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Cadastrar Cliente</h2>
            <form onSubmit={handleCreate}>
              <div className="input-group">
                <label className="input-label">Nome Completo / Razão Social</label>
                <input type="text" className="input-field" value={name} onChange={e=>setName(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">CPF ou CNPJ</label>
                  <input type="text" className="input-field" value={document} onChange={e=>setDocument(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Telefone / WhatsApp</label>
                  <input type="text" className="input-field" value={phone} onChange={e=>setPhone(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">E-mail</label>
                <input type="email" className="input-field" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Foto do Cliente (Opcional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  className="input-field" 
                  onChange={e=>setPhotoFile(e.target.files ? e.target.files[0] : null)} 
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ background: 'var(--border)', flex: 1, color: 'white' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
