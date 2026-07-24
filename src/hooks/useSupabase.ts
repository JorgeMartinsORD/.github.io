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
          .upsert({
            aluno_id: alunoId,
            disciplina_id: disciplinaId,
            objetivo,
            interesses_musicais: interesses,
            nivel,
          } as any);
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
  const salvarConteudo = useCallback(
    async (
      alunoId: number,
      disciplinaId: number,
      cicloNumero: number,
      aulaNumero: number,
      conteudo: string,
      cronogramaReferencia?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const { error: err } = await supabase
          .from('aula_conteudos')
          .upsert({
            aluno_id: alunoId,
            disciplina_id: disciplinaId,
            ciclo_numero: cicloNumero,
            aula_numero: aulaNumero,
            conteudo,
            cronograma_referencia: cronogramaReferencia,
            criado_por_ia: true,
          } as any);
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
        return data || [];
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
        const { error: err } = await supabase
          .from('aluno_avaliacao')
          .insert({
            aluno_id: alunoId,
            disciplina_id: disciplinaId,
            ciclo_numero: cicloNumero,
            aula_numero: 4,
            pontos_fortes: pontosFort,
            pontos_fracos: pontosFracos,
            notas_adicionais: notasAdicionais,
          } as any);
        if (err) throw err;
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
        const { data, error: err } = await supabase
          .from('aluno_avaliacao')
          .select('*')
          .eq('aluno_id', alunoId)
          .eq('disciplina_id', disciplinaId)
          .eq('ciclo_numero', cicloNumero)
          .single();
        if (err) throw err;
        return data;
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
          .upsert({
            aluno_id: alunoId,
            disciplina_id: disciplinaId,
            ciclo_numero: cicloNumero,
            aula_numero: aulaNumero,
            video_url: videoUrl,
            duracao_segundos: duracaoSegundos,
            notas_professor: notasProfessor,
          } as any);
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
    conteudo: { salvar: salvarConteudo, carregar: carregarConteudo },
    avaliacao: { salvar: salvarAvaliacao, carregar: carregarAvaliacao },
    gravacao: { salvar: salvarGravacao, carregar: carregarGravacao },
    ajuste: { salvar: salvarAjuste, carregar: carregarAjustes },
  };
};
