const EMUSYS_BASE_URL = "https://api.emusys.com.br/v1";

export const onRequest: PagesFunction = async (context) => {
  try {
    const token = context.env?.EMUSYS_TOKEN;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "No token configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Test 1: /professores
    const resp1 = await fetch(`${EMUSYS_BASE_URL}/professores?limite=1`, {
      headers: { token },
    });
    const body1 = await resp1.text();

    // Test 2: /matriculas
    const resp2 = await fetch(`${EMUSYS_BASE_URL}/matriculas?status=ativa&limite=1`, {
      headers: { token },
    });
    const body2 = await resp2.text();

    // Test 3: /disciplinas
    const resp3 = await fetch(`${EMUSYS_BASE_URL}/disciplinas?limite=1`, {
      headers: { token },
    });
    const body3 = await resp3.text();

    return new Response(
      JSON.stringify({
        professores: {
          status: resp1.status,
          body: (() => {
            try {
              return JSON.parse(body1);
            } catch {
              return body1;
            }
          })(),
        },
        matriculas: {
          status: resp2.status,
          body: (() => {
            try {
              return JSON.parse(body2);
            } catch {
              return body2;
            }
          })(),
        },
        disciplinas: {
          status: resp3.status,
          body: (() => {
            try {
              return JSON.parse(body3);
            } catch {
              return body3;
            }
          })(),
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
