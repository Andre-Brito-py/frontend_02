import { useState } from 'react';
import api from '../lib/api';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { login, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('name', data.user.name);
      window.location.href = data.user.role === 'ADMIN' ? '/dashboard' : '/sales';
    } catch (err) {
      setError(err?.response?.data?.error || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Entrar</h2>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Login</label>
            <input className="input" value={login} onChange={e => setLogin(e.target.value)} />
          </div>
          <div>
            <label className="label">Senha</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute inset-y-0 right-2 my-auto p-1 rounded focus:outline-none focus:ring opacity-60 hover:opacity-90"
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                  {showPassword ? (
                    <g>
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.73-1.66 1.76-3.17 3-4.47" />
                      <path d="M4.12 4.12 19.88 19.88" />
                      <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
                      <path d="M22.001 12c-.73 1.66-1.76 3.17-3 4.47" />
                    </g>
                  ) : (
                    <g>
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </g>
                  )}
                </svg>
              </button>
            </div>
          </div>
          <button className="btn w-full" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  );
}