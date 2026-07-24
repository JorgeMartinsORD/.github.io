import { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import './AvaliarAluno.css';

interface Aluno {
  id: number;
  nome: string;
}

interface Props {
  aluno: Aluno;
  disciplinaId: number;
  cicloNumero: number;
  onConcluido?: () => void;
}

export const AvaliarAluno = ({ aluno, disciplinaId, cicloNumero, onConcluido }: Props) => {
  const { avaliacao, loading, error } = useSupabase();
  const [pontosFort, setPontosFort] = useState('');
  const [pontosFracos, setPontosFracos] = useState('');
  const [notasAdicionais, setNotasAdicionais] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [avaliacaoExistente, setAvaliacaoExistente] = useState<any>(null);

  useEffect(() => {
    carregarAvaliacaoExistente();
  }, []);

  const carregarAvaliacaoExistente = async () => {
    const existente = await avaliacao.carregar(aluno.id, disciplinaId, cicloNumero);
    if (existente) {
      setPontosFort(existente.pontos_fortes || '');
      setPontosFracos(existente.pontos_fracos || '');
      setNotasAdicionais(existente.notas_adicionais || '');
      setAvaliacaoExistente(existente);
    }
  };

  const handleSalvar = async () => {
    if (!pontosFort.trim() || !pontosFracos.trim()) {
      alert('Por favor, preencha pontos fortes e pontos a melhorar');
      return;
    }

    setSalvando(true);
    try {
      await avaliacao.salvar(
        aluno.id,
        disciplinaId,
        cicloNumero,
        pontosFort,
        pontosFracos,
        notasAdicionais
      );
      setMensagemSucesso('✅ Avaliação salva com sucesso!');
      setTimeout(() => {
        setMensagemSucesso('');
        onConcluido?.();
      }, 2000);
    } catch (err) {
      console.error('Erro ao salvar avaliação:', err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="avaliar-aluno">
      <div className="avaliacao-card">
        <header className="avaliacao-header">
          <h2>🎯 Avaliação da Aula 4</h2>
          <p className="aluno-info">
            {aluno.nome} • Ciclo {cicloNumero}
          </p>
        </header>

        {error && <div className="alerta erro">❌ {error}</div>}
        {mensagemSucesso && <div className="alerta sucesso">{mensagemSucesso}</div>}

        <div className="avaliacao-info">
          <p>
            Registre os pontos fortes e os pontos a melhorar do aluno ao fim da Aula 4.
            Essas informações serão usadas para personalizar o próximo ciclo de aulas.
          </p>
        </div>

        <section className="avaliacao-section">
          <label className="label-titulo">
            <span className="emoji">💪</span> Pontos Fortes
          </label>
          <p className="label-descricao">
            O que o aluno fez bem? Quais foram seus progressos?
          </p>
          <textarea
            value={pontosFort}
            onChange={(e) => setPontosFort(e.target.value)}
            placeholder="Ex: Melhorou bastante a técnica de batida, mantém o ritmo bem, demonstra interesse..."
            className="textarea-avaliacao"
            rows={4}
          />
        </section>

        <section className="avaliacao-section">
          <label className="label-titulo">
            <span className="emoji">📈</span> Pontos a Melhorar
          </label>
          <p className="label-descricao">
            Em que áreas o aluno pode melhorar? Quais são os desafios?
          </p>
          <textarea
            value={pontosFracos}
            onChange={(e) => setPontosFracos(e.target.value)}
            placeholder="Ex: Ainda tem dificuldade com o timing, precisa praticar mais a leitura de notas..."
            className="textarea-avaliacao"
            rows={4}
          />
        </section>

        <section className="avaliacao-section">
          <label className="label-titulo">
            <span className="emoji">📝</span> Notas Adicionais
          </label>
          <p className="label-descricao">Observações gerais, contexto ou qualquer outro feedback</p>
          <textarea
            value={notasAdicionais}
            onChange={(e) => setNotasAdicionais(e.target.value)}
            placeholder="Ex: Aluno muito dedicado, compareceu em todas as aulas, participativo..."
            className="textarea-avaliacao"
            rows={3}
          />
        </section>

        {avaliacaoExistente && (
          <div className="aviso-sobrescrita">
            ℹ️ Essa avaliação será atualizada com as novas informações
          </div>
        )}

        <div className="avaliacao-actions">
          <button onClick={handleSalvar} disabled={salvando || loading} className="btn-avaliar">
            {salvando || loading ? '⏳ Salvando...' : '✅ Salvar Avaliação'}
          </button>
        </div>

        <div className="avaliacao-footer">
          <p className="hint">
            💡 Dica: Use essas informações para personalizar o próximo ciclo de aulas.
          </p>
        </div>
      </div>
    </div>
  );
};
