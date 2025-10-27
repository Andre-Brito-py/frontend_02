import { useEffect, useState } from 'react';
import Protected from '../components/Protected';
import Layout from '../components/Layout';
import api from '../lib/api';

function AdditionalsManager({ onManageCategories }) {
  const [additionals, setAdditionals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', price: '', categoryId: '', variablePrice: false });
  const [editingId, setEditingId] = useState(null);
  const [showSuspended, setShowSuspended] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [{ data: adds }, { data: cats }] = await Promise.all([
        api.get(`/api/additionals${showSuspended ? '?includeSuspended=true' : ''}`),
        api.get('/api/additional-categories'),
      ]);
      setAdditionals(adds);
      setCategories(cats);
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao carregar dados');
    }
  }

  useEffect(() => { load(); }, [showSuspended]);

  async function save(e) {
    e.preventDefault();
    setMsg('');
    const payload = {
      name: form.name,
      price: form.variablePrice || form.price === '' ? null : parseFloat(form.price),
      categoryId: form.categoryId ? parseInt(String(form.categoryId)) : null,
    };
    try {
      if (editingId) {
        await api.put(`/api/additionals/${editingId}`, payload);
      } else {
        await api.post('/api/additionals', payload);
      }
      setForm({ name: '', price: '', categoryId: '', variablePrice: false });
      setEditingId(null);
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao salvar adicional');
    }
  }

  function edit(a) {
    setEditingId(a.id);
    setForm({ name: a.name, price: a.price ?? '', categoryId: a.categoryId || '', variablePrice: a.price == null });
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

  async function toggleSuspended(a) {
    try {
      await api.patch(`/api/additionals/${a.id}/suspended`, { suspended: !a.suspended });
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao atualizar suspensão do adicional');
    }
  }

  return (
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
            <input className="input" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value, variablePrice: false })} />
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <input type="checkbox" checked={form.variablePrice} onChange={e => setForm({ ...form, variablePrice: e.target.checked, price: e.target.checked ? '' : form.price })} />
              Preço variável (solicitar no caixa)
            </label>
          </div>
          <div>
            <label className="label flex items-center justify-between">
              <span>Categoria</span>
              <button type="button" className="text-blue-600 hover:underline text-sm" onClick={onManageCategories}>Gerenciar categorias</button>
            </label>
            <select className="input" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Sem categoria</option>
              {categories.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit">{editingId ? 'Salvar' : 'Cadastrar'}</button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Lista de Adicionais</h2>
          <label className="label flex items-center gap-2">
            <input type="checkbox" checked={showSuspended} onChange={e => setShowSuspended(e.target.checked)} />
            Exibir suspensos
          </label>
        </div>
        {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {additionals.map(a => (
            <div key={a.id} className={`rounded-lg border shadow-sm p-4 bg-white ${a.suspended ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">{a.name}</div>
                  <div className="text-sm text-gray-600">{a.category?.name || 'Sem categoria'}</div>
                </div>
                {a.suspended && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Suspenso</span>
                )}
              </div>
              <div className="mt-3 text-sm text-gray-700">Preço: R$ {Number(a.price).toFixed(2)}</div>
              <div className="mt-4 flex gap-2">
                <button className="btn btn-secondary" onClick={() => edit(a)}>Editar</button>
                <button className={`btn ${a.suspended ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'}`} onClick={() => toggleSuspended(a)}>
                  {a.suspended ? 'Reativar' : 'Suspender'}
                </button>
                <button className="btn btn-danger" onClick={() => remove(a.id)}>Excluir</button>
              </div>
            </div>
          ))}
          {additionals.length === 0 && (
            <div className="text-gray-600">Nenhum adicional cadastrado</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdditionalCategoriesManager() {
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
              <div className="mb-2 font-semibold">Produtos (use remover para desvincular)</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Produto</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
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
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [additionalCategories, setAdditionalCategories] = useState([]);
  const [selectedAdditionalCategoryIds, setSelectedAdditionalCategoryIds] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', category: '', stock: 0, variablePrice: false });
  const [stockEnabled, setStockEnabled] = useState(false);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('produtos');
  const [showSuspended, setShowSuspended] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [prodRes, catRes, addCatRes] = await Promise.all([
      api.get(`/api/products${showSuspended ? '?includeSuspended=true' : ''}`),
      api.get('/api/categories'),
      api.get('/api/additional-categories')
    ]);
    setProducts(prodRes.data);
    setCategories(catRes.data);
    setAdditionalCategories(addCatRes.data || []);
  }

  useEffect(() => { load(); }, [showSuspended]);

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
      let productId = editing;
      if (editing) {
        const { data: updated } = await api.put(`/api/products/${editing}`, payload);
        productId = updated?.id ?? editing;
      } else {
        const { data: created } = await api.post('/api/products', payload);
        productId = created?.id;
      }
      // Atualizar vínculos de categorias de adicionais (se houver)
      if (productId && Array.isArray(selectedAdditionalCategoryIds)) {
        await api.put(`/api/products/${productId}/additional-categories`, {
          categoryIds: selectedAdditionalCategoryIds,
        });
      }
      setForm({ name: '', price: '', category: '', stock: 0, variablePrice: false });
      setStockEnabled(false);
      setEditing(null);
      setSelectedAdditionalCategoryIds([]);
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
    // Carregar categorias de adicionais vinculadas ao produto em edição
    api.get(`/api/products/${p.id}/additional-categories`).then(({ data }) => {
      setSelectedAdditionalCategoryIds(Array.isArray(data) ? data.map(c => c.id) : []);
    }).catch(() => setSelectedAdditionalCategoryIds([]));
  }

  async function toggleSuspended(p) {
    try {
      await api.patch(`/api/products/${p.id}/suspended`, { suspended: !p.suspended });
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao atualizar suspensão do produto');
    }
  }

  return (
    <Protected roles={['ADMIN']}>
      <Layout>
        <div className="mb-4 flex gap-2">
          <button className={`btn ${tab === 'produtos' ? '' : 'bg-gray-200'}`} onClick={() => setTab('produtos')}>Produtos</button>
          <button className={`btn ${tab === 'adicionais' ? '' : 'bg-gray-200'}`} onClick={() => setTab('adicionais')}>Adicionais</button>
        </div>
        {tab === 'produtos' && (
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
                <label className="label flex items-center justify-between">
                  <span>Categorias de adicionais do produto</span>
                  <button type="button" className="text-blue-600 hover:underline text-sm" onClick={() => setTab('catAdicionais')}>Gerenciar categorias</button>
                </label>
                {additionalCategories.length === 0 && (
                  <div className="text-sm text-gray-600">Nenhuma categoria de adicionais cadastrada.</div>
                )}
                {additionalCategories.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-auto p-2 border rounded">
                    {additionalCategories.map(c => {
                      const checked = selectedAdditionalCategoryIds.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={e => {
                              const on = e.target.checked;
                              setSelectedAdditionalCategoryIds(prev => {
                                const set = new Set(prev);
                                if (on) set.add(c.id); else set.delete(c.id);
                                return Array.from(set);
                              });
                            }}
                          />
                          <span>{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">Ao selecionar, os adicionais dessas categorias ficam disponíveis no PDV.</div>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Lista de Produtos</h2>
              <label className="label flex items-center gap-2">
                <input type="checkbox" checked={showSuspended} onChange={e => setShowSuspended(e.target.checked)} />
                Exibir suspensos
              </label>
            </div>
            {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className={`rounded-lg border shadow-sm p-4 bg-white ${p.suspended ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-semibold">{p.name}</div>
                      <div className="text-sm text-gray-600">{p.category || 'Sem categoria'}</div>
                    </div>
                    {p.suspended && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Suspenso</span>
                    )}
                  </div>
                  <div className="mt-3 text-sm">
                    <div className={p.variablePrice ? 'text-green-600 font-medium' : 'text-green-600 font-medium'}>
                      Preço: {p.variablePrice ? 'Variável' : `R$ ${Number(p.price).toFixed(2)}`}
                    </div>
                    <div className="text-gray-700">Estoque: {p.stock < 0 ? 'Ilimitado' : p.stock}</div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button className="btn-soft" onClick={() => edit(p)}>Editar</button>
                    <button className={`${p.suspended ? 'btn-soft-success' : 'btn-soft-warning'}`} onClick={() => toggleSuspended(p)}>
                      {p.suspended ? 'Reativar' : 'Suspender'}
                    </button>
                    <button className="btn-soft-danger" onClick={() => remove(p.id)}>Excluir</button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="text-gray-600">Nenhum produto encontrado.</div>
              )}
            </div>
          </div>
        </div>
        )}
        {tab === 'adicionais' && <AdditionalsManager onManageCategories={() => setTab('catAdicionais')} />}
        {tab === 'catAdicionais' && <AdditionalCategoriesManager />}
      </Layout>
    </Protected>
  );
}