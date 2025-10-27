export default function MenuCards() {
  const cards = [
    { title: 'Produtos', desc: 'Gerencie produtos e adicionais', href: '/products' },
    { title: 'Caixas', desc: 'Cadastre e edite operadores de caixa', href: '/cashiers' },
    { title: 'Pagamentos', desc: 'Defina formas de pagamento', href: '/payments' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map(card => (
        <a key={card.title} href={card.href} className="menu-card">
          <div className="menu-card-title">{card.title}</div>
          <div className="menu-card-desc">{card.desc}</div>
        </a>
      ))}
    </div>
  );
}