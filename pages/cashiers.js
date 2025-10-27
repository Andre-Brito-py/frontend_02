import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Protected from '../components/Protected';
import api from '../lib/api';

export default function CashiersPage() {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pwById, setPwById] = useState({});
  const [rowMsg, setRowMsg] = useState({});
  const [rowLoading, setRowLoading] = useState({});

  // Estados para edição
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', login: '', email: '' });

  async function load() {
    setError('');
    try {
      const { data } = await api.get('/api/auth/users?role=CAIXA');
      setList(data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Falha ao carregar caixas');
    }
  }

  useEffect(() => { load(); }, []);

  async function onCreate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post('/api/auth/cashiers', { name, login, password, email: email || null });
      setSuccess(`Caixa criado: ${data.name} (${data.login})`);
      setName('');
      setLogin('');
      setPassword('');
      setEmail('');
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Falha ao criar caixa');
    } finally {
      setLoading(false);
    }
  }

  function setRowPassword(id, value) {
    setPwById(prev => ({ ...prev, [id]: value }));
  }

  async function updateRowPassword(id) {
    setRowLoading(prev => ({ ...prev, [id]: true }));
    setRowMsg(prev => ({ ...prev, [id]: '' }));
    try {
      const newPassword = pwById[id];
      if (!newPassword) throw new Error('Informe a nova senha');
      await api.put(`/api/auth/cashiers/${id}/password`, { password: newPassword });
      setRowMsg(prev => ({ ...prev, [id]: 'Senha atualizada com sucesso' }));
      setPwById(prev => ({ ...prev, [id]: '' }));
    } catch (err) {
      setRowMsg(prev => ({ ...prev, [id]: err?.response?.data?.error || err.message || 'Falha ao atualizar senha' }));
    } finally {
      setRowLoading(prev => ({ ...prev, [id]: false }));
    }
  }

  async function disableRowPassword(id) {
    if (!confirm('Tem certeza que deseja desabilitar a senha deste caixa?')) return;
    setRowLoading(prev => ({ ...prev, [id]: true }));
    setRowMsg(prev => ({ ...prev, [id]: '' }));
    try {
      await api.delete(`/api/auth/cashiers/${id}/password`);
      setRowMsg(prev => ({ ...prev, [id]: 'Senha desabilitada. Defina uma nova para reativar.' }));
    } catch (err) {
      setRowMsg(prev => ({ ...prev, [id]: err?.response?.data?.error || 'Falha ao desabilitar senha' }));
    } finally {
      setRowLoading(prev => ({ ...prev, [id]: false }));
    }
  }

  async function deleteCashier(id) {
    if (!confirm('Tem certeza que deseja excluir este caixa?')) return;
    setRowLoading(prev => ({ ...prev, [id]: true }));
    setRowMsg(prev => ({ ...prev, [id]: '' }));
    try {
      await api.delete(`/api/auth/cashiers/${id}`);
      setRowMsg(prev => ({ ...prev, [id]: 'Caixa excluído com sucesso' }));
      await load();
    } catch (err) {
      setRowMsg(prev => ({ ...prev, [id]: err?.response?.data?.error || 'Falha ao excluir caixa' }));
    } finally {
      setRowLoading(prev => ({ ...prev, [id]: false }));
    }
  }

  // Modal de edição (substitui edição inline)
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalData, setModalData] = useState({ id: null, name: '', login: '', email: '', newPassword: '' });
  const [showPassword, setShowPassword] = useState(false);

  function startEdit(cashier) {
    setModalError('');
    setModalSuccess('');
    setShowPassword(false);
    setModalData({
      id: cashier.id,
      name: cashier.name || '',
      login: cashier.login || '',
      email: cashier.email || '',
      newPassword: ''
    });
    setShowModal(true);
  }
  
  function closeModal() {
    setShowModal(false);
    setModalData({ id: null, name: '', login: '', email: '', newPassword: '' });
  }
  
  async function saveModal() {
    if (!modalData.name || !modalData.login) {
      setModalError('Nome e login são obrigatórios');
      return;
    }
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');
    try {
      await api.put(`/api/auth/cashiers/${modalData.id}`, {
        name: modalData.name,
        login: modalData.login,
        email: modalData.email || null,
      });
      if (modalData.newPassword) {
        await api.put(`/api/auth/cashiers/${modalData.id}/password`, { password: modalData.newPassword });
      }
      setModalSuccess('Dados salvos com sucesso');
      setShowModal(false);
      await load();
    } catch (err) {
      setModalError(err?.response?.data?.error || 'Falha ao salvar alterações');
    } finally {
      setModalLoading(false);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData({ name: '', login: '', email: '' });
  }

  async function saveEdit(id) {
    setRowLoading(prev => ({ ...prev, [id]: true }));
    setRowMsg(prev => ({ ...prev, [id]: '' }));
    try {
      if (!editData.name || !editData.login) {
        throw new Error('Nome e login são obrigatórios');
      }
      await api.put(`/api/auth/cashiers/${id}`, editData);
      setRowMsg(prev => ({ ...prev, [id]: 'Dados atualizados com sucesso' }));
      setEditingId(null);
      await load();
    } catch (err) {
      setRowMsg(prev => ({ ...prev, [id]: err?.response?.data?.error || err.message || 'Falha ao atualizar dados' }));
    } finally {
      setRowLoading(prev => ({ ...prev, [id]: false }));
    }
  }

  return (
    <Protected roles={['ADMIN']}>
      <Layout>
        <h1 className="text-2xl font-semibold mb-6">Caixas</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Criar novo caixa</h2>
            {error && <div className="text-red-600 mb-3">{error}</div>}
            {success && <div className="text-green-600 mb-3">{success}</div>}
            <form onSubmit={onCreate} className="space-y-4">
              <div>
                <label className="label">Nome</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Login</label>
                <input className="input" value={login} onChange={e => setLogin(e.target.value)} />
              </div>
              <div>
                <label className="label">Senha</label>
                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div>
                <label className="label">Email (opcional)</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button className="btn" type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Criar caixa'}</button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Caixas cadastrados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map(u => (
                <div key={u.id} className="rounded-lg border shadow-sm p-4 bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-semibold">{u.name}</div>
                      <div className="text-sm text-gray-600">Login: {u.login}</div>
                      <div className="text-sm text-gray-600">Email: {u.email || '-'}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Criado em: {new Date(u.createdAt).toLocaleString()}</div>
                  <div className="mt-4 flex gap-2">
                    <button className="btn btn-secondary" disabled={rowLoading[u.id]} onClick={() => startEdit(u)}>Editar</button>
                    <button className="btn btn-danger" disabled={rowLoading[u.id]} onClick={() => deleteCashier(u.id)}>{rowLoading[u.id] ? '...' : 'Excluir'}</button>
                  </div>
                  {rowMsg[u.id] && <div className="text-sm mt-2 text-gray-600">{rowMsg[u.id]}</div>}
                </div>
              ))}
              {list.length === 0 && (
                <div className="text-gray-600">Nenhum caixa cadastrado.</div>
              )}
            </div>
          </div>
        </div>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-xl mx-4">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Editar dados do caixa</h3>
                <p className="text-sm text-gray-600">Atualize login e senha de forma clara, além de nome e email.</p>
              </div>
              <div className="p-6 space-y-4">
                {modalError && <div className="text-red-600">{modalError}</div>}
                {modalSuccess && <div className="text-green-600">{modalSuccess}</div>}
 
                <div>
                  <label className="label">Nome</label>
                  <input className="input" value={modalData.name} onChange={e => setModalData(prev => ({ ...prev, name: e.target.value }))} placeholder="Nome do caixa" />
                </div>
 
                <div>
                  <label className="label">Login</label>
                  <input className="input" value={modalData.login} onChange={e => setModalData(prev => ({ ...prev, login: e.target.value }))} placeholder="Login de acesso" />
                  <p className="text-xs text-gray-500 mt-1">O login deve ser único.</p>
                </div>
 
                <div>
                  <label className="label">Email (opcional)</label>
                  <input className="input" type="email" value={modalData.email} onChange={e => setModalData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@exemplo.com" />
                </div>
 
                <div>
                  <label className="label">Nova senha</label>
                  <div className="flex gap-2">
                    <input className="input flex-1" type={showPassword ? 'text' : 'password'} value={modalData.newPassword} onChange={e => setModalData(prev => ({ ...prev, newPassword: e.target.value }))} placeholder="Defina uma nova senha (opcional)" />
                    <button type="button" className="btn" onClick={() => setShowPassword(prev => !prev)}>
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Se preenchido, a senha será atualizada.</p>
                </div>
              </div>
              <div className="p-6 border-t flex justify-end gap-2">
                <button className="btn" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-secondary" onClick={saveModal} disabled={modalLoading}>
                  {modalLoading ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </Protected>
  );
}