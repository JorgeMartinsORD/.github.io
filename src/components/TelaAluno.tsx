import { useState, useEffect } from 'react';
import { useEmusys } from '../hooks/useEmusys';
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

export const TelaAluno = ({ aluno, onVoltar }: Props) => {
  const { getAulaNumero, loading } = useEmusys();
  const [aulaNumero, setAulaNumero] = useState<{ aula_numero: number; aulas_passadas: number } | null>(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await getAulaNumero(aluno.id);
        setAulaNumero(data);
      } catch (err) {
        console.error('Erro ao carregar número da aula:', err);
      }
    };

    carregar();
  }, [aluno.id, getAulaNumero]);

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

      <div className="aula-numero-card">
        <h2>🎵 Aula Atual</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : aulaNumero ? (
          <>
            <div className="aula-numero-grande">
              Aula <span>{aulaNumero.aula_numero}</span>
            </div>
            <p className="aula-passadas">
              {aulaNumero.aulas_passadas} aula(s) já realizada(s)
            </p>
          </>
        ) : (
          <p>Sem informações de aulas</p>
        )}
      </div>

      <div className="disciplinas">
        <h3>Disciplinas Cadastradas</h3>
        {aluno.disciplinas.length > 0 ? (
          <div className="disciplinas-list">
            {aluno.disciplinas.map((disc: any, i: number) => (
              <div key={i} className="disciplina-item">
                <h4>{disc.nome}</h4>
                <p>Tipo: {disc.tipo}</p>
                <p>Professor: {disc.nome_professor || 'Não atribuído'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>Sem disciplinas cadastradas</p>
        )}
      </div>

      <div className="btn-group">
        <button className="btn-gerar-plano">Gerar Plano do Mês →</button>
      </div>
    </div>
  );
};
