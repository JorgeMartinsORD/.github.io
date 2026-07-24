import { useState, useCallback } from 'react';

const WORKER_API_BASE = 'https://calm-night-3061.19jorgeml.workers.dev';

export const useEmusys = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async (endpoint: string, params?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${WORKER_API_BASE}${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          url.searchParams.append(k, v);
        });
      }

      console.log('[useEmusys] Calling:', url.toString());
      const response = await fetch(url.toString());
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
      const data = await call('/api/matriculas', { status });
      // Mapeia matrículas para formato de alunos esperado pelo frontend
      const alunos = data.items?.map((m: any) => ({
        id: m.aluno?.id,
        nome: m.aluno?.nome,
        email: m.aluno?.email,
        telefone: m.aluno?.telefone,
        data_nascimento: m.aluno?.data_nascimento,
        disciplinas: m.contrato_atual?.disciplinas || [],
      })) || [];
      return { items: alunos };
    },
    [call]
  );

  const getAulas = useCallback(
    async (dataInicial: string, dataFinal: string) => {
      return call('/api/aulas', {
        data_inicial: dataInicial,
        data_final: dataFinal,
      });
    },
    [call]
  );

  const getAulaNumero = useCallback(
    async (alunoId: string) => {
      const matriculas = await call('/api/matriculas', { aluno_id: alunoId });
      const nrAulasPassadas = matriculas.items?.[0]?.contrato_atual?.disciplinas?.[0]?.nr_aulas_passadas || 0;
      return { aluno_id: alunoId, aula_numero: nrAulasPassadas + 1, aulas_passadas: nrAulasPassadas };
    },
    [call]
  );

  const getProfessores = useCallback(async () => {
    const data = await call('/api/professores');
    return (data.professores || []) as Array<{ id: number; nome: string }>;
  }, [call]);

  return { getAlunos, getAulas, getAulaNumero, getProfessores, loading, error };
};
