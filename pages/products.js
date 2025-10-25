import { useEffect, useState } from 'react';
import Protected from '../components/Protected';
import Layout from '../components/Layout';
import api from '../lib/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', category: '', stock: 0, variablePrice: false });
  const [stockEnabled, setStockEnabled] = useState(false);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const [prodRes, catRes] = await Promise.all([
      api.get('/api/products'),
      api.get('/api/categories')
    ]);
    setProducts(prodRes.data);
    setCategories(catRes.data);
  }

  async function save(e) {
    e.preventDefault();
    setMsg('');
    const vp = !!form.variablePrice;
    const priceRaw = form.price === '' ? null : parseFloat(form.price);
    const payload = { 
      name: form.name, 
      price: vp ? (Number.isFinite(priceRaw) ? priceRaw : 0) : priceRaw, 
      category: form.category || null, 
      variablePrice: vp 
    };
    if (stockEnabled) {
      const s = parseInt(String(form.stock || '0'));
      if (!Number.isNaN(s)) payload.stock = s;
    } else if (editing) {
      payload.stock = -1;
    }
    try {
      if (editing) {
        await api.put(`/api/products/${editing}`, payload);
      } else {
        await api.post('/api/products', payload);
      }
      setForm({ name: '', price: '', category: '', stock: 0, variablePrice: false });
      setStockEnabled(false);
      setEditing(null);
      load();
    } catch (err) {
      setMsg(err?.response?.data?.error || err.message || 'Falha ao salvar produto');
    }
  }

  async function remove(id) {
    if (!confirm('Excluir produto?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      load();
    } catch (err) {
      setMsg(err?.response?.data?.error || err.message || 'Falha ao excluir produto');
    }
  }

  function edit(p) {
    setEditing(p.id);
    setForm({ name: p.name, price: p.price, category: p.category || '', stock: p.stock >= 0 ? p.stock : 0, variablePrice: !!p.variablePrice });
    setStockEnabled(p.stock >= 0);
  }

  return (
    <Protected roles={['ADMIN']}>
      <Layout>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Cadastro de Produtos</h2>
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
                <label className="label flex items-center gap-2">
                  <input type="checkbox" checked={form.variablePrice} onChange={e => setForm({ ...form, variablePrice: e.target.checked })} />
                  Preço variável (solicitar no caixa)
                </label>
              </div>
              <div>
                <label className="label flex items-center justify-between">
                  <span>Categoria</span>
                  <a href="/categories" className="text-blue-600 hover:underline text-sm">Gerenciar categorias</a>
                </label>
                <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">Sem categoria</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label flex items-center gap-2">
                  <input type="checkbox" checked={stockEnabled} onChange={e => setStockEnabled(e.target.checked)} />
                  Adicionar estoque inicial (opcional)
                </label>
                {stockEnabled && (
                  <input className="input mt-2" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value || '0') })} />
                )}
              </div>
              <button className="btn" type="submit">{editing ? 'Salvar' : 'Cadastrar'}</button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Lista de Produtos</h2>
            {msg && <div className="mb-3 text-sm text-gray-700">{msg}</div>}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Nome</th>
                  <th>Preço</th>
                  <th>Categoria</th>
                  <th>Estoque</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b">
                    <td className="py-2">{p.name}</td>
                    <td>{p.variablePrice ? 'Variável' : `R$ ${Number(p.price).toFixed(2)}`}</td>
                    <td>{p.category || '-'}</td>
                    <td>{p.stock < 0 ? 'Ilimitado' : p.stock}</td>
                    <td className="text-right space-x-2">
                      <button className="btn" onClick={() => edit(p)}>Editar</button>
                      <button className="btn bg-red-600 hover:bg-red-700" onClick={() => remove(p.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Layout>
    </Protected>
  );
}