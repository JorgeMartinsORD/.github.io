import { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import './AjustarAula.css';

interface Aluno {
  id: number;
  nome: string;
}

interface Props {
  aluno: Aluno;
  disciplinaId: number;
  cicloNumero: number;
}

export const AjustarAula = ({ aluno, disciplinaId, cicloNumero }: Props) => {
  const { ajuste, loading, error } = useSupabase();
  const [descricao, setDescricao] = useState('');
  const [motivo, setMotivo] = useState('');
  const [aplicadoNaAula, setAplicadoNaAula] = useState<string>('');
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [ajustes, setAjustes] = useState<any[]>([]);

  useEffect(() => {
    carregarAjustes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cicloNumero, disciplinaId]);

  const carregarAjustes = async () => {
    const lista = await ajuste.carregar(aluno.id, disciplinaId, cicloNumero);
    setAjustes(lista || []);
  };

  const handleSalvar = async () => {
    if (!descricao.trim()) {
      alert('Descreva o ajuste feito no plano de aulas.');
      return;
    }
    setSalvando(true);
    try {
      await ajuste.salvar(
        aluno.id,
        disciplinaId,
        cicloNumero,
        descricao.trim(),
        motivo.trim() || undefined,
        aplicadoNaAula ? parseInt(aplicadoNaAula) : undefined
      );
      setMensagemSucesso('✅ Ajuste registrado!');
      setDescricao('');
      setMotivo('');
      setAplicadoNaAula('');
      await carregarAjustes();
      setTimeout(() => setMensagemSucesso(''), 2500);
    } catch (err) {
      console.error('Erro ao salvar ajuste:', err);
    } finally {
      setSalvando(false);
    }
  };

  const formatarData = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="ajustar-aula">
      <div className="ajuste-card">
        <header className="ajuste-header">
          <h2>✏️ Ajustes no Plano</h2>
          <p className="aluno-info">
            {aluno.nome} • Ciclo {cicloNumero}
          </p>
        </header>

        <div className="ajuste-info">
          <p>
            Registre mudanças que você fez no plano gerado pela IA (trocar um conteúdo,
            adiar um tema, adaptar a um imprevisto). Esse histórico ajuda a personalizar
            os próximos ciclos.
          </p>
        </div>

        {error && <div className="alerta erro">❌ {error}</div>}
        {mensagemSucesso && <div className="alerta sucesso">{mensagemSucesso}</div>}

        <section className="ajuste-section">
          <label className="label-titulo">📝 O que foi ajustado?</label>
          <textarea
            className="textarea-ajuste"
            rows={3}
            placeholder="Ex: Troquei o conteúdo da aula 2 por revisão de acordes, pois o aluno faltou..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </section>

        <section className="ajuste-section">
          <label className="label-titulo">💬 Motivo (opcional)</label>
          <textarea
            className="textarea-ajuste"
            rows={2}
            placeholder="Ex: Aluno pediu para focar em uma música específica"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </section>

        <section className="ajuste-section">
          <label className="label-titulo">🎯 Aplicado na aula (opcional)</label>
          <select
            className="select-aula"
            value={aplicadoNaAula}
            onChange={(e) => setAplicadoNaAula(e.target.value)}
          >
            <option value="">Não especificar</option>
            <option value="1">Aula 1</option>
            <option value="2">Aula 2</option>
            <option value="3">Aula 3</option>
            <option value="4">Aula 4</option>
          </select>
        </section>

        <div className="ajuste-actions">
          <button className="btn-ajuste" onClick={handleSalvar} disabled={salvando || loading}>
            {salvando ? '⏳ Salvando...' : '➕ Registrar Ajuste'}
          </button>
        </div>

        <section className="ajuste-historico">
          <h3>Histórico deste ciclo ({ajustes.length})</h3>
          {ajustes.length === 0 && <p className="historico-vazio">Nenhum ajuste registrado ainda.</p>}
          <ul className="historico-lista">
            {ajustes.map((a) => (
              <li key={a.id} className="historico-item">
                <div className="historico-topo">
                  {a.aplicado_na_aula && <span className="tag-aula">Aula {a.aplicado_na_aula}</span>}
                  <span className="historico-data">{formatarData(a.created_at)}</span>
                </div>
                <p className="historico-descricao">{a.descricao}</p>
                {a.motivo && <p className="historico-motivo">💬 {a.motivo}</p>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};
