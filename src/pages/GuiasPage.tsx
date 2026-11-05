import { useState, type FormEvent } from 'react';
import {
  FileText,
  Search,
  Printer,
  CheckCircle2,
  Layers,
  DollarSign,
  Pencil,
  XCircle,
  X,
  Check
} from 'lucide-react';
import type {
  Atendimento,
  DemandaFinanceira,
  Operadora,
  Paciente,
  Profissional
} from '../data/dadosFaturamento';
import {
  formatarDataBR,
  formatarMoeda,
  obterClasseBadgeAtendimento
} from '../utils/formatadores';
import { ActionMenu } from '../components/ActionMenu';
import {
  ExpandableFilterPanel,
  ExpandableFilterToggle
} from '../components/ExpandableFilterBar';
import { ModalGuiaTuss } from '../components/ModalGuiaTuss';

interface GuiasPageProps {
  atendimentos: Atendimento[];
  demandas: DemandaFinanceira[];
  pacientes: Paciente[];
  medicos: Profissional[];
  operadoras: Operadora[];
  aoEditarGuiaTuss: (
    guiaId: string,
    dados: { codigoTuss: string; descricao: string; valor: number }
  ) => void;
  aoCancelarGuiaTuss: (guiaId: string) => void;
  aoExcluirGuiaTuss: (guiaId: string) => void;
}

export function GuiasPage({
  atendimentos,
  demandas,
  pacientes,
  medicos,
  operadoras,
  aoEditarGuiaTuss,
  aoCancelarGuiaTuss,
  aoExcluirGuiaTuss
}: GuiasPageProps) {
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(false);
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroOperadora, setFiltroOperadora] = useState<string>('Todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');

  const [guiaSelecionada, setGuiaSelecionada] = useState<Atendimento | null>(
    null
  );

  const [guiaEmEdicao, setGuiaEmEdicao] = useState<Atendimento | null>(null);
  const [editCodigoTuss, setEditCodigoTuss] = useState<string>('');
  const [editDescricao, setEditDescricao] = useState<string>('');
  const [editValor, setEditValor] = useState<string>('');

  const guiasDeAtendimentos: (Atendimento & { loteVinculadoId?: string })[] =
    atendimentos
      .filter(
        (a) =>
          a.status === 'Confirmado' ||
          a.status === 'Realizado' ||
          a.status === 'Cancelado'
      )
      .map((a) => {
        const lote = demandas.find((d) =>
          d.guias.some((g) => g.atendimentoId === a.id)
        );
        return {
          ...a,
          loteVinculadoId: lote?.id
        };
      });

  const guiasExtrasDeLotes: (Atendimento & { loteVinculadoId?: string })[] = [];
  demandas.forEach((lote) => {
    lote.guias.forEach((g) => {
      if (
        !g.atendimentoId ||
        !guiasDeAtendimentos.some((ga) => ga.id === g.atendimentoId)
      ) {
        guiasExtrasDeLotes.push({
          id: g.id,
          codigoTuss: g.codigoTuss || '10101012',
          pacienteId: 'PAC-LOTE',
          pacienteNome: g.pacienteNome,
          medicoId: 'PROF-LOTE',
          medicoNome: g.medicoNome,
          especialidade: lote.tipoAtendimento,
          descricao: g.procedimento,
          data: g.data,
          hora: '10:00',
          operadora: lote.operadora,
          status: 'Realizado',
          valor: g.valor,
          loteVinculadoId: lote.id
        });
      }
    });
  });

  const todasGuias = [...guiasDeAtendimentos, ...guiasExtrasDeLotes];

  const qtdFiltrosAtivos =
    (buscaTexto.trim() ? 1 : 0) +
    (filtroOperadora !== 'Todas' ? 1 : 0) +
    (filtroStatus !== 'Todos' ? 1 : 0);

  function limparFiltros() {
    setBuscaTexto('');
    setFiltroOperadora('Todas');
    setFiltroStatus('Todos');
  }

  function abrirModalEditarGuia(guia: Atendimento) {
    setGuiaEmEdicao(guia);
    setEditCodigoTuss(guia.codigoTuss || '10101012');
    setEditDescricao(guia.descricao);
    setEditValor(String(guia.valor));
  }

  function salvarEdicaoGuia(evento: FormEvent) {
    evento.preventDefault();
    if (!guiaEmEdicao) return;
    const valNum = parseFloat(editValor);
    if (!editDescricao.trim() || isNaN(valNum) || valNum <= 0) {
      alert('Preencha o procedimento e um valor válido para a guia!');
      return;
    }

    aoEditarGuiaTuss(guiaEmEdicao.id, {
      codigoTuss: editCodigoTuss.trim() || '10101012',
      descricao: editDescricao.trim(),
      valor: valNum
    });
    setGuiaEmEdicao(null);
  }

  const filtradas = todasGuias.filter((g) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const bateTexto =
      g.id.toLocaleLowerCase().includes(termo) ||
      (g.codigoTuss || '').toLocaleLowerCase().includes(termo) ||
      g.pacienteNome.toLocaleLowerCase().includes(termo) ||
      g.medicoNome.toLocaleLowerCase().includes(termo) ||
      g.descricao.toLocaleLowerCase().includes(termo) ||
      (g.loteVinculadoId || '').toLocaleLowerCase().includes(termo);
    const bateOp =
      filtroOperadora === 'Todas' || g.operadora === filtroOperadora;
    const bateStatus = filtroStatus === 'Todos' || g.status === filtroStatus;
    return bateTexto && bateOp && bateStatus;
  });

  const volumeTotalGuias = filtradas
    .filter((g) => g.status !== 'Cancelado')
    .reduce((acc, g) => acc + Math.max(0, g.valor - (g.desconto ?? 0)), 0);
  const qtdEmLote = filtradas.filter((g) => Boolean(g.loteVinculadoId)).length;
  const qtdRealizadas = filtradas.filter((g) => g.status === 'Realizado').length;

  const opcoesOperadoras = Array.from(
    new Set([...operadoras.map((o) => o.nome), 'Particular'])
  );

  return (
    <main className="dashboard-body">
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>
          Central de Guias TUSS / TISS de Faturamento
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Consulte, edite, cancele, exclua e utilize o botão Ver/Imprimir para emitir
          as Guias TUSS de atendimentos e lotes de operadoras.
        </p>
      </div>

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Guias Listadas</span>
            <FileText size={20} color="#778873" />
          </div>
          <div className="kpi-value">{filtradas.length}</div>
          <div className="kpi-subtitle">Guias TUSS / TISS disponíveis</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Volume Ativo das Guias</span>
            <DollarSign size={20} color="#778873" />
          </div>
          <div className="kpi-value">{formatarMoeda(volumeTotalGuias)}</div>
          <div className="kpi-subtitle">Soma líquida das guias ativas</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Guias Realizadas</span>
            <CheckCircle2 size={20} color="#4d6b53" />
          </div>
          <div className="kpi-value">{qtdRealizadas}</div>
          <div className="kpi-subtitle">Procedimentos clínicos concluídos</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Vinculadas em Lotes</span>
            <Layers size={20} color="#778873" />
          </div>
          <div className="kpi-value">{qtdEmLote}</div>
          <div className="kpi-subtitle">Agrupadas em lotes de faturamento</div>
        </div>
      </section>

      <section className="demandas-section">
        <div className="filters-bar">
          <div>
            <h2
              style={{
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FileText size={18} color="#778873" />
              <span>Relação de Guias TUSS ({filtradas.length})</span>
            </h2>
          </div>

          <ExpandableFilterToggle
            aberto={painelFiltrosAberto}
            aoAlternar={() => setPainelFiltrosAberto((ant) => !ant)}
            qtdAtivos={qtdFiltrosAtivos}
            aoLimpar={limparFiltros}
          />
        </div>

        <ExpandableFilterPanel
          aberto={painelFiltrosAberto}
          aoLimpar={limparFiltros}
        >
          <div className="search-box" style={{ flex: 1, minWidth: '240px' }}>
            <Search size={16} color="#5A6B57" />
            <input
              type="text"
              placeholder="Buscar por nº guia, código TUSS, paciente, médico ou lote..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filtroOperadora}
            onChange={(e) => setFiltroOperadora(e.target.value)}
          >
            <option value="Todas">Operadora: Todas</option>
            {opcoesOperadoras.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="Todos">Status: Todos</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Realizado">Realizado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </ExpandableFilterPanel>

        <div className="table-container">
          <table className="demandas-table">
            <thead>
              <tr>
                <th>Nº Guia</th>
                <th>Cód. TUSS</th>
                <th>Paciente</th>
                <th>Médico Executante</th>
                <th>Procedimento</th>
                <th>Data</th>
                <th>Operadora / Lote</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      padding: '2rem'
                    }}
                  >
                    Nenhuma guia encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtradas.map((g) => {
                  const liquido = Math.max(0, g.valor - (g.desconto ?? 0));
                  return (
                    <tr
                      key={`${g.id}-${g.loteVinculadoId || 'avulsa'}`}
                      className="clickable-row"
                      onClick={() => setGuiaSelecionada(g)}
                      title="Clique para visualizar ou imprimir a Guia TUSS"
                    >
                      <td style={{ fontWeight: 700, color: '#778873' }}>
                        GUIA-{g.id}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {g.codigoTuss || '10101012'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{g.pacienteNome}</td>
                      <td>
                        <div>{g.medicoNome}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>
                          {g.especialidade}
                        </small>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {g.descricao}
                      </td>
                      <td>{formatarDataBR(g.data)}</td>
                      <td>
                        <span className="badge badge-faturado">{g.operadora}</span>
                        {g.loteVinculadoId && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              marginTop: '0.2rem'
                            }}
                          >
                            Lote: <strong>{g.loteVinculadoId}</strong>
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatarMoeda(liquido)}</td>
                      <td>
                        <span className={obterClasseBadgeAtendimento(g.status)}>
                          {g.status}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            flexWrap: 'nowrap'
                          }}
                        >
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => setGuiaSelecionada(g)}
                            title="Visualizar e Imprimir Guia TUSS"
                          >
                            <Printer size={13} />
                            <span>Ver/Imprimir</span>
                          </button>

                          <ActionMenu
                            opcoes={[
                              {
                                rotulo: 'Editar Guia',
                                icone: <Pencil size={14} />,
                                aoClicar: () => abrirModalEditarGuia(g)
                              },
                              ...(g.status !== 'Cancelado'
                                ? [
                                    {
                                      rotulo: 'Cancelar Guia',
                                      icone: <XCircle size={14} />,
                                      aoClicar: () => aoCancelarGuiaTuss(g.id)
                                    }
                                  ]
                                : [])
                            ]}
                            aoExcluir={() => aoExcluirGuiaTuss(g.id)}
                            tituloExcluir="Excluir Guia"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {guiaSelecionada && (
        <ModalGuiaTuss
          atendimento={guiaSelecionada}
          paciente={pacientes.find((p) => p.id === guiaSelecionada.pacienteId)}
          medico={medicos.find((m) => m.id === guiaSelecionada.medicoId)}
          aoFechar={() => setGuiaSelecionada(null)}
        />
      )}

      {guiaEmEdicao && (
        <div className="modal-overlay" onClick={() => setGuiaEmEdicao(null)}>
          <div
            className="modal-content modal-content-80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>
                  Editar Guia TUSS — GUIA-{guiaEmEdicao.id}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Atualize os dados técnicos e financeiros desta Guia TUSS ({guiaEmEdicao.operadora}).
                </p>
              </div>
              <button
                type="button"
                className="btn-realtime"
                onClick={() => setGuiaEmEdicao(null)}
                style={{ padding: '0.3rem 0.5rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={salvarEdicaoGuia}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div className="lote-summary-strip">
                <div>
                  <span className="strip-label">Nº da Guia</span>
                  <strong style={{ color: '#778873' }}>GUIA-{guiaEmEdicao.id}</strong>
                </div>
                <div>
                  <span className="strip-label">Paciente</span>
                  <strong>{guiaEmEdicao.pacienteNome}</strong>
                </div>
                <div>
                  <span className="strip-label">Profissional Executante</span>
                  <strong>{guiaEmEdicao.medicoNome}</strong>
                </div>
                <div>
                  <span className="strip-label">Operadora</span>
                  <strong>{guiaEmEdicao.operadora}</strong>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Código TUSS</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editCodigoTuss}
                    onChange={(e) => setEditCodigoTuss(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Procedimento / Descrição da Guia</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editDescricao}
                    onChange={(e) => setEditDescricao(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Valor da Guia (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-input"
                    value={editValor}
                    onChange={(e) => setEditValor(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-realtime"
                  onClick={() => setGuiaEmEdicao(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} />
                  <span>Salvar Alterações da Guia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
