import { useState, useEffect, useMemo } from 'react';
import { useEmusys } from '../hooks/useEmusys';
import { useProfessor } from '../contexts/ProfessorContext';
import './ListaAlunos.css';

interface Agendamento {
  dia_da_semana: string;
  dia_da_semana_nome: string;
  horario: string;
  nome_sala?: string;
}

interface Disciplina {
  id: number;
  nome: string;
  tipo: string;
  nome_turma?: string;
  id_professor?: number;
  nome_professor?: string;
  agendamentos?: Agendamento[];
}

interface Aluno {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  disciplinas: Disciplina[];
}

// Uma ocorrência = um aluno numa disciplina num horário/dia específico
interface Ocorrencia {
  aluno: Aluno;
  disciplina: Disciplina;
  horario: string;
  sala?: string;
}

interface Turma {
  chave: string;
  label: string;
  isGrupo: boolean;
  horarioOrdem: string; // menor horário para ordenação
  ocorrencias: Ocorrencia[];
}

interface Dia {
  num: number;
  nome: string;
  turmas: Turma[];
}

// Segunda(2) → Sábado(7), Domingo(1) por último
const ordemDia = (n: number) => (n === 1 ? 8 : n);

export const ListaAlunos = ({ onSelectAluno }: { onSelectAluno: (aluno: Aluno) => void }) => {
  const { getAlunos, loading, error } = useEmusys();
  const { professorSelecionado } = useProfessor();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('ativa');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const carregarAlunos = async () => {
      setLocalError(null);
      try {
        const data = await getAlunos(filtroStatus);
        setAlunos(data.items || []);
      } catch (err) {
        console.error('Erro ao carregar alunos:', err);
        setLocalError('Não foi possível carregar os alunos.');
        setAlunos([]);
      }
    };

    carregarAlunos();
  }, [filtroStatus, getAlunos]);

  const profId = professorSelecionado?.id;

  // Monta a árvore Dia → Turma → Alunos, filtrando só as disciplinas deste professor
  const { dias, totalAlunos } = useMemo(() => {
    const mapaDias = new Map<number, Dia>();
    const alunosUnicos = new Set<string>();

    for (const aluno of alunos) {
      for (const disc of aluno.disciplinas || []) {
        if (profId != null && disc.id_professor !== profId) continue;
        const agendamentos = disc.agendamentos || [];
        for (const ag of agendamentos) {
          const num = parseInt(ag.dia_da_semana, 10) || 0;
          if (!mapaDias.has(num)) {
            mapaDias.set(num, { num, nome: ag.dia_da_semana_nome || 'Sem dia', turmas: [] });
          }
          const dia = mapaDias.get(num)!;

          const isGrupo = disc.tipo === 'Turma' && !!disc.nome_turma;
          const chave = isGrupo ? `T:${disc.nome_turma}` : 'INDIVIDUAL';
          const label = isGrupo ? disc.nome_turma! : 'Aulas Individuais';

          let turma = dia.turmas.find((t) => t.chave === chave);
          if (!turma) {
            turma = { chave, label, isGrupo, horarioOrdem: ag.horario, ocorrencias: [] };
            dia.turmas.push(turma);
          }
          if (ag.horario < turma.horarioOrdem) turma.horarioOrdem = ag.horario;

          turma.ocorrencias.push({
            aluno,
            disciplina: disc,
            horario: ag.horario,
            sala: ag.nome_sala,
          });
          alunosUnicos.add(aluno.id);
        }
      }
    }

    // Ordena dias, turmas e ocorrências
    const listaDias = [...mapaDias.values()].sort((a, b) => ordemDia(a.num) - ordemDia(b.num));
    for (const dia of listaDias) {
      dia.turmas.sort((a, b) => {
        // Turmas em grupo primeiro (por horário), individuais por último
        if (a.isGrupo !== b.isGrupo) return a.isGrupo ? -1 : 1;
        return a.horarioOrdem.localeCompare(b.horarioOrdem);
      });
      for (const turma of dia.turmas) {
        turma.ocorrencias.sort(
          (a, b) => a.horario.localeCompare(b.horario) || a.aluno.nome.localeCompare(b.aluno.nome)
        );
      }
    }

    return { dias: listaDias, totalAlunos: alunosUnicos.size };
  }, [alunos, profId]);

  // Ao clicar num aluno, passa o aluno com as disciplinas DESTE professor,
  // colocando a disciplina clicada em primeiro
  const abrirAluno = (aluno: Aluno, disciplinaClicada: Disciplina) => {
    const disciplinasProf = (aluno.disciplinas || []).filter(
      (d) => profId == null || d.id_professor === profId
    );
    const ordenadas = [
      disciplinaClicada,
      ...disciplinasProf.filter((d) => d.id !== disciplinaClicada.id),
    ];
    onSelectAluno({ ...aluno, disciplinas: ordenadas });
  };

  return (
    <div className="lista-alunos">
      <header className="lista-header">
        <div>
          <h2>📅 Meus Alunos</h2>
          {professorSelecionado && (
            <p className="lista-sub">
              {professorSelecionado.nome.trim()} · {totalAlunos} aluno(s)
            </p>
          )}
        </div>
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

      {(error || localError) && (
        <div className="error-message">
          <p>⚠️ {error || localError}</p>
        </div>
      )}

      {!loading && !error && !localError && dias.length === 0 && (
        <p className="vazio">Nenhum aluno encontrado para este professor.</p>
      )}

      <div className="dias-lista">
        {dias.map((dia) => (
          <section key={dia.num} className="dia-bloco">
            <h3 className="dia-titulo">{dia.nome}</h3>

            <div className="turmas-lista">
              {dia.turmas.map((turma) => (
                <div key={turma.chave} className={`turma-card ${turma.isGrupo ? 'grupo' : 'individual'}`}>
                  <div className="turma-header">
                    <span className="turma-badge">{turma.isGrupo ? '👥 Turma' : '👤 Individual'}</span>
                    <span className="turma-label">{turma.label}</span>
                    {turma.isGrupo && <span className="turma-horario">{turma.horarioOrdem}</span>}
                    <span className="turma-count">{turma.ocorrencias.length}</span>
                  </div>

                  <ul className="alunos-turma">
                    {turma.ocorrencias.map((oc, i) => (
                      <li
                        key={`${oc.aluno.id}-${oc.disciplina.id}-${oc.horario}-${i}`}
                        className="aluno-item"
                        onClick={() => abrirAluno(oc.aluno, oc.disciplina)}
                      >
                        <span className="aluno-nome">{oc.aluno.nome}</span>
                        <span className="aluno-meta">
                          <span className="aluno-horario">{oc.horario}</span>
                          <span className="aluno-disc">{oc.disciplina.nome}</span>
                          {oc.sala && <span className="aluno-sala">{oc.sala}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
