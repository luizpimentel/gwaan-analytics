import { useState, type FormEvent } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  DollarSign,
  CheckCircle2,
  Clock,
  Pencil,
  X,
  Check,
  Layers,
  Archive,
  FileText,
  Lock,
  Eye
} from 'lucide-react';
import type {
  Atendimento,
  FormaPagamentoParticular,
  GuiaParticular,
  LoteParticular,
  PrioridadeDemanda,
  StatusLoteParticular,
  StatusParticular,
  TipoGuiaParticular
} from '../data/dadosFaturamento';
import {
  formatarDataBR,
  formatarMoeda,
  formatarUltimaAtualizacao,
  obterClasseBadgeLoteParticular,
  obterClasseBadgeParticular,
  obterClassePrioridade
} from '../utils/formatadores';
import { Pagination } from '../components/Pagination';
import { ActionMenu, type OpcaoActionMenu } from '../components/ActionMenu';
import {
  ExpandableFilterPanel,
  ExpandableFilterToggle
} from '../components/ExpandableFilterBar';

interface ParticularesPageProps {
  atendimentos: Atendimento[];
  guiasParticulares: GuiaParticular[];
  lotesParticularesArquivados: LoteParticular[];
  aoSalvarGuiaParticular: (
    dados: Omit<GuiaParticular, 'id' | 'atualizadoEm'> & { id?: string }
  ) => void;
  aoAlterarStatusGuiaParticular: (id: string, novoStatus: StatusParticular) => void;
  aoExcluirGuiaParticular: (id: string) => void;
  aoSalvarLoteParticular: (dados: {
    id?: string;
    descricao: string;
    prioridade: PrioridadeDemanda;
    guiasIds: string[];
    status: StatusLoteParticular;
    observacoes: string;
  }) => void;
  aoExcluirLoteParticularArquivado: (id: string) => void;
}

const ITENS_POR_PAGINA_PARTICULARES = 10;

const TIPOS_GUIA_PARTICULAR: TipoGuiaParticular[] = [
  'Guia Principal',
  'Retorno',
  'Complementação',
  'Prorrogação',
  'Nova Guia'
];

export function ParticularesPage({
  atendimentos,
  guiasParticulares,
  lotesParticularesArquivados,
  aoSalvarGuiaParticular,
  aoAlterarStatusGuiaParticular,
  aoExcluirGuiaParticular,
  aoSalvarLoteParticular,
  aoExcluirLoteParticularArquivado
}: ParticularesPageProps) {
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(false);
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [filtroPagamento, setFiltroPagamento] = useState<string>('Todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('Todas');
  const [paginaAtual, setPaginaAtual] = useState<number>(1);

  const [modalGuiaAberto, setModalGuiaAberto] = useState<boolean>(false);
  const [guiaEditando, setGuiaEditando] = useState<GuiaParticular | null>(null);
  const [atendimentoIdSelecionado, setAtendimentoIdSelecionado] =
    useState<string>('');
  const [tipoGuia, setTipoGuia] =
    useState<TipoGuiaParticular>('Guia Principal');
  const [paciente, setPaciente] = useState<string>('');
  const [medicoNome, setMedicoNome] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [dataGuia, setDataGuia] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [nf, setNf] = useState<string>('');
  const [valorBruto, setValorBruto] = useState<string>('');
  const [desconto, setDesconto] = useState<string>('0');
  const [status, setStatus] = useState<StatusParticular>('Não pago');
  const [prioridade, setPrioridade] = useState<PrioridadeDemanda>('Média');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoParticular>('PIX');
  const [observacoes, setObservacoes] = useState<string>('');

  const [modalLoteAberto, setModalLoteAberto] = useState<boolean>(false);
  const [loteDetalheSelecionado, setLoteDetalheSelecionado] =
    useState<LoteParticular | null>(null);
  const [descricaoLote, setDescricaoLote] = useState<string>('');
  const [prioridadeLote, setPrioridadeLote] = useState<PrioridadeDemanda>('Média');
  const [statusLote, setStatusLote] = useState<StatusLoteParticular>('Aberto');
  const [guiasSelecionadasParaLote, setGuiasSelecionadasParaLote] = useState<string[]>(
    []
  );
  const [obsLote, setObsLote] = useState<string>('');

  const qtdFiltrosAtivos =
    (buscaTexto.trim() ? 1 : 0) +
    (filtroStatus !== 'Todos' ? 1 : 0) +
    (filtroPagamento !== 'Todos' ? 1 : 0) +
    (filtroPrioridade !== 'Todas' ? 1 : 0);

  function limparFiltros() {
    setBuscaTexto('');
    setFiltroStatus('Todos');
    setFiltroPagamento('Todos');
    setFiltroPrioridade('Todas');
    setPaginaAtual(1);
  }

  function preencherDadosAPartirDeAtendimento(idAtd: string, tipo: TipoGuiaParticular) {
    const atd = atendimentos.find((a) => a.id === idAtd);
    if (!atd) return;
    setAtendimentoIdSelecionado(atd.id);
    setPaciente(atd.pacienteNome);
    setMedicoNome(atd.medicoNome);
    setDataGuia(atd.data);
    const prefixoTipo = tipo !== 'Guia Principal' ? `[${tipo}] ` : '';
    setDescricao(`${prefixoTipo}${atd.descricao}`);
    setValorBruto(String(atd.valor));
    setDesconto(String(atd.desconto ?? 0));
  }

  function abrirModalNovaGuia() {
    if (atendimentos.length === 0) {
      alert('Cadastre um atendimento antes de gerar uma guia particular!');
      return;
    }
    const atdPadrao =
      atendimentos.find((a) => a.operadora === 'Particular') ?? atendimentos[0];

    const qtdGuiasExistentes = guiasParticulares.filter(
      (g) => g.atendimentoId === atdPadrao.id
    ).length;
    const tipoInicial: TipoGuiaParticular =
      qtdGuiasExistentes > 0 ? 'Complementação' : 'Guia Principal';

    setGuiaEditando(null);
    setTipoGuia(tipoInicial);
    preencherDadosAPartirDeAtendimento(atdPadrao.id, tipoInicial);
    setNf('');
    setStatus('Não pago');
    setPrioridade('Média');
    setFormaPagamento('PIX');
    setObservacoes('');
    setModalGuiaAberto(true);
  }

  function abrirModalEditarGuia(guia: GuiaParticular) {
    setGuiaEditando(guia);
    setAtendimentoIdSelecionado(guia.atendimentoId || (atendimentos[0]?.id ?? ''));
    setTipoGuia(guia.tipoGuia || 'Guia Principal');
    setPaciente(guia.paciente);
    setMedicoNome(guia.medicoNome ?? '');
    setDescricao(guia.descricao);
    setDataGuia(guia.data);
    setNf(guia.nf);
    setValorBruto(String(guia.valorBruto));
    setDesconto(String(guia.desconto ?? 0));
    setStatus(guia.status);
    setPrioridade(guia.prioridade);
    setFormaPagamento(guia.formaPagamento);
    setObservacoes(guia.observacoes ?? '');
    setModalGuiaAberto(true);
  }

  function abrirModalNovoLote() {
    setLoteDetalheSelecionado(null);
    setDescricaoLote(
      `Lote Contábil Particular — ${new Date().toLocaleDateString('pt-BR')}`
    );
    setPrioridadeLote('Média');
    setStatusLote('Aberto');
    const apenasPagasDisponiveis = guiasParticulares
      .filter((g) => g.status === 'Pago' && !g.loteId)
      .map((g) => g.id);
    setGuiasSelecionadasParaLote(apenasPagasDisponiveis);
    setObsLote('');
    setModalLoteAberto(true);
  }

  function abrirModalInspecionarLote(lote: LoteParticular) {
    setLoteDetalheSelecionado(lote);
    setDescricaoLote(lote.descricao);
    setPrioridadeLote(lote.prioridade);
    setStatusLote(lote.status);
    setGuiasSelecionadasParaLote(lote.guiasIds);
    setObsLote(lote.observacoes ?? '');
    setModalLoteAberto(true);
  }

  function alternarSelecaoGuiaNoLote(idGuia: string) {
    if (loteDetalheSelecionado?.status === 'Fechado') return;
    if (
      loteDetalheSelecionado &&
      loteDetalheSelecionado.guiasIds.includes(idGuia)
    ) {
      return;
    }
    setGuiasSelecionadasParaLote((ant) =>
      ant.includes(idGuia) ? ant.filter((i) => i !== idGuia) : [...ant, idGuia]
    );
  }

  const guiaEstaFechada = guiaEditando?.status === 'Fechado';

  function submeterFormularioGuia(evento: FormEvent) {
    evento.preventDefault();
    if (guiaEstaFechada) {
      setModalGuiaAberto(false);
      return;
    }

    if (!atendimentoIdSelecionado) {
      alert(
        'Uma guia particular deve obrigatoriamente estar vinculada a um atendimento existente!'
      );
      return;
    }

    const brutoNum = parseFloat(valorBruto);
    const descNum = Math.max(0, parseFloat(desconto) || 0);

    if (!paciente.trim() || !descricao.trim() || isNaN(brutoNum) || brutoNum <= 0) {
      alert('Preencha o atendimento, descrição e um valor bruto válido!');
      return;
    }

    const liquido = Math.max(0, brutoNum - descNum);
    const statusPermitido: StatusParticular =
      status === 'Fechado' ? 'Pago' : status;

    aoSalvarGuiaParticular({
      id: guiaEditando?.id,
      atendimentoId: atendimentoIdSelecionado,
      tipoGuia,
      paciente: paciente.trim(),
      medicoNome: medicoNome.trim() || undefined,
      descricao: descricao.trim(),
      data: dataGuia,
      nf: nf.trim() || 'Pendente emissão',
      valorBruto: brutoNum,
      desconto: descNum,
      valor: liquido,
      status: statusPermitido,
      prioridade,
      formaPagamento,
      loteId: guiaEditando?.loteId,
      observacoes: observacoes.trim()
    });

    setModalGuiaAberto(false);
    setGuiaEditando(null);
  }

  function submeterFormularioLote(evento: FormEvent) {
    evento.preventDefault();
    if (loteDetalheSelecionado?.status === 'Fechado') {
      setModalLoteAberto(false);
      return;
    }

    if (!descricaoLote.trim() || guiasSelecionadasParaLote.length === 0) {
      alert(
        'Informe uma descrição e selecione ao menos 1 guia particular com status Pago para alocar no lote!'
      );
      return;
    }

    aoSalvarLoteParticular({
      id: loteDetalheSelecionado?.id,
      descricao: descricaoLote.trim(),
      prioridade: prioridadeLote,
      guiasIds: guiasSelecionadasParaLote,
      status: statusLote,
      observacoes: obsLote.trim()
    });

    setModalLoteAberto(false);
  }

  const filtrados = guiasParticulares.filter((item) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const bateTexto =
      item.id.toLocaleLowerCase().includes(termo) ||
      (item.atendimentoId || '').toLocaleLowerCase().includes(termo) ||
      item.paciente.toLocaleLowerCase().includes(termo) ||
      item.descricao.toLocaleLowerCase().includes(termo) ||
      item.nf.toLocaleLowerCase().includes(termo);
    const bateStatus = filtroStatus === 'Todos' || item.status === filtroStatus;
    const batePagamento =
      filtroPagamento === 'Todos' || item.formaPagamento === filtroPagamento;
    const batePrioridade =
      filtroPrioridade === 'Todas' || item.prioridade === filtroPrioridade;

    return bateTexto && bateStatus && batePagamento && batePrioridade;
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(filtrados.length / ITENS_POR_PAGINA_PARTICULARES)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const paginados = filtrados.slice(
    (paginaSegura - 1) * ITENS_POR_PAGINA_PARTICULARES,
    paginaSegura * ITENS_POR_PAGINA_PARTICULARES
  );

  const volumeTotal = guiasParticulares.reduce((acc, i) => acc + i.valor, 0);
  const totalPago = guiasParticulares
    .filter((i) => i.status === 'Pago')
    .reduce((acc, i) => acc + i.valor, 0);
  const totalNaoPago = guiasParticulares
    .filter((i) => i.status === 'Não pago')
    .reduce((acc, i) => acc + i.valor, 0);
  const totalFechado = guiasParticulares
    .filter((i) => i.status === 'Fechado')
    .reduce((acc, i) => acc + i.valor, 0);

  const brutoPreview = parseFloat(valorBruto) || 0;
  const descPreview = Math.max(0, parseFloat(desconto) || 0);
  const liquidoPreview = Math.max(0, brutoPreview - descPreview);

  const somaGuiasSelecionadasLote = guiasParticulares
    .filter((g) => guiasSelecionadasParaLote.includes(g.id))
    .reduce((acc, g) => acc + g.valor, 0);

  const guiasCandidatasAoLote = guiasParticulares.filter((g) => {
    if (loteDetalheSelecionado) {
      return (
        loteDetalheSelecionado.guiasIds.includes(g.id) ||
        (loteDetalheSelecionado.status === 'Aberto' &&
          g.status === 'Pago' &&
          !g.loteId)
      );
    }
    return g.status === 'Pago' && !g.loteId;
  });

  function construirOpcoesParticular(item: GuiaParticular): OpcaoActionMenu[] {
    if (item.status === 'Fechado') {
      return [
        {
          rotulo: 'Visualizar Guia (Fechada)',
          icone: <Eye size={14} />,
          aoClicar: () => abrirModalEditarGuia(item)
        }
      ];
    }

    const opcoes: OpcaoActionMenu[] = [
      {
        rotulo: 'Editar Guia Particular',
        icone: <Pencil size={14} />,
        aoClicar: () => abrirModalEditarGuia(item)
      }
    ];

    if (item.status !== 'Pago') {
      opcoes.push({
        rotulo: 'Marcar como Pago',
        icone: <Check size={14} />,
        aoClicar: () => aoAlterarStatusGuiaParticular(item.id, 'Pago')
      });
    }

    if (item.status !== 'Não pago') {
      opcoes.push({
        rotulo: 'Marcar como Não pago',
        icone: <Clock size={14} />,
        aoClicar: () => aoAlterarStatusGuiaParticular(item.id, 'Não pago')
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
            Guias e Lotes de Atendimentos Particulares
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Vincule guias particulares a atendimentos existentes. Utilize{' '}
            <strong>+ Lote</strong> para alocar guias com status <strong>Pago</strong>{' '}
            (que mudam automaticamente para <strong>Fechado</strong>).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={abrirModalNovaGuia}>
            <Plus size={18} />
            <span>Guia Particular</span>
          </button>

          <button className="btn-primary" onClick={abrirModalNovoLote}>
            <Plus size={18} />
            <span>Lote</span>
          </button>
        </div>
      </div>

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Volume Líquido Particular</span>
            <DollarSign size={20} color="#778873" />
          </div>
          <div className="kpi-value">{formatarMoeda(volumeTotal)}</div>
          <div className="kpi-subtitle">
            {guiasParticulares.length} guias de atendimento particular
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Pago (Apto para + Lote)</span>
            <CheckCircle2 size={20} color="#778873" />
          </div>
          <div className="kpi-value">{formatarMoeda(totalPago)}</div>
          <div className="kpi-subtitle">Guias quitadas prontas para lote</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Não Pago</span>
            <Clock size={20} color="#d97706" />
          </div>
          <div className="kpi-value">{formatarMoeda(totalNaoPago)}</div>
          <div className="kpi-subtitle">Aguardando pagamento / NF</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Fechado (Alocadas em Lote)</span>
            <Archive size={20} color="#4d6b53" />
          </div>
          <div className="kpi-value">{formatarMoeda(totalFechado)}</div>
          <div className="kpi-subtitle">
            {lotesParticularesArquivados.length} lote(s) de guias particulares
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
              <UserCheck size={18} color="#778873" />
              <span>Guias de Atendimentos Particulares ({filtrados.length})</span>
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginTop: '0.2rem'
              }}
            >
              Guias com status Fechado foram alocadas em lote e são protegidas contra
              edição.
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
              placeholder="Buscar código, atendimento, paciente, NF ou procedimento..."
              value={buscaTexto}
              onChange={(e) => {
                setBuscaTexto(e.target.value);
                setPaginaAtual(1);
              }}
            />
          </div>

          <select
            className="filter-select"
            value={filtroPagamento}
            onChange={(e) => {
              setFiltroPagamento(e.target.value);
              setPaginaAtual(1);
            }}
          >
            <option value="Todos">Pagamento: Todos</option>
            <option value="PIX">PIX</option>
            <option value="Cartão">Cartão</option>
            <option value="Boleto">Boleto</option>
            <option value="Transferência">Transferência</option>
            <option value="Dinheiro">Dinheiro</option>
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
            <option value="Pago">Pago</option>
            <option value="Não pago">Não pago</option>
            <option value="Fechado">Fechado (Em Lote)</option>
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
                <th>Atendimento</th>
                <th>Paciente</th>
                <th>Procedimento / Guia</th>
                <th>NF (Nota Fiscal)</th>
                <th>Pagamento</th>
                <th>Prioridade</th>
                <th>Desconto</th>
                <th>Valor Líquido</th>
                <th>Status</th>
                <th>Atualização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginados.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      padding: '2rem'
                    }}
                  >
                    Nenhuma guia particular encontrada para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginados.map((item) => (
                  <tr
                    key={item.id}
                    className="clickable-row"
                    onClick={() => abrirModalEditarGuia(item)}
                    title={
                      item.status === 'Fechado'
                        ? 'Guia Fechada em lote (Somente visualização)'
                        : 'Clique para editar a guia de atendimento particular'
                    }
                  >
                    <td style={{ fontWeight: 700, color: '#778873' }}>{item.id}</td>
                    <td>
                      <span className="badge badge-faturado">
                        {item.atendimentoId || 'ATD-VINC'}
                      </span>
                      {item.tipoGuia && (
                        <div
                          style={{
                            fontSize: '0.73rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.15rem'
                          }}
                        >
                          {item.tipoGuia}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.paciente}</div>
                      {item.medicoNome && (
                        <small style={{ color: 'var(--text-secondary)' }}>
                          {item.medicoNome}
                        </small>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {item.descricao}
                      </div>
                      <small className="obs-preview">
                        Data: {formatarDataBR(item.data)}
                        {item.loteId ? ` • Lote ${item.loteId}` : ''}
                      </small>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.84rem',
                          fontWeight: 600
                        }}
                      >
                        {item.nf || '-'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-faturar">{item.formaPagamento}</span>
                    </td>
                    <td>
                      <span className={obterClassePrioridade(item.prioridade)}>
                        {item.prioridade}
                      </span>
                    </td>
                    <td
                      style={{
                        color: item.desconto > 0 ? '#d97706' : 'var(--text-secondary)'
                      }}
                    >
                      {item.desconto > 0
                        ? `Desc: ${formatarMoeda(item.desconto)}`
                        : 'Sem desc.'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{formatarMoeda(item.valor)}</div>
                      {item.desconto > 0 && (
                        <small
                          style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}
                        >
                          Bruto: {formatarMoeda(item.valorBruto)}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className={obterClasseBadgeParticular(item.status)}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {formatarUltimaAtualizacao(item.atualizadoEm)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        opcoes={construirOpcoesParticular(item)}
                        aoExcluir={() => aoExcluirGuiaParticular(item.id)}
                        tituloExcluir="Excluir Guia Particular"
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
          totalItens={filtrados.length}
          itensPorPagina={ITENS_POR_PAGINA_PARTICULARES}
          aoMudarPagina={setPaginaAtual}
        />
      </section>

      <section className="demandas-section">
        <div className="filters-bar">
          <div>
            <h2
              style={{
                fontSize: '1.15rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Layers size={18} color="#778873" />
              <span>
                Lotes de Guias Particulares ({lotesParticularesArquivados.length})
              </span>
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.84rem',
                marginTop: '0.2rem'
              }}
            >
              Status de lotes particulares: <strong>Aberto</strong> (permite alocar mais
              guias pagas) e <strong>Fechado</strong> (lote fechado para contabilidade).
            </p>
          </div>
        </div>

        <div className="table-container">
          <table className="demandas-table">
            <thead>
              <tr>
                <th>Código Lote</th>
                <th>Descrição do Lote</th>
                <th>Data Criação</th>
                <th>Qtd. Guias</th>
                <th>Prioridade</th>
                <th>Valor Total</th>
                <th>Status do Lote</th>
                <th>Atualização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lotesParticularesArquivados.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      padding: '1.75rem'
                    }}
                  >
                    Nenhum lote particular cadastrado. Use o botão "+ Lote" no topo para
                    alocar guias pagas.
                  </td>
                </tr>
              ) : (
                lotesParticularesArquivados.map((lote) => (
                  <tr
                    key={lote.id}
                    className="clickable-row"
                    onClick={() => abrirModalInspecionarLote(lote)}
                  >
                    <td style={{ fontWeight: 700, color: '#778873' }}>{lote.id}</td>
                    <td style={{ fontWeight: 600 }}>
                      <div>{lote.descricao}</div>
                      {lote.observacoes && (
                        <small className="obs-preview">{lote.observacoes}</small>
                      )}
                    </td>
                    <td>{formatarDataBR(lote.dataCriacao)}</td>
                    <td>{lote.guiasIds.length} guia(s)</td>
                    <td>
                      <span className={obterClassePrioridade(lote.prioridade)}>
                        {lote.prioridade}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatarMoeda(lote.valorTotal)}</td>
                    <td>
                      <span className={obterClasseBadgeLoteParticular(lote.status)}>
                        {lote.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {formatarUltimaAtualizacao(lote.dataFechamento)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        opcoes={[
                          {
                            rotulo:
                              lote.status === 'Aberto'
                                ? 'Gerenciar / Alocar Guias Pagas'
                                : 'Ver Guias do Lote Fechado',
                            icone: <FileText size={14} />,
                            aoClicar: () => abrirModalInspecionarLote(lote)
                          }
                        ]}
                        aoExcluir={() => aoExcluirLoteParticularArquivado(lote.id)}
                        tituloExcluir="Excluir Lote Particular"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalGuiaAberto && (
        <div className="modal-overlay" onClick={() => setModalGuiaAberto(false)}>
          <div
            className="modal-content modal-content-80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>
                  {guiaEditando
                    ? guiaEstaFechada
                      ? `Visualizar Guia Particular Fechada (${guiaEditando.id})`
                      : `Editar Guia Particular (${guiaEditando.id})`
                    : 'Registrar Nova Guia de Atendimento Particular'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Toda guia particular é vinculada a um atendimento existente (podendo
                  haver mais de uma guia por atendimento: retorno, complementação,
                  prorrogação ou nova guia).
                </p>
              </div>
              <button
                type="button"
                className="btn-realtime"
                onClick={() => setModalGuiaAberto(false)}
                style={{ padding: '0.3rem 0.5rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {guiaEstaFechada && (
              <div className="alert-box alert-enviado">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 600
                  }}
                >
                  <Lock size={16} />
                  <span>
                    Guia Particular com Status Fechado — Edição Bloqueada
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', marginTop: '0.2rem' }}>
                  Esta guia foi alocada no lote{' '}
                  <strong>{guiaEditando?.loteId || 'Particular'}</strong> pelo botão{' '}
                  <strong>+ Lote</strong> e encontra-se com status{' '}
                  <strong>Fechado</strong>, não podendo ser editada.
                </p>
              </div>
            )}

            <form
              onSubmit={submeterFormularioGuia}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}
            >
              <div className="lote-summary-strip">
                <div>
                  <span className="strip-label">Atendimento Vinculado</span>
                  <strong style={{ color: '#778873' }}>
                    {atendimentoIdSelecionado || '-'}
                  </strong>
                </div>
                <div>
                  <span className="strip-label">Valor Bruto</span>
                  <strong>{formatarMoeda(brutoPreview)}</strong>
                </div>
                <div>
                  <span className="strip-label">Desconto</span>
                  <strong style={{ color: '#d97706' }}>
                    Desc: {formatarMoeda(descPreview)}
                  </strong>
                </div>
                <div>
                  <span className="strip-label">Valor Líquido Final</span>
                  <strong style={{ color: 'var(--accent-color)' }}>
                    {formatarMoeda(liquidoPreview)}
                  </strong>
                </div>
                <div>
                  <span className="strip-label">Status</span>
                  <span className={obterClasseBadgeParticular(status)}>{status}</span>
                </div>
              </div>

              <div className="guias-lote-box">
                <strong>Vínculo Obrigatório com Atendimento Existente</strong>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: '0.75rem'
                  }}
                >
                  <div className="form-group">
                    <label>Selecionar Atendimento Existente</label>
                    <select
                      className="form-input"
                      value={atendimentoIdSelecionado}
                      onChange={(e) =>
                        preencherDadosAPartirDeAtendimento(e.target.value, tipoGuia)
                      }
                      disabled={guiaEstaFechada}
                      required
                    >
                      {atendimentos.map((atd) => {
                        const qtdGuiasDoAtd = guiasParticulares.filter(
                          (g) => g.atendimentoId === atd.id
                        ).length;
                        return (
                          <option key={atd.id} value={atd.id}>
                            {atd.id} — {atd.pacienteNome} ({atd.medicoNome}) •{' '}
                            {formatarDataBR(atd.data)} • {qtdGuiasDoAtd} guia(s)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Finalidade / Tipo da Guia no Atendimento</label>
                    <select
                      className="form-input"
                      value={tipoGuia}
                      onChange={(e) => {
                        const novoTipo = e.target.value as TipoGuiaParticular;
                        setTipoGuia(novoTipo);
                        if (!guiaEditando && atendimentoIdSelecionado) {
                          preencherDadosAPartirDeAtendimento(
                            atendimentoIdSelecionado,
                            novoTipo
                          );
                        }
                      }}
                      disabled={guiaEstaFechada}
                    >
                      {TIPOS_GUIA_PARTICULAR.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.3fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Paciente do Atendimento</label>
                  <input
                    type="text"
                    className="form-input"
                    value={paciente}
                    onChange={(e) => setPaciente(e.target.value)}
                    disabled
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Médico Responsável</label>
                  <input
                    type="text"
                    className="form-input"
                    value={medicoNome}
                    onChange={(e) => setMedicoNome(e.target.value)}
                    disabled
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descrição do Atendimento / Procedimento na Guia</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Check-up Cardiológico Executivo"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={guiaEstaFechada}
                  required
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Nota Fiscal (NF)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: NF-e 004890"
                    value={nf}
                    onChange={(e) => setNf(e.target.value)}
                    disabled={guiaEstaFechada}
                  />
                </div>

                <div className="form-group">
                  <label>Data da Guia</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dataGuia}
                    onChange={(e) => setDataGuia(e.target.value)}
                    disabled={guiaEstaFechada}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Forma de Pagamento</label>
                  <select
                    className="form-input"
                    value={formaPagamento}
                    onChange={(e) =>
                      setFormaPagamento(e.target.value as FormaPagamentoParticular)
                    }
                    disabled={guiaEstaFechada}
                  >
                    <option value="PIX">PIX</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Valor Bruto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-input"
                    placeholder="0.00"
                    value={valorBruto}
                    onChange={(e) => setValorBruto(e.target.value)}
                    disabled={guiaEstaFechada}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Desconto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    value={desconto}
                    onChange={(e) => setDesconto(e.target.value)}
                    disabled={guiaEstaFechada}
                  />
                </div>

                <div className="form-group">
                  <label>Status da Guia Particular</label>
                  <select
                    className="form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusParticular)}
                    disabled={guiaEstaFechada}
                  >
                    <option value="Pago">Pago</option>
                    <option value="Não pago">Não pago</option>
                    {guiaEstaFechada && (
                      <option value="Fechado">Fechado (Alocada via + Lote)</option>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Prioridade</label>
                  <select
                    className="form-input"
                    value={prioridade}
                    onChange={(e) =>
                      setPrioridade(e.target.value as PrioridadeDemanda)
                    }
                    disabled={guiaEstaFechada}
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Observações</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Detalhes de recibo, NF ou parcelamento..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  disabled={guiaEstaFechada}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-realtime"
                  onClick={() => setModalGuiaAberto(false)}
                >
                  {guiaEstaFechada ? 'Fechar Visualização' : 'Cancelar'}
                </button>
                {!guiaEstaFechada && (
                  <button type="submit" className="btn-primary">
                    <Check size={16} />
                    <span>
                      {guiaEditando ? 'Salvar Alterações' : 'Salvar Guia Particular'}
                    </span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {modalLoteAberto && (
        <div className="modal-overlay" onClick={() => setModalLoteAberto(false)}>
          <div
            className="modal-content modal-content-80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>
                  {loteDetalheSelecionado
                    ? `Gerenciar Lote de Guias Particulares (${loteDetalheSelecionado.id})`
                    : 'Alocar Guias Pagas em Lote Particular (+ Lote)'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Somente guias com status <strong>Pago</strong> podem ser colocadas no
                  lote, passando automaticamente para o status <strong>Fechado</strong>{' '}
                  na guia.
                </p>
              </div>
              <button
                type="button"
                className="btn-realtime"
                onClick={() => setModalLoteAberto(false)}
                style={{ padding: '0.3rem 0.5rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {loteDetalheSelecionado?.status === 'Fechado' && (
              <div className="alert-box alert-enviado">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 600
                  }}
                >
                  <Lock size={16} />
                  <span>Lote Fechado para Contabilidade</span>
                </div>
                <p style={{ fontSize: '0.84rem', marginTop: '0.2rem' }}>
                  Este lote encontra-se com status <strong>Fechado</strong> para a
                  contabilidade e não recebe novas alocações.
                </p>
              </div>
            )}

            <form
              onSubmit={submeterFormularioLote}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div className="lote-summary-strip">
                <div>
                  <span className="strip-label">Guias no Lote</span>
                  <strong>{guiasSelecionadasParaLote.length} guia(s)</strong>
                </div>
                <div>
                  <span className="strip-label">Status Automático nas Guias</span>
                  <span className="badge badge-faturado">Fechado</span>
                </div>
                <div>
                  <span className="strip-label">Status do Lote</span>
                  <span className={obterClasseBadgeLoteParticular(statusLote)}>
                    {statusLote}
                  </span>
                </div>
                <div>
                  <span className="strip-label">Soma das Guias no Lote</span>
                  <strong style={{ color: 'var(--accent-color)', fontSize: '1.05rem' }}>
                    {formatarMoeda(somaGuiasSelecionadasLote)}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.8fr 1fr 1.2fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Descrição do Lote Particular</label>
                  <input
                    type="text"
                    className="form-input"
                    value={descricaoLote}
                    onChange={(e) => setDescricaoLote(e.target.value)}
                    disabled={loteDetalheSelecionado?.status === 'Fechado'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Prioridade</label>
                  <select
                    className="form-input"
                    value={prioridadeLote}
                    onChange={(e) =>
                      setPrioridadeLote(e.target.value as PrioridadeDemanda)
                    }
                    disabled={loteDetalheSelecionado?.status === 'Fechado'}
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status do Lote Particular</label>
                  <select
                    className="form-input"
                    value={statusLote}
                    onChange={(e) =>
                      setStatusLote(e.target.value as StatusLoteParticular)
                    }
                    disabled={loteDetalheSelecionado?.status === 'Fechado'}
                  >
                    <option value="Aberto">
                      Aberto (Permite alocar mais guias pagas)
                    </option>
                    <option value="Fechado">
                      Fechado (Lote fechado para contabilidade)
                    </option>
                  </select>
                </div>
              </div>

              <div className="guias-lote-box">
                <strong>
                  {loteDetalheSelecionado?.status === 'Fechado'
                    ? 'Guias Alocadas neste Lote Contábil'
                    : 'Guias Pagas Disponíveis e Alocadas neste Lote (Somente Guias Pagas)'}
                </strong>

                {guiasCandidatasAoLote.length === 0 ? (
                  <p
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Não há guias particulares com status "Pago" disponíveis para alocação
                    no momento.
                  </p>
                ) : (
                  <div className="guias-lote-list">
                    {guiasCandidatasAoLote.map((g) => {
                      const marcada = guiasSelecionadasParaLote.includes(g.id);
                      const jaEstavaNoLote =
                        loteDetalheSelecionado?.guiasIds.includes(g.id) ?? false;
                      const desabilitarCheckbox =
                        loteDetalheSelecionado?.status === 'Fechado' || jaEstavaNoLote;

                      return (
                        <label
                          key={g.id}
                          className="guia-lote-item"
                          style={{
                            cursor: desabilitarCheckbox ? 'default' : 'pointer'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={marcada}
                              disabled={desabilitarCheckbox}
                              onChange={() => alternarSelecaoGuiaNoLote(g.id)}
                            />
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                <span
                                  style={{
                                    color: '#778873',
                                    marginRight: '0.35rem'
                                  }}
                                >
                                  {g.id}
                                </span>
                                {g.paciente} — {g.descricao}
                              </div>
                              <small style={{ color: 'var(--text-secondary)' }}>
                                Atendimento: {g.atendimentoId || 'ATD'} • NF: {g.nf} •
                                Pagamento: {g.formaPagamento} • Status na guia:{' '}
                                <strong>{marcada ? 'Fechado (No Lote)' : g.status}</strong>
                              </small>
                            </div>
                          </div>
                          <strong>{formatarMoeda(g.valor)}</strong>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Observações Contábeis do Lote</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={obsLote}
                  onChange={(e) => setObsLote(e.target.value)}
                  disabled={loteDetalheSelecionado?.status === 'Fechado'}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-realtime"
                  onClick={() => setModalLoteAberto(false)}
                >
                  Fechar
                </button>
                {loteDetalheSelecionado?.status !== 'Fechado' && (
                  <button type="submit" className="btn-primary">
                    <Archive size={16} />
                    <span>
                      {loteDetalheSelecionado
                        ? 'Salvar Lote Particular'
                        : 'Confirmar Alocação no Lote (+ Lote)'}
                    </span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
