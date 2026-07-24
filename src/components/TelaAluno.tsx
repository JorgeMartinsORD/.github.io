import { useState, useEffect } from 'react';
import { useEmusys } from '../hooks/useEmusys';
import { PreencherPerfil } from './PreencherPerfil';
import { VisualizarAulas } from './VisualizarAulas';
import { AvaliarAluno } from './AvaliarAluno';
import './TelaAluno.css';

interface Aluno {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  disciplinas: any[];
}

interface Props {
  aluno: Aluno;
  onVoltar: () => void;
}

type Tela = 'resumo' | 'preencher-perfil' | 'visualizar-aulas' | 'avaliar';

export const TelaAluno = ({ aluno, onVoltar }: Props) => {
  const { loading } = useEmusys();
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<any | null>(
    aluno.disciplinas?.[0] || null
  );
  const [cicloNumero, setCicloNumero] = useState(1);
  const [telaAtual, setTelaAtual] = useState<Tela>('resumo');

  const disciplinaId = disciplinaSelecionada?.id ? parseInt(String(disciplinaSelecionada.id)) : 0;

  const handleProximoEtapa = () => {
    if (telaAtual === 'preencher-perfil') {
      setTelaAtual('visualizar-aulas');
    } else if (telaAtual === 'visualizar-aulas') {
      setTelaAtual('avaliar');
    } else if (telaAtual === 'avaliar') {
      setCicloNumero((prev) => prev + 1);
      setTelaAtual('visualizar-aulas');
    }
  };

  if (!disciplinaSelecionada) {
    return (
      <div className="tela-aluno">
        <button className="btn-voltar" onClick={onVoltar}>← Voltar</button>
        <p>Selecione uma disciplina</p>
      </div>
    );
  }

  // Renderizar componentes baseado na tela
  if (telaAtual === 'preencher-perfil') {
    return (
      <div className="tela-aluno">
        <button className="btn-voltar" onClick={() => setTelaAtual('resumo')}>
          ← Voltar
        </button>
        <PreencherPerfil
          aluno={{ id: parseInt(String(aluno.id)), nome: aluno.nome }}
          disciplinaId={disciplinaId}
          onConcluido={handleProximoEtapa}
        />
      </div>
    );
  }

  if (telaAtual === 'visualizar-aulas') {
    return (
      <div className="tela-aluno">
        <button className="btn-voltar" onClick={() => setTelaAtual('resumo')}>
          ← Voltar
        </button>
        <VisualizarAulas
          aluno={{ id: parseInt(String(aluno.id)), nome: aluno.nome }}
          disciplinaId={disciplinaId}
          cicloNumero={cicloNumero}
          cronogramaReferencia={disciplinaSelecionada.nome || 'Cronograma'}
        />
        <div className="acoes-ciclo">
          <button className="btn-proximo" onClick={() => setTelaAtual('avaliar')}>
            Ir para Avaliação →
          </button>
        </div>
      </div>
    );
  }

  if (telaAtual === 'avaliar') {
    return (
      <div className="tela-aluno">
        <button className="btn-voltar" onClick={() => setTelaAtual('resumo')}>
          ← Voltar
        </button>
        <AvaliarAluno
          aluno={{ id: parseInt(String(aluno.id)), nome: aluno.nome }}
          disciplinaId={disciplinaId}
          cicloNumero={cicloNumero}
          onConcluido={handleProximoEtapa}
        />
      </div>
    );
  }

  // Tela de resumo (padrão)
  return (
    <div className="tela-aluno">
      <button className="btn-voltar" onClick={onVoltar}>← Voltar</button>

      <div className="aluno-header">
        <h1>{aluno.nome}</h1>
        <p className="data-nascimento">
          {new Date(aluno.data_nascimento).toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="cards-info">
        <div className="card">
          <h3>📧 Email</h3>
          <p>{aluno.email || 'Não informado'}</p>
        </div>

        <div className="card">
          <h3>📞 Telefone</h3>
          <p>{aluno.telefone || 'Não informado'}</p>
        </div>

        <div className="card">
          <h3>📚 Disciplinas</h3>
          <p>{aluno.disciplinas.length} disciplina(s)</p>
        </div>
      </div>

      {aluno.disciplinas.length > 1 && (
        <div className="disciplina-seletor">
          <label>Selecione a disciplina:</label>
          <select
            value={disciplinaId}
            onChange={(e) => {
              const disc = aluno.disciplinas.find(
                (d: any) => d.id === parseInt(e.target.value)
              );
              setDisciplinaSelecionada(disc);
              setCicloNumero(1);
            }}
          >
            {aluno.disciplinas.map((disc: any) => (
              <option key={disc.id} value={disc.id}>
                {disc.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="ciclo-info">
        <h2>🎯 Ciclo Atual: {cicloNumero}</h2>
        <p>Gerenciar aulas e feedback do aluno nesta disciplina</p>
      </div>

      <div className="acoes-principais">
        <button
          className="btn-acao btn-perfil"
          onClick={() => setTelaAtual('preencher-perfil')}
        >
          <span className="emoji">👤</span>
          <span>Preencher Perfil</span>
          <span className="desc">Aula 1</span>
        </button>

        <button className="btn-acao btn-aulas" onClick={() => setTelaAtual('visualizar-aulas')}>
          <span className="emoji">📚</span>
          <span>Ver Aulas</span>
          <span className="desc">Aulas 1-3</span>
        </button>

        <button className="btn-acao btn-avaliar" onClick={() => setTelaAtual('avaliar')}>
          <span className="emoji">🎯</span>
          <span>Avaliar Aluno</span>
          <span className="desc">Aula 4</span>
        </button>
      </div>
    </div>
  );
};
