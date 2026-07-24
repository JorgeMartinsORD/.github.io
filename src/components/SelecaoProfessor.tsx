import { useState, useEffect } from 'react';
import { useProfessor } from '../contexts/ProfessorContext';
import { useEmusys } from '../hooks/useEmusys';
import './SelecaoProfessor.css';

interface Professor {
  id: number;
  nome: string;
}

export const SelecaoProfessor = () => {
  const { setProfessor } = useProfessor();
  const { getProfessores } = useEmusys();
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarProfessores = async () => {
      try {
        const dados = await getProfessores();
        // Ordena alfabeticamente por nome
        dados.sort((a, b) => a.nome.trim().localeCompare(b.nome.trim(), 'pt-BR'));
        setProfessores(dados);
      } catch (err) {
        setError('Erro ao carregar professores');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    carregarProfessores();
  }, [getProfessores]);

  const handleSelecionar = (professor: Professor) => {
    setProfessor(professor);
  };

  return (
    <div className="selecao-container">
      <div className="selecao-box">
        <h1>🎵 Plataforma IA Professores</h1>
        <p className="subtitle">Selecione seu perfil de professor</p>

        {loading && <p className="loading">Carregando professores...</p>}
        {error && <p className="error">⚠️ {error}</p>}

        {!loading && professores.length === 0 && (
          <p className="vazio">Nenhum professor encontrado</p>
        )}

        <div className="professores-grid">
          {professores.map((prof) => (
            <button
              key={prof.id}
              className="professor-card"
              onClick={() => handleSelecionar(prof)}
            >
              <div className="professor-avatar">👨‍🏫</div>
              <h3>{prof.nome.trim()}</h3>
              <span className="btn-text">Acessar →</span>
            </button>
          ))}
        </div>

        <div className="info">
          <p><small>✨ Cada professor vê apenas seus próprios alunos, organizados por dia e turma</small></p>
        </div>
      </div>
    </div>
  );
};
