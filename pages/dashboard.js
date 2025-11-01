import { useEffect, useState } from 'react';
import Protected from '../components/Protected';
import Layout from '../components/Layout';
import MenuCards from '../components/MenuCards';
import api from '../lib/api';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, BarElement } from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, BarElement);

// Plugin para faixas alternadas no fundo (estilo do exemplo)
const bandPlugin = {
  id: 'chartAreaBands',
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales?.x) return;
    const { left, right, top, bottom } = chartArea;
    const ticks = scales.x.ticks || [];
    const step = (right - left) / Math.max(ticks.length, 1);
    ctx.save();
    for (let i = 0; i < ticks.length; i++) {
      if (i % 2 === 1) {
        ctx.fillStyle = 'rgba(229, 231, 235, 0.35)'; // cinza claro
        ctx.fillRect(left + i * step, top, step, bottom - top);
      }
    }
    ctx.restore();
  },
};
ChartJS.register(bandPlugin);

export default function Dashboard() {
  const [summary, setSummary] = useState({ today: {}, week: {}, month: {} });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [revenueByDay, setRevenueByDay] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedPaymentMethodIds, setSelectedPaymentMethodIds] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [sales, setSales] = useState([]);
  const [chartType, setChartType] = useState('line');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [payFilterOpen, setPayFilterOpen] = useState(true);
  const [prodFilterOpen, setProdFilterOpen] = useState(true);
  const [catFilterOpen, setCatFilterOpen] = useState(true);
  const [deliveryType, setDeliveryType] = useState('todos');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    if (!token || role !== 'ADMIN') return;
    loadSummary();
    loadPayments();
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    if (!token || role !== 'ADMIN') return;
    loadRevenue();
    loadSales();
  }, [startDate, endDate, selectedPaymentMethodIds, selectedProductIds, selectedCategoryIds, deliveryType]);

  async function loadSummary() {
    try {
      const params = {};
      if (deliveryType !== 'todos') params.delivery = deliveryType;
      const { data } = await api.get('/api/reports/summary', { params });
      setSummary(data);
    } catch (err) {
      console.warn('Falha ao carregar resumo:', err?.response?.status);
    }
  }

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    if (!token || role !== 'ADMIN') return;
    loadSummary();
  }, [deliveryType]);

  async function loadRevenue() {
    try {
      const params = {};
      if (startDate && !endDate) {
        const start = new Date(startDate); start.setHours(0,0,0,0);
        const end = new Date(startDate); end.setHours(23,59,59,999);
        params.start = start.toISOString();
        params.end = end.toISOString();
      } else {
        if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); params.start = s.toISOString(); }
        if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); params.end = e.toISOString(); }
      }
      if (deliveryType !== 'todos') params.delivery = deliveryType;
      const { data } = await api.get('/api/reports/revenue-by-day', { params });
      setRevenueByDay(data);
    } catch (err) {
      console.warn('Falha ao carregar faturamento:', err?.response?.status);
    }
  }

  async function loadPayments() {
    try {
      const { data } = await api.get('/api/payments');
      setPaymentMethods(data);
    } catch (err) {
      console.warn('Falha ao carregar pagamentos:', err?.response?.status);
    }
  }

  async function loadProducts() {
    try {
      const { data } = await api.get('/api/products');
      setProducts(data);
    } catch (err) {
      console.warn('Falha ao carregar produtos:', err?.response?.status);
    }
  }

  async function loadCategories() {
    try {
      const { data } = await api.get('/api/categories');
      setCategories(data);
    } catch (err) {
      console.warn('Falha ao carregar categorias:', err?.response?.status);
    }
  }

  async function loadSales() {
    try {
      const params = {};
      if (startDate && !endDate) {
        const start = new Date(startDate); start.setHours(0,0,0,0);
        const end = new Date(startDate); end.setHours(23,59,59,999);
        params.start = start.toISOString();
        params.end = end.toISOString();
      } else {
        if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); params.start = s.toISOString(); }
        if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); params.end = e.toISOString(); }
      }
      // Multi-seleção é tratada no frontend; não passamos filtros individuais aqui
      const { data } = await api.get('/api/sales', { params });
      setSales(data);
    } catch (err) {
      console.warn('Falha ao carregar vendas:', err?.response?.status);
    }
  }

  async function deleteSale(id) {
    try {
      const ok = window.confirm('Excluir esta venda permanentemente?');
      if (!ok) return;
      await api.delete(`/api/sales/${id}`);
      // Atualiza lista local rapidamente
      setSales(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Falha ao excluir venda');
    }
  }

  async function downloadExcel() {
    try {
      const params = {};
      if (startDate && !endDate) {
        const start = new Date(startDate); start.setHours(0,0,0,0);
        const end = new Date(startDate); end.setHours(23,59,59,999);
        params.start = start.toISOString();
        params.end = end.toISOString();
      } else {
        if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); params.start = s.toISOString(); }
        if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); params.end = e.toISOString(); }
      }
      if (deliveryType !== 'todos') params.delivery = deliveryType;
      const res = await api.get('/api/reports/export-xlsx', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Falha ao baixar Excel');
    }
  }

  // ===== Séries dinâmicas a partir das vendas + filtros múltiplos =====
  const palette = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#22c55e', '#06b6d4', '#f97316'];
  const productName = new Map(products.map(p => [String(p.id), p.name]));
  const paymentName = new Map(paymentMethods.map(pm => [String(pm.id), pm.name]));
  const categoryName = new Map(categories.map(c => [String(c.id), c.name]));
  const categoryByProductId = new Map(products.map(p => [String(p.id), p.category || '']));
  const selectedCategoryNames = new Set(selectedCategoryIds.map(id => categoryName.get(String(id))));
  // Filtro de entrega por item (delivery/presencial/todos)
  const deliveryMatchItem = (i) => {
    if (deliveryType === 'todos') return true;
    if (deliveryType === 'delivery') return i.isDelivery === true;
    return i.isDelivery === false; // presencial
  };

  function computeSeries() {
    // Usa chave de dia no horário local para evitar deslocamentos
    const dayKey = (date) => {
      const d = new Date(date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`; // chave estável para ordenação
    };
  
    // Pré-filtro leve para construir labels só com vendas potencialmente relevantes
    const filteredSales = sales.filter(sale => {
      const okPay = selectedPaymentMethodIds.length === 0 || selectedPaymentMethodIds.includes(String(sale.paymentMethodId));
      const okProd = selectedProductIds.length === 0 || sale.items.some(i => selectedProductIds.includes(String(i.productId)));
      const okCat = selectedCategoryIds.length === 0 || sale.items.some(i => {
        const cat = (i.product && i.product.category) || categoryByProductId.get(String(i.productId)) || '';
        return selectedCategoryNames.has(cat);
      });
      const okDelivery = deliveryType === 'todos' || sale.items.some(deliveryMatchItem);
      return okPay && okProd && okCat && okDelivery;
    });

    // Labels ordenadas (YYYY-MM-DD) e versão pt-BR (DD/MM)
    const labels = Array.from(new Set(filteredSales.map(s => dayKey(s.createdAt)))).sort();
    const labelsBR = labels.map(k => { const [y,m,d] = k.split('-'); return `${d}/${m}`; });
  
    // Dimensões selecionadas
    const dims = { payment: [], product: [], category: [] };
    if (selectedPaymentMethodIds.length) selectedPaymentMethodIds.forEach(id => dims.payment.push({ id: String(id), label: paymentName.get(String(id)) || String(id) }));
    if (selectedProductIds.length) selectedProductIds.forEach(id => dims.product.push({ id: String(id), label: productName.get(String(id)) || String(id) }));
    if (selectedCategoryIds.length) selectedCategoryIds.forEach(id => dims.category.push({ id: String(id), label: categoryName.get(String(id)) || String(id) }));
  
    const flattenCombos = (dimsObj) => {
      const keys = Object.keys(dimsObj).filter(k => dimsObj[k].length > 0);
      if (keys.length === 0) return [[]];
      let acc = [[]];
      keys.forEach(k => {
        const next = [];
        dimsObj[k].forEach(entry => {
          acc.forEach(base => next.push([...base, { type: k, id: entry.id, label: entry.label }]));
        });
        acc = next;
      });
      return acc;
    };
  
    // Base agregada quando não há múltiplas dimensões
    const labelToSum = {}; labels.forEach(l => { labelToSum[l] = 0; });
    const lineDatasets = [];
    const combos = flattenCombos(dims);
  
    if (combos.length <= 1) {
      filteredSales.forEach(s => {
        const k = dayKey(s.createdAt);
        let sum = 0;
        s.items.forEach(i => {
          if (!deliveryMatchItem(i)) return;
          const okProd = selectedProductIds.length === 0 || selectedProductIds.includes(String(i.productId));
          const cat = (i.product && i.product.category) || categoryByProductId.get(String(i.productId)) || '';
          const okCat = selectedCategoryIds.length === 0 || selectedCategoryNames.has(cat);
          if (okProd && okCat) sum += Number(i.unitPrice) * i.quantity;
        });
        labelToSum[k] += sum;
      });
      const data = labels.map(k => Number(labelToSum[k].toFixed(2)));
      lineDatasets.push({ label: 'Faturamento do período', data, borderColor: palette[0], backgroundColor: palette[0], tension: 0.3 });
    } else {
      combos.forEach((combo, idx) => {
        const data = labels.map(k => {
          let sum = 0;
          filteredSales.forEach(s => {
            if (dayKey(s.createdAt) !== k) return;
            const matchPay = combo.some(c => c.type === 'payment') ? combo.some(c => c.type === 'payment' && c.id === String(s.paymentMethodId)) : true;
            const visibleItems = s.items.filter(i => {
              if (!deliveryMatchItem(i)) return false;
              const matchProd = combo.some(c => c.type === 'product') ? combo.some(c => c.type === 'product' && c.id === String(i.productId)) : (selectedProductIds.length === 0 || selectedProductIds.includes(String(i.productId)));
              const cat = (i.product && i.product.category) || categoryByProductId.get(String(i.productId)) || '';
              const matchCat = combo.some(c => c.type === 'category') ? combo.some(c => c.type === 'category' && selectedCategoryNames.has(cat)) : (selectedCategoryIds.length === 0 || selectedCategoryNames.has(cat));
              return matchProd && matchCat;
            });
            if (matchPay) sum += visibleItems.reduce((a, i) => a + Number(i.unitPrice) * i.quantity, 0);
          });
          return Number(sum.toFixed(2));
        });
        lineDatasets.push({ label: combo.map(c => c.label).join(' • '), data, borderColor: palette[idx % palette.length], backgroundColor: palette[idx % palette.length], tension: 0.3 });
      });
    }

  // Barras
  const barDatasets = [];
  if (combos.length <= 1) {
    const data = labels.map(k => labelToSum[k]);
    barDatasets.push({ label: 'Faturamento do período', data, borderRadius: 6, backgroundColor: palette[0] + '99' });
  } else {
    combos.forEach((combo, idx) => {
      const data = labels.map(k => {
        let sum = 0;
        filteredSales.forEach(s => {
          if (dayKey(s.createdAt) !== k) return;
          const matchPay = combo.some(c => c.type === 'payment') ? combo.some(c => c.type === 'payment' && c.id === String(s.paymentMethodId)) : true;
          if (!matchPay) return;
          const visibleItems = s.items.filter(i => {
            if (!deliveryMatchItem(i)) return false;
            const matchProd = combo.some(c => c.type === 'product') ? combo.some(c => c.type === 'product' && c.id === String(i.productId)) : (selectedProductIds.length === 0 || selectedProductIds.includes(String(i.productId)));
            const cat = (i.product && i.product.category) || categoryByProductId.get(String(i.productId)) || '';
            const matchCat = combo.some(c => c.type === 'category') ? combo.some(c => c.type === 'category' && selectedCategoryNames.has(cat)) : (selectedCategoryIds.length === 0 || selectedCategoryNames.has(cat));
            return matchProd && matchCat;
          });
          sum += visibleItems.reduce((a, i) => a + Number(i.unitPrice) * i.quantity, 0);
        });
        return Number(sum.toFixed(2));
      });
      barDatasets.push({ label: combo.map(c => c.label).join(' • '), data, borderRadius: 6, backgroundColor: palette[idx % palette.length] + '99' });
    });
  }

  const stackedBar = barDatasets.length > 1;
  return { labels: labelsBR, lineDatasets, barDatasets, stackedBar };
}

  const computed = computeSeries();

  // Substitui dados do gráfico por versões dinâmicas
  const chartData = { labels: computed.labels, datasets: computed.lineDatasets };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: computed.lineDatasets.length > 1 },
      tooltip: {
        callbacks: { label: (ctx) => `R$ ${Number(ctx.parsed.y || 0).toFixed(2)}` },
        backgroundColor: 'rgba(17, 24, 39, 0.9)', titleColor: '#fff', bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#4b5563' } },
      y: { beginAtZero: true, grid: { color: 'rgba(226,232,240,0.6)', drawBorder: false }, ticks: { color: '#4b5563', callback: (v) => `R$ ${Number(v).toFixed(0)}` } },
    },
  };

  const chartDataBar = { labels: computed.labels, datasets: computed.barDatasets };
  const chartOptionsBar = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: computed.barDatasets.length > 1 },
      tooltip: {
        callbacks: { label: (ctx) => `R$ ${Number(ctx.parsed.y || 0).toFixed(2)}` },
        backgroundColor: 'rgba(17, 24, 39, 0.9)', titleColor: '#fff', bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#4b5563' }, stacked: computed.stackedBar },
      y: { beginAtZero: true, grid: { color: 'rgba(226,232,240,0.6)', drawBorder: false }, ticks: { color: '#4b5563', callback: (v) => `R$ ${Number(v).toFixed(0)}` }, stacked: computed.stackedBar },
    },
  };

  // substituído por versões dinâmicas baseadas em filtros múltiplos (chartData, chartOptions, chartDataBar, chartOptionsBar)

  return (
    <Protected roles={['ADMIN']}>
      <Layout>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Menu</h2>
          <MenuCards />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <div className="text-sm text-gray-600">Vendas Hoje</div>
            <div className="text-2xl font-semibold">R$ {Number(summary.today.total || 0).toFixed(2)}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Vendas Semana</div>
            <div className="text-2xl font-semibold">R$ {Number(summary.week.total || 0).toFixed(2)}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Vendas Mês</div>
            <div className="text-2xl font-semibold">R$ {Number(summary.month.total || 0).toFixed(2)}</div>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Filtros do Dashboard</div>
            <button className="btn" onClick={() => setFiltersOpen(!filtersOpen)}>
              {filtersOpen ? 'Recolher filtros' : 'Exibir filtros'}
            </button>
          </div>
          {filtersOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <div className="label">Início</div>
                <DatePicker selected={startDate} onChange={(d) => setStartDate(d)} className="input" placeholderText="dd/mm/aaaa" dateFormat="dd/MM/yyyy" />
              </div>
              <div>
                <div className="label">Fim</div>
                <DatePicker selected={endDate} onChange={(d) => setEndDate(d)} className="input" placeholderText="dd/mm/aaaa" dateFormat="dd/MM/yyyy" />
              </div>
            
              <MultiSelectDropdown
                label="Forma de pagamento"
                options={paymentMethods.map(pm => ({ value: pm.id, label: pm.name }))}
                selected={selectedPaymentMethodIds}
                onChange={setSelectedPaymentMethodIds}
                placeholder="Selecione formas de pagamento"
              />
            
              <MultiSelectDropdown
                label="Produto"
                options={products.map(p => ({ value: p.id, label: p.name }))}
                selected={selectedProductIds}
                onChange={setSelectedProductIds}
                placeholder="Selecione produtos"
              />
            
              <MultiSelectDropdown
                label="Categoria"
                options={categories.map(c => ({ value: c.id, label: c.name }))}
                selected={selectedCategoryIds}
                onChange={setSelectedCategoryIds}
                placeholder="Selecione categorias"
              />

              <div>
                <div className="label">Tipo</div>
                <select className="input" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}>
                  <option value="todos">Todos</option>
                  <option value="presencial">Presencial</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
            
              <div className="ml-auto flex items-center gap-2">
                <span className="label">Tipo de gráfico</span>
                <button
                  className={chartType === 'line' ? 'btn' : 'px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300'}
                  onClick={() => setChartType('line')}
                >
                  Linha
                </button>
                <button
                  className={chartType === 'bar' ? 'btn' : 'px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300'}
                  onClick={() => setChartType('bar')}
                >
                  Barras
                </button>
                <button className="btn ml-2" onClick={downloadExcel}>Baixar Excel</button>
              </div>
            </div>
          )}
          <div className="relative h-72">
            {chartType === 'line' ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <Bar data={chartDataBar} options={chartOptionsBar} />
            )}
          </div>
        </div>
        <div className="card">
          <div className="mb-4 font-semibold">Vendas no período</div>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border">Data/Hora</th>
                  <th className="text-left p-2 border">Usuário</th>
                  <th className="text-left p-2 border">Pagamento</th>
                  <th className="text-left p-2 border">Itens</th>
                  <th className="text-right p-2 border">Total (R$)</th>
                  <th className="text-right p-2 border w-28">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sales.filter(s => s.items.some(deliveryMatchItem)).map(s => {
                  const visibleItems = s.items.filter(deliveryMatchItem);
                  const totalVisible = visibleItems.reduce((a,i)=> a + Number(i.unitPrice)*i.quantity, 0);
                  return (
                    <tr key={s.id}>
                      <td className="p-2 border">{new Date(s.createdAt).toLocaleString('pt-BR')}</td>
                      <td className="p-2 border">{s.user?.name || s.userId}</td>
                      <td className="p-2 border">{s.paymentMethod?.name || s.paymentMethodId}</td>
                      <td className="p-2 border">
                        <div className="space-y-1">
                          {visibleItems.map(i => (
                            <div key={i.id}>{(i.product?.name || productName.get(String(i.productId)) || i.productId)} x{i.quantity} (R$ {Number(i.unitPrice).toFixed(2)})</div>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 border text-right">{Number(totalVisible).toFixed(2)}</td>
                      <td className="p-2 border text-right">
                        <button
                          className="btn-danger px-3 py-1 text-xs rounded"
                          aria-label="Excluir venda"
                          title="Excluir venda"
                          onClick={() => deleteSale(s.id)}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {sales.length === 0 && (
                    <tr>
                      <td className="p-2 border text-center" colSpan={6}>Nenhuma venda no período</td>
                    </tr>
                  )}
                </tbody>
            </table>
          </div>
        </div>
      </Layout>
    </Protected>
  );

}


// Dropdown multiselect simples com busca
function MultiSelectDropdown({ label, options, selected, onChange, placeholder = 'Selecione...', buttonClass = 'input' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
  const toggle = () => setOpen(!open);
  const done = () => setOpen(false);
  const clear = () => onChange([]);
  const onCheck = (val) => {
    const exists = selected.includes(String(val));
    if (exists) onChange(selected.filter(v => String(v) !== String(val)));
    else onChange([...selected, String(val)]);
  };
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <label className="label">{label}</label>
      </div>
      <button type="button" className={"w-full px-3 py-2 rounded border bg-white text-left hover:bg-gray-50 " + (buttonClass || '')} onClick={toggle}>
        {selected.length ? `${selected.length} selecionado(s)` : placeholder}
      </button>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white border rounded shadow">
          <div className="p-2 border-b">
            <input className="input" placeholder="Buscar..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(o => (
              <label key={o.value} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={selected.includes(String(o.value))} onChange={() => onCheck(o.value)} />
                <span>{o.label}</span>
              </label>
            ))}
            {filtered.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">Nada encontrado</div>}
          </div>
          <div className="flex justify-between p-2 border-t">
            <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={clear}>Limpar</button>
            <button className="btn" onClick={done}>Pronto</button>
          </div>
        </div>
      )}
    </div>
  );
}