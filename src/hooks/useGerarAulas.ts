import { useState, useCallback } from 'react';

interface DadosGeracaoAulas {
  alunoNome: string;
  disciplina: string;
  objetivo: string;
  interesses: string[];
  nivel: string;
  cronogramaReferencia: string;
  avaliacaoAnterior?: {
    pontosFort: string;
    pontosFracos: string;
  };
}

interface AulaGerada {
  numero: number;
  titulo: string;
  conteudo: string;
  duracao: string;
  materiais?: string[];
}

interface RespostaGeracaoAulas {
  sucesso: boolean;
  aulas?: AulaGerada[];
  erro?: string;
}

export const useGerarAulas = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gerar = useCallback(async (dados: DadosGeracaoAulas): Promise<AulaGerada[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gerar-aulas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || 'Erro ao gerar aulas');
      }

      const result: RespostaGeracaoAulas = await response.json();

      if (!result.sucesso) {
        throw new Error(result.erro || 'Falha na geração das aulas');
      }

      console.log('[useGerarAulas] Aulas geradas com sucesso:', result.aulas);
      return result.aulas || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar aulas';
      setError(message);
      console.error('[useGerarAulas] Erro:', message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { gerar, loading, error };
};
