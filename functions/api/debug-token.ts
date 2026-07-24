export const onRequest: PagesFunction = async (context) => {
  const token = context.env?.EMUSYS_TOKEN;

  return new Response(
    JSON.stringify({
      token_set: !!token,
      token_length: token?.length || 0,
      token_first_chars: token?.substring(0, 10) || null,
      token_last_chars: token?.substring(token.length - 10) || null,
      full_token: token || "NOT SET",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};
