export const onRequest: PagesFunction = async (context) => {
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ erro: 'Method not allowed' }), { status: 405 });
  }

  try {
    const dados = await context.request.json();

    const {
      alunoNome,
      disciplina,
      objetivo,
      interesses,
      nivel,
      cronogramaReferencia,
      avaliacaoAnterior,
    } = dados;

    // Pegar API Key do ambiente (secret configurado no Cloudflare Pages)
    const openaiApiKey = context.env?.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ sucesso: false, erro: 'API Key do OpenAI não configurada no servidor' }),
        { status: 500 }
      );
    }

    if (!alunoNome || !disciplina || !objetivo || !nivel) {
      return new Response(
        JSON.stringify({ sucesso: false, erro: 'Dados incompletos do aluno' }),
        { status: 400 }
      );
    }

    // Construir prompt
    const prompt = construirPrompt(
      alunoNome,
      disciplina,
      objetivo,
      interesses,
      nivel,
      cronogramaReferencia,
      avaliacaoAnterior
    );

    // Chamar OpenAI
    const aulas = await chamarOpenAI(prompt, openaiApiKey);

    return new Response(
      JSON.stringify({
        sucesso: true,
        aulas,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[gerar-aulas] Erro:', message);

    return new Response(
      JSON.stringify({
        sucesso: false,
        erro: message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

function construirPrompt(
  alunoNome: string,
  disciplina: string,
  objetivo: string,
  interesses: string[],
  nivel: string,
  cronogramaReferencia: string,
  avaliacaoAnterior?: any
): string {
  const contextAvaliacao = avaliacaoAnterior
    ? `\n\nAvaliação anterior:\n- Pontos fortes: ${avaliacaoAnterior.pontosFort}\n- Pontos a melhorar: ${avaliacaoAnterior.pontosFracos}`
    : '';

  return `Você é um professor experiente de ${disciplina}. Gere um plano de 4 aulas para:

Aluno: ${alunoNome}
Disciplina: ${disciplina}
Objetivo: ${objetivo}
Interesses musicais: ${interesses.join(', ')}
Nível: ${nivel}
Cronograma de referência: ${cronogramaReferencia}
${contextAvaliacao}

Responda em JSON válido com este formato exato (sem markdown, apenas JSON puro):
{
  "aulas": [
    {
      "numero": 1,
      "titulo": "Título da aula",
      "conteudo": "Descrição detalhada do conteúdo e atividades",
      "materiais": ["Material 1", "Material 2"]
    },
    {
      "numero": 2,
      "titulo": "...",
      "conteudo": "...",
      "materiais": [...]
    },
    {
      "numero": 3,
      "titulo": "...",
      "conteudo": "...",
      "materiais": [...]
    },
    {
      "numero": 4,
      "titulo": "...",
      "conteudo": "...",
      "materiais": [...]
    }
  ]
}`;
}

async function chamarOpenAI(prompt: string, apiKey: string): Promise<any[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Você é um professor experiente. Retorne SEMPRE respostas em JSON válido, sem markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API: ${errorData.error?.message || 'Erro desconhecido'}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Resposta vazia do OpenAI');
  }

  // Extrair JSON da resposta
  let aulas;
  try {
    aulas = JSON.parse(content);
  } catch {
    // Tentar extrair JSON do markdown
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      aulas = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error('Não foi possível extrair JSON da resposta do OpenAI');
    }
  }

  return aulas.aulas || aulas;
}
