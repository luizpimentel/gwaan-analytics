import { useState } from 'react';
import {
  Plus,
  Search,
  Layers,
  Pencil,
  MessageSquareWarning,
  Send,
  Check,
  Eye,
  Printer
} from 'lucide-react';
import type {
  DemandaFinanceira,
  Operadora,
  StatusFaturamento
} from '../data/dadosFaturamento';
import {
  formatarDataBR,
  formatarMoeda,
  formatarUltimaAtualizacao,
  obterClasseBadge,
  obterClassePrioridade
} from '../utils/formatadores';
import { Pagination } from '../components/Pagination';
import { ActionMenu, type OpcaoActionMenu } from '../components/ActionMenu';
import {
  ExpandableFilterPanel,
  ExpandableFilterToggle
} from '../components/ExpandableFilterBar';
import { gerarEImprimirFaturasLotePDF } from '../components/ModalLote';

interface LotesPageProps {
  demandas: DemandaFinanceira[];
  operadoras: Operadora[];
  aoAbrirNovoLote: () => void;
  aoSelecionarLote: (lote: DemandaFinanceira) => void;
  aoAbrirRecurso: (lote: DemandaFinanceira) => void;
  aoAlterarStatus: (id: string, novoStatus: StatusFaturamento) => void;
  aoExcluirDemanda: (id: string) => void;
}

const ITENS_POR_PAGINA_LOTES = 25;

export function LotesPage({
  demandas,
  operadoras,
  aoAbrirNovoLote,
  aoSelecionarLote,
  aoAbrirRecurso,
  aoAlterarStatus,
  aoExcluirDemanda
}: LotesPageProps) {
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(false);
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroOperadora, setFiltroOperadora] = useState<string>('Todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('Todas');
  const [paginaAtual, setPaginaAtual] = useState<number>(1);

  const qtdFiltrosAtivos =
    (buscaTexto.trim() ? 1 : 0) +
    (filtroOperadora !== 'Todas' ? 1 : 0) +
    (filtroStatus !== 'Todos' ? 1 : 0) +
    (filtroPrioridade !== 'Todas' ? 1 : 0);

  function limparFiltros() {
    setBuscaTexto('');
    setFiltroOperadora('Todas');
    setFiltroStatus('Todos');
    setFiltroPrioridade('Todas');
    setPaginaAtual(1);
  }

  const lotesFiltrados = demandas.filter((lote) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const bateTexto =
      lote.id.toLocaleLowerCase().includes(termo) ||
      lote.operadora.toLocaleLowerCase().includes(termo) ||
      lote.descricao.toLocaleLowerCase().includes(termo) ||
      (lote.tipoAtendimento ?? '').toLocaleLowerCase().includes(termo);
    const bateOperadora =
      filtroOperadora === 'Todas' || lote.operadora === filtroOperadora;
    const bateStatus = filtroStatus === 'Todos' || lote.status === filtroStatus;
    const batePrioridade =
      filtroPrioridade === 'Todas' || lote.prioridade === filtroPrioridade;

    return bateTexto && bateOperadora && bateStatus && batePrioridade;
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(lotesFiltrados.length / ITENS_POR_PAGINA_LOTES)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const lotesPaginados = lotesFiltrados.slice(
    (paginaSegura - 1) * ITENS_POR_PAGINA_LOTES,
    paginaSegura * ITENS_POR_PAGINA_LOTES
  );

  const totalFinanceiroFiltrado = lotesFiltrados.reduce(
    (acc, l) => acc + l.valor,
    0
  );
  const qtdAbertos = lotesFiltrados.filter((l) => l.status === 'Aberto').length;
  const qtdFaturadas = lotesFiltrados.filter(
    (l) => l.status === 'Faturada'
  ).length;
  const qtdEnviadas = lotesFiltrados.filter((l) => l.status === 'Enviada').length;

  const nomesOperadoras = Array.from(
    new Set([
      ...operadoras.map((op) => op.nome),
      ...demandas.map((d) => d.operadora)
    ])
  );

  function construirOpcoesLote(lote: DemandaFinanceira): OpcaoActionMenu[] {
    const opcoes: OpcaoActionMenu[] = [];

    if (lote.status !== 'Enviada') {
      opcoes.push({
        rotulo: 'Gerenciar Lote, Atendimentos e Histórico',
        icone: <Pencil size={14} />,
        aoClicar: () => aoSelecionarLote(lote)
      });
    } else {
      opcoes.push({
        rotulo: 'Visualizar Lote, Atendimentos e Histórico',
        icone: <Eye size={14} />,
        aoClicar: () => aoSelecionarLote(lote)
      });
      opcoes.push({
        rotulo: lote.recurso ? 'Atualizar Recurso' : 'Abrir Recurso',
        icone: <MessageSquareWarning size={14} />,
        destaque: 'recurso',
        aoClicar: () => aoAbrirRecurso(lote)
      });
    }

    if (lote.status === 'Faturada' || lote.status === 'Enviada') {
      opcoes.push({
        rotulo: 'Visualizar / Imprimir Faturas (PDF)',
        icone: <Printer size={14} />,
        aoClicar: () =>
          gerarEImprimirFaturasLotePDF({
            id: lote.id,
            operadora: lote.operadora,
            descricao: lote.descricao,
            tipoAtendimento: lote.tipoAtendimento,
            dataCriacao: lote.dataCriacao,
            guias: lote.guias
          })
      });
    }

    if (lote.status === 'Aberto') {
      opcoes.push({
        rotulo: 'Emitir Faturas (Mudar para Faturada)',
        icone: <Check size={14} />,
        aoClicar: () => {
          gerarEImprimirFaturasLotePDF({
            id: lote.id,
            operadora: lote.operadora,
            descricao: lote.descricao,
            tipoAtendimento: lote.tipoAtendimento,
            dataCriacao: lote.dataCriacao,
            guias: lote.guias
          });
          aoAlterarStatus(lote.id, 'Faturada');
        }
      });
    }

    if (lote.status !== 'Enviada') {
      opcoes.push({
        rotulo: 'Enviar ao Convênio (Mudar para Enviada)',
        icone: <Send size={14} />,
        aoClicar: () => aoAlterarStatus(lote.id, 'Enviada')
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
            Gestão de Lotes de Convênios
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Status de lotes de convênios: <strong>Aberto</strong> (alocar guias
            para faturar), <strong>Faturada</strong> (faturas PDF emitidas por
            atendimento) e <strong>Enviada</strong> (enviado ao convênio para
            pagamento).
          </p>
        </div>

        <button className="btn-primary" onClick={aoAbrirNovoLote}>
          <Plus size={18} />
          <span>Lote</span>
        </button>
      </div>

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Lotes Abertos (Para Faturar)</span>
            <Layers size={20} color="#3b82f6" />
          </div>
          <div className="kpi-value">{qtdAbertos}</div>
          <div className="kpi-subtitle">Abertos para alocação de guias</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Lotes Faturados</span>
            <Check size={20} color="#778873" />
          </div>
          <div className="kpi-value">{qtdFaturadas}</div>
          <div className="kpi-subtitle">Faturas em PDF emitidas</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Lotes Enviados</span>
            <Send size={20} color="#4d6b53" />
          </div>
          <div className="kpi-value">{qtdEnviadas}</div>
          <div className="kpi-subtitle">Enviados aos convênios para pagamento</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Volume Total nos Lotes</span>
            <Layers size={20} color="#778873" />
          </div>
          <div className="kpi-value">{formatarMoeda(totalFinanceiroFiltrado)}</div>
          <div className="kpi-subtitle">
            {lotesFiltrados.length} lote(s) listado(s)
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
              <Layers size={18} color="#778873" />
              <span>Catálogo de Lotes de Convênios ({lotesFiltrados.length})</span>
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginTop: '0.2rem'
              }}
            >
              Clique em qualquer lote para abrir o modal (80% da tela) com as abas de
              Dados, Atendimentos Vinculados e Histórico.
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
              placeholder="Buscar código, operadora, tipo ou descrição..."
              value={buscaTexto}
              onChange={(e) => {
                setBuscaTexto(e.target.value);
                setPaginaAtual(1);
              }}
            />
          </div>

          <select
            className="filter-select"
            value={filtroOperadora}
            onChange={(e) => {
              setFiltroOperadora(e.target.value);
              setPaginaAtual(1);
            }}
          >
            <option value="Todas">Operadora: Todas</option>
            {nomesOperadoras.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
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
            <option value="Aberto">Aberto</option>
            <option value="Faturada">Faturada</option>
            <option value="Enviada">Enviada</option>
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
                <th>Código</th>
                <th>Operadora</th>
                <th>Descrição / Tipo de Tratamento</th>
                <th>Criação</th>
                <th>Prioridade</th>
                <th>Valor (Soma Guias)</th>
                <th>Status</th>
                <th>Última Alteração (Histórico)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lotesPaginados.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      padding: '2rem'
                    }}
                  >
                    Nenhum lote encontrado para os critérios informados.
                  </td>
                </tr>
              ) : (
                lotesPaginados.map((lote) => (
                  <tr
                    key={lote.id}
                    className="clickable-row"
                    onClick={() => aoSelecionarLote(lote)}
                    title="Clique para abrir o modal com Dados, Atendimentos e Histórico do lote"
                  >
                    <td style={{ fontWeight: 700, color: '#778873' }}>{lote.id}</td>
                    <td style={{ fontWeight: 500 }}>{lote.operadora}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {lote.descricao}
                      </div>
                      <small className="obs-preview">
                        Tratamento:{' '}
                        <strong>{lote.tipoAtendimento ?? 'SADT / Exames'}</strong> •{' '}
                        {lote.guias?.length ?? 0} guia(s)
                        {lote.observacoes ? ` — ${lote.observacoes}` : ''}
                      </small>
                      {lote.recurso && (
                        <span className="recurso-tag" title={lote.recurso.motivo}>
                          Recurso: {lote.recurso.motivo}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.84rem' }}>
                      {formatarDataBR(lote.dataCriacao)}
                    </td>
                    <td>
                      <span className={obterClassePrioridade(lote.prioridade)}>
                        {lote.prioridade}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatarMoeda(lote.valor)}</td>
                    <td>
                      <span className={obterClasseBadge(lote.status)}>{lote.status}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                      {lote.historicoLote?.[0]?.dataHora ||
                        formatarUltimaAtualizacao(
                          lote.dataAlteracaoOuEnvio || lote.atualizadoHa
                        )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        opcoes={construirOpcoesLote(lote)}
                        aoExcluir={() => aoExcluirDemanda(lote.id)}
                        tituloExcluir="Excluir Lote"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          paginaAtual={paginaSegura}
          totalItens={lotesFiltrados.length}
          itensPorPagina={ITENS_POR_PAGINA_LOTES}
          aoMudarPagina={setPaginaAtual}
        />
      </section>
    </main>
  );
}
