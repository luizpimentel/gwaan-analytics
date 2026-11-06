import { useState } from 'react';
import {
  Plus,
  Search,
  Layers,
  Pencil,
  MessageSquareWarning,
  Check,
  Printer,
  FolderOpen,
  Clock,
  RotateCcw,
  AlertTriangle
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
  const [abaVisualizacao, setAbaVisualizacao] = useState<'todos' | 'glosas'>(
    'todos'
  );
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(false);
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroOperadora, setFiltroOperadora] = useState<string>('Todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('Todas');
  const [filtroTipoGlosa, setFiltroTipoGlosa] = useState<string>('Todos');
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
    setFiltroTipoGlosa('Todos');
    setPaginaAtual(1);
  }

  const lotesFiltrados = demandas.filter((lote) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const bateGuiasOuFaturas = (lote.guias ?? []).some(
      (g) =>
        g.id.toLocaleLowerCase().includes(termo) ||
        (g.faturaId || '').toLocaleLowerCase().includes(termo) ||
        (g.atendimentoId || '').toLocaleLowerCase().includes(termo) ||
        (g.pacienteId || '').toLocaleLowerCase().includes(termo) ||
        g.pacienteNome.toLocaleLowerCase().includes(termo) ||
        (g.senhaAutorizacao || '').toLocaleLowerCase().includes(termo)
    );
    const bateTexto =
      lote.id.toLocaleLowerCase().includes(termo) ||
      bateGuiasOuFaturas ||
      lote.operadora.toLocaleLowerCase().includes(termo) ||
      (lote.observacoes ?? '').toLocaleLowerCase().includes(termo) ||
      lote.descricao.toLocaleLowerCase().includes(termo) ||
      (lote.codigoEnvioOperadora ?? '').toLocaleLowerCase().includes(termo) ||
      (lote.tipoAtendimento ?? '').toLocaleLowerCase().includes(termo);
    const bateOperadora =
      filtroOperadora === 'Todas' || lote.operadora === filtroOperadora;
    const bateStatus = filtroStatus === 'Todos' || lote.status === filtroStatus;
    const batePrioridade =
      filtroPrioridade === 'Todas' || lote.prioridade === filtroPrioridade;

    return bateTexto && bateOperadora && bateStatus && batePrioridade;
  });

  const lotesNaFilaDeGlosas = demandas.filter((lote) => {
    const ehGlosaOuReenviado =
      lote.status === 'Glosado' ||
      lote.status === 'Reenviado' ||
      Boolean(lote.recurso);
    if (!ehGlosaOuReenviado) return false;
    if (filtroTipoGlosa !== 'Todos') {
      return (lote.recurso?.tipoGlosa || 'Administrativa') === filtroTipoGlosa;
    }
    return true;
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

  const qtdAbertosOuPendentes = demandas.filter(
    (l) => l.status === 'Aberto' || l.status === 'Pendente'
  ).length;
  const qtdFechados = demandas.filter((l) => l.status === 'Fechado').length;
  const qtdEnviadosEReenviados = demandas.filter(
    (l) => l.status === 'Enviado' || l.status === 'Reenviado'
  ).length;
  const qtdGlosados = demandas.filter((l) => l.status === 'Glosado').length;

  const nomesOperadoras = Array.from(
    new Set([
      ...operadoras.map((op) => op.nome),
      ...demandas.map((d) => d.operadora)
    ])
  );

  function construirOpcoesLote(lote: DemandaFinanceira): OpcaoActionMenu[] {
    const opcoes: OpcaoActionMenu[] = [
      {
        rotulo: 'Abrir Gestão do Lote (LOTE-nº), Guias (G-nº) e Faturas (FAT-nº)',
        icone: <Pencil size={14} />,
        aoClicar: () => aoSelecionarLote(lote)
      }
    ];

    if (
      lote.status === 'Fechado' ||
      lote.status === 'Enviado' ||
      lote.status === 'Glosado' ||
      lote.status === 'Reenviado'
    ) {
      opcoes.push({
        rotulo: 'Visualizar / Imprimir Faturas (FAT-nº PDF)',
        icone: <Printer size={14} />,
        aoClicar: () =>
          gerarEImprimirFaturasLotePDF({
            id: lote.id,
            operadora: lote.operadora,
            descricao: lote.descricao,
            tipoAtendimento: lote.tipoAtendimento,
            dataCriacao: lote.dataCriacao,
            guias: lote.guias,
            codigoEnvioOperadora: lote.codigoEnvioOperadora
          })
      });
    }

    if (lote.status === 'Aberto') {
      opcoes.push({
        rotulo: 'Faturar Guias (Gerar FAT-nº e Fechar)',
        icone: <Check size={14} />,
        aoClicar: () => {
          aoAlterarStatus(lote.id, 'Fechado');
          gerarEImprimirFaturasLotePDF({
            id: lote.id,
            operadora: lote.operadora,
            descricao: lote.descricao,
            tipoAtendimento: lote.tipoAtendimento,
            dataCriacao: lote.dataCriacao,
            guias: lote.guias
          });
        }
      });
      opcoes.push({
        rotulo: 'Marcar como Pendente',
        icone: <Clock size={14} />,
        aoClicar: () => aoAlterarStatus(lote.id, 'Pendente')
      });
    }

    if (lote.status === 'Pendente') {
      opcoes.push({
        rotulo: 'Abrir Lote (Mudar para Aberto)',
        icone: <FolderOpen size={14} />,
        aoClicar: () => aoAlterarStatus(lote.id, 'Aberto')
      });
      opcoes.push({
        rotulo: 'Faturar Guias (Gerar FAT-nº e Fechar)',
        icone: <Check size={14} />,
        aoClicar: () => {
          aoAlterarStatus(lote.id, 'Fechado');
          gerarEImprimirFaturasLotePDF({
            id: lote.id,
            operadora: lote.operadora,
            descricao: lote.descricao,
            tipoAtendimento: lote.tipoAtendimento,
            dataCriacao: lote.dataCriacao,
            guias: lote.guias
          });
        }
      });
    }

    if (lote.status === 'Fechado' && !lote.codigoEnvioOperadora) {
      opcoes.push({
        rotulo: 'Abrir Lote (Mudar para Aberto)',
        icone: <FolderOpen size={14} />,
        aoClicar: () => aoAlterarStatus(lote.id, 'Aberto')
      });
    }

    if (
      (lote.status === 'Fechado' && Boolean(lote.codigoEnvioOperadora)) ||
      lote.status === 'Enviado' ||
      lote.status === 'Reenviado'
    ) {
      opcoes.push({
        rotulo: 'Glosar Lote (Retorno da Operadora)',
        icone: <MessageSquareWarning size={14} />,
        destaque: 'recurso',
        aoClicar: () => {
          aoAlterarStatus(lote.id, 'Glosado');
          aoAbrirRecurso({ ...lote, status: 'Glosado' });
        }
      });
    }

    if (lote.status === 'Glosado') {
      opcoes.push({
        rotulo: 'Tratar Glosa / Justificativa',
        icone: <MessageSquareWarning size={14} />,
        destaque: 'recurso',
        aoClicar: () => aoAbrirRecurso(lote)
      });
      opcoes.push({
        rotulo: 'Reenviar Lote Pós-Glosa',
        icone: <RotateCcw size={14} />,
        aoClicar: () => aoAlterarStatus(lote.id, 'Reenviado')
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
            Gestão de Lotes (LOTE-nº), Faturas (FAT-nº) & Sistema de Glosas
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Cada lote usa a chave primária <strong>LOTE-nº</strong>. Ao fechar o
            lote, cada guia (<strong>G-nº</strong>) e senha de autorização recebe
            sua fatura única (<strong>FAT-nº</strong>).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn-realtime ${abaVisualizacao === 'todos' ? 'active' : ''}`}
            onClick={() => setAbaVisualizacao('todos')}
          >
            <Layers size={16} />
            <span>Catálogo Geral de Lotes ({demandas.length})</span>
          </button>

          <button
            type="button"
            className={`btn-realtime ${abaVisualizacao === 'glosas' ? 'active' : ''}`}
            onClick={() => setAbaVisualizacao('glosas')}
          >
            <AlertTriangle size={16} />
            <span>Sistema de Glosas ({lotesNaFilaDeGlosas.length})</span>
          </button>

          <button className="btn-primary" onClick={aoAbrirNovoLote}>
            <Plus size={18} />
            <span>Novo Lote (LOTE-nº)</span>
          </button>
        </div>
      </div>

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Abertos / Pendentes</span>
            <Layers size={20} color="#3b82f6" />
          </div>
          <div className="kpi-value">{qtdAbertosOuPendentes}</div>
          <div className="kpi-subtitle">Em inclusão de guias G-nº</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Fechados (Faturas FAT-nº Emitidas)</span>
            <Check size={20} color="#778873" />
          </div>
          <div className="kpi-value">{qtdFechados}</div>
          <div className="kpi-subtitle">Aguardando protocolo da operadora</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Enviados / Reenviados</span>
            <RotateCcw size={20} color="#4d6b53" />
          </div>
          <div className="kpi-value">{qtdEnviadosEReenviados}</div>
          <div className="kpi-subtitle">Enviados à operadora com protocolo</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Lotes Glosados (Em Tratamento)</span>
            <MessageSquareWarning size={20} color="#dc2626" />
          </div>
          <div className="kpi-value">{qtdGlosados}</div>
          <div className="kpi-subtitle">
            Fila de tratamento específico de glosas
          </div>
        </div>
      </section>

      {abaVisualizacao === 'glosas' ? (
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
                <MessageSquareWarning size={18} color="#dc2626" />
                <span>
                  Sistema de Glosas — Fila de Tratamento Específico (
                  {lotesNaFilaDeGlosas.length})
                </span>
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  marginTop: '0.2rem'
                }}
              >
                Lotes glosados ficam agrupados nesta fila para classificação do
                motivo da glosa, ajuste das guias/senhas e reenvio à operadora.
              </p>
            </div>

            <select
              className="filter-select"
              value={filtroTipoGlosa}
              onChange={(e) => setFiltroTipoGlosa(e.target.value)}
            >
              <option value="Todos">Tipo de Glosa: Todos</option>
              <option value="Administrativa">Administrativa</option>
              <option value="Técnica / Médica">Técnica / Médica</option>
              <option value="Divergência de Valor / Tabela TUSS">
                Divergência de Valor / Tabela TUSS
              </option>
              <option value="Elegibilidade / Carteirinha">
                Elegibilidade / Carteirinha
              </option>
              <option value="Ausência de Senha / Autorização">
                Ausência de Senha / Autorização
              </option>
            </select>
          </div>

          <div className="table-container">
            <table className="demandas-table">
              <thead>
                <tr>
                  <th>Cód. Lote (PK)</th>
                  <th>Operadora / Protocolo</th>
                  <th>Tipo de Glosa</th>
                  <th>Motivo da Glosa & Tratamento</th>
                  <th>Guias (G-nº) & Faturas (FAT-nº)</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações de Tratamento</th>
                </tr>
              </thead>
              <tbody>
                {lotesNaFilaDeGlosas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        padding: '2rem'
                      }}
                    >
                      Nenhum lote glosado pendente de tratamento para o filtro
                      selecionado.
                    </td>
                  </tr>
                ) : (
                  lotesNaFilaDeGlosas.map((lote) => (
                    <tr
                      key={lote.id}
                      className="clickable-row"
                      onClick={() => aoSelecionarLote(lote)}
                    >
                      <td style={{ fontWeight: 700, color: '#778873' }}>
                        {lote.id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{lote.operadora}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>
                          Envio: {lote.codigoEnvioOperadora || 'S/ protocolo'}
                        </small>
                      </td>
                      <td>
                        <span className="badge badge-glosado">
                          {lote.recurso?.tipoGlosa || 'Administrativa'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {lote.recurso?.motivo ||
                            'Glosa apontada no retorno da operadora.'}
                        </div>
                        {lote.recurso?.justificativaRecurso && (
                          <small
                            style={{
                              display: 'block',
                              color: '#4d6b53',
                              marginTop: '0.2rem',
                              fontWeight: 600
                            }}
                          >
                            Providência: {lote.recurso.justificativaRecurso}
                          </small>
                        )}
                      </td>
                      <td>
                        <div>{lote.guias.map((g) => g.id).join(', ')}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>
                          {lote.guias
                            .map((g) => g.faturaId)
                            .filter(Boolean)
                            .join(', ') || 'S/ fatura'}
                        </small>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {formatarMoeda(lote.valor)}
                      </td>
                      <td>
                        <span className={obterClasseBadge(lote.status)}>
                          {lote.status}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.4rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => aoAbrirRecurso(lote)}
                          >
                            <MessageSquareWarning size={13} />
                            <span>Tratar Glosa</span>
                          </button>

                          {lote.status === 'Glosado' && (
                            <button
                              type="button"
                              className="btn-action"
                              onClick={() =>
                                aoAlterarStatus(lote.id, 'Reenviado')
                              }
                              title="Marcar lote como Reenviado após correção"
                            >
                              <RotateCcw size={13} />
                              <span>Reenviar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
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
                <span>
                  Catálogo de Lotes de Operadoras ({lotesFiltrados.length})
                </span>
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  marginTop: '0.2rem'
                }}
              >
                Localize rapidamente por <strong>LOTE-nº</strong>,{' '}
                <strong>FAT-nº</strong>, <strong>G-nº</strong>,{' '}
                <strong>CONS-nº</strong>, <strong>PAC-nº</strong> ou senha de
                autorização.
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
                placeholder="Buscar por LOTE-nº, FAT-nº, G-nº, CONS-nº, PAC-nº, senha, protocolo ou operadora..."
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
                  <th>Cód. Lote (PK)</th>
                  <th>Operadora</th>
                  <th>Guias (G-nº), Faturas (FAT-nº) & Observações</th>
                  <th>Criação</th>
                  <th>Prioridade</th>
                  <th>Valor (Soma Guias)</th>
                  <th>Status</th>
                  <th>Última Alteração</th>
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
                  lotesPaginados.map((lote) => {
                    const faturasDoLote = Array.from(
                      new Set(
                        (lote.guias ?? [])
                          .map((g) => g.faturaId)
                          .filter(Boolean)
                      )
                    );
                    const guiasCodigos = (lote.guias ?? []).map((g) => g.id);

                    return (
                      <tr
                        key={lote.id}
                        className="clickable-row"
                        onClick={() => aoSelecionarLote(lote)}
                        title="Clique para abrir o modal com Dados, Guias (G-nº), Faturas (FAT-nº) e Histórico do lote"
                      >
                        <td style={{ fontWeight: 700, color: '#778873' }}>
                          {lote.id}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{lote.operadora}</div>
                          {lote.codigoEnvioOperadora && (
                            <small
                              style={{ color: '#4d6b53', fontWeight: 600 }}
                            >
                              Cód. Envio: {lote.codigoEnvioOperadora}
                            </small>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          <div
                            style={{
                              fontWeight: 500,
                              color: 'var(--text-primary)'
                            }}
                          >
                            {lote.tipoAtendimento ?? 'SADT / Exames'} • Guias:{' '}
                            <strong>{guiasCodigos.join(', ') || '0'}</strong>
                          </div>
                          {faturasDoLote.length > 0 && (
                            <small
                              style={{
                                display: 'block',
                                color: '#4d6b53',
                                fontWeight: 700,
                                fontSize: '0.76rem'
                              }}
                            >
                              Fatura(s) Emitida(s): {faturasDoLote.join(', ')}
                            </small>
                          )}
                          <small className="obs-preview">
                            {lote.observacoes || 'Sem observações adicionais'}
                          </small>
                          {lote.recurso && (
                            <span
                              className="recurso-tag"
                              title={lote.recurso.motivo}
                            >
                              Glosa ({lote.recurso.tipoGlosa || 'Recurso'}):{' '}
                              {lote.recurso.motivo}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.84rem' }}>
                          {formatarDataBR(lote.dataCriacao)}
                          {lote.horaCriacao ? ` às ${lote.horaCriacao}` : ''}
                        </td>
                        <td>
                          <span
                            className={obterClassePrioridade(lote.prioridade)}
                          >
                            {lote.prioridade}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {formatarMoeda(lote.valor)}
                        </td>
                        <td>
                          <span className={obterClasseBadge(lote.status)}>
                            {lote.status}
                          </span>
                        </td>
                        <td
                          style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.84rem'
                          }}
                        >
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
                    );
                  })
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
      )}
    </main>
  );
}
