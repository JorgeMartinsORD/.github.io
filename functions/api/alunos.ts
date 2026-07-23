// GET /api/alunos?status=ativa

const EMUSYS_BASE_URL = "https://api.emusys.com.br/v1";

async function fetchEmusysWithPagination(
  token: string,
  endpoint: string,
  params: Record<string, string> = {}
): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${EMUSYS_BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    if (cursor) url.searchParams.append("cursor", cursor);
    url.searchParams.append("limite", "50");

    const response = await fetch(url.toString(), { headers: { token } });
    if (!response.ok) throw new Error(`Emusys error: ${response.status}`);

    const data = await response.json();
    results.push(...(data.items || []));
    hasMore = data.paginacao?.tem_mais || false;
    cursor = data.paginacao?.proximo_cursor || null;

    if (hasMore) await new Promise((r) => setTimeout(r, 100));
  }

  return results;
}

export const onRequest: PagesFunction = async (context) => {
  const token = context.env.EMUSYS_TOKEN;
  if (!token) return new Response("Token não configurado", { status: 500 });

  const url = new URL(context.request.url);
  const status = url.searchParams.get("status") || "ativa";

  const matriculas = await fetchEmusysWithPagination(token, "/matriculas", { status });

  const alunos = matriculas.map((m) => ({
    id: m.aluno.id,
    nome: m.aluno.nome,
    email: m.aluno.email,
    telefone: m.aluno.telefone,
    data_nascimento: m.aluno.data_nascimento,
    disciplinas: m.contrato_atual?.disciplinas || [],
    status: m.status,
  }));

  return new Response(JSON.stringify({ items: alunos }), {
    headers: { "Content-Type": "application/json" },
  });
};
