// GET /api/professor?email=seu-email@exemplo.com

const EMUSYS_BASE_URL = "https://api.emusys.com.br/v1";

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
    const email = url.searchParams.get("email");

    if (!email) {
      return new Response(
        JSON.stringify({ error: "email parameter required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(
      `${EMUSYS_BASE_URL}/pessoas/buscar?email=${encodeURIComponent(email)}`,
      { headers: { token } }
    );

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Professor not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
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
