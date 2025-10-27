import { useEffect, useState } from 'react';
import Protected from '../components/Protected';
import Layout from '../components/Layout';
import api from '../lib/api';

export default function AdditionalCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [addProductId, setAddProductId] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        api.get('/api/additional-categories'),
        api.get('/api/products'),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao carregar dados');
    }
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/additional-categories/${editingId}`, { name: form.name, description: form.description });
      } else {
        await api.post('/api/additional-categories', { name: form.name, description: form.description });
      }
      setForm({ name: '', description: '' });
      setEditingId(null);
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao salvar categoria');
    }
  }

  function edit(cat) {
    setEditingId(cat.id);
    setForm({ name: cat.name, description: cat.description || '' });
  }

  async function remove(id) {
    if (!confirm('Excluir categoria de adicionais?')) return;
    try {
      await api.delete(`/api/additional-categories/${id}`);
      if (selectedCategory?.id === id) setSelectedCategory(null);
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao excluir categoria');
    }
  }

  async function addProductToSelectedCategory() {
    if (!selectedCategory || !addProductId) return;
    try {
      // Carregar categorias já vinculadas ao produto
      const { data: prodCats } = await api.get(`/api/products/${addProductId}/additional-categories`);
      const ids = [...new Set([selectedCategory.id, ...prodCats.map(c => c.id)])];
      await api.put(`/api/products/${addProductId}/additional-categories`, { categoryIds: ids });
      setAddProductId('');
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao vincular produto à categoria');
    }
  }

  async function removeProductFromSelectedCategory(pid) {
    if (!selectedCategory) return;
    try {
      const { data: prodCats } = await api.get(`/api/products/${pid}/additional-categories`);
      const ids = prodCats.map(c => c.id).filter(id => id !== selectedCategory.id);
      await api.put(`/api/products/${pid}/additional-categories`, { categoryIds: ids });
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao desvincular produto da categoria');
    }
  }

  return (
    <Protected roles={["ADMIN"]}>
      <Layout>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Categorias de Adicionais</h2>
            {msg && <div className="mb-3 text-sm text-gray-700">{msg}</div>}
            <form onSubmit={save} className="space-y-3 mb-4">
              <div>
                <label className="label">Nome</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Descrição</label>
                <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button className="btn" type="submit">{editingId ? 'Salvar' : 'Adicionar'}</button>
                {editingId && (
                  <button type="button" className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => { setEditingId(null); setForm({ name: '', description: '' }); }}>Cancelar</button>
                )}
              </div>
            </form>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Nome</th>
                  <th className="py-2">Descrição</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id} className="border-b">
                    <td className="py-2">{cat.name}</td>
                    <td className="py-2">{cat.description || '-'}</td>
                    <td className="py-2 text-right space-x-2">
                      <button className="btn" onClick={() => edit(cat)}>Editar</button>
                      <button className="btn" onClick={() => setSelectedCategory(cat)}>Abrir</button>
                      <button className="btn bg-red-600 hover:bg-red-700" onClick={() => remove(cat.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr><td className="py-2" colSpan={3}>Nenhuma categoria</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Produtos por Categoria de Adicionais</h2>
            {!selectedCategory && (
              <div className="text-gray-600">Selecione uma categoria de adicionais para gerenciar seus produtos vinculados.</div>
            )}
            {selectedCategory && (
              <div>
                <div className="mb-3"><span className="font-semibold">Categoria:</span> {selectedCategory.name}</div>
                <div className="mb-4 flex items-end gap-2">
                  <div className="flex-1">
                    <div className="label">Vincular produto</div>
                    <select className="input" value={addProductId} onChange={e => setAddProductId(e.target.value)}>
                      <option value="">Selecione</option>
                      {products.map(p => (
                        <option key={p.id} value={String(p.id)}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn" onClick={addProductToSelectedCategory}>Adicionar</button>
                </div>
                <div>
                  <div className="mb-2 font-semibold">Produtos vinculados (visualização geral)</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2">Produto</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.filter(p => p.additionalCategories?.some?.(() => false)).length === 0 && (
                        <tr><td className="py-2" colSpan={2}>Dica: selecione um produto acima para vincular à categoria</td></tr>
                      )}
                      {products.map(p => (
                        <tr key={p.id} className="border-b">
                          <td className="py-2">{p.name}</td>
                          <td className="py-2 text-right">
                            <button className="btn bg-red-600 hover:bg-red-700" onClick={() => removeProductFromSelectedCategory(p.id)}>Remover da categoria</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </Protected>
  );
}