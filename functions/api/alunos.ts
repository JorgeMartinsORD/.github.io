const EMUSYS_BASE_URL = "https://api.emusys.com.br/v1";

async function fetchEmusysWithPagination(
  token: string,
  endpoint: string,
  params: Record<string, string> = {}
): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | null = null;
  let hasMore = true;
  let pageCount = 0;

  while (hasMore) {
    pageCount++;
    const url = new URL(`${EMUSYS_BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    if (cursor) url.searchParams.append("cursor", cursor);
    url.searchParams.append("limite", "50");

    console.log(`[DEBUG] Fetching page ${pageCount}: ${url.toString()}`);

    try {
      const response = await fetch(url.toString(), {
        headers: { token },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ERROR] Emusys returned ${response.status}: ${errorText}`);
        throw new Error(`Emusys error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[DEBUG] Page ${pageCount} returned ${data.items?.length || 0} items`);
      
      results.push(...(data.items || []));
      hasMore = data.paginacao?.tem_mais || false;
      cursor = data.paginacao?.proximo_cursor || null;

      if (hasMore) await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.error(`[ERROR] Fetch failed on page ${pageCount}:`, err);
      throw err;
    }
  }

  return results;
}

export const onRequest: PagesFunction = async (context) => {
  try {
    console.log("[DEBUG] /api/alunos called");
    
    const token = context.env.EMUSYS_TOKEN;
    console.log(`[DEBUG] Token available: ${!!token}`);
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "EMUSYS_TOKEN not configured in environment" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(context.request.url);
    const status = url.searchParams.get("status") || "ativa";
    console.log(`[DEBUG] Fetching alunos with status: ${status}`);

    const matriculas = await fetchEmusysWithPagination(token, "/matriculas", {
      status: status,
    });

    console.log(`[DEBUG] Got ${matriculas.length} matriculas`);

    const alunos = matriculas.map((m) => ({
      id: m.aluno.id,
      nome: m.aluno.nome,
      email: m.aluno.email,
      telefone: m.aluno.telefone,
      data_nascimento: m.aluno.data_nascimento,
      disciplinas: m.contrato_atual?.disciplinas || [],
      status: m.status,
    }));

    console.log(`[DEBUG] Returning ${alunos.length} alunos`);

    return new Response(JSON.stringify({ items: alunos }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] Fatal error:`, message, err);
    return new Response(
      JSON.stringify({ error: message, details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
