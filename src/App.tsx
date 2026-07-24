import { useState } from 'react';
import { ProfessorProvider, useProfessor } from './contexts/ProfessorContext';
import { SelecaoProfessor } from './components/SelecaoProfessor';
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
  const { professorSelecionado, logout } = useProfessor();
  const [telaAtual, setTelaAtual] = useState<'lista' | 'detalhe'>('lista');
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);

  const handleLogout = () => {
    logout();
    setTelaAtual('lista');
    setAlunoSelecionado(null);
  };

  // Se nenhum professor selecionado, mostra tela de seleção
  if (!professorSelecionado) {
    return <SelecaoProfessor />;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🎵 Plataforma IA Professores</h1>
        <div className="professor-info">
          <p>{professorSelecionado.nome}</p>
          <button onClick={handleLogout} className="btn-logout">
            Trocar Professor
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
    <ProfessorProvider>
      <AppContent />
    </ProfessorProvider>
  );
}

export default App;
