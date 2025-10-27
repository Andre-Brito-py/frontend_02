import { useEffect, useState } from 'react';
import Protected from '../components/Protected';
import Layout from '../components/Layout';
import api from '../lib/api';

export default function AdditionalsPage() {
  const [additionals, setAdditionals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', price: '', categoryId: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [{ data: adds }, { data: cats }] = await Promise.all([
        api.get('/api/additionals'),
        api.get('/api/additional-categories'),
      ]);
      setAdditionals(adds);
      setCategories(cats);
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao carregar dados');
    }
  }

  async function save(e) {
    e.preventDefault();
    setMsg('');
    const payload = {
      name: form.name,
      price: form.price === '' ? null : parseFloat(form.price),
      categoryId: form.categoryId ? parseInt(String(form.categoryId)) : null,
    };
    try {
      if (editingId) {
        await api.put(`/api/additionals/${editingId}`, payload);
      } else {
        await api.post('/api/additionals', payload);
      }
      setForm({ name: '', price: '', categoryId: '' });
      setEditingId(null);
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao salvar adicional');
    }
  }

  function edit(a) {
    setEditingId(a.id);
    setForm({ name: a.name, price: a.price, categoryId: a.categoryId });
  }

  async function remove(id) {
    if (!confirm('Excluir adicional?')) return;
    try {
      await api.delete(`/api/additionals/${id}`);
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao excluir adicional');
    }
  }

  return (
    <Protected roles={["ADMIN"]}>
      <Layout>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Cadastro de Adicionais</h2>
            {msg && <div className="mb-3 text-sm text-gray-700">{msg}</div>}
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="label">Nome</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Preço</label>
                <input className="input" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label className="label">Categoria de adicionais</label>
                <select className="input" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Selecione</option>
                  {categories.map(c => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button className="btn" type="submit">{editingId ? 'Salvar' : 'Cadastrar'}</button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Lista de Adicionais</h2>
            {msg && <div className="mb-3 text-sm text-gray-700">{msg}</div>}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Nome</th>
                  <th className="py-2">Preço</th>
                  <th className="py-2">Categoria</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {additionals.map(a => (
                  <tr key={a.id} className="border-b">
                    <td className="py-2">{a.name}</td>
                    <td className="py-2">R$ {Number(a.price).toFixed(2)}</td>
                    <td className="py-2">{a.category?.name || '-'}</td>
                    <td className="py-2 text-right space-x-2">
                      <button className="btn" onClick={() => edit(a)}>Editar</button>
                      <button className="btn bg-red-600 hover:bg-red-700" onClick={() => remove(a.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
                {additionals.length === 0 && (
                  <tr><td className="py-2" colSpan={4}>Nenhum adicional cadastrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Layout>
    </Protected>
  );
}