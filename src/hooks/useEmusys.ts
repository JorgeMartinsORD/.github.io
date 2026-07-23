import { useState, useCallback } from 'react';

const EMUSYS_API_BASE = '/api';

export const useEmusys = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async (endpoint: string, params?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${EMUSYS_API_BASE}${endpoint}`, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          url.searchParams.append(k, v);
        });
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao chamar API';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProfessor = useCallback(
    async (email: string) => {
      return call('/professor', { email });
    },
    [call]
  );

  const getAlunos = useCallback(
    async (status = 'ativa') => {
      return call('/alunos', { status });
    },
    [call]
  );

  const getAulas = useCallback(
    async (dataInicial: string, dataFinal: string) => {
      return call('/aulas', { data_inicial: dataInicial, data_final: dataFinal });
    },
    [call]
  );

  const getAulaNumero = useCallback(
    async (alunoId: string) => {
      return call('/aula-numero', { aluno_id: alunoId });
    },
    [call]
  );

  return { getProfessor, getAlunos, getAulas, getAulaNumero, loading, error };
};
