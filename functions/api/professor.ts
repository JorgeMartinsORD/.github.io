// GET /api/professor?email=seu-email@exemplo.com

const EMUSYS_BASE_URL = "https://api.emusys.com.br/v1";

export const onRequest: PagesFunction = async (context) => {
  const token = context.env.EMUSYS_TOKEN;
  if (!token) return new Response("Token não configurado", { status: 500 });

  const url = new URL(context.request.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return new Response("email obrigatório", { status: 400 });
  }

  const response = await fetch(
    `${EMUSYS_BASE_URL}/pessoas/buscar?email=${encodeURIComponent(email)}`,
    { headers: { token } }
  );

  if (!response.ok) {
    return new Response("Professor não encontrado", { status: 404 });
  }

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};
