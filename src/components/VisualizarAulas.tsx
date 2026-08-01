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
  criadoPorIa?: boolean;
  videoUrl?: string;
}

// Extrai o ID do vídeo do YouTube (aceita youtu.be, watch?v=, embed, shorts)
const youtubeId = (url?: string): string | null => {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
};

export const VisualizarAulas = ({
  aluno,
  disciplinaId,
  cicloNumero,
  cronogramaReferencia,
}: Props) => {
  const { conteudo, perfil, avaliacao, gravacao } = useSupabase();
  const { gerar, loading: gerandoAulas, error: erroGeracao } = useGerarAulas();

  const [aulas, setAulas] = useState<AulaGerada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [expandidas, setExpandidas] = useState<number[]>([]);
  const [perfilAluno, setPerfilAluno] = useState<any>(null);
  const [editando, setEditando] = useState<number | null>(null);
  const [rascunho, setRascunho] = useState<AulaGerada | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [msgEdicao, setMsgEdicao] = useState('');

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

      // Mesclar o link da gravação (opcional) de cada aula
      const comGravacao = await Promise.all(
        (aulasExistentes || []).map(async (a: any) => {
          const g: any = await gravacao.carregar(aluno.id, disciplinaId, cicloNumero, a.numero);
          return { ...a, videoUrl: g?.video_url || '' };
        })
      );
      setAulas(comGravacao);
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
      // A partir do 2º ciclo, alimenta a IA com a avaliação do ciclo anterior
      // para personalizar (e não repetir) o conteúdo.
      let avaliacaoAnterior;
      if (cicloNumero > 1) {
        const av: any = await avaliacao.carregar(aluno.id, disciplinaId, cicloNumero - 1);
        if (av) {
          avaliacaoAnterior = {
            pontosFort: av.pontos_fortes || '',
            pontosFracos: av.pontos_fracos || '',
          };
        }
      }

      const aulasGeradas = await gerar({
        alunoNome: aluno.nome,
        disciplina: cronogramaReferencia,
        objetivo: perfilAluno.objetivo,
        interesses: perfilAluno.interesses_musicais || [],
        nivel: perfilAluno.nivel,
        cronogramaReferencia,
        avaliacaoAnterior,
      });

      if (aulasGeradas) {
        setAulas(aulasGeradas);

        // Salvar no Supabase (estrutura completa: titulo, conteudo, duracao, materiais)
        for (const aula of aulasGeradas) {
          await conteudo.salvar(aluno.id, disciplinaId, cicloNumero, aula, cronogramaReferencia);
        }
      }
    } catch (err) {
      console.error('Erro ao gerar aulas:', err);
    }
  };

  const toggleExpandir = (numero: number) => {
    if (editando === numero) return; // não recolhe enquanto edita
    setExpandidas((prev) =>
      prev.includes(numero) ? prev.filter((n) => n !== numero) : [...prev, numero]
    );
  };

  const iniciarEdicao = (aula: AulaGerada) => {
    setEditando(aula.numero);
    setRascunho({ ...aula, materiais: aula.materiais || [] });
    setExpandidas((prev) => (prev.includes(aula.numero) ? prev : [...prev, aula.numero]));
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setRascunho(null);
  };

  const atualizarRascunho = (campo: keyof AulaGerada, valor: any) => {
    setRascunho((prev) => (prev ? { ...prev, [campo]: valor } : prev));
  };

  const salvarEdicao = async () => {
    if (!rascunho) return;
    if (!rascunho.conteudo.trim()) {
      alert('O conteúdo da aula não pode ficar vazio.');
      return;
    }
    setSalvandoEdicao(true);
    try {
      // criadoPorIa = false marca que o professor editou (acompanhamento do que foi dado)
      await conteudo.salvar(aluno.id, disciplinaId, cicloNumero, rascunho, cronogramaReferencia, false);

      // Link da gravação (opcional) — salva se o professor informou
      if (rascunho.videoUrl && rascunho.videoUrl.trim()) {
        await gravacao.salvar(
          aluno.id,
          disciplinaId,
          cicloNumero,
          rascunho.numero,
          rascunho.videoUrl.trim()
        );
      }

      setAulas((prev) =>
        prev.map((a) => (a.numero === rascunho.numero ? { ...rascunho, criadoPorIa: false } : a))
      );
      setEditando(null);
      setRascunho(null);
      setMsgEdicao('✅ Aula atualizada!');
      setTimeout(() => setMsgEdicao(''), 2500);
    } catch (err) {
      console.error('Erro ao salvar edição da aula:', err);
    } finally {
      setSalvandoEdicao(false);
    }
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
        {msgEdicao && <div className="alerta sucesso">{msgEdicao}</div>}

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
                    <h3>
                      {aula.titulo}
                      {aula.criadoPorIa === false && (
                        <span className="badge-editado">✏️ Editado pelo professor</span>
                      )}
                    </h3>
                    <p className="duracao">⏱️ {aula.duracao || 'Sem duração'}</p>
                  </div>
                  <div className="chevron">
                    {expandidas.includes(aula.numero) ? '▼' : '▶'}
                  </div>
                </div>

                {expandidas.includes(aula.numero) && (
                  <div className="aula-conteudo-expandido">
                    {editando === aula.numero && rascunho ? (
                      /* MODO EDIÇÃO */
                      <div className="aula-edicao">
                        <label className="edit-label">Título</label>
                        <input
                          className="edit-input"
                          value={rascunho.titulo}
                          onChange={(e) => atualizarRascunho('titulo', e.target.value)}
                        />

                        <label className="edit-label">Duração</label>
                        <input
                          className="edit-input"
                          value={rascunho.duracao}
                          placeholder="Ex: 50 minutos"
                          onChange={(e) => atualizarRascunho('duracao', e.target.value)}
                        />

                        <label className="edit-label">Conteúdo / o que foi dado</label>
                        <textarea
                          className="edit-textarea"
                          rows={6}
                          value={rascunho.conteudo}
                          onChange={(e) => atualizarRascunho('conteudo', e.target.value)}
                        />

                        <label className="edit-label">Materiais (um por linha)</label>
                        <textarea
                          className="edit-textarea"
                          rows={3}
                          value={(rascunho.materiais || []).join('\n')}
                          placeholder={'Ex: Metrônomo\nPartitura da música X'}
                          onChange={(e) =>
                            atualizarRascunho(
                              'materiais',
                              e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                            )
                          }
                        />

                        <label className="edit-label">🎥 Link da gravação (opcional)</label>
                        <input
                          className="edit-input"
                          type="url"
                          value={rascunho.videoUrl || ''}
                          placeholder="https://youtu.be/... (vídeo da aula)"
                          onChange={(e) => atualizarRascunho('videoUrl', e.target.value)}
                        />
                        {youtubeId(rascunho.videoUrl) && (
                          <div className="video-preview">
                            <iframe
                              src={`https://www.youtube.com/embed/${youtubeId(rascunho.videoUrl)}`}
                              title={`Gravação aula ${rascunho.numero}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}

                        <div className="edit-acoes">
                          <button
                            className="btn-salvar-edicao"
                            onClick={salvarEdicao}
                            disabled={salvandoEdicao}
                          >
                            {salvandoEdicao ? '⏳ Salvando...' : '💾 Salvar'}
                          </button>
                          <button
                            className="btn-cancelar-edicao"
                            onClick={cancelarEdicao}
                            disabled={salvandoEdicao}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* MODO LEITURA */
                      <>
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

                        {aula.videoUrl && (
                          <div className="gravacao-aula">
                            <h4>🎥 Gravação</h4>
                            {youtubeId(aula.videoUrl) ? (
                              <div className="video-preview">
                                <iframe
                                  src={`https://www.youtube.com/embed/${youtubeId(aula.videoUrl)}`}
                                  title={`Gravação aula ${aula.numero}`}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            ) : (
                              <a className="video-link" href={aula.videoUrl} target="_blank" rel="noreferrer">
                                ▶ Abrir vídeo em nova aba
                              </a>
                            )}
                          </div>
                        )}

                        <button className="btn-editar-aula" onClick={() => iniciarEdicao(aula)}>
                          ✏️ Editar esta aula
                        </button>
                      </>
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
