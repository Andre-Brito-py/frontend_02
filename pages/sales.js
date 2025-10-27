import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Protected from '../components/Protected';
import api from '../lib/api';

export default function SalesPage() {
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [nextItemDelivery, setNextItemDelivery] = useState(false);
  const [availableAdditionals, setAvailableAdditionals] = useState([]);
  const [pendingAdditionals, setPendingAdditionals] = useState([]);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  // Modal de preço variável
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [priceProduct, setPriceProduct] = useState(null);
  const [priceQty, setPriceQty] = useState(1);

  useEffect(() => { loadLists(); }, []);

  async function loadLists() {
    try {
      const [{ data: prod }, { data: pay }] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/payments'),
      ]);
      setProducts(prod);
      setPayments(pay);
      if (prod.length && !selectedProductId) setSelectedProductId(String(prod[0].id));
      if (pay.length && !paymentMethodId) setPaymentMethodId(String(pay[0].id));
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Falha ao carregar listas');
    }
  }

  // Carregar adicionais permitidos quando muda produto selecionado
  useEffect(() => {
    async function loadAdditionalsForProduct() {
      setAvailableAdditionals([]);
      setPendingAdditionals([]);
      const pid = parseInt(String(selectedProductId || ''));
      if (!pid) return;
      try {
        const [{ data: cats }, { data: adds }] = await Promise.all([
          api.get(`/api/products/${pid}/additional-categories`),
          api.get('/api/additionals'),
        ]);
        const allowedCatIds = new Set(cats.map(c => c.id));
        const filteredAdds = adds.filter(a => allowedCatIds.has(a.categoryId));
        setAvailableAdditionals(filteredAdds);
      } catch (err) {
        // silêncio para não poluir a UI
      }
    }
    if (selectedProductId) loadAdditionalsForProduct();
  }, [selectedProductId]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => {
      const base = Number(item.unitPrice) * item.quantity;
      const adds = (item.additionals || []).reduce((s, a) => s + Number(a.unitPrice) * Number(a.quantity || 1), 0);
      return sum + base + adds;
    }, 0);
  }, [cart]);

  function addToCart() {
    setMsg('');
    const id = parseInt(selectedProductId);
    const p = products.find(x => x.id === id);
    if (!p) return;
    const qty = parseInt(String(quantity || '1'));
    if (!qty || qty <= 0) return setMsg('Informe uma quantidade válida');
    if (p.stock >= 0 && p.stock < qty) return setMsg(`Estoque insuficiente para ${p.name}`);
  
    if (p.variablePrice) {
      setPriceProduct(p);
      setPriceQty(qty);
      setPriceInput(p.price ? String(Number(p.price).toFixed(2)).replace('.', ',') : '');
      setPriceModalOpen(true);
      return;
    }
  
    const unitPrice = Number(p.price);
    setCart(prev => {
      const i = prev.findIndex(x => x.productId === id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], quantity: copy[i].quantity + qty };
        return copy;
      }
      return [...prev, { productId: id, name: p.name, unitPrice: unitPrice.toFixed(2), quantity: qty, isDelivery: nextItemDelivery, additionals: pendingAdditionals }];
    });
    setPendingAdditionals([]);
  }

  function removeItem(productId) {
    setCart(prev => prev.filter(i => i.productId !== productId));
  }

  function confirmVariablePrice() {
    setMsg('');
    const p = priceProduct;
    if (!p) return setPriceModalOpen(false);
    const raw = String(priceInput || '').trim().replace(',', '.');
    const val = Number(raw);
    if (!Number.isFinite(val) || val <= 0) {
      setMsg('Preço unitário inválido');
      return;
    }
    const id = p.id;
    const qty = priceQty || 1;
    setCart(prev => {
      const i = prev.findIndex(x => x.productId === id);
      if (i >= 0) {
        const copy = [...prev];
        // quando já existe, soma quantidade, mantém preço informado
        copy[i] = { ...copy[i], quantity: copy[i].quantity + qty, unitPrice: val.toFixed(2) };
        return copy;
      }
      return [...prev, { productId: id, name: p.name, unitPrice: val.toFixed(2), quantity: qty, isDelivery: nextItemDelivery, additionals: pendingAdditionals }];
    });
    setPriceModalOpen(false);
    setPriceProduct(null);
    setPriceQty(1);
    setPriceInput('');
    setPendingAdditionals([]);
  }
  function cancelVariablePrice() {
    setPriceModalOpen(false);
    setPriceProduct(null);
    setPriceQty(1);
    setPriceInput('');
  }

  async function finalizeSale() {
    setLoading(true);
    setMsg('');
    try {
      if (!paymentMethodId) throw new Error('Selecione uma forma de pagamento');
      if (cart.length === 0) throw new Error('Adicione produtos ao carrinho');
      const payload = {
        paymentMethodId: parseInt(String(paymentMethodId)),
        items: cart.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          isDelivery: i.isDelivery === true,
          additionals: (i.additionals || []).map(a => ({ additionalId: a.additionalId, quantity: a.quantity, unitPrice: Number(a.unitPrice) })),
        })),
      };
      await api.post('/api/sales', payload);
      setMsg('Venda registrada com sucesso');
      setCart([]);
      await loadLists(); // atualiza estoque visível
    } catch (err) {
      const aborted = String(err?.message || '').toLowerCase().includes('aborted');
      setMsg(aborted ? 'Operação interrompida pelo navegador. Tente novamente.' : (err?.response?.data?.error || err.message || 'Falha ao registrar venda'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Protected roles={['ADMIN', 'CAIXA']}>
      <Layout>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Seleção de Produtos</h2>
        {msg && <div className="mb-3 text-sm text-gray-700">{msg}</div>}
        <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="label">Produtos</label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {products.length === 0 && (
                  <div className="col-span-full text-sm text-gray-600">Nenhum produto disponível.</div>
                )}
                {products.map(p => (
                  <div
                    key={p.id}
                    className={`border rounded-lg p-3 hover:shadow transition cursor-pointer ${String(selectedProductId) === String(p.id) ? 'ring-2 ring-blue-500' : ''} ${p.suspended ? 'opacity-60 pointer-events-none' : ''}`}
                    onClick={() => setSelectedProductId(String(p.id))}
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-green-600 font-medium">{p.variablePrice ? 'Preço variável' : `R$ ${Number(p.price).toFixed(2)}`}</div>
                    <div className="text-xs text-gray-500">Estoque: {p.stock < 0 ? 'Ilimitado' : p.stock}</div>
                    {p.suspended && <div className="mt-2 inline-block text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Suspenso</div>}
                  </div>
                ))}
              </div>
              <div>
                <label className="label">Quantidade</label>
                <input className="input" type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value || '1'))} />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={nextItemDelivery ? 'delivery' : 'presencial'} onChange={e => setNextItemDelivery(e.target.value === 'delivery')}>
                  <option value="presencial">Presencial</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              <div>
                <div className="label flex items-center justify-between">
                  <span>Adicionais (opcional)</span>
                  <a href="/additionals" className="text-blue-600 hover:underline text-sm">Gerenciar adicionais</a>
                </div>
                {availableAdditionals.length === 0 && (
                  <div className="text-sm text-gray-600">Nenhum adicional disponível para este produto.</div>
                )}
                {availableAdditionals.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availableAdditionals.map(a => (
                      <div key={a.id} className={`border rounded p-2 ${a.suspended ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium">{a.name}</div>
                            <div className="text-xs text-gray-600">R$ {Number(a.price).toFixed(2)}</div>
                          </div>
                          {a.suspended && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Suspenso</span>}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <input className="input w-20" type="number" min="1" defaultValue={1} onChange={(e) => {
                            const qty = parseInt(e.target.value || '1');
                            const idx = pendingAdditionals.findIndex(x => x.additionalId === a.id);
                            if (idx >= 0) {
                              const copy = [...pendingAdditionals];
                              copy[idx] = { ...copy[idx], quantity: qty };
                              setPendingAdditionals(copy);
                            }
                          }} />
                          <button className="btn" disabled={a.suspended} onClick={() => {
                            const exists = pendingAdditionals.find(x => x.additionalId === a.id);
                            if (exists) return;
                            setPendingAdditionals(prev => [...prev, { additionalId: a.id, name: a.name, unitPrice: Number(a.price).toFixed(2), quantity: 1 }]);
                          }}>Adicionar</button>
                          <button className="btn bg-red-600 hover:bg-red-700" onClick={() => setPendingAdditionals(prev => prev.filter(x => x.additionalId !== a.id))}>Remover</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {pendingAdditionals.length > 0 && (
                  <div className="mt-2 text-sm">
                    Selecionados: {pendingAdditionals.map(a => `${a.name} x${a.quantity}`).join(', ')}
                  </div>
                )}
              </div>
              <button className="btn" disabled={!selectedProductId || products.find(x => String(x.id) === String(selectedProductId))?.suspended} onClick={addToCart}>
                {products.find(x => String(x.id) === String(selectedProductId))?.suspended ? 'Produto suspenso' : 'Adicionar ao carrinho'}
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Carrinho</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Produto</th>
                  <th>Qtd</th>
                  <th>Unitário</th>
                  <th>Subtotal</th>
                  <th>Tipo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(i => (
                  <tr key={i.productId} className="border-b">
                    <td className="py-2">{i.name}</td>
                    <td>{i.quantity}</td>
                    <td>R$ {Number(i.unitPrice).toFixed(2)}</td>
                    <td>
                      <div>R$ {(Number(i.unitPrice) * i.quantity).toFixed(2)}</div>
                      {i.additionals?.length > 0 && (
                        <div className="text-xs text-gray-700">
                          Adicionais: {i.additionals.map(a => `${a.name} x${a.quantity} (R$ ${(Number(a.unitPrice) * Number(a.quantity)).toFixed(2)})`).join(', ')}
                        </div>
                      )}
                    </td>
                    <td>
                      <select className="input" value={i.isDelivery ? 'delivery' : 'presencial'} onChange={e => setCart(prev => prev.map(x => x.productId === i.productId ? { ...x, isDelivery: e.target.value === 'delivery' } : x))}>
                        <option value="presencial">Presencial</option>
                        <option value="delivery">Delivery</option>
                      </select>
                    </td>
                    <td className="text-right">
                      <button className="btn bg-red-600 hover:bg-red-700" onClick={() => removeItem(i.productId)}>Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex items-center gap-3">
              <div>
                <label className="label">Forma de pagamento</label>
                <select className="input" value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)}>
                  {payments.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="ml-auto text-right">
                <div className="text-lg font-semibold">Total: R$ {total.toFixed(2)}</div>
                <button className="btn" disabled={loading} onClick={finalizeSale}>{loading ? 'Processando...' : 'Finalizar venda'}</button>
              </div>
            </div>
          </div>
        </div>

        {priceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-3">Informar preço do produto</h3>
              <div className="text-sm mb-3">Produto: <span className="font-medium">{priceProduct?.name}</span></div>
              <div className="space-y-3">
                <div>
                  <label className="label">Preço unitário</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Ex.: 9,99"
                    value={priceInput}
                    onChange={e => setPriceInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Quantidade</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={priceQty}
                    onChange={e => setPriceQty(parseInt(e.target.value || '1'))}
                  />
                </div>
                {msg && <div className="text-sm text-gray-700">{msg}</div>}
                <div className="flex justify-end gap-2 pt-2">
                  <button className="btn" onClick={cancelVariablePrice}>Cancelar</button>
                  <button className="btn" onClick={confirmVariablePrice}>Adicionar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </Protected>
  );
}