// GET /api/aulas?data_inicial=2026-07-20&data_final=2026-07-25

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

    const response = await fetch(url.toString(), {
      headers: { token },
    });

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
  const dataInicial = url.searchParams.get("data_inicial");
  const dataFinal = url.searchParams.get("data_final");

  if (!dataInicial || !dataFinal) {
    return new Response("data_inicial e data_final obrigatórios", { status: 400 });
  }

  const params = {
    data_hora_inicial: `${dataInicial}T00:00:00`,
    data_hora_final: `${dataFinal}T23:59:59`,
  };

  const aulas = await fetchEmusysWithPagination(token, "/aulas", params);
  const aulasLimpas = aulas.filter(
    (a) => a.matricula_disciplina_id > 0 || a.categoria === "experimental"
  );

  return new Response(JSON.stringify({ items: aulasLimpas }), {
    headers: { "Content-Type": "application/json" },
  });
};
