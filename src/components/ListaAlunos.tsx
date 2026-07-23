import { useState, useEffect } from 'react';
import { useEmusys } from '../hooks/useEmusys';
import './ListaAlunos.css';

interface Aluno {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  disciplinas: any[];
}

export const ListaAlunos = ({ onSelectAluno }: { onSelectAluno: (aluno: Aluno) => void }) => {
  const { getAlunos, loading, error } = useEmusys();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('ativa');

  useEffect(() => {
    const carregarAlunos = async () => {
      try {
        const data = await getAlunos(filtroStatus);
        setAlunos(data.items || []);
      } catch (err) {
        console.error('Erro ao carregar alunos:', err);
      }
    };

    carregarAlunos();
  }, [filtroStatus, getAlunos]);

  return (
    <div className="lista-alunos">
      <header className="lista-header">
        <h2>📚 Alunos</h2>
        <select 
          value={filtroStatus} 
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="filtro-status"
        >
          <option value="ativa">Matrículas Ativas</option>
          <option value="todas">Todas</option>
          <option value="trancada">Trancadas</option>
          <option value="finalizada">Finalizadas</option>
        </select>
      </header>

      {loading && <p className="loading">Carregando alunos...</p>}
      {error && <p className="error">Erro: {error}</p>}

      {!loading && alunos.length === 0 && (
        <p className="vazio">Nenhum aluno encontrado</p>
      )}

      <div className="alunos-grid">
        {alunos.map((aluno) => (
          <div 
            key={aluno.id} 
            className="aluno-card"
            onClick={() => onSelectAluno(aluno)}
          >
            <h3>{aluno.nome}</h3>
            <div className="aluno-info">
              <p><strong>Email:</strong> {aluno.email || 'N/A'}</p>
              <p><strong>Telefone:</strong> {aluno.telefone || 'N/A'}</p>
              <p><strong>Disciplinas:</strong> {aluno.disciplinas.length}</p>
            </div>
            <button className="btn-detalhes">Ver Detalhes →</button>
          </div>
        ))}
      </div>
    </div>
  );
};
