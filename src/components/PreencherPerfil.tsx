import { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import './PreencherPerfil.css';

interface Aluno {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  disciplinas?: any[];
}

interface Props {
  aluno: Aluno;
  disciplinaId: number;
  onConcluido?: () => void;
}

const NIVEIS = ['Iniciante', 'Intermediário', 'Avançado'];
const GENEROS_MUSICAS = [
  'Rock',
  'Pop',
  'Jazz',
  'Blues',
  'MPB',
  'Samba',
  'Clássico',
  'Metal',
  'Funk',
  'Reggae',
  'Eletrônico',
  'Soul',
];

export const PreencherPerfil = ({ aluno, disciplinaId, onConcluido }: Props) => {
  const { perfil, loading, error } = useSupabase();
  const [objetivo, setObjetivo] = useState('');
  const [interesses, setInteresses] = useState<string[]>([]);
  const [nivel, setNivel] = useState('Intermediário');
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  useEffect(() => {
    carregarPerfilExistente();
  }, []);

  const carregarPerfilExistente = async () => {
    const perfilExistente = await perfil.carregar(aluno.id, disciplinaId);
    if (perfilExistente) {
      setObjetivo(perfilExistente.objetivo || '');
      setInteresses(perfilExistente.interesses_musicais || []);
      setNivel(perfilExistente.nivel || 'Intermediário');
    }
  };

  const toggleInteresse = (genero: string) => {
    setInteresses((prev) =>
      prev.includes(genero) ? prev.filter((g) => g !== genero) : [...prev, genero]
    );
  };

  const handleSalvar = async () => {
    if (!objetivo.trim()) {
      alert('Por favor, descreva o objetivo do aluno');
      return;
    }

    if (interesses.length === 0) {
      alert('Por favor, selecione pelo menos um interesse musical');
      return;
    }

    setSalvando(true);
    try {
      await perfil.salvar(aluno.id, disciplinaId, objetivo, interesses, nivel);
      setMensagemSucesso('✅ Perfil salvo com sucesso!');
      setTimeout(() => {
        setMensagemSucesso('');
        onConcluido?.();
      }, 2000);
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="preencher-perfil">
      <div className="perfil-card">
        <header className="perfil-header">
          <h2>👤 Perfil do Aluno</h2>
          <p className="aluno-info">
            {aluno.nome} • {aluno.email || 'sem email'}
          </p>
        </header>

        {error && <div className="alerta erro">❌ {error}</div>}
        {mensagemSucesso && <div className="alerta sucesso">{mensagemSucesso}</div>}

        <section className="perfil-section">
          <label className="label-titulo">🎯 Objetivo do Aluno</label>
          <p className="label-descricao">O que ele deseja aprender com esta disciplina?</p>
          <textarea
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            placeholder="Ex: Aprender técnicas de bateria para tocar rock..."
            className="textarea-objetivo"
            rows={4}
          />
        </section>

        <section className="perfil-section">
          <label className="label-titulo">🎵 Interesses Musicais</label>
          <p className="label-descricao">Selecione os gêneros que o aluno gosta</p>
          <div className="generos-grid">
            {GENEROS_MUSICAS.map((genero) => (
              <button
                key={genero}
                className={`genero-btn ${interesses.includes(genero) ? 'ativo' : ''}`}
                onClick={() => toggleInteresse(genero)}
                type="button"
              >
                {genero}
              </button>
            ))}
          </div>
          <p className="interesses-selecionados">
            {interesses.length > 0
              ? `${interesses.length} interesse(s) selecionado(s): ${interesses.join(', ')}`
              : 'Nenhum interesse selecionado'}
          </p>
        </section>

        <section className="perfil-section">
          <label className="label-titulo">📊 Nível de Experiência</label>
          <p className="label-descricao">Qual o nível atual do aluno?</p>
          <div className="niveis-radio">
            {NIVEIS.map((niv) => (
              <label key={niv} className="radio-label">
                <input
                  type="radio"
                  name="nivel"
                  value={niv}
                  checked={nivel === niv}
                  onChange={(e) => setNivel(e.target.value)}
                />
                <span>{niv}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="perfil-actions">
          <button
            onClick={handleSalvar}
            disabled={salvando || loading}
            className="btn-salvar"
          >
            {salvando || loading ? '⏳ Salvando...' : '✅ Salvar Perfil'}
          </button>
        </div>
      </div>
    </div>
  );
};
