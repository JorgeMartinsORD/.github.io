import { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { useGerarAulas } from '../hooks/useGerarAulas';
import './VisualizarAulas.css';

interface Aluno {
  id: number;
  nome: string;
  disciplinas?: any[];
}

interface Props {
  aluno: Aluno;
  disciplinaId: number;
  cicloNumero: number;
  cronogramaReferencia: string;
}

interface AulaGerada {
  numero: number;
  titulo: string;
  conteudo: string;
  duracao: string;
  materiais?: string[];
}

export const VisualizarAulas = ({
  aluno,
  disciplinaId,
  cicloNumero,
  cronogramaReferencia,
}: Props) => {
  const { conteudo, perfil } = useSupabase();
  const { gerar, loading: gerandoAulas, error: erroGeracao } = useGerarAulas();

  const [aulas, setAulas] = useState<AulaGerada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [expandidas, setExpandidas] = useState<number[]>([]);
  const [perfilAluno, setPerfilAluno] = useState<any>(null);

  useEffect(() => {
    carregarDados();
  }, [cicloNumero]);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      // Carregar perfil
      const perfData = await perfil.carregar(aluno.id, disciplinaId);
      setPerfilAluno(perfData);

      // Carregar conteúdo existente
      const aulasExistentes = await conteudo.carregar(aluno.id, disciplinaId, cicloNumero);
      setAulas(aulasExistentes || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setCarregando(false);
    }
  };

  const handleGerarAulas = async () => {
    if (!perfilAluno) {
      alert('Perfil do aluno não encontrado. Preencha o perfil primeiro.');
      return;
    }

    try {
      const aulasGeradas = await gerar({
        alunoNome: aluno.nome,
        disciplina: 'Música',
        objetivo: perfilAluno.objetivo,
        interesses: perfilAluno.interesses_musicais || [],
        nivel: perfilAluno.nivel,
        cronogramaReferencia,
      });

      if (aulasGeradas) {
        setAulas(aulasGeradas);

        // Salvar no Supabase
        for (const aula of aulasGeradas) {
          await conteudo.salvar(
            aluno.id,
            disciplinaId,
            cicloNumero,
            aula.numero,
            aula.conteudo,
            cronogramaReferencia
          );
        }
      }
    } catch (err) {
      console.error('Erro ao gerar aulas:', err);
    }
  };

  const toggleExpandir = (numero: number) => {
    setExpandidas((prev) =>
      prev.includes(numero) ? prev.filter((n) => n !== numero) : [...prev, numero]
    );
  };

  return (
    <div className="visualizar-aulas">
      <div className="aulas-card">
        <header className="aulas-header">
          <div>
            <h2>📚 Aulas do Ciclo {cicloNumero}</h2>
            <p className="aluno-info">{aluno.nome}</p>
          </div>
          <button
            onClick={handleGerarAulas}
            disabled={gerandoAulas}
            className="btn-gerar"
          >
            {gerandoAulas ? '⏳ Gerando...' : '✨ Gerar Aulas com IA'}
          </button>
        </header>

        {erroGeracao && <div className="alerta erro">❌ {erroGeracao}</div>}

        {carregando && <div className="loading">Carregando aulas...</div>}

        {!carregando && aulas.length === 0 && (
          <div className="vazio">
            <p>Nenhuma aula gerada ainda.</p>
            <p className="hint">Clique em "Gerar Aulas com IA" para criar o plano de aulas</p>
          </div>
        )}

        {!carregando && aulas.length > 0 && (
          <div className="aulas-lista">
            {aulas.map((aula) => (
              <div key={aula.numero} className="aula-item">
                <div
                  className={`aula-header-item ${expandidas.includes(aula.numero) ? 'expandida' : ''}`}
                  onClick={() => toggleExpandir(aula.numero)}
                >
                  <div className="aula-numero">
                    <span className="numero-circulo">{aula.numero}</span>
                  </div>
                  <div className="aula-resumo">
                    <h3>{aula.titulo}</h3>
                    <p className="duracao">⏱️ {aula.duracao}</p>
                  </div>
                  <div className="chevron">
                    {expandidas.includes(aula.numero) ? '▼' : '▶'}
                  </div>
                </div>

                {expandidas.includes(aula.numero) && (
                  <div className="aula-conteudo-expandido">
                    <div className="conteudo-texto">
                      <h4>Conteúdo</h4>
                      <p>{aula.conteudo}</p>
                    </div>

                    {aula.materiais && aula.materiais.length > 0 && (
                      <div className="materiais">
                        <h4>📋 Materiais</h4>
                        <ul>
                          {aula.materiais.map((material, idx) => (
                            <li key={idx}>{material}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="aulas-footer">
          <p className="info-ciclo">
            Ciclo {cicloNumero} • {aulas.length} aulas • Cronograma: {cronogramaReferencia}
          </p>
        </div>
      </div>
    </div>
  );
};
