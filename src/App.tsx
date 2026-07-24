import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { ListaAlunos } from './components/ListaAlunos';
import { TelaAluno } from './components/TelaAluno';
import './App.css';

interface Aluno {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  disciplinas: any[];
}

const AppContent = () => {
  const { professor, loading, logout } = useAuth();
  const [telaAtual, setTelaAtual] = useState<'lista' | 'detalhe'>('lista');
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      setTelaAtual('lista');
      setAlunoSelecionado(null);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!professor) {
    return <Login />;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🎵 Plataforma IA Professores</h1>
        <div className="professor-info">
          <p>{professor.nome || professor.email}</p>
          <button onClick={handleLogout} className="btn-logout">
            Sair
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {telaAtual === 'lista' ? (
          <ListaAlunos
            onSelectAluno={(aluno) => {
              setAlunoSelecionado(aluno);
              setTelaAtual('detalhe');
            }}
          />
        ) : (
          alunoSelecionado && (
            <TelaAluno
              aluno={alunoSelecionado}
              onVoltar={() => setTelaAtual('lista')}
            />
          )
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
