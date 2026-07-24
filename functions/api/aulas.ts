const EMUSYS_BASE_URL = "https://api.emusys.com.br/v1";

interface Aula {
  id: string;
  matricula_disciplina_id: number;
  categoria: string;
  presenca: string;
  professores: Array<{ presenca: string }>;
}

function isConfidentAbsence(aula: Aula): boolean {
  return aula.professores.some(p => p.presenca === "presente");
}

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
    const dataInicial = url.searchParams.get("data_inicial");
    const dataFinal = url.searchParams.get("data_final");

    if (!dataInicial || !dataFinal) {
      return new Response(
        JSON.stringify({ error: "data_inicial and data_final parameters required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const params = {
      data_hora_inicial: `${dataInicial}T00:00:00`,
      data_hora_final: `${dataFinal}T23:59:59`,
    };

    const aulas = await fetchEmusysWithPagination(token, "/aulas", params);
    const aulasProcessadas = aulas
      .filter((a: Aula) => a.matricula_disciplina_id > 0 || a.categoria === "experimental")
      .map((aula: Aula) => ({
        ...aula,
        is_confident_absence: isConfidentAbsence(aula),
      }));

    return new Response(JSON.stringify({ items: aulasProcessadas }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
