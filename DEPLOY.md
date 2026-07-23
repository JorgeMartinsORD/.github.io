# Deploy — Cloudflare Pages

## Status Atual ✅

- **Projeto criado:** plataforma-ia-professores
- **URL:** https://plataforma-ia-professores.pages.dev
- **Deploy atual:** https://7a8cd503.plataforma-ia-professores.pages.dev
- **Conta:** 19jorgeml@gmail.com

## Fazendo Deploy

### Método 1: Cloudflare CLI (recomendado)

```bash
npm run build
wrangler pages deploy dist/
```

### Método 2: Git Integration (automático)

Conectar repositório GitHub ao Cloudflare Pages:
1. Push para `main` branch no GitHub
2. Cloudflare detecta e faz deploy automático
3. Cada commit = novo deployment

## Variáveis de Ambiente

No Cloudflare Pages Dashboard → Settings → Environment variables:
```
VITE_SUPABASE_URL=https://subyafcrtccaisssdsbq.supabase.co
VITE_SUPABASE_ANON_KEY=[sua-anon-key]
```

## Build & Deploy Automático

Edite `.github/workflows/deploy.yml` para CI/CD automático via GitHub Actions.

## Acessar Dashboard

https://dash.cloudflare.com → Pages → plataforma-ia-professores
