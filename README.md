# Sistema de Caixa — Frontend (Next.js)

Este repositório contém apenas o frontend (Next.js) do sistema de caixa. Está pronto para deploy na Vercel.

## Requisitos
- Node.js 18+
- Vercel (para deploy)
- Backend acessível via HTTP com autenticação JWT

## Configuração
Defina a URL da API no ambiente:

- Variável: NEXT_PUBLIC_API_URL
- Exemplo: https://seu-backend.onrender.com

O frontend lê essa variável em lib/api.js e adiciona o token JWT automaticamente nas requisições.

## Desenvolvimento local
`ash
npm install
npm run dev
`
Acesse http://localhost:3000.

## Build e produção local
`ash
npm run build
npm start
`

## Deploy na Vercel
1. Crie um projeto na Vercel e conecte este repositório.
2. Em Settings → Environment Variables, adicione:
   - NEXT_PUBLIC_API_URL = URL pública do backend
3. Faça o deploy. Acesse o domínio gerado (https://<seu-projeto>.vercel.app).

## Observações
- Se o backend estiver em Render (free), a primeira chamada pode demorar ~20–40s (hibernação). Considere avisar no frontend.
- Autenticação: o token é salvo em localStorage (chave 	oken). Em 401 o app redireciona para login.

## Estrutura
- pages/: páginas Next.js (login, dashboard, vendas, etc.)
- components/: layout e guardas de rota
- lib/api.js: cliente Axios com base URL e interceptores
- styles/: estilos Tailwind

## Licença
Uso interno do cliente. Sem autorização para revenda.
