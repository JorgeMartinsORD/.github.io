import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import './App.css';

const AppContent = () => {
  const { professor, loading } = useAuth();

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
        <div>
          <p>Bem-vindo, {professor.nome || professor.email}</p>
        </div>
      </header>
      <main className="dashboard-content">
        <h2>Dashboard (em desenvolvimento)</h2>
        <p>Próximos passos:</p>
        <ul>
          <li>✅ Login funcionando</li>
          <li>⏳ Lista de alunos</li>
          <li>⏳ Tela do aluno</li>
          <li>⏳ Gerar plano</li>
        </ul>
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
