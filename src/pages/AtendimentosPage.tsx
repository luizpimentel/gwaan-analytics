import { useState } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  Pencil,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import type {
  Atendimento,
  Operadora,
  Paciente,
  Profissional,
  StatusAtendimento
} from '../data/dadosFaturamento';
import {
  formatarDataBR,
  formatarMoeda,
  obterClasseBadgeAtendimento
} from '../utils/formatadores';
import { Pagination } from '../components/Pagination';
import { ActionMenu, type OpcaoActionMenu } from '../components/ActionMenu';
import {
  ExpandableFilterPanel,
  ExpandableFilterToggle
} from '../components/ExpandableFilterBar';
import { ModalAtendimento } from '../components/ModalAtendimento';
import {
  ModalGuiaTuss,
  imprimirGuiaTussAtendimento
} from '../components/ModalGuiaTuss';

interface AtendimentosPageProps {
  atendimentos: Atendimento[];
  pacientes: Paciente[];
  medicos: Profissional[];
  operadoras: Operadora[];
  aoSalvarAtendimento: (dados: Omit<Atendimento, 'id'> & { id?: string }) => void;
  aoCadastrarPacienteRapido: (dados: Omit<Paciente, 'id'>) => Paciente;
  aoAlterarStatusAtendimento: (id: string, novoStatus: StatusAtendimento) => void;
  aoExcluirAtendimento: (id: string) => void;
}

const ITENS_POR_PAGINA_ATD = 12;

export function AtendimentosPage({
  atendimentos,
  pacientes,
  medicos,
  operadoras,
  aoSalvarAtendimento,
  aoCadastrarPacienteRapido,
  aoAlterarStatusAtendimento,
  aoExcluirAtendimento
}: AtendimentosPageProps) {
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(false);
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroOperadora, setFiltroOperadora] = useState<string>('Todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [filtroData, setFiltroData] = useState<string>('');
  const [paginaAtual, setPaginaAtual] = useState<number>(1);

  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] =
    useState<Atendimento | null>(null);

  const [guiaTussParaVisualizar, setGuiaTussParaVisualizar] =
    useState<Atendimento | null>(null);

  const qtdFiltrosAtivos =
    (buscaTexto.trim() ? 1 : 0) +
    (filtroOperadora !== 'Todas' ? 1 : 0) +
    (filtroStatus !== 'Todos' ? 1 : 0) +
    (filtroData ? 1 : 0);

  function limparFiltros() {
    setBuscaTexto('');
    setFiltroOperadora('Todas');
    setFiltroStatus('Todos');
    setFiltroData('');
    setPaginaAtual(1);
  }

  function abrirModalNovo() {
    setAtendimentoSelecionado(null);
    setModalAberto(true);
  }

  function abrirModalAtendimento(atd: Atendimento) {
    setAtendimentoSelecionado(atd);
    setModalAberto(true);
  }

  const filtrados = atendimentos.filter((item) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const bateTexto =
      item.id.toLocaleLowerCase().includes(termo) ||
      item.pacienteNome.toLocaleLowerCase().includes(termo) ||
      item.pacienteId.toLocaleLowerCase().includes(termo) ||
      item.medicoNome.toLocaleLowerCase().includes(termo) ||
      item.especialidade.toLocaleLowerCase().includes(termo) ||
      item.descricao.toLocaleLowerCase().includes(termo);
    const bateOperadora =
      filtroOperadora === 'Todas' || item.operadora === filtroOperadora;
    const bateStatus = filtroStatus === 'Todos' || item.status === filtroStatus;
    const bateData = !filtroData || item.data === filtroData;

    return bateTexto && bateOperadora && bateStatus && bateData;
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(filtrados.length / ITENS_POR_PAGINA_ATD)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const paginados = filtrados.slice(
    (paginaSegura - 1) * ITENS_POR_PAGINA_ATD,
    paginaSegura * ITENS_POR_PAGINA_ATD
  );

  const opcoesOperadoras = [
    ...Array.from(new Set(operadoras.map((o) => o.nome))),
    'Particular'
  ];

  const qtdAgendados = filtrados.filter((a) => a.status === 'Agendado').length;
  const valorAgendados = filtrados
    .filter((a) => a.status === 'Agendado')
    .reduce((acc, a) => acc + Math.max(0, a.valor - (a.desconto ?? 0)), 0);

  const qtdConfirmados = filtrados.filter((a) => a.status === 'Confirmado').length;
  const valorConfirmados = filtrados
    .filter((a) => a.status === 'Confirmado')
    .reduce((acc, a) => acc + Math.max(0, a.valor - (a.desconto ?? 0)), 0);

  const qtdRealizados = filtrados.filter((a) => a.status === 'Realizado').length;
  const valorRealizados = filtrados
    .filter((a) => a.status === 'Realizado')
    .reduce((acc, a) => acc + Math.max(0, a.valor - (a.desconto ?? 0)), 0);

  const qtdCancelados = filtrados.filter((a) => a.status === 'Cancelado').length;
  const valorCancelados = filtrados
    .filter((a) => a.status === 'Cancelado')
    .reduce((acc, a) => acc + Math.max(0, a.valor - (a.desconto ?? 0)), 0);

  function construirOpcoesAtendimento(item: Atendimento): OpcaoActionMenu[] {
    const opcoes: OpcaoActionMenu[] = [
      {
        rotulo:
          item.status === 'Cancelado'
            ? 'Reagendar (Alterar Data/Hora)'
            : 'Ver / Editar Atendimento',
        icone: <Pencil size={14} />,
        aoClicar: () => abrirModalAtendimento(item)
      }
    ];

    if (
      item.status !== 'Confirmado' &&
      item.status !== 'Realizado' &&
      item.status !== 'Cancelado'
    ) {
      opcoes.push({
        rotulo: 'Confirmar Atendimento',
        icone: <Clock size={14} />,
        aoClicar: () => aoAlterarStatusAtendimento(item.id, 'Confirmado')
      });
    }

    if (item.status !== 'Realizado' && item.status !== 'Cancelado') {
      opcoes.push({
        rotulo: 'Marcar como Realizado',
        icone: <CheckCircle2 size={14} />,
        aoClicar: () => aoAlterarStatusAtendimento(item.id, 'Realizado')
      });
    }

    if (item.status !== 'Cancelado') {
      opcoes.push({
        rotulo: 'Cancelar Atendimento',
        icone: <XCircle size={14} />,
        aoClicar: () => aoAlterarStatusAtendimento(item.id, 'Cancelado')
      });
    }

    return opcoes;
  }

  return (
    <main className="dashboard-body">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>
            Atendimentos Clínicos
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Gerencie agendamentos, procedimentos, emissão de Guias TUSS no modal e histórico
            financeiro de atendimentos.
          </p>
        </div>

        <button className="btn-primary" onClick={abrirModalNovo}>
          <Plus size={18} />
          <span>Novo Atendimento</span>
        </button>
      </div>

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Agendados</span>
            <Clock size={20} color="#3b82f6" />
          </div>
          <div className="kpi-value">{qtdAgendados}</div>
          <div className="kpi-subtitle">
            Volume: <strong>{formatarMoeda(valorAgendados)}</strong> • Aguardando confirmação
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Confirmados</span>
            <CalendarCheck size={20} color="#778873" />
          </div>
          <div className="kpi-value">{qtdConfirmados}</div>
          <div className="kpi-subtitle">
            Volume: <strong>{formatarMoeda(valorConfirmados)}</strong> • Guia TUSS liberada
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Realizados</span>
            <CheckCircle2 size={20} color="#4d6b53" />
          </div>
          <div className="kpi-value">{qtdRealizados}</div>
          <div className="kpi-subtitle">
            Volume: <strong>{formatarMoeda(valorRealizados)}</strong> • Concluídos
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Cancelados</span>
            <XCircle size={20} color="#dc2626" />
          </div>
          <div className="kpi-value">{qtdCancelados}</div>
          <div className="kpi-subtitle">
            Volume: <strong>{formatarMoeda(valorCancelados)}</strong> • Desmarcados / Expirados
          </div>
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
              <CalendarCheck size={18} color="#778873" />
              <span>Agenda e Histórico de Atendimentos ({filtrados.length})</span>
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginTop: '0.2rem'
              }}
            >
              Clique no atendimento para abrir o modal, editar procedimentos e visualizar ou
              imprimir a Guia TUSS.
            </p>
          </div>

          <ExpandableFilterToggle
            aberto={painelFiltrosAberto}
            aoAlternar={() => setPainelFiltrosAberto((ant) => !ant)}
            qtdAtivos={qtdFiltrosAtivos}
            aoLimpar={limparFiltros}
          />
        </div>

        <ExpandableFilterPanel aberto={painelFiltrosAberto} aoLimpar={limparFiltros}>
          <div className="search-box" style={{ flex: 1, minWidth: '240px' }}>
            <Search size={16} color="#5A6B57" />
            <input
              type="text"
              placeholder="Buscar paciente, ID do paciente, médico ou procedimento..."
              value={buscaTexto}
              onChange={(e) => {
                setBuscaTexto(e.target.value);
                setPaginaAtual(1);
              }}
            />
          </div>

          <input
            type="date"
            className="filter-select"
            value={filtroData}
            onChange={(e) => {
              setFiltroData(e.target.value);
              setPaginaAtual(1);
            }}
            title="Filtrar por data do atendimento"
          />

          <select
            className="filter-select"
            value={filtroOperadora}
            onChange={(e) => {
              setFiltroOperadora(e.target.value);
              setPaginaAtual(1);
            }}
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
            onChange={(e) => {
              setFiltroStatus(e.target.value);
              setPaginaAtual(1);
            }}
          >
            <option value="Todos">Status: Todos</option>
            <option value="Agendado">Agendado</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Realizado">Realizado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </ExpandableFilterPanel>

        <div className="table-container">
          <table className="demandas-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Descrição</th>
                <th>Data e Hora</th>
                <th>Operadora</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginados.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      padding: '2rem'
                    }}
                  >
                    Nenhum atendimento encontrado para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginados.map((item) => {
                  const temDesconto =
                    item.operadora === 'Particular' && (item.desconto ?? 0) > 0;
                  const liquido = Math.max(0, item.valor - (item.desconto ?? 0));

                  return (
                    <tr
                      key={item.id}
                      className="clickable-row"
                      onClick={() => abrirModalAtendimento(item)}
                      title="Clique para abrir informações completas do atendimento"
                    >
                      <td style={{ fontWeight: 700, color: '#778873' }}>{item.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.pacienteNome}</div>
                        <small
                          style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}
                        >
                          ID Paciente: <strong>{item.pacienteId}</strong>
                        </small>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.medicoNome}</div>
                        <small
                          style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}
                        >
                          {item.especialidade}
                        </small>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        <div>{item.descricao}</div>
                        {(item.historicoAlteracoes?.length ?? 0) > 0 && (
                          <small
                            style={{
                              color: '#778873',
                              fontWeight: 600,
                              fontSize: '0.73rem'
                            }}
                          >
                            {item.historicoAlteracoes?.length} alteração(ões) de valor/desc.
                          </small>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{formatarDataBR(item.data)}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>
                          às {item.hora || '09:00'}
                        </small>
                      </td>
                      <td>
                        <span className="badge badge-faturado">{item.operadora}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{formatarMoeda(liquido)}</div>
                        {temDesconto && (
                          <small style={{ color: '#d97706', fontSize: '0.75rem' }}>
                            Desc: {formatarMoeda(item.desconto ?? 0)}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className={obterClasseBadgeAtendimento(item.status)}>
                          {item.status}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          opcoes={construirOpcoesAtendimento(item)}
                          aoExcluir={() => aoExcluirAtendimento(item.id)}
                          tituloExcluir="Excluir Atendimento"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          paginaAtual={paginaSegura}
          totalItens={filtrados.length}
          itensPorPagina={ITENS_POR_PAGINA_ATD}
          aoMudarPagina={setPaginaAtual}
        />
      </section>

      {modalAberto && (
        <ModalAtendimento
          atendimentoInicial={atendimentoSelecionado}
          pacientes={pacientes}
          medicos={medicos}
          operadoras={operadoras}
          aoFechar={() => {
            setModalAberto(false);
            setAtendimentoSelecionado(null);
          }}
          aoSalvarAtendimento={aoSalvarAtendimento}
          aoCadastrarPacienteRapido={aoCadastrarPacienteRapido}
          aoVisualizarGuiaTuss={(atd) => setGuiaTussParaVisualizar(atd)}
          aoImprimirGuiaTuss={(atd) =>
            imprimirGuiaTussAtendimento(
              atd,
              pacientes.find((p) => p.id === atd.pacienteId),
              medicos.find((m) => m.id === atd.medicoId)
            )
          }
        />
      )}

      {guiaTussParaVisualizar && (
        <ModalGuiaTuss
          atendimento={guiaTussParaVisualizar}
          paciente={pacientes.find((p) => p.id === guiaTussParaVisualizar.pacienteId)}
          medico={medicos.find((m) => m.id === guiaTussParaVisualizar.medicoId)}
          aoFechar={() => setGuiaTussParaVisualizar(null)}
        />
      )}
    </main>
  );
}
