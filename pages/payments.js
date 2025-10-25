import { useEffect, useState } from 'react';
import Protected from '../components/Protected';
import Layout from '../components/Layout';
import api from '../lib/api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/api/payments');
    setPayments(data);
  }

  async function save(e) {
    e.preventDefault();
    if (!name) return;
    if (editing) {
      await api.put(`/api/payments/${editing}`, { name });
    } else {
      await api.post('/api/payments', { name });
    }
    setName('');
    setEditing(null);
    load();
  }

  async function remove(id) {
    if (!confirm('Excluir forma de pagamento?')) return;
    await api.delete(`/api/payments/${id}`);
    load();
  }

  return (
    <Protected roles={['ADMIN']}>
      <Layout>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Formas de Pagamento</h2>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="label">Nome</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <button className="btn" type="submit">{editing ? 'Salvar' : 'Cadastrar'}</button>
            </form>
          </div>
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Lista</h2>
            <ul>
              {payments.map(p => (
                <li key={p.id} className="flex justify-between items-center py-2 border-b">
                  <span>{p.name}</span>
                  <span className="space-x-2">
                    <button className="btn" onClick={() => { setEditing(p.id); setName(p.name); }}>Editar</button>
                    <button className="btn bg-red-600 hover:bg-red-700" onClick={() => remove(p.id)}>Excluir</button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Layout>
    </Protected>
  );
}