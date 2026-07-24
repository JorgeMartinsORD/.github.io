import { useState, useCallback } from 'react';

const EMUSYS_API_BASE = 'https://api.emusys.com.br/v1';
const EMUSYS_TOKEN = import.meta.env.VITE_EMUSYS_TOKEN;

export const useEmusys = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async (endpoint: string, params?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${EMUSYS_API_BASE}${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          url.searchParams.append(k, v);
        });
      }

      const response = await fetch(url.toString(), {
        headers: { token: EMUSYS_TOKEN },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API error: ${response.status} - ${errorBody}`);
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

  const getAlunos = useCallback(
    async (status = 'todas') => {
      return call('/matriculas', { status });
    },
    [call]
  );

  const getAulas = useCallback(
    async (dataInicial: string, dataFinal: string) => {
      return call('/aulas', {
        data_hora_inicial: `${dataInicial}T00:00:00`,
        data_hora_final: `${dataFinal}T23:59:59`,
      });
    },
    [call]
  );

  const getAulaNumero = useCallback(
    async (alunoId: string) => {
      const matriculas = await call('/matriculas', { aluno_id: alunoId });
      const nrAulasPassadas = matriculas.items?.[0]?.contrato_atual?.disciplinas?.[0]?.nr_aulas_passadas || 0;
      return { aluno_id: alunoId, aula_numero: nrAulasPassadas + 1, aulas_passadas: nrAulasPassadas };
    },
    [call]
  );

  return { getAlunos, getAulas, getAulaNumero, loading, error };
};
