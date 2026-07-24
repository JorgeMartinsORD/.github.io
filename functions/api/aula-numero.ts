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

    try {
      const response = await fetch(url.toString(), { headers: { token } });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Emusys ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      results.push(...(data.items || []));
      hasMore = data.paginacao?.tem_mais || false;
      cursor = data.paginacao?.proximo_cursor || null;

      if (hasMore) await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      throw err;
    }
  }

  return results;
}

export const onRequest: PagesFunction = async (context) => {
  try {
    const token = context.env?.EMUSYS_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({
          error: "EMUSYS_TOKEN not configured",
          hint: "Run: wrangler secret put EMUSYS_TOKEN",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(context.request.url);
    const alunoId = url.searchParams.get("aluno_id");

    if (!alunoId) {
      return new Response(
        JSON.stringify({ error: "aluno_id parameter required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const matriculas = await fetchEmusysWithPagination(token, "/matriculas", {
      aluno_id: alunoId,
    });

    let nrAulasPassadas = 0;
    if (matriculas.length > 0) {
      const disc = matriculas[0].contrato_atual?.disciplinas?.[0];
      nrAulasPassadas = disc?.nr_aulas_passadas || 0;
    }

    return new Response(
      JSON.stringify({
        aluno_id: alunoId,
        aula_numero: nrAulasPassadas + 1,
        aulas_passadas: nrAulasPassadas,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
