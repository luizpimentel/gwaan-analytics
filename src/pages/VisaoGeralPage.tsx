import { useState } from 'react';
import {
  CheckCircle2,
  Send,
  Search,
  Filter,
  Check,
  Pencil,
  MessageSquareWarning,
  FolderOpen,
  Calendar,
  Clock
} from 'lucide-react';
import type {
  DemandaFinanceira,
  StatusFaturamento
} from '../data/dadosFaturamento';
import {
  estaDentroDoPeriodo,
  formatarMoeda,
  formatarUltimaAtualizacao,
  obterClasseBadge,
  obterClassePrioridade,
  type FiltroPeriodoVisaoGeral
} from '../utils/formatadores';
import { Pagination } from '../components/Pagination';
import { ActionMenu, type OpcaoActionMenu } from '../components/ActionMenu';
import {
  ExpandableFilterPanel,
  ExpandableFilterToggle
} from '../components/ExpandableFilterBar';

interface VisaoGeralPageProps {
  demandas: DemandaFinanceira[];
  metaFinanceira: number;
  aoAlterarStatus: (id: string, novoStatus: StatusFaturamento) => void;
  aoEditarDemanda: (demanda: DemandaFinanceira) => void;
  aoAbrirRecurso: (demanda: DemandaFinanceira) => void;
  aoExcluirDemanda: (id: string) => void;
}

const ITENS_POR_PAGINA_DASHBOARD = 10;

export function VisaoGeralPage({
  demandas,
  metaFinanceira,
  aoAlterarStatus,
  aoEditarDemanda,
  aoAbrirRecurso,
  aoExcluirDemanda
}: VisaoGeralPageProps) {
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(false);
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroPeriodo, setFiltroPeriodo] =
    useState<FiltroPeriodoVisaoGeral>('Todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('Todas');
  const [paginaAtual, setPaginaAtual] = useState<number>(1);

  const qtdFiltrosAtivos =
    (buscaTexto.trim() ? 1 : 0) +
    (filtroPeriodo !== 'Todos' ? 1 : 0) +
    (filtroStatus !== 'Todos' ? 1 : 0) +
    (filtroPrioridade !== 'Todas' ? 1 : 0);

  function limparFiltros() {
    setBuscaTexto('');
    setFiltroPeriodo('Todos');
    setFiltroStatus('Todos');
    setFiltroPrioridade('Todas');
    setPaginaAtual(1);
  }

  const demandasNoPeriodo = demandas.filter((demanda) =>
    estaDentroDoPeriodo(
      demanda.dataAlteracaoOuEnvio || demanda.dataCriacao,
      filtroPeriodo
    )
  );

  const demandasFiltradas = demandasNoPeriodo.filter((demanda) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const bateTexto =
      demanda.id.toLocaleLowerCase().includes(termo) ||
      demanda.operadora.toLocaleLowerCase().includes(termo) ||
      (demanda.observacoes || '').toLocaleLowerCase().includes(termo) ||
      (demanda.tipoAtendimento || '').toLocaleLowerCase().includes(termo) ||
      demanda.descricao.toLocaleLowerCase().includes(termo) ||
      (demanda.codigoEnvioOperadora || '').toLocaleLowerCase().includes(termo) ||
      (demanda.guias ?? []).some(
        (g) =>
          g.id.toLocaleLowerCase().includes(termo) ||
          (g.faturaId || '').toLocaleLowerCase().includes(termo) ||
          (g.atendimentoId || '').toLocaleLowerCase().includes(termo) ||
          (g.pacienteId || '').toLocaleLowerCase().includes(termo) ||
          (g.senhaAutorizacao || '').toLocaleLowerCase().includes(termo)
      );
    const bateStatus = filtroStatus === 'Todos' || demanda.status === filtroStatus;
    const batePrioridade =
      filtroPrioridade === 'Todas' || demanda.prioridade === filtroPrioridade;

    return bateTexto && bateStatus && batePrioridade;
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(demandasFiltradas.length / ITENS_POR_PAGINA_DASHBOARD)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const demandasPaginadas = demandasFiltradas.slice(
    (paginaSegura - 1) * ITENS_POR_PAGINA_DASHBOARD,
    paginaSegura * ITENS_POR_PAGINA_DASHBOARD
  );

  const demandasAbertasOuPendentes = demandasNoPeriodo.filter(
    (d) => d.status === 'Aberto' || d.status === 'Pendente'
  );
  const totalAberto = demandasAbertasOuPendentes.reduce(
    (soma, item) => soma + item.valor,
    0
  );

  const demandasFechadas = demandasNoPeriodo.filter((d) => d.status === 'Fechado');
  const totalFechado = demandasFechadas.reduce((soma, item) => soma + item.valor, 0);

  const demandasEnviadas = demandasNoPeriodo.filter(
    (d) => d.status === 'Enviado' || d.status === 'Reenviado'
  );
  const totalEnviado = demandasEnviadas.reduce((soma, item) => soma + item.valor, 0);

  const receitaConsolidada = totalFechado + totalEnviado;
  const percentualMeta =
    metaFinanceira > 0 ? Math.round((receitaConsolidada / metaFinanceira) * 100) : 0;
  const larguraBarraMeta = Math.min(100, Math.max(0, percentualMeta));

  function construirOpcoesLinha(item: DemandaFinanceira): OpcaoActionMenu[] {
    const opcoes: OpcaoActionMenu[] = [
      {
        rotulo: 'Abrir / Gerenciar Lote',
        icone: <Pencil size={14} />,
        aoClicar: () => aoEditarDemanda(item)
      }
    ];

    if (item.status === 'Aberto') {
      opcoes.push({
        rotulo: 'Faturar Guias (Fechar)',
        icone: <Check size={14} />,
        aoClicar: () => aoAlterarStatus(item.id, 'Fechado')
      });
      opcoes.push({
        rotulo: 'Marcar como Pendente',
        icone: <Clock size={14} />,
        aoClicar: () => aoAlterarStatus(item.id, 'Pendente')
      });
    } else if (item.status === 'Pendente') {
      opcoes.push({
        rotulo: 'Abrir Lote',
        icone: <FolderOpen size={14} />,
        aoClicar: () => aoAlterarStatus(item.id, 'Aberto')
      });
      opcoes.push({
        rotulo: 'Faturar Guias (Fechar)',
        icone: <Check size={14} />,
        aoClicar: () => aoAlterarStatus(item.id, 'Fechado')
      });
    } else if (item.status === 'Fechado' && !item.codigoEnvioOperadora) {
      opcoes.push({
        rotulo: 'Abrir Lote',
        icone: <FolderOpen size={14} />,
        aoClicar: () => aoAlterarStatus(item.id, 'Aberto')
      });
    } else if (
      item.status === 'Enviado' ||
      item.status === 'Reenviado' ||
      (item.status === 'Fechado' && Boolean(item.codigoEnvioOperadora))
    ) {
      opcoes.push({
        rotulo: 'Glosar Lote',
        icone: <MessageSquareWarning size={14} />,
        destaque: 'recurso',
        aoClicar: () => {
          aoAlterarStatus(item.id, 'Glosado');
          aoAbrirRecurso(item);
        }
      });
    } else if (item.status === 'Glosado') {
      opcoes.push({
        rotulo: 'Tratar Glosa',
        icone: <MessageSquareWarning size={14} />,
        destaque: 'recurso',
        aoClicar: () => aoAbrirRecurso(item)
      });
      opcoes.push({
        rotulo: 'Abrir Lote',
        icone: <FolderOpen size={14} />,
        aoClicar: () => aoAlterarStatus(item.id, 'Aberto')
      });
    }

    return opcoes;
  }

  const botoesPeriodo: { id: FiltroPeriodoVisaoGeral; rotulo: string }[] = [
    { id: 'Hoje', rotulo: 'Hoje' },
    { id: '7dias', rotulo: '7 dias' },
    { id: '15dias', rotulo: '15 dias' },
    { id: 'Mes', rotulo: 'Mês' },
    { id: 'Todos', rotulo: 'Todos' }
  ];

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
            Monitoramento de Faturamento
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Torre de controle diária • Meta por Operadora:{' '}
            <strong>{formatarMoeda(metaFinanceira)}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginRight: '0.25rem'
            }}
          >
            <Calendar size={15} color="#778873" />
            Período:
          </span>
          {botoesPeriodo.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`btn-realtime ${filtroPeriodo === p.id ? 'active' : ''}`}
              onClick={() => {
                setFiltroPeriodo(p.id);
                setPaginaAtual(1);
              }}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      <section className="kpi-grid kpi-grid-three">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Fechado (Faturado)</span>
            <CheckCircle2 size={20} color="#778873" />
          </div>
          <div className="kpi-value">{formatarMoeda(totalFechado)}</div>
          <div className="meta-progress-wrapper">
            <div className="meta-progress-track">
              <div
                className="meta-progress-fill"
                style={{ width: `${larguraBarraMeta}%` }}
              />
            </div>
            <div className="meta-progress-label">
              <span>{percentualMeta}% da meta (Fechado + Enviado)</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Enviado / Reenviado</span>
            <Send size={20} color="#4d6b53" />
          </div>
          <div className="kpi-value">{formatarMoeda(totalEnviado)}</div>
          <div className="kpi-subtitle">
            {demandasEnviadas.length}{' '}
            {demandasEnviadas.length === 1
              ? 'lote enviado à operadora'
              : 'lotes enviados às operadoras'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Lotes Abertos / Pendentes</span>
            <FolderOpen size={20} color="#778873" />
          </div>
          <div className="kpi-value">{formatarMoeda(totalAberto)}</div>
          <div className="kpi-subtitle">
            {demandasAbertasOuPendentes.length}{' '}
            {demandasAbertasOuPendentes.length === 1
              ? 'lote aguardando fechamento'
              : 'lotes aguardando fechamento'}
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
              <Filter size={18} color="#778873" />
              <span>Fila de Lotes Processados</span>
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginTop: '0.2rem'
              }}
            >
              Total de {demandasFiltradas.length} lotes filtrados de {demandas.length}{' '}
              armazenados.
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
              placeholder="Buscar LOTE-nº, FAT-nº, G-nº, CONS-nº, PAC-nº, senha, protocolo ou operadora..."
              value={buscaTexto}
              onChange={(e) => {
                setBuscaTexto(e.target.value);
                setPaginaAtual(1);
              }}
            />
          </div>

          <select
            className="filter-select"
            value={filtroPeriodo}
            onChange={(e) => {
              setFiltroPeriodo(e.target.value as FiltroPeriodoVisaoGeral);
              setPaginaAtual(1);
            }}
          >
            <option value="Todos">Período: Todos</option>
            <option value="Hoje">Hoje</option>
            <option value="7dias">Últimos 7 dias</option>
            <option value="15dias">Últimos 15 dias</option>
            <option value="Mes">Este Mês</option>
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
            <option value="Aberto">Aberto</option>
            <option value="Pendente">Pendente</option>
            <option value="Fechado">Fechado</option>
            <option value="Enviado">Enviado</option>
            <option value="Glosado">Glosado</option>
            <option value="Reenviado">Reenviado</option>
          </select>

          <select
            className="filter-select"
            value={filtroPrioridade}
            onChange={(e) => {
              setFiltroPrioridade(e.target.value);
              setPaginaAtual(1);
            }}
          >
            <option value="Todas">Prioridade: Todas</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </ExpandableFilterPanel>

        <div className="table-container">
          <table className="demandas-table">
            <thead>
              <tr>
                <th>Código (LOTE-nº)</th>
                <th>Operadora</th>
                <th>Consulta / Guias & Faturas</th>
                <th>Prioridade</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Última Atualização</th>
                <th>Ações Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {demandasPaginadas.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      padding: '2rem'
                    }}
                  >
                    Nenhum lote encontrado para os filtros e período selecionados.
                  </td>
                </tr>
              ) : (
                demandasPaginadas.map((item) => {
                  const faturasDoLote = (item.guias ?? [])
                    .map((g) => g.faturaId)
                    .filter(Boolean);
                  return (
                    <tr
                      key={item.id}
                      className="clickable-row"
                      onClick={() => aoEditarDemanda(item)}
                    >
                      <td style={{ fontWeight: 700, color: '#778873' }}>{item.id}</td>
                      <td style={{ fontWeight: 500 }}>{item.operadora}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        <div>
                          {item.observacoes || item.descricao || `Lote ${item.operadora} — ${item.tipoAtendimento}`}
                        </div>
                        <small className="obs-preview">
                          {item.tipoAtendimento} • {item.guias?.length ?? 0} guia(s) (G-nº)
                          {faturasDoLote.length > 0
                            ? ` • Faturas: ${faturasDoLote.join(', ')}`
                            : ''}
                          {item.codigoEnvioOperadora
                            ? ` • Protocolo Envio: ${item.codigoEnvioOperadora}`
                            : ''}
                        </small>
                        {item.recurso && (
                          <span className="recurso-tag" title={item.recurso.motivo}>
                            Glosa: {item.recurso.tipoGlosa}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={obterClassePrioridade(item.prioridade)}>
                          {item.prioridade}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatarMoeda(item.valor)}</td>
                      <td>
                        <span className={obterClasseBadge(item.status)}>{item.status}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                        {formatarUltimaAtualizacao(
                          item.dataAlteracaoOuEnvio || item.atualizadoHa
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          opcoes={construirOpcoesLinha(item)}
                          aoExcluir={() => aoExcluirDemanda(item.id)}
                          tituloExcluir="Excluir Lote"
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
          totalItens={demandasFiltradas.length}
          itensPorPagina={ITENS_POR_PAGINA_DASHBOARD}
          aoMudarPagina={setPaginaAtual}
        />
      </section>
    </main>
  );
}
