import { useEffect, useState } from 'react';
import Protected from '../components/Protected';
import Layout from '../components/Layout';
import api from '../lib/api';
import Notification from '../components/Notification';

export default function SettingsPage() {
  const [recentLimit, setRecentLimit] = useState(10);
  const [recentEnabled, setRecentEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notify, setNotify] = useState({ type: 'success', message: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/api/settings');
      setRecentLimit(data?.recentSalesLimit || 10);
      setRecentEnabled(data?.recentSalesEnabled !== false);
      setDarkMode(!!data?.darkMode);
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', !!data?.darkMode);
        localStorage.setItem('theme', data?.darkMode ? 'dark' : 'light');
      }
    } catch (err) {
      setNotify({ type: 'error', message: err?.response?.data?.error || 'Falha ao carregar configurações' });
    }
  }

  async function save() {
    setLoading(true);
    try {
      const payload = {
        recentSalesLimit: parseInt(String(recentLimit || '10')),
        recentSalesEnabled: !!recentEnabled,
        darkMode: !!darkMode,
      };
      await api.put('/api/settings', payload);
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', !!darkMode);
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
      }
      setNotify({ type: 'success', message: 'Configurações salvas com sucesso.' });
    } catch (err) {
      setNotify({ type: 'error', message: err?.response?.data?.error || 'Falha ao salvar configurações' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Protected roles={['ADMIN']}>
      <Layout>
        <div className="card max-w-xl">
          <h2 className="text-xl font-semibold mb-4">Configurações</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Últimas vendas</h3>
              <label className="label">Quantidade visível no menu de vendas</label>
              <input
                className="input"
                type="number"
                min="1"
                max="500"
                value={recentLimit}
                onChange={e => setRecentLimit(parseInt(e.target.value || '10'))}
              />
              <div className="text-xs text-gray-600 mt-1">Defina quantas vendas recentes devem aparecer na área de consulta/edição.</div>
              <div className="mt-3 flex items-center gap-2">
                <input id="recent-enabled" type="checkbox" checked={recentEnabled} onChange={e => setRecentEnabled(e.target.checked)} />
                <label htmlFor="recent-enabled" className="label">Ativar Últimas vendas</label>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Aparência</h3>
              <div className="flex items-center gap-2">
                <input id="dark-mode" type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />
                <label htmlFor="dark-mode" className="label">Modo escuro</label>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn" disabled={loading} onClick={save}>{loading ? 'Salvando...' : 'Salvar'}</button>
              <button className="btn" onClick={load}>Recarregar</button>
            </div>
          </div>
        </div>
        <Notification
          type={notify.type}
          message={notify.message}
          onClose={() => setNotify({ ...notify, message: '' })}
        />
      </Layout>
    </Protected>
  );
}