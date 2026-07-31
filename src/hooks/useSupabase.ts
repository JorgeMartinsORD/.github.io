import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

export const useSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PERFIL
  const salvarPerfil = useCallback(
    async (alunoId: number, disciplinaId: number, objetivo: string, interesses: string[], nivel: string) => {
      setLoading(true);
      setError(null);
      try {
        const { error: err } = await supabase
          .from('aluno_perfil')
          .upsert(
            {
              aluno_id: alunoId,
              disciplina_id: disciplinaId,
              objetivo,
              interesses_musicais: interesses,
              nivel,
            } as any,
            { onConflict: 'aluno_id,disciplina_id' }
          );
        if (err) throw err;
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao salvar perfil';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const carregarPerfil = useCallback(async (alunoId: number, disciplinaId: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('aluno_perfil')
        .select('*')
        .eq('aluno_id', alunoId)
        .eq('disciplina_id', disciplinaId)
        .single();
      if (err) throw err;
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar perfil';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // CONTEÚDO DE AULAS
  // A aula gerada pela IA tem estrutura rica (titulo, conteudo, duracao, materiais).
  // Como a coluna `conteudo` é a única disponível para o corpo, persistimos a aula
  // completa como JSON ali e reconstruímos ao carregar (com fallback p/ linhas antigas em texto puro).
  const salvarConteudo = useCallback(
    async (
      alunoId: number,
      disciplinaId: number,
      cicloNumero: number,
      aula: { numero: number; titulo?: string; conteudo: string; duracao?: string; materiais?: string[] },
      cronogramaReferencia?: string,
      criadoPorIa: boolean = true
    ) => {
      setLoading(true);
      setError(null);
      try {
        const payload = JSON.stringify({
          titulo: aula.titulo || `Aula ${aula.numero}`,
          conteudo: aula.conteudo,
          duracao: aula.duracao || '',
          materiais: aula.materiais || [],
        });
        const { error: err } = await supabase
          .from('aula_conteudos')
          .upsert(
            {
              aluno_id: alunoId,
              disciplina_id: disciplinaId,
              ciclo_numero: cicloNumero,
              aula_numero: aula.numero,
              conteudo: payload,
              cronograma_referencia: cronogramaReferencia,
              criado_por_ia: criadoPorIa,
            } as any,
            { onConflict: 'aluno_id,disciplina_id,ciclo_numero,aula_numero' }
          );
        if (err) throw err;
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao salvar conteúdo';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const carregarConteudo = useCallback(
    async (alunoId: number, disciplinaId: number, cicloNumero: number) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('aula_conteudos')
          .select('*')
          .eq('aluno_id', alunoId)
          .eq('disciplina_id', disciplinaId)
          .eq('ciclo_numero', cicloNumero)
          .order('aula_numero', { ascending: true });
        if (err) throw err;
        // Reconstrói a estrutura rica; aceita tanto JSON novo quanto texto puro legado
        return (data || []).map((row: any) => {
          let parsed: any = null;
          try {
            const p = JSON.parse(row.conteudo);
            if (p && typeof p === 'object' && ('titulo' in p || 'conteudo' in p)) parsed = p;
          } catch {
            /* texto puro legado */
          }
          return {
            numero: row.aula_numero,
            titulo: parsed?.titulo || `Aula ${row.aula_numero}`,
            conteudo: parsed?.conteudo ?? row.conteudo,
            duracao: parsed?.duracao || '',
            materiais: parsed?.materiais || [],
            criadoPorIa: row.criado_por_ia !== false,
          };
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar conteúdo';
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Retorna o maior ciclo já salvo para (aluno, disciplina); 0 se não houver
  const ultimoCiclo = useCallback(async (alunoId: number, disciplinaId: number) => {
    try {
      const { data } = await supabase
        .from('aula_conteudos')
        .select('ciclo_numero')
        .eq('aluno_id', alunoId)
        .eq('disciplina_id', disciplinaId)
        .order('ciclo_numero', { ascending: false })
        .limit(1);
      return (data && (data[0] as any)?.ciclo_numero) || 0;
    } catch {
      return 0;
    }
  }, []);

  // AVALIAÇÃO
  const salvarAvaliacao = useCallback(
    async (
      alunoId: number,
      disciplinaId: number,
      cicloNumero: number,
      pontosFort: string,
      pontosFracos: string,
      notasAdicionais?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const campos = {
          aula_numero: 4,
          pontos_fortes: pontosFort,
          pontos_fracos: pontosFracos,
          notas_adicionais: notasAdicionais,
        };
        // Sem unique constraint nesta tabela: procura existente e atualiza, senão insere.
        // Evita duplicatas (que quebrariam o carregar) sem depender de DDL.
        const { data: existente } = await supabase
          .from('aluno_avaliacao')
          .select('id')
          .eq('aluno_id', alunoId)
          .eq('disciplina_id', disciplinaId)
          .eq('ciclo_numero', cicloNumero)
          .order('created_at', { ascending: false })
          .limit(1);

        if (existente && existente[0]) {
          const { error: err } = await (supabase.from('aluno_avaliacao') as any)
            .update(campos)
            .eq('id', (existente[0] as any).id);
          if (err) throw err;
        } else {
          const { error: err } = await supabase
            .from('aluno_avaliacao')
            .insert({
              aluno_id: alunoId,
              disciplina_id: disciplinaId,
              ciclo_numero: cicloNumero,
              ...campos,
            } as any);
          if (err) throw err;
        }
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao salvar avaliação';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const carregarAvaliacao = useCallback(
    async (alunoId: number, disciplinaId: number, cicloNumero: number) => {
      setLoading(true);
      setError(null);
      try {
        // Robusto a eventuais duplicatas legadas: pega a mais recente em vez de .single()
        const { data, error: err } = await supabase
          .from('aluno_avaliacao')
          .select('*')
          .eq('aluno_id', alunoId)
          .eq('disciplina_id', disciplinaId)
          .eq('ciclo_numero', cicloNumero)
          .order('created_at', { ascending: false })
          .limit(1);
        if (err) throw err;
        return (data && data[0]) || null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Avaliação não encontrada';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // GRAVAÇÃO
  const salvarGravacao = useCallback(
    async (
      alunoId: number,
      disciplinaId: number,
      cicloNumero: number,
      aulaNumero: number,
      videoUrl: string,
      duracaoSegundos?: number,
      notasProfessor?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const { error: err } = await supabase
          .from('aula_gravacao')
          .upsert(
            {
              aluno_id: alunoId,
              disciplina_id: disciplinaId,
              ciclo_numero: cicloNumero,
              aula_numero: aulaNumero,
              video_url: videoUrl,
              duracao_segundos: duracaoSegundos,
              notas_professor: notasProfessor,
            } as any,
            { onConflict: 'aluno_id,disciplina_id,ciclo_numero,aula_numero' }
          );
        if (err) throw err;
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao salvar gravação';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const carregarGravacao = useCallback(
    async (alunoId: number, disciplinaId: number, cicloNumero: number, aulaNumero: number) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('aula_gravacao')
          .select('*')
          .eq('aluno_id', alunoId)
          .eq('disciplina_id', disciplinaId)
          .eq('ciclo_numero', cicloNumero)
          .eq('aula_numero', aulaNumero)
          .single();
        if (err) throw err;
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gravação não encontrada';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // AJUSTE MANUAL
  const salvarAjuste = useCallback(
    async (
      alunoId: number,
      disciplinaId: number,
      cicloNumero: number,
      descricao: string,
      motivo?: string,
      aplicadoNaAula?: number
    ) => {
      setLoading(true);
      setError(null);
      try {
        const { error: err } = await supabase
          .from('ajuste_manual')
          .insert({
            aluno_id: alunoId,
            disciplina_id: disciplinaId,
            ciclo_numero: cicloNumero,
            descricao,
            motivo,
            aplicado_na_aula: aplicadoNaAula,
          } as any);
        if (err) throw err;
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao salvar ajuste';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const carregarAjustes = useCallback(
    async (alunoId: number, disciplinaId: number, cicloNumero: number) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('ajuste_manual')
          .select('*')
          .eq('aluno_id', alunoId)
          .eq('disciplina_id', disciplinaId)
          .eq('ciclo_numero', cicloNumero)
          .order('created_at', { ascending: false });
        if (err) throw err;
        return data || [];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar ajustes';
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    perfil: { salvar: salvarPerfil, carregar: carregarPerfil },
    conteudo: { salvar: salvarConteudo, carregar: carregarConteudo, ultimoCiclo },
    avaliacao: { salvar: salvarAvaliacao, carregar: carregarAvaliacao },
    gravacao: { salvar: salvarGravacao, carregar: carregarGravacao },
    ajuste: { salvar: salvarAjuste, carregar: carregarAjustes },
  };
};
