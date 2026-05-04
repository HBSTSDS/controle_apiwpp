import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestão Multi-Tenant',
  description: 'Sistema de Controle de Estoque, Vendas e Contas a Receber',
};

import { AuthProvider } from '../context/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
