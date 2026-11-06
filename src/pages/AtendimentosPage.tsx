import { useState } from 'react';
import {
  CalendarCheck,
  Search,
  FolderOpen,
  CheckCircle2,
  FileText,
  DollarSign,
  Layers,
  Plus
} from 'lucide-react';
import {
  extrairGuiasDaConsulta,
  type Atendimento,
  type DemandaFinanceira,
  type Operadora,
  type Paciente,
  type Profissional,
  type StatusAtendimento
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
  demandas?: DemandaFinanceira[];
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
  demandas = [],
  pacientes,
  medicos,
  operadoras,
  aoSalvarAtendimento,
  aoCadastrarPacienteRapido,
  aoExcluirAtendimento
}: AtendimentosPageProps) {
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(false);
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroOperadora, setFiltroOperadora] = useState<string>('Todas');
  const [filtroData, setFiltroData] = useState<string>('');
  const [paginaAtual, setPaginaAtual] = useState<number>(1);

  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] =
    useState<Atendimento | null>(null);

  const [guiaTussParaVisualizar, setGuiaTussParaVisualizar] =
    useState<Atendimento | null>(null);

  const apenasRealizados = atendimentos.filter((a) => a.status === 'Realizado');

  const qtdFiltrosAtivos =
    (buscaTexto.trim() ? 1 : 0) +
    (filtroOperadora !== 'Todas' ? 1 : 0) +
    (filtroData ? 1 : 0);

  function limparFiltros() {
    setBuscaTexto('');
    setFiltroOperadora('Todas');
    setFiltroData('');
    setPaginaAtual(1);
  }

  function abrirModalAtendimento(atd: Atendimento | null) {
    setAtendimentoSelecionado(atd);
    setModalAberto(true);
  }

  const filtrados = apenasRealizados.filter((item) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const guiasDaConsulta = extrairGuiasDaConsulta(item);
    const bateGuiaOuSenha = guiasDaConsulta.some(
      (g) =>
        g.numeroGuia.toLocaleLowerCase().includes(termo) ||
        (g.numeroGuiaOperadora || '').toLocaleLowerCase().includes(termo) ||
        (g.senhaAutorizacao || '').toLocaleLowerCase().includes(termo)
    );
    const bateTexto =
      item.id.toLocaleLowerCase().includes(termo) ||
      bateGuiaOuSenha ||
      (item.numeroGuia || '').toLocaleLowerCase().includes(termo) ||
      (item.numeroGuiaOperadora || '').toLocaleLowerCase().includes(termo) ||
      (item.senhaAutorizacao || '').toLocaleLowerCase().includes(termo) ||
      item.pacienteNome.toLocaleLowerCase().includes(termo) ||
      item.pacienteId.toLocaleLowerCase().includes(termo) ||
      item.medicoNome.toLocaleLowerCase().includes(termo) ||
      item.especialidade.toLocaleLowerCase().includes(termo) ||
      item.descricao.toLocaleLowerCase().includes(termo);
    const bateOperadora =
      filtroOperadora === 'Todas' || item.operadora === filtroOperadora;
    const bateData = !filtroData || item.data === filtroData;

    return bateTexto && bateOperadora && bateData;
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

  const qtdRealizados = filtrados.length;
  const valorRealizados = filtrados.reduce(
    (acc, a) => acc + Math.max(0, a.valor - (a.desconto ?? 0)),
    0
  );
  const qtdConvenios = filtrados.filter(
    (a) => a.operadora !== 'Particular'
  ).length;
  const qtdParticulares = filtrados.filter(
    (a) => a.operadora === 'Particular'
  ).length;

  function construirOpcoesAtendimento(item: Atendimento): OpcaoActionMenu[] {
    const guiasDaConsulta = extrairGuiasDaConsulta(item);
    const opcoesGuias: OpcaoActionMenu[] = guiasDaConsulta.map((gd) => ({
      rotulo: `Visualizar / Imprimir Guia ${gd.numeroGuia}${gd.numeroGuiaOperadora && gd.numeroGuiaOperadora !== gd.numeroGuia ? ` (Ope: ${gd.numeroGuiaOperadora})` : ''}`,
      icone: <FileText size={14} />,
      aoClicar: () =>
        setGuiaTussParaVisualizar({
          ...item,
          numeroGuia: gd.numeroGuia,
          numeroGuiaOperadora: gd.numeroGuiaOperadora,
          senhaAutorizacao: gd.senhaAutorizacao,
          codigoTuss: gd.codigoTussPrincipal,
          descricao: gd.descricao,
          valor: gd.valorTotal,
          desconto: gd.desconto,
          procedimentos: gd.procedimentos
        })
    }));

    return [
      {
        rotulo: 'Gerenciar Ficha da Consulta e Procedimentos',
        icone: <FolderOpen size={14} />,
        aoClicar: () => abrirModalAtendimento(item)
      },
      ...opcoesGuias
    ];
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
            Gestão de Consultas e Produção Assistencial
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Controle corporativo de atendimentos realizados, codificação TUSS,
            autorizações de operadoras e emissão de guias de faturamento.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => abrirModalAtendimento(null)}
        >
          <Plus size={18} />
          <span>Registrar Consulta</span>
        </button>
      </div>

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Consultas Realizadas</span>
            <CheckCircle2 size={20} color="#4d6b53" />
          </div>
          <div className="kpi-value">{qtdRealizados}</div>
          <div className="kpi-subtitle">Atendimentos auditados no período</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Receita Assistencial Líquida</span>
            <DollarSign size={20} color="#778873" />
          </div>
          <div className="kpi-value">{formatarMoeda(valorRealizados)}</div>
          <div className="kpi-subtitle">Produção líquida consolidada</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Atendimentos por Operadoras</span>
            <Layers size={20} color="#3b82f6" />
          </div>
          <div className="kpi-value">{qtdConvenios}</div>
          <div className="kpi-subtitle">Faturamento via convênios credenciados</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Atendimentos Particulares</span>
            <CalendarCheck size={20} color="#778873" />
          </div>
          <div className="kpi-value">{qtdParticulares}</div>
          <div className="kpi-subtitle">Faturamento direto na unidade</div>
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
              <span>Relação de Consultas Realizadas ({filtrados.length})</span>
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginTop: '0.2rem'
              }}
            >
              Selecione um registro para visualizar a ficha clínica-financeira,
              gerenciar procedimentos e emitir guias.
            </p>
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
              placeholder="Pesquisar por código da consulta, guia empresa, guia operadora, senha, paciente ou médico..."
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
            title="Filtrar por data da consulta"
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
        </ExpandableFilterPanel>

        <div className="table-container">
          <table className="demandas-table">
            <thead>
              <tr>
                <th>Código da Consulta &amp; Guias</th>
                <th>Paciente</th>
                <th>Médico Executante</th>
                <th>Procedimentos Realizados</th>
                <th>Data e Horário</th>
                <th>Operadora / Plano</th>
                <th>Valor Líquido</th>
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
                    Nenhuma consulta encontrada para os critérios selecionados.
                  </td>
                </tr>
              ) : (
                paginados.map((item) => {
                  const temDesconto =
                    item.operadora === 'Particular' && (item.desconto ?? 0) > 0;
                  const liquido = Math.max(0, item.valor - (item.desconto ?? 0));
                  const ultimoHistorico = item.historicoAlteracoes?.[0];
                  const guiasDaConsulta = extrairGuiasDaConsulta(item);

                  return (
                    <tr
                      key={item.id}
                      className="clickable-row"
                      onClick={() => abrirModalAtendimento(item)}
                      title="Clique para abrir a ficha da consulta"
                    >
                      <td>
                        <div style={{ fontWeight: 700, color: '#778873' }}>
                          {item.id}
                        </div>
                        <small
                          style={{
                            color: 'var(--text-secondary)',
                            display: 'block',
                            marginTop: '0.15rem'
                          }}
                        >
                          Guia Emp.:{' '}
                          <strong>
                            {guiasDaConsulta.map((g) => g.numeroGuia).join(', ')}
                          </strong>
                        </small>
                        {item.operadora !== 'Particular' && (
                          <small
                            style={{
                              color: 'var(--text-secondary)',
                              display: 'block'
                            }}
                          >
                            Guia Ope.:{' '}
                            <strong>
                              {guiasDaConsulta
                                .map((g) => g.numeroGuiaOperadora || g.numeroGuia)
                                .join(', ')}
                            </strong>
                          </small>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.pacienteNome}</div>
                        <small
                          style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.78rem'
                          }}
                        >
                          Registro: <strong>{item.pacienteId}</strong>
                        </small>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.medicoNome}</div>
                        <small
                          style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.78rem'
                          }}
                        >
                          {item.especialidade}
                        </small>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        <div
                          style={{
                            color: 'var(--text-primary)',
                            fontWeight: 500
                          }}
                        >
                          {item.descricao}
                        </div>
                        <small
                          style={{
                            display: 'block',
                            color: 'var(--text-secondary)',
                            fontSize: '0.76rem',
                            marginTop: '0.15rem'
                          }}
                        >
                          {(item.procedimentos?.length ?? 1)} procedimento(s) •{' '}
                          {guiasDaConsulta.length} guia(s) emitida(s)
                        </small>
                        {ultimoHistorico && (
                          <small
                            style={{
                              display: 'block',
                              color: '#4d6b53',
                              fontWeight: 600,
                              fontSize: '0.74rem',
                              marginTop: '0.18rem'
                            }}
                          >
                            Auditoria:{' '}
                            {ultimoHistorico.descricaoAcao ||
                              `${ultimoHistorico.dataHora} — Atualização Financeira`}
                          </small>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {formatarDataBR(item.data)}
                        </div>
                        <small style={{ color: 'var(--text-secondary)' }}>
                          às {item.hora || '09:00'}
                        </small>
                      </td>
                      <td>
                        <span className="badge badge-faturado">
                          {item.operadora}
                        </span>
                        {item.plano && (
                          <small
                            style={{
                              display: 'block',
                              color: 'var(--text-secondary)',
                              fontSize: '0.74rem',
                              marginTop: '0.2rem'
                            }}
                          >
                            {item.plano}
                          </small>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>
                          {formatarMoeda(liquido)}
                        </div>
                        {temDesconto && (
                          <small
                            style={{ color: '#d97706', fontSize: '0.75rem' }}
                          >
                            Desc.: {formatarMoeda(item.desconto ?? 0)}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className={obterClasseBadgeAtendimento('Realizado')}>
                          Realizado
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          opcoes={construirOpcoesAtendimento(item)}
                          aoExcluir={() => aoExcluirAtendimento(item.id)}
                          tituloExcluir="Excluir Consulta"
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
          atendimentosExistentes={atendimentos}
          pacientes={pacientes}
          medicos={medicos}
          operadoras={operadoras}
          demandas={demandas}
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
          paciente={pacientes.find(
            (p) => p.id === guiaTussParaVisualizar.pacienteId
          )}
          medico={medicos.find((m) => m.id === guiaTussParaVisualizar.medicoId)}
          aoFechar={() => setGuiaTussParaVisualizar(null)}
        />
      )}
    </main>
  );
}
