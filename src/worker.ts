// ============================================================================
//  CLOUDFLARE WORKER — Proxy seguro para API Emusys
//  Token guardado como secret, nunca vai pro frontend
// ============================================================================

const EMUSYS_BASE_URL = "https://api.emusys.com.br/v1";

// Helper para chamar API Emusys com paginação
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

    if (cursor) {
      url.searchParams.append("cursor", cursor);
    }

    url.searchParams.append("limite", "50");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        token: token,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Emusys API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    results.push(...(data.items || []));

    hasMore = data.paginacao?.tem_mais || false;
    cursor = data.paginacao?.proximo_cursor || null;

    if (hasMore) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return results;
}

export default {
  async fetch(
    request: Request,
    env: { EMUSYS_TOKEN: string }
  ): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const token = env.EMUSYS_TOKEN;

      // GET /api/aulas
      if (pathname === "/api/aulas" && request.method === "GET") {
        const dataInicial = url.searchParams.get("data_inicial");
        const dataFinal = url.searchParams.get("data_final");
        const professorId = url.searchParams.get("professor_id");

        if (!dataInicial || !dataFinal) {
          return new Response(
            JSON.stringify({ error: "data_inicial e data_final obrigatórios" }),
            { status: 400, headers: corsHeaders }
          );
        }

        const params: Record<string, string> = {
          data_hora_inicial: `${dataInicial}T00:00:00`,
          data_hora_final: `${dataFinal}T23:59:59`,
        };

        if (professorId) {
          params.professor_id = professorId;
        }

        const aulas = await fetchEmusysWithPagination(token, "/aulas", params);
        const aulasLimpas = aulas.filter((a) => a.matricula_disciplina_id > 0 || a.categoria === "experimental");

        return new Response(JSON.stringify({ items: aulasLimpas }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /api/alunos
      if (pathname === "/api/alunos" && request.method === "GET") {
        const status = url.searchParams.get("status") || "ativa";

        const matriculas = await fetchEmusysWithPagination(token, "/matriculas", {
          status: status,
        });

        const alunos = matriculas.map((m) => ({
          id: m.aluno.id,
          lead_id: m.aluno.lead_id,
          nome: m.aluno.nome,
          email: m.aluno.email,
          telefone: m.aluno.telefone,
          data_nascimento: m.aluno.data_nascimento,
          cpf: m.aluno.cpf,
          disciplinas: m.contrato_atual?.disciplinas || [],
          status: m.status,
          data_matricula: m.data_matricula,
        }));

        return new Response(JSON.stringify({ items: alunos }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /api/professor
      if (pathname === "/api/professor" && request.method === "GET") {
        const email = url.searchParams.get("email");

        if (!email) {
          return new Response(JSON.stringify({ error: "email obrigatório" }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const response = await fetch(
          `${EMUSYS_BASE_URL}/pessoas/buscar?email=${encodeURIComponent(email)}`,
          { headers: { token } }
        );

        if (!response.ok) {
          return new Response(JSON.stringify({ error: "Professor não encontrado" }), {
            status: 404,
            headers: corsHeaders,
          });
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /api/aula-numero
      if (pathname === "/api/aula-numero" && request.method === "GET") {
        const alunoId = url.searchParams.get("aluno_id");

        if (!alunoId) {
          return new Response(JSON.stringify({ error: "aluno_id obrigatório" }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const matriculas = await fetchEmusysWithPagination(token, "/matriculas", {
          aluno_id: alunoId,
        });

        let nrAulasPassadas = 0;
        if (matriculas.length > 0) {
          const m = matriculas[0];
          const disc = m.contrato_atual?.disciplinas?.[0];
          nrAulasPassadas = disc?.nr_aulas_passadas || 0;
        }

        return new Response(
          JSON.stringify({
            aluno_id: alunoId,
            aula_numero: nrAulasPassadas + 1,
            aulas_passadas: nrAulasPassadas,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET /api/disciplinas
      if (pathname === "/api/disciplinas" && request.method === "GET") {
        const response = await fetch(`${EMUSYS_BASE_URL}/disciplinas`, {
          headers: { token },
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Endpoint não encontrado" }), {
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};
