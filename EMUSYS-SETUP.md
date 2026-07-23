# Integração Emusys — Setup

## 1. Registrar o Token como Secret no Cloudflare

Execute este comando no terminal (Windows PowerShell):

```powershell
cd C:\Users\jorgi\Desktop\Claude\plataforma-ia-frontend
wrangler secret put EMUSYS_TOKEN
```

Quando pedir o valor, cole:
```
GG7d5GW8hthJ5PqZTCeyYFK2xF6L86
```

Depois de colar, pressione **ENTER** e o terminal fechará a entrada (Ctrl+D no Mac, Ctrl+Z + ENTER no Windows).

✅ Secret registrado com sucesso!

---

## 2. Criar o Worker no Cloudflare

```powershell
wrangler deployments create
```

Ou manualmente:
1. Acesse: https://dash.cloudflare.com
2. Selecione **Workers & Pages**
3. Clique **Create**
4. Nome: `plataforma-ia-emusys-proxy`
5. Cole o código de `src/worker.ts`
6. **Deploy**

---

## 3. Conectar Workers → Pages

No Cloudflare Pages do projeto `plataforma-ia-professores`:

1. Settings → Functions
2. Routing: `/api/*` → Worker `plataforma-ia-emusys-proxy`
3. Save

---

## 4. Endpoints Disponíveis

Após configurar, use:

### Trazer informações do professor
```
GET /api/professor?email=seu-email@exemplo.com
```

### Listar alunos do professor
```
GET /api/alunos?status=ativa
```

### Trazer aulas de um período
```
GET /api/aulas?data_inicial=2026-07-20&data_final=2026-07-25
```

### Número da aula de um aluno
```
GET /api/aula-numero?aluno_id=123
```

---

## 5. Testar Localmente

```powershell
npm run build
wrangler pages deploy dist/
```

Ou via:
```bash
wrangler pages publish dist/
```

---

## Troubleshooting

**Erro: "Token inválido"**
- Verifique se o token foi registrado: `wrangler secret list`

**Erro: 429 (Rate limit)**
- A API Emusys limita a 60 req/min. O Worker tem cache de 10 min.
- Aguarde ou distribua as chamadas.

**Dados não aparecem**
- Verifique no Cloudflare Dashboard → Workers → Logs

