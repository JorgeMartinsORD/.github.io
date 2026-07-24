const EMUSYS_BASE_URL = "https://api.emusys.com.br/v1";

export const onRequest: PagesFunction = async (context) => {
  try {
    const token = context.env?.EMUSYS_TOKEN;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "No token" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log what we're sending
    const headersToSend = {
      token: token,
      "Content-Type": "application/json",
    };

    console.log("[HEADERS] Sending:", JSON.stringify(headersToSend));
    console.log("[TOKEN] Value:", token);
    console.log("[TOKEN] Length:", token.length);
    console.log("[TOKEN] First 10:", token.substring(0, 10));

    const response = await fetch(`${EMUSYS_BASE_URL}/professores?limite=1`, {
      headers: headersToSend,
    });

    const body = await response.text();

    return new Response(
      JSON.stringify({
        sent_headers: headersToSend,
        response_status: response.status,
        response_headers: Object.fromEntries(response.headers.entries()),
        response_body: body,
        response_parsed: (() => {
          try {
            return JSON.parse(body);
          } catch {
            return null;
          }
        })(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
