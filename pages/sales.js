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

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
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
      return [...prev, { productId: id, name: p.name, unitPrice: unitPrice.toFixed(2), quantity: qty }];
    });
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
      return [...prev, { productId: id, name: p.name, unitPrice: val.toFixed(2), quantity: qty }];
    });
    setPriceModalOpen(false);
    setPriceProduct(null);
    setPriceQty(1);
    setPriceInput('');
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
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: Number(i.unitPrice) })),
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
              <div>
                <label className="label">Produto</label>
                <select className="input" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.variablePrice ? 'preço variável' : `R$ ${Number(p.price).toFixed(2)}`} (Estoque: {p.stock < 0 ? 'Ilimitado' : p.stock})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quantidade</label>
                <input className="input" type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value || '1'))} />
              </div>
              <button className="btn" onClick={addToCart}>Adicionar ao carrinho</button>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(i => (
                  <tr key={i.productId} className="border-b">
                    <td className="py-2">{i.name}</td>
                    <td>{i.quantity}</td>
                    <td>R$ {Number(i.unitPrice).toFixed(2)}</td>
                    <td>R$ {(Number(i.unitPrice) * i.quantity).toFixed(2)}</td>
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