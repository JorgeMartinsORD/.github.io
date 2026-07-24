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
      const response = await fetch(url.toString(), {
        headers: { token },
      });

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
    console.log("[DEBUG] Token available:", !!token);

    if (!token) {
      return new Response(
        JSON.stringify({
          error: "EMUSYS_TOKEN not configured",
          debug: "no token in env",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(context.request.url);
    const status = url.searchParams.get("status") || "ativa";
    console.log("[DEBUG] Fetching matriculas with status:", status);

    const matriculas = await fetchEmusysWithPagination(token, "/matriculas", {
      status: status,
    });

    console.log("[DEBUG] Got matriculas:", matriculas.length);

    const alunos = matriculas.map((m) => ({
      id: m.aluno?.id,
      nome: m.aluno?.nome,
      email: m.aluno?.email,
      telefone: m.aluno?.telefone,
      data_nascimento: m.aluno?.data_nascimento,
      disciplinas: m.contrato_atual?.disciplinas || [],
      status: m.status,
    }));

    console.log("[DEBUG] Returning alunos:", alunos.length);
    return new Response(JSON.stringify({ items: alunos }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ERROR]", message, err);
    return new Response(
      JSON.stringify({ error: message, debug: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
