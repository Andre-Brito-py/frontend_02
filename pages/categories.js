import { useEffect, useState } from 'react';
import Protected from '../components/Protected';
import Layout from '../components/Layout';
import api from '../lib/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [formName, setFormName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [catProducts, setCatProducts] = useState([]);
  const [addProductId, setAddProductId] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/products'),
      ]);
      setCategories(cats);
      setProducts(prods);
      if (selectedCategory) await loadCategoryProducts(selectedCategory.id);
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao carregar dados');
    }
  }

  async function loadCategoryProducts(id) {
    try {
      const { data } = await api.get(`/api/categories/${id}/products`);
      setCatProducts(data);
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao carregar produtos da categoria');
    }
  }

  async function saveCategory(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/categories/${editingId}`, { name: formName });
      } else {
        await api.post('/api/categories', { name: formName });
      }
      setFormName('');
      setEditingId(null);
      load();
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao salvar categoria');
    }
  }

  function editCategory(cat) {
    setEditingId(cat.id);
    setFormName(cat.name);
  }

  async function deleteCategory(id) {
    if (!confirm('Excluir categoria?')) return;
    try {
      await api.delete(`/api/categories/${id}`);
      if (selectedCategory?.id === id) {
        setSelectedCategory(null);
        setCatProducts([]);
      }
      load();
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao excluir categoria');
    }
  }

  async function selectCategory(cat) {
    setSelectedCategory(cat);
    await loadCategoryProducts(cat.id);
  }

  async function addProductToCategory() {
    if (!selectedCategory || !addProductId) return;
    try {
      await api.post(`/api/categories/${selectedCategory.id}/products`, { productId: addProductId });
      setAddProductId('');
      await loadCategoryProducts(selectedCategory.id);
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao adicionar produto à categoria');
    }
  }

  async function removeProductFromCategory(pid) {
    if (!selectedCategory) return;
    try {
      await api.delete(`/api/categories/${selectedCategory.id}/products/${pid}`);
      await loadCategoryProducts(selectedCategory.id);
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao remover produto da categoria');
    }
  }

  return (
    <Protected roles={['ADMIN']}>
      <Layout>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Categorias</h2>
            {msg && <div className="mb-3 text-sm text-gray-700">{msg}</div>}
            <form onSubmit={saveCategory} className="flex gap-2 mb-4">
              <input className="input flex-1" placeholder="Nome da categoria" value={formName} onChange={e => setFormName(e.target.value)} />
              <button className="btn" type="submit">{editingId ? 'Salvar' : 'Adicionar'}</button>
              {editingId && (
                <button type="button" className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => { setEditingId(null); setFormName(''); }}>Cancelar</button>
              )}
            </form>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Nome</th>
                  <th className="py-2">Produtos</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id} className="border-b">
                    <td className="py-2">{cat.name}</td>
                    <td className="py-2">{products.filter(p => p.category === cat.name).length}</td>
                    <td className="py-2 text-right space-x-2">
                      <button className="btn" onClick={() => editCategory(cat)}>Editar</button>
                      <button className="btn" onClick={() => selectCategory(cat)}>Abrir</button>
                      <button className="btn bg-red-600 hover:bg-red-700" onClick={() => deleteCategory(cat.id)}>Excluir</button>
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
            <h2 className="text-xl font-semibold mb-4">Detalhes da Categoria</h2>
            {!selectedCategory && (
              <div className="text-gray-600">Selecione uma categoria para gerenciar seus produtos.</div>
            )}
            {selectedCategory && (
              <div>
                <div className="mb-3"><span className="font-semibold">Categoria:</span> {selectedCategory.name}</div>
                <div className="mb-4 flex items-end gap-2">
                  <div className="flex-1">
                    <div className="label">Adicionar produto</div>
                    <select className="input" value={addProductId} onChange={e => setAddProductId(e.target.value)}>
                      <option value="">Selecione</option>
                      {products.filter(p => p.category !== selectedCategory.name).map(p => (
                        <option key={p.id} value={String(p.id)}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn" onClick={addProductToCategory}>Adicionar</button>
                </div>
                <div>
                  <div className="mb-2 font-semibold">Produtos na categoria</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2">Produto</th>
                        <th className="py-2">Preço</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {catProducts.map(p => (
                        <tr key={p.id} className="border-b">
                          <td className="py-2">{p.name}</td>
                          <td className="py-2">R$ {Number(p.price).toFixed(2)}</td>
                          <td className="py-2 text-right">
                            <button className="btn bg-red-600 hover:bg-red-700" onClick={() => removeProductFromCategory(p.id)}>Remover</button>
                          </td>
                        </tr>
                      ))}
                      {catProducts.length === 0 && (
                        <tr><td className="py-2" colSpan={3}>Nenhum produto nesta categoria</td></tr>
                      )}
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