
import { useEffect, useState } from 'react';
import Protected from '../components/Protected';
import Layout from '../components/Layout';
import api from '../lib/api';
import Notification from '../components/Notification';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(false);
  const [notify, setNotify] = useState({ type: 'success', message: '' });

  // Geral
  const [recentLimit, setRecentLimit] = useState(10);
  const [recentEnabled, setRecentEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Fiscal
  const [fiscal, setFiscal] = useState({
    cnpj: '', razaoSocial: '', nomeFantasia: '',
    inscricaoEstadual: '', inscricaoMunicipal: '',
    logradouro: '', numero: '', bairro: '', municipio: '', uf: '', cep: '',
    fiscalApiToken: '', fiscalEnvironment: 'homologacao', cscToken: '', cscId: ''
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [settingsRes, fiscalRes] = await Promise.all([
        api.get('/api/settings'),
        api.get('/api/fiscal/config').catch(() => ({ data: {} })) // Ignora erro se não configurado
      ]);

      // Geral
      setRecentLimit(settingsRes.data?.recentSalesLimit || 10);
      setRecentEnabled(settingsRes.data?.recentSalesEnabled !== false);
      setDarkMode(!!settingsRes.data?.darkMode);
      
      // Theme
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', !!settingsRes.data?.darkMode);
        localStorage.setItem('theme', settingsRes.data?.darkMode ? 'dark' : 'light');
      }

      // Fiscal
      if (fiscalRes.data) {
        setFiscal(prev => ({ ...prev, ...fiscalRes.data }));
      }

    } catch (err) {
      setNotify({ type: 'error', message: err?.response?.data?.error || 'Falha ao carregar configurações' });
    }
  }

  async function saveGeral() {
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
      setNotify({ type: 'success', message: 'Configurações gerais salvas.' });
    } catch (err) {
      setNotify({ type: 'error', message: err?.response?.data?.error || 'Falha ao salvar configurações' });
    } finally {
      setLoading(false);
    }
  }

  async function saveFiscal() {
    setLoading(true);
    try {
      await api.put('/api/fiscal/config', fiscal);
      setNotify({ type: 'success', message: 'Configurações fiscais salvas.' });
      load(); // Recarrega para ver tokens ofuscados
    } catch (err) {
      setNotify({ type: 'error', message: err?.response?.data?.error || 'Falha ao salvar fiscal' });
    } finally {
      setLoading(false);
    }
  }

  const handleFiscalChange = (e) => {
    const { name, value } = e.target;
    setFiscal(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Protected roles={['ADMIN']}>
      <Layout>
        <div className="w-full max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Configurações</h2>
          
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              className={`py-2 px-4 font-medium transition-colors ${
                activeTab === 'geral' 
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              onClick={() => setActiveTab('geral')}
            >
              Geral
            </button>
            <button
              className={`py-2 px-4 font-medium transition-colors ${
                activeTab === 'fiscal' 
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              onClick={() => setActiveTab('fiscal')}
            >
              Fiscal (NFC-e)
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            {activeTab === 'geral' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Vendas</h3>
                  <div className="form-control">
                    <label className="label">Limite de vendas recentes</label>
                    <input
                      className="input w-full max-w-xs"
                      type="number"
                      min="1"
                      max="500"
                      value={recentLimit}
                      onChange={e => setRecentLimit(parseInt(e.target.value || '10'))}
                    />
                    <p className="text-xs text-gray-500 mt-1">Quantidade visível na lista rápida.</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <input id="recent-enabled" type="checkbox" className="checkbox" checked={recentEnabled} onChange={e => setRecentEnabled(e.target.checked)} />
                    <label htmlFor="recent-enabled" className="label cursor-pointer">Exibir lista de últimas vendas</label>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Aparência</h3>
                  <div className="flex items-center gap-2">
                    <input id="dark-mode" type="checkbox" className="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />
                    <label htmlFor="dark-mode" className="label cursor-pointer">Modo escuro</label>
                  </div>
                </div>

                <div className="pt-4">
                  <button className="btn btn-primary" disabled={loading} onClick={saveGeral}>
                    {loading ? 'Salvando...' : 'Salvar Geral'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'fiscal' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700">Dados da Empresa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ (apenas números)</label>
                      <input 
                        name="cnpj" 
                        value={fiscal.cnpj || ''} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        maxLength={14} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razão Social</label>
                      <input 
                        name="razaoSocial" 
                        value={fiscal.razaoSocial || ''} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Fantasia</label>
                      <input 
                        name="nomeFantasia" 
                        value={fiscal.nomeFantasia || ''} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inscrição Estadual</label>
                      <input 
                        name="inscricaoEstadual" 
                        value={fiscal.inscricaoEstadual || ''} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inscrição Municipal</label>
                      <input 
                        name="inscricaoMunicipal" 
                        value={fiscal.inscricaoMunicipal || ''} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                    <div className="md:col-span-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logradouro</label>
                      <input 
                        name="logradouro" 
                        value={fiscal.logradouro || ''} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número</label>
                      <input 
                        name="numero" 
                        value={fiscal.numero || ''} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bairro</label>
                      <input 
                        name="bairro" 
                        value={fiscal.bairro || ''} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Município</label>
                      <input 
                        name="municipio" 
                        value={fiscal.municipio || ''} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UF</label>
                      <input 
                        name="uf" 
                        value={fiscal.uf || ''} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        maxLength={2} 
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
                      <input 
                        name="cep" 
                        value={fiscal.cep || ''} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        maxLength={8} 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700">Integração Focus NFe</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ambiente</label>
                      <select 
                        name="fiscalEnvironment" 
                        value={fiscal.fiscalEnvironment} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="homologacao">Homologação (Teste)</option>
                        <option value="producao">Produção</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Token API Focus</label>
                      <input 
                        name="fiscalApiToken" 
                        value={fiscal.fiscalApiToken || ''} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        type="password" 
                        placeholder="******" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID CSC (NFC-e)</label>
                      <input 
                        name="cscId" 
                        value={fiscal.cscId || ''} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        placeholder="Ex: 000001" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Token CSC (NFC-e)</label>
                      <input 
                        name="cscToken" 
                        value={fiscal.cscToken || ''} 
                        onChange={handleFiscalChange} 
                        className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        type="password" 
                        placeholder="******" 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                  <button className="btn btn-primary bg-green-600 hover:bg-green-700 px-6" disabled={loading} onClick={saveFiscal}>
                    {loading ? 'Salvando...' : 'Salvar Configuração Fiscal'}
                  </button>
                </div>
              </div>
            )}
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
