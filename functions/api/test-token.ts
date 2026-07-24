const EMUSYS_BASE_URL = "https://api.emusys.com.br/v1";

export const onRequest: PagesFunction = async (context) => {
  try {
    const token = context.env?.EMUSYS_TOKEN;
    console.log("[TEST] Token available:", !!token);
    console.log("[TEST] Token length:", token?.length);

    if (!token) {
      return new Response(
        JSON.stringify({ error: "No token configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[TEST] Calling Emusys /disciplinas endpoint...");
    const response = await fetch(`${EMUSYS_BASE_URL}/disciplinas?limite=1`, {
      headers: { token },
    });

    console.log("[TEST] Response status:", response.status);
    const responseText = await response.text();
    console.log("[TEST] Response body:", responseText);

    return new Response(
      JSON.stringify({
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
        bodyParsed: (() => {
          try {
            return JSON.parse(responseText);
          } catch {
            return null;
          }
        })(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message, stack: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
