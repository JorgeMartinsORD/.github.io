# Setup da Plataforma IA Professores

## Estrutura do Projeto

```
src/
├── components/        # Componentes React reutilizáveis
│   └── Login.tsx     # Tela de login
├── contexts/         # Context API para estado global
│   └── AuthContext.tsx
├── lib/              # Utilitários e configurações
│   └── supabase.ts   # Cliente Supabase
├── types/            # TypeScript types
│   └── index.ts
├── App.tsx           # Componente principal
└── main.tsx
```

## Rodando Localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173

## Variáveis de Ambiente

Arquivo `.env` (já criado com dados do projeto):
```
VITE_SUPABASE_URL=https://subyafcrtccaisssdsbq.supabase.co
VITE_SUPABASE_ANON_KEY=[sua-anon-key]
```

## Testando o Login

**Email de teste:**
- Email: `19jorgeml@gmail.com`
- Senha: [a que você definiu no Supabase]

Após login bem-sucedido:
1. ✅ RLS está funcionando (JWT validado)
2. ✅ Dados do professor carregados
3. ✅ Redirecionado para Dashboard

## Deploy em Cloudflare Pages

```bash
npm run build
```

Depois:
1. Conecta o repositório git no Cloudflare Pages
2. Build command: `npm run build`
3. Publish directory: `dist`

Pronto para deploy! 🚀
