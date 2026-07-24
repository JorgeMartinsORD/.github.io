import { useState, useEffect } from 'react';
import { useProfessor } from '../contexts/ProfessorContext';
import './SelecaoProfessor.css';

interface Professor {
  id: string;
  nome: string;
  email: string;
}

export const SelecaoProfessor = () => {
  const { setProfessor } = useProfessor();
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarProfessores = async () => {
      try {
        // Simula dados - em produção viriam do banco
        const dados: Professor[] = [
          { id: '1', nome: 'Isac Levi', email: '19jorgeml@gmail.com' },
          { id: '2', nome: 'Professor Demo', email: 'demo@exemplo.com' },
          { id: '3', nome: 'Test Professor', email: 'test@exemplo.com' },
        ];
        setProfessores(dados);
      } catch (err) {
        setError('Erro ao carregar professores');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    carregarProfessores();
  }, []);

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
              <h3>{prof.nome}</h3>
              <p>{prof.email}</p>
              <span className="btn-text">Acessar →</span>
            </button>
          ))}
        </div>

        <div className="info">
          <p><small>✨ Acesso temporário - todos os professores podem ver todos os dados para testes</small></p>
        </div>
      </div>
    </div>
  );
};
