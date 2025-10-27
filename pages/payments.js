import { useEffect, useState } from 'react';
import Protected from '../components/Protected';
import Layout from '../components/Layout';
import api from '../lib/api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/api/payments');
      setPayments(data);
      setError('');
    } catch (err) {
      if (err?.response?.status === 401) {
        // Sem sessão: Protected irá redirecionar; não quebrar UI
        return;
      }
      setError(err?.response?.data?.error || 'Falha ao carregar formas de pagamento');
    }
  }

  async function save(e) {
    e.preventDefault();
    if (!name) return;
    try {
      if (editing) {
        await api.put(`/api/payments/${editing}`, { name });
      } else {
        await api.post('/api/payments', { name });
      }
      setName('');
      setEditing(null);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Falha ao salvar forma de pagamento');
    }
  }

  async function remove(id) {
    if (!confirm('Excluir forma de pagamento?')) return;
    try {
      await api.delete(`/api/payments/${id}`);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Falha ao excluir forma de pagamento');
    }
  }

  return (
    <Protected roles={['ADMIN']}>
      <Layout>
        <h1 className="text-2xl font-semibold mb-6">Formas de Pagamento</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Cadastrar Forma de Pagamento</h2>
            {error && <div className="text-red-600 mb-3">{error}</div>}
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="label">Nome</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <button className="btn" type="submit">{editing ? 'Salvar' : 'Cadastrar'}</button>
            </form>
          </div>
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Formas de Pagamento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {payments.map(p => (
                <div key={p.id} className="rounded-lg border shadow-sm p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">{p.name}</div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="btn btn-secondary" onClick={() => { setEditing(p.id); setName(p.name); }}>Editar</button>
                    <button className="btn btn-danger" onClick={() => remove(p.id)}>Excluir</button>
                  </div>
                </div>
              ))}
              {payments.length === 0 && (
                <div className="text-gray-600">Nenhuma forma de pagamento cadastrada.</div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </Protected>
  );
}