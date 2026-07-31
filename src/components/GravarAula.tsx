import { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import './GravarAula.css';

interface Aluno {
  id: number;
  nome: string;
}

interface Props {
  aluno: Aluno;
  disciplinaId: number;
  cicloNumero: number;
}

interface SlotAula {
  aulaNumero: number;
  videoUrl: string;
  notas: string;
  salvo: boolean;
}

const AULAS = [1, 2, 3, 4];

// Extrai o ID do vídeo do YouTube para montar o embed (aceita youtu.be, watch?v=, shorts)
const youtubeId = (url: string): string | null => {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
};

export const GravarAula = ({ aluno, disciplinaId, cicloNumero }: Props) => {
  const { gravacao, loading, error } = useSupabase();
  const [slots, setSlots] = useState<SlotAula[]>(
    AULAS.map((n) => ({ aulaNumero: n, videoUrl: '', notas: '', salvo: false }))
  );
  const [salvandoAula, setSalvandoAula] = useState<number | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  useEffect(() => {
    carregarGravacoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cicloNumero, disciplinaId]);

  const carregarGravacoes = async () => {
    const carregadas = await Promise.all(
      AULAS.map(async (n) => {
        const g: any = await gravacao.carregar(aluno.id, disciplinaId, cicloNumero, n);
        return {
          aulaNumero: n,
          videoUrl: g?.video_url || '',
          notas: g?.notas_professor || '',
          salvo: !!g?.video_url,
        };
      })
    );
    setSlots(carregadas);
  };

  const atualizarSlot = (aulaNumero: number, campo: 'videoUrl' | 'notas', valor: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.aulaNumero === aulaNumero ? { ...s, [campo]: valor } : s))
    );
  };

  const handleSalvar = async (slot: SlotAula) => {
    if (!slot.videoUrl.trim()) {
      alert('Cole o link do vídeo da aula antes de salvar.');
      return;
    }
    setSalvandoAula(slot.aulaNumero);
    try {
      await gravacao.salvar(
        aluno.id,
        disciplinaId,
        cicloNumero,
        slot.aulaNumero,
        slot.videoUrl.trim(),
        undefined,
        slot.notas.trim() || undefined
      );
      setSlots((prev) =>
        prev.map((s) => (s.aulaNumero === slot.aulaNumero ? { ...s, salvo: true } : s))
      );
      setMensagemSucesso(`✅ Gravação da Aula ${slot.aulaNumero} salva!`);
      setTimeout(() => setMensagemSucesso(''), 2500);
    } catch (err) {
      console.error('Erro ao salvar gravação:', err);
    } finally {
      setSalvandoAula(null);
    }
  };

  const totalSalvas = slots.filter((s) => s.salvo).length;

  return (
    <div className="gravar-aula">
      <div className="gravacao-card">
        <header className="gravacao-header">
          <h2>🎥 Gravações das Aulas</h2>
          <p className="aluno-info">
            {aluno.nome} • Ciclo {cicloNumero} • {totalSalvas}/4 gravadas
          </p>
        </header>

        <div className="gravacao-info">
          <p>
            Cole o link do vídeo de cada aula (YouTube recomendado — pode ser "não listado").
            O vídeo fica disponível para revisão do aluno e do professor.
          </p>
        </div>

        {error && <div className="alerta erro">❌ {error}</div>}
        {mensagemSucesso && <div className="alerta sucesso">{mensagemSucesso}</div>}

        <div className="slots-lista">
          {slots.map((slot) => {
            const vid = youtubeId(slot.videoUrl);
            return (
              <section key={slot.aulaNumero} className="slot-aula">
                <div className="slot-header">
                  <span className="slot-numero">Aula {slot.aulaNumero}</span>
                  {slot.salvo && <span className="slot-badge">✓ Gravada</span>}
                </div>

                <label className="label-campo">Link do vídeo</label>
                <input
                  type="url"
                  className="input-video"
                  placeholder="https://youtu.be/..."
                  value={slot.videoUrl}
                  onChange={(e) => atualizarSlot(slot.aulaNumero, 'videoUrl', e.target.value)}
                />

                {vid && (
                  <div className="video-preview">
                    <iframe
                      src={`https://www.youtube.com/embed/${vid}`}
                      title={`Aula ${slot.aulaNumero}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                {!vid && slot.videoUrl.trim() && (
                  <a className="video-link" href={slot.videoUrl} target="_blank" rel="noreferrer">
                    ▶ Abrir vídeo em nova aba
                  </a>
                )}

                <label className="label-campo">Notas do professor (opcional)</label>
                <textarea
                  className="textarea-notas"
                  rows={2}
                  placeholder="Ex: aluno teve dificuldade no minuto 12, revisar acorde F..."
                  value={slot.notas}
                  onChange={(e) => atualizarSlot(slot.aulaNumero, 'notas', e.target.value)}
                />

                <button
                  className="btn-salvar-slot"
                  disabled={salvandoAula === slot.aulaNumero || loading}
                  onClick={() => handleSalvar(slot)}
                >
                  {salvandoAula === slot.aulaNumero ? '⏳ Salvando...' : slot.salvo ? '💾 Atualizar' : '💾 Salvar'}
                </button>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
