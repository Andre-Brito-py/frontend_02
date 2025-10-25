import { useEffect, useState } from 'react';

export default function Layout({ children }) {
  const [role, setRole] = useState(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('role'));
    }
  }, []);

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow">
        <div className="container py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Sistema de Caixa</h1>
          <nav className="space-x-4">
            {role === 'ADMIN' && (
              <>
                <a className="hover:underline" href="/dashboard">Dashboard</a>
                <a className="hover:underline" href="/products">Produtos</a>
                <a className="hover:underline" href="/payments">Pagamentos</a>
                <a className="hover:underline" href="/sales">Vendas</a>
                <a className="hover:underline" href="/cashiers">Caixas</a>
              </>
            )}
            {role === 'CAIXA' && (
              <>
                <a className="hover:underline" href="/sales">Vendas</a>
              </>
            )}
            <button className="btn" onClick={() => { localStorage.clear(); window.location.href = '/'; }}>Sair</button>
          </nav>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}