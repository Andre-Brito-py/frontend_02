import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-2">Página não encontrada</h1>
        <p className="text-gray-600 mb-4">A rota acessada não existe ou houve uma navegação incorreta.</p>
        <Link href="/" className="btn">Voltar ao início</Link>
      </div>
    </div>
  );
}