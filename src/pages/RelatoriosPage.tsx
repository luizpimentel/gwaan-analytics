import { useState, type FormEvent } from 'react';
import {
  Download,
  FileBarChart2,
  TrendingUp,
  Building2,
  PieChart as PieChartIcon,
  BarChart3,
  MessageSquareWarning,
  CheckCircle2,
  CalendarCheck,
  Stethoscope,
  Users,
  Search,
  Target,
  ShieldCheck,
  Save,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  ehProfissionalMedico,
  type Atendimento,
  type DemandaFinanceira,
  type GuiaParticular,
  type Operadora,
  type Paciente,
  type PrioridadeDemanda,
  type Profissional,
  type RegrasGestao,
  type StatusFaturamento
} from '../data/dadosFaturamento';
import {
  exportarAtendimentosCSV,
  exportarParaCSV,
  formatarDataBR,
  formatarMoeda,
  obterClasseBadge,
  obterClasseBadgeAtendimento
} from '../utils/formatadores';
import {
  ExpandableFilterPanel,
  ExpandableFilterToggle
} from '../components/ExpandableFilterBar';

interface RelatoriosPageProps {
  demandasOperadoras: DemandaFinanceira[];
  guiasParticulares: GuiaParticular[];
  operadoras: Operadora[];
  atendimentos: Atendimento[];
  medicos: Profissional[];
  pacientes: Paciente[];
  regrasGestao: RegrasGestao;
  aoSalvarRegras: (novasRegras: RegrasGestao) => void;
}

const TODOS_STATUS: StatusFaturamento[] = ['Aberto', 'Faturada', 'Enviada'];
const TODAS_PRIORIDADES: PrioridadeDemanda[] = ['Alta', 'Média', 'Baixa'];

export function RelatoriosPage({
  demandasOperadoras,
  guiasParticulares,
  operadoras,
  atendimentos,
  medicos,
  pacientes,
  regrasGestao,
  aoSalvarRegras
}: RelatoriosPageProps) {
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(false);
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');
  const [filtroOperadora, setFiltroOperadora] = useState<string>('Todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('Todas');
  const [filtroConformidade, setFiltroConformidade] = useState<string>('Todos');

  const [metaPorOperadora, setMetaPorOperadora] = useState<string>(
    String(regrasGestao.metaPorOperadora)
  );
  const [metaGlobalMensal, setMetaGlobalMensal] = useState<string>(
    String(regrasGestao.metaGlobalMensal)
  );
  const [valorMinimoLote, setValorMinimoLote] = useState<string>(
    String(regrasGestao.valorMinimoLote)
  );
  const [tetoGlosaPercentual, setTetoGlosaPercentual] = useState<string>(
    String(regrasGestao.tetoGlosaPercentual)
  );
  const [metaAtendimentosMensal, setMetaAtendimentosMensal] = useState<string>(
    String(regrasGestao.metaAtendimentosMensal)
  );
  const [minimoAtendimentosPorMedico, setMinimoAtendimentosPorMedico] =
    useState<string>(String(regrasGestao.minimoAtendimentosPorMedico));
  const [mensagemSalvo, setMensagemSalvo] = useState<boolean>(false);

  const metaFinanceira = regrasGestao.metaPorOperadora;
  const corpoClinicoMedicos = medicos.filter((m) =>
    ehProfissionalMedico(m.cargo)
  );

  const qtdFiltrosAtivos =
    (buscaTexto.trim() ? 1 : 0) +
    (filtroCategoria !== 'Todas' ? 1 : 0) +
    (filtroOperadora !== 'Todas' ? 1 : 0) +
    (filtroStatus !== 'Todos' ? 1 : 0) +
    (filtroPrioridade !== 'Todas' ? 1 : 0) +
    (filtroConformidade !== 'Todos' ? 1 : 0);

  function limparFiltros() {
    setBuscaTexto('');
    setFiltroCategoria('Todas');
    setFiltroOperadora('Todas');
    setFiltroStatus('Todos');
    setFiltroPrioridade('Todas');
    setFiltroConformidade('Todos');
  }

  function submeterRegras(evento: FormEvent) {
    evento.preventDefault();
    const novas: RegrasGestao = {
      metaPorOperadora: Math.max(
        100,
        Number(metaPorOperadora) || regrasGestao.metaPorOperadora
      ),
      metaGlobalMensal: Math.max(
        500,
        Number(metaGlobalMensal) || regrasGestao.metaGlobalMensal
      ),
      valorMinimoLote: Math.max(
        50,
        Number(valorMinimoLote) || regrasGestao.valorMinimoLote
      ),
      tetoGlosaPercentual: Math.min(
        100,
        Math.max(
          0.5,
          Number(tetoGlosaPercentual) || regrasGestao.tetoGlosaPercentual
        )
      ),
      metaAtendimentosMensal: Math.max(
        1,
        Number(metaAtendimentosMensal) || regrasGestao.metaAtendimentosMensal
      ),
      minimoAtendimentosPorMedico: Math.max(
        1,
        Number(minimoAtendimentosPorMedico) ||
          regrasGestao.minimoAtendimentosPorMedico
      )
    };

    aoSalvarRegras(novas);
    setMensagemSalvo(true);
    setTimeout(() => setMensagemSalvo(false), 3000);
  }

  const particularesNormalizados: DemandaFinanceira[] = guiasParticulares.map(
    (p) => ({
      id: p.id,
      operadora: 'Particular',
      descricao: `${p.paciente} — ${p.descricao}`,
      tipoAtendimento: 'Consulta',
      dataCriacao: p.data,
      dataAlteracaoOuEnvio: p.atualizadoEm,
      valor: p.valor,
      status:
        p.status === 'Pago'
          ? 'Faturada'
          : p.status === 'Fechado'
            ? 'Enviada'
            : 'Aberto',
      prioridade: p.prioridade,
      atualizadoHa: p.atualizadoEm,
      guias: [],
      categoria: 'Particular',
      observacoes: p.observacoes,
      recurso: p.recurso
    })
  );

  const todosRegistros: DemandaFinanceira[] = [
    ...demandasOperadoras.map((d) => ({
      ...d,
      categoria: d.categoria ?? ('Operadora' as const)
    })),
    ...particularesNormalizados
  ];

  const registrosFiltrados = todosRegistros.filter((reg) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const bateTexto =
      !termo ||
      reg.id.toLocaleLowerCase().includes(termo) ||
      reg.operadora.toLocaleLowerCase().includes(termo) ||
      reg.descricao.toLocaleLowerCase().includes(termo);
    const bateCategoria =
      filtroCategoria === 'Todas' || reg.categoria === filtroCategoria;
    const bateOperadora =
      filtroOperadora === 'Todas' || reg.operadora === filtroOperadora;
    const bateStatus = filtroStatus === 'Todos' || reg.status === filtroStatus;
    const batePrioridade =
      filtroPrioridade === 'Todas' || reg.prioridade === filtroPrioridade;

    return (
      bateTexto &&
      bateCategoria &&
      bateOperadora &&
      bateStatus &&
      batePrioridade
    );
  });

  const totalAberto = registrosFiltrados
    .filter((d) => d.status === 'Aberto')
    .reduce((s, i) => s + i.valor, 0);
  const totalFaturada = registrosFiltrados
    .filter((d) => d.status === 'Faturada')
    .reduce((s, i) => s + i.valor, 0);
  const totalEnviada = registrosFiltrados
    .filter((d) => d.status === 'Enviada')
    .reduce((s, i) => s + i.valor, 0);

  const dadosGraficoStatus = [
    { name: 'Aberto (Em Alocação / Pendente)', valor: totalAberto, cor: '#3b82f6' },
    { name: 'Faturada / Pago', valor: totalFaturada, cor: '#778873' },
    { name: 'Enviada / Fechado', valor: totalEnviada, cor: '#4d6b53' }
  ];

  const volumeTotal = registrosFiltrados.reduce((acc, r) => acc + r.valor, 0);
  const ticketMedio =
    registrosFiltrados.length > 0 ? volumeTotal / registrosFiltrados.length : 0;

  const volumeEfetivado = totalFaturada + totalEnviada;
  const taxaEfetivacao =
    volumeTotal > 0 ? ((volumeEfetivado / volumeTotal) * 100).toFixed(1) : '0.0';

  const percMetaGlobal =
    regrasGestao.metaGlobalMensal > 0
      ? Math.round((volumeEfetivado / regrasGestao.metaGlobalMensal) * 100)
      : 0;

  const lotesAbaixoDoMinimo = demandasOperadoras.filter(
    (d) => d.valor < regrasGestao.valorMinimoLote
  );

  const atendimentosRealizadosOuConfirmados = atendimentos.filter(
    (a) => a.status === 'Realizado' || a.status === 'Confirmado'
  );
  const percMetaAtendimentos =
    regrasGestao.metaAtendimentosMensal > 0
      ? Math.round(
          (atendimentosRealizadosOuConfirmados.length /
            regrasGestao.metaAtendimentosMensal) *
            100
        )
      : 0;

  const lotesComRecurso = registrosFiltrados.filter(
    (r) => Boolean(r.recurso) || Boolean(r.motivoUltimaExclusaoFatura)
  );
  const volumeComRecurso = lotesComRecurso.reduce((acc, r) => acc + r.valor, 0);

  const nomesEntidades = Array.from(
    new Set([
      ...operadoras.map((op) => op.nome),
      ...demandasOperadoras.map((d) => d.operadora),
      'Particular'
    ])
  );

  const relatorioPorOperadora = nomesEntidades.map((nomeEntidade) => {
    const cadOp = operadoras.find((o) => o.nome === nomeEntidade);
    const itens = registrosFiltrados.filter((r) => r.operadora === nomeEntidade);
    const somaTotal = itens.reduce((acc, i) => acc + i.valor, 0);
    const aberto = itens
      .filter((i) => i.status === 'Aberto')
      .reduce((acc, i) => acc + i.valor, 0);
    const faturada = itens
      .filter((i) => i.status === 'Faturada')
      .reduce((acc, i) => acc + i.valor, 0);
    const enviada = itens
      .filter((i) => i.status === 'Enviada')
      .reduce((acc, i) => acc + i.valor, 0);

    const participacao =
      volumeTotal > 0 ? ((somaTotal / volumeTotal) * 100).toFixed(1) : '0.0';
    const atingimentoMeta =
      metaFinanceira > 0
        ? Math.round(((faturada + enviada) / metaFinanceira) * 100)
        : 0;

    return {
      nome: nomeEntidade,
      operadora: nomeEntidade.replace(/\s*Saúde$/i, ''),
      categoria: nomeEntidade === 'Particular' ? 'Particular' : 'Operadora',
      cnpj:
        cadOp?.cnpj ??
        (nomeEntidade === 'Particular' ? 'Pessoa Física / Part.' : '-'),
      datasEnvio: cadOp?.datasEnvio ?? [],
      qtdLotes: itens.length,
      aberto,
      faturada,
      enviada,
      valor: somaTotal,
      somaTotal,
      participacao,
      atingimentoMeta
    };
  });

  const operadorasFiltradasMeta = operadoras.filter((op) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const bateTexto = !termo || op.nome.toLocaleLowerCase().includes(termo);
    const lotesOp = demandasOperadoras.filter((d) => d.operadora === op.nome);
    const efetivadoOp = lotesOp
      .filter((i) => i.status === 'Faturada' || i.status === 'Enviada')
      .reduce((acc, i) => acc + i.valor, 0);
    const atingiu = efetivadoOp >= regrasGestao.metaPorOperadora;
    const bateConf =
      filtroConformidade === 'Todos' ||
      (filtroConformidade === 'Conforme' ? atingiu : !atingiu);
    return bateTexto && bateConf;
  });

  const medicosFiltradosMeta = corpoClinicoMedicos.filter((med) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const bateTexto =
      !termo ||
      med.nome.toLocaleLowerCase().includes(termo) ||
      (med.especialidade || '').toLocaleLowerCase().includes(termo);
    const atdsMed = atendimentos.filter(
      (a) => a.medicoId === med.id && a.status !== 'Cancelado'
    );
    const atingiu = atdsMed.length >= regrasGestao.minimoAtendimentosPorMedico;
    const bateConf =
      filtroConformidade === 'Todos' ||
      (filtroConformidade === 'Conforme' ? atingiu : !atingiu);
    return bateTexto && bateConf;
  });

  const relatorioPorStatus = TODOS_STATUS.map((st) => {
    const itens = registrosFiltrados.filter((r) => r.status === st);
    const soma = itens.reduce((acc, i) => acc + i.valor, 0);
    const qtdAlta = itens.filter((i) => i.prioridade === 'Alta').length;
    const qtdMedia = itens.filter((i) => i.prioridade === 'Média').length;
    const qtdBaixa = itens.filter((i) => i.prioridade === 'Baixa').length;
    const ticket = itens.length > 0 ? soma / itens.length : 0;
    const perc =
      volumeTotal > 0 ? ((soma / volumeTotal) * 100).toFixed(1) : '0.0';

    return {
      status: st,
      qtd: itens.length,
      qtdAlta,
      qtdMedia,
      qtdBaixa,
      soma,
      ticket,
      perc
    };
  });

  const volumeAtendimentos = atendimentos
    .filter((a) => a.status !== 'Cancelado')
    .reduce((acc, a) => acc + Math.max(0, a.valor - (a.desconto ?? 0)), 0);

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
            Relatórios Corporativos e Avaliação de Desempenho
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Painel executivo consolidado com indicadores estratégicos, governança de
            metas, gráficos analíticos e relatórios de Operadoras, Particulares,
            Profissionais e Pacientes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            className="btn-outline"
            onClick={() => exportarAtendimentosCSV(atendimentos)}
            title="Exportar relatório de atendimentos clínicos em CSV"
          >
            <Download size={16} />
            <span>Exportar Atendimentos CSV</span>
          </button>

          <button
            className="btn-primary"
            onClick={() => exportarParaCSV(registrosFiltrados)}
            title="Exportar lotes e guias filtrados em formato CSV"
          >
            <Download size={18} />
            <span>Exportar Faturamento CSV ({registrosFiltrados.length})</span>
          </button>
        </div>
      </div>

      <section className="demandas-section" style={{ padding: '1.15rem 1.5rem' }}>
        <div className="filters-bar">
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600
              }}
            >
              <FileBarChart2 size={18} color="#778873" />
              <span>Filtros Corporativos de Segmentação Analítica</span>
            </div>
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                marginTop: '0.15rem'
              }}
            >
              Segmente os gráficos e tabelas abaixo por categoria, operadora, status
              do lote, prioridade ou conformidade de metas.
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
          <div className="search-box" style={{ flex: 1, minWidth: '220px' }}>
            <Search size={16} color="#5A6B57" />
            <input
              type="text"
              placeholder="Buscar código, operadora, profissional ou descrição..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="Todas">
              Categoria: Todas (Operadoras + Particulares)
            </option>
            <option value="Operadora">Apenas Operadoras</option>
            <option value="Particular">Apenas Particulares</option>
          </select>

          <select
            className="filter-select"
            value={filtroOperadora}
            onChange={(e) => setFiltroOperadora(e.target.value)}
          >
            <option value="Todas">Operadora / Origem: Todas</option>
            {nomesEntidades.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="Todos">Status: Todos</option>
            {TODOS_STATUS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
          >
            <option value="Todas">Prioridade: Todas</option>
            {TODAS_PRIORIDADES.map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filtroConformidade}
            onChange={(e) => setFiltroConformidade(e.target.value)}
          >
            <option value="Todos">Status da Meta: Todos</option>
            <option value="Conforme">Meta / Mínimo Atingido</option>
            <option value="Abaixo">Abaixo da Meta / Mínimo</option>
          </select>
        </ExpandableFilterPanel>
      </section>

      <section className="relatorio-secao-corporativa">
        <div className="relatorio-secao-cabecalho">
          <h2 className="relatorio-secao-titulo">
            <TrendingUp size={20} color="#778873" />
            <span>1. Sumário Executivo de Indicadores Estratégicos (KPIs)</span>
          </h2>
          <p className="relatorio-secao-descricao">
            Visão macro do desempenho financeiro faturado/enviado frente à meta
            global da instituição, ticket médio por lote e produtividade clínica.
          </p>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <span>Faturamento Efetivado vs. Meta Global</span>
              <TrendingUp size={20} color="#778873" />
            </div>
            <div className="kpi-value">{formatarMoeda(volumeEfetivado)}</div>
            <div className="meta-progress-wrapper">
              <div className="meta-progress-track">
                <div
                  className="meta-progress-fill"
                  style={{ width: `${Math.min(100, percMetaGlobal)}%` }}
                />
              </div>
              <div className="meta-progress-label">
                <span>
                  {percMetaGlobal}% de {formatarMoeda(regrasGestao.metaGlobalMensal)}{' '}
                  • Taxa de Efetivação: {taxaEfetivacao}%
                </span>
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span>Volume em Lotes Abertos (A Faturar)</span>
              <Layers size={20} color="#3b82f6" />
            </div>
            <div className="kpi-value">{formatarMoeda(totalAberto)}</div>
            <div className="kpi-subtitle">
              Aguardando emissão de faturas • Recursos:{' '}
              <strong>{formatarMoeda(volumeComRecurso)}</strong>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span>
                Conformidade de Piso por Lote (
                {formatarMoeda(regrasGestao.valorMinimoLote)})
              </span>
              <ShieldCheck size={20} color="#778873" />
            </div>
            <div className="kpi-value">
              {demandasOperadoras.length - lotesAbaixoDoMinimo.length} /{' '}
              {demandasOperadoras.length} lotes
            </div>
            <div className="kpi-subtitle">
              Ticket médio global: <strong>{formatarMoeda(ticketMedio)}</strong>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span>
                Produtividade Clínica ({regrasGestao.metaAtendimentosMensal} atd.)
              </span>
              <CalendarCheck size={20} color="#778873" />
            </div>
            <div className="kpi-value">
              {atendimentosRealizadosOuConfirmados.length} atendimentos (
              {formatarMoeda(volumeAtendimentos)})
            </div>
            <div className="meta-progress-wrapper">
              <div className="meta-progress-track">
                <div
                  className="meta-progress-fill"
                  style={{ width: `${Math.min(100, percMetaAtendimentos)}%` }}
                />
              </div>
              <div className="meta-progress-label">
                <span>{percMetaAtendimentos}% da meta mensal de atendimentos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relatorio-secao-corporativa">
        <div className="relatorio-secao-cabecalho">
          <h2 className="relatorio-secao-titulo">
            <BarChart3 size={20} color="#778873" />
            <span>
              2. Análise Visual de Distribuição Financeira e Performance por
              Operadora
            </span>
          </h2>
          <p className="relatorio-secao-descricao">
            Acompanhamento gráfico da proporção financeira entre os estágios de
            faturamento (Aberto, Faturada e Enviada) e comparativo direto do volume
            de cada operadora frente à meta institucional estipulada.
          </p>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-title">
              <PieChartIcon size={20} color="#778873" />
              <span>Composição do Volume Financeiro por Status do Lote</span>
            </div>
            <p className="chart-subtitle">
              Proporção monetária distribuída entre lotes em aberto para alocação,
              lotes com faturas emitidas e lotes já enviados às operadoras.
            </p>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGraficoStatus}
                    dataKey="valor"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {dadosGraficoStatus.map((item, index) => (
                      <Cell key={`cell-${index}`} fill={item.cor} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(valor) => formatarMoeda(Number(valor ?? 0))}
                    contentStyle={{
                      backgroundColor: '#FAFBF5',
                      borderColor: '#A1BC98',
                      borderRadius: '8px',
                      color: '#2C352B'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-legend">
              {dadosGraficoStatus.map((item) => (
                <div className="legend-item" key={item.name}>
                  <span
                    className="legend-dot"
                    style={{ backgroundColor: item.cor }}
                  />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">
              <BarChart3 size={20} color="#778873" />
              <span>
                Faturamento por Operadora vs. Meta Individual (
                {formatarMoeda(metaFinanceira)})
              </span>
            </div>
            <p className="chart-subtitle">
              Comparativo do volume total acumulado por operadora e atendimentos
              particulares em relação à linha de referência da meta corporativa.
            </p>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={relatorioPorOperadora}
                  margin={{ top: 20, right: 15, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#D2DCB6"
                    vertical={false}
                  />
                  <XAxis dataKey="operadora" stroke="#5A6B57" fontSize={12} />
                  <YAxis
                    stroke="#5A6B57"
                    fontSize={12}
                    tickFormatter={(valor) =>
                      `R$ ${(Number(valor) / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    formatter={(valor) => [
                      formatarMoeda(Number(valor ?? 0)),
                      'Volume'
                    ]}
                    contentStyle={{
                      backgroundColor: '#FAFBF5',
                      borderColor: '#A1BC98',
                      borderRadius: '8px',
                      color: '#2C352B'
                    }}
                  />
                  <ReferenceLine
                    y={metaFinanceira}
                    stroke="#5A6B57"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: `Meta ${formatarMoeda(metaFinanceira)}`,
                      position: 'top',
                      fill: '#5A6B57',
                      fontSize: 12
                    }}
                  />
                  <Bar dataKey="valor" fill="#778873" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="relatorio-secao-corporativa">
        <div className="relatorio-secao-cabecalho">
          <h2 className="relatorio-secao-titulo">
            <Target size={20} color="#778873" />
            <span>
              3. Governança de Metas Corporativas e Auditoria de Conformidade
            </span>
          </h2>
          <p className="relatorio-secao-descricao">
            Parametrização das diretrizes estratégicas da empresa e monitoramento em
            tempo real do cumprimento de metas pelas Operadoras e pelo Corpo Clínico.
          </p>
        </div>

        <div className="grade-painel-duplo">
          <div className="demandas-section">
            <div>
              <h3 style={{ fontSize: '1.08rem' }}>
                Parâmetros e Diretrizes de Desempenho
              </h3>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.2rem'
                }}
              >
                Ajuste os indicadores de referência para recalcular automaticamente
                as metas dos relatórios.
              </p>
            </div>

            <form
              onSubmit={submeterRegras}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}
            >
              <div className="form-group">
                <label>Meta Financeira por Operadora (R$)</label>
                <input
                  type="number"
                  step="500"
                  min="100"
                  className="form-input"
                  value={metaPorOperadora}
                  onChange={(e) => setMetaPorOperadora(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Meta Global de Faturamento Mensal (R$)</label>
                <input
                  type="number"
                  step="1000"
                  min="500"
                  className="form-input"
                  value={metaGlobalMensal}
                  onChange={(e) => setMetaGlobalMensal(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Valor Mínimo por Lote para Fechamento (R$)</label>
                <input
                  type="number"
                  step="100"
                  min="50"
                  className="form-input"
                  value={valorMinimoLote}
                  onChange={(e) => setValorMinimoLote(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Índice de Tolerância de Divergências / Recursos (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100"
                  className="form-input"
                  value={tetoGlosaPercentual}
                  onChange={(e) => setTetoGlosaPercentual(e.target.value)}
                  required
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Meta Mensal Atendimentos</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={metaAtendimentosMensal}
                    onChange={(e) => setMetaAtendimentosMensal(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mínimo por Médico</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={minimoAtendimentosPorMedico}
                    onChange={(e) =>
                      setMinimoAtendimentosPorMedico(e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ justifyContent: 'center', marginTop: '0.35rem' }}
              >
                <Save size={16} />
                <span>Salvar Diretrizes e Metas</span>
              </button>

              {mensagemSalvo && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: 'var(--accent-color)',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Parâmetros atualizados e aplicados aos relatórios!</span>
                </div>
              )}
            </form>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            <div className="demandas-section">
              <div>
                <h3 style={{ fontSize: '1.08rem' }}>
                  Atingimento de Meta Individual por Operadora (
                  {formatarMoeda(regrasGestao.metaPorOperadora)})
                </h3>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.83rem',
                    marginTop: '0.2rem'
                  }}
                >
                  Mensuração do volume efetivado (lotes com status Faturada e
                  Enviada) frente à meta estipulada para cada operadora.
                </p>
              </div>

              <div className="table-container">
                <table className="demandas-table">
                  <thead>
                    <tr>
                      <th>Operadora</th>
                      <th>Efetivado (Faturada + Enviada)</th>
                      <th>Volume Total</th>
                      <th>Progresso da Meta</th>
                      <th>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operadorasFiltradasMeta.map((op) => {
                      const lotesOp = demandasOperadoras.filter(
                        (d) => d.operadora === op.nome
                      );
                      const totalOp = lotesOp.reduce(
                        (acc, i) => acc + i.valor,
                        0
                      );
                      const efetivadoOp = lotesOp
                        .filter(
                          (i) =>
                            i.status === 'Faturada' || i.status === 'Enviada'
                        )
                        .reduce((acc, i) => acc + i.valor, 0);
                      const perc =
                        regrasGestao.metaPorOperadora > 0
                          ? Math.round(
                              (efetivadoOp / regrasGestao.metaPorOperadora) * 100
                            )
                          : 0;

                      return (
                        <tr key={op.id}>
                          <td style={{ fontWeight: 600 }}>{op.nome}</td>
                          <td style={{ fontWeight: 600 }}>
                            {formatarMoeda(efetivadoOp)}
                          </td>
                          <td>{formatarMoeda(totalOp)}</td>
                          <td style={{ minWidth: '160px' }}>
                            <div className="meta-progress-wrapper">
                              <div className="meta-progress-track">
                                <div
                                  className="meta-progress-fill"
                                  style={{ width: `${Math.min(100, perc)}%` }}
                                />
                              </div>
                              <span
                                style={{ fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                {perc}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                perc >= 100
                                  ? 'badge-enviado'
                                  : perc >= 50
                                    ? 'badge-faturado'
                                    : 'badge-pendente'
                              }`}
                            >
                              {perc >= 100
                                ? 'Meta Atingida'
                                : perc >= 50
                                  ? 'Em Evolução'
                                  : 'Abaixo da Meta'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="demandas-section">
              <div>
                <h3 style={{ fontSize: '1.08rem' }}>
                  Conformidade de Produtividade Clínica por Médico (Mínimo:{' '}
                  {regrasGestao.minimoAtendimentosPorMedico} atd.)
                </h3>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.83rem',
                    marginTop: '0.2rem'
                  }}
                >
                  Avaliação individual dos profissionais médicos quanto ao volume
                  mínimo de atendimentos clínicos realizados/confirmados.
                </p>
              </div>

              <div className="table-container">
                <table className="demandas-table">
                  <thead>
                    <tr>
                      <th>Profissional Médico</th>
                      <th>Especialidade</th>
                      <th>Atendimentos Válidos</th>
                      <th>Volume Clínico</th>
                      <th>Conformidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicosFiltradosMeta.map((med) => {
                      const atdsMed = atendimentos.filter(
                        (a) => a.medicoId === med.id && a.status !== 'Cancelado'
                      );
                      const somaMed = atdsMed.reduce(
                        (acc, a) =>
                          acc + Math.max(0, a.valor - (a.desconto ?? 0)),
                        0
                      );
                      const atingiuMinimo =
                        atdsMed.length >=
                        regrasGestao.minimoAtendimentosPorMedico;

                      return (
                        <tr key={med.id}>
                          <td style={{ fontWeight: 600 }}>{med.nome}</td>
                          <td>{med.especialidade || med.cargo}</td>
                          <td>
                            {atdsMed.length} /{' '}
                            {regrasGestao.minimoAtendimentosPorMedico}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {formatarMoeda(somaMed)}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                atingiuMinimo
                                  ? 'badge-enviado'
                                  : 'badge-pendente'
                              }`}
                            >
                              {atingiuMinimo
                                ? 'Dentro do Mínimo'
                                : 'Abaixo do Mínimo'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relatorio-secao-corporativa">
        <div className="relatorio-secao-cabecalho">
          <h2 className="relatorio-secao-titulo">
            <Building2 size={20} color="#778873" />
            <span>
              4. Demonstrativo Financeiro Consolidado por Operadora e Particular
            </span>
          </h2>
          <p className="relatorio-secao-descricao">
            Detalhamento contábil por fonte pagadora, discriminando valores em lotes
            abertos, faturados e enviados, participação percentual na receita (%
            Share) e calendário de envios.
          </p>
        </div>

        <div className="table-container">
          <table className="demandas-table">
            <thead>
              <tr>
                <th>Operadora / Origem</th>
                <th>Categoria</th>
                <th>CNPJ / Identificação</th>
                <th>Lotes / Guias</th>
                <th>Aberto</th>
                <th>Faturada / Pago</th>
                <th>Enviada / Fechado</th>
                <th>Volume Total</th>
                <th>% Share</th>
                <th>Meta</th>
              </tr>
            </thead>
            <tbody>
              {relatorioPorOperadora.map((linha) => (
                <tr key={linha.nome}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{linha.nome}</div>
                    {linha.datasEnvio.length > 0 && (
                      <small
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.75rem'
                        }}
                      >
                        Envios: {linha.datasEnvio.map(formatarDataBR).join(', ')}
                      </small>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-faturar">
                      {linha.categoria}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>
                    {linha.cnpj}
                  </td>
                  <td>{linha.qtdLotes}</td>
                  <td>{formatarMoeda(linha.aberto)}</td>
                  <td>{formatarMoeda(linha.faturada)}</td>
                  <td style={{ fontWeight: 600, color: '#4d6b53' }}>
                    {formatarMoeda(linha.enviada)}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {formatarMoeda(linha.somaTotal)}
                  </td>
                  <td>{linha.participacao}%</td>
                  <td>
                    <span className="badge badge-faturado">
                      {linha.atingimentoMeta}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="relatorio-secao-corporativa">
        <div className="relatorio-secao-cabecalho">
          <h2 className="relatorio-secao-titulo">
            <Layers size={20} color="#778873" />
            <span>
              5. Matriz Analítica por Status Operacional e Grau de Prioridade
            </span>
          </h2>
          <p className="relatorio-secao-descricao">
            Avaliação da volumetria de lotes e guias segundo o estágio de
            processamento (Aberto, Faturada e Enviada), distribuída por nível de
            criticidade e ticket médio.
          </p>
        </div>

        <div className="table-container">
          <table className="demandas-table">
            <thead>
              <tr>
                <th>Status do Lote</th>
                <th>Qtd. Registros</th>
                <th>
                  <span className="priority-tag priority-alta">
                    Prioridade Alta
                  </span>
                </th>
                <th>
                  <span className="priority-tag priority-media">
                    Prioridade Média
                  </span>
                </th>
                <th>
                  <span className="priority-tag priority-baixa">
                    Prioridade Baixa
                  </span>
                </th>
                <th>Ticket Médio</th>
                <th>Volume Financeiro</th>
                <th>% do Volume</th>
              </tr>
            </thead>
            <tbody>
              {relatorioPorStatus.map((st) => (
                <tr key={st.status}>
                  <td>
                    <span className={obterClasseBadge(st.status)}>
                      {st.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{st.qtd}</td>
                  <td>{st.qtdAlta}</td>
                  <td>{st.qtdMedia}</td>
                  <td>{st.qtdBaixa}</td>
                  <td>{formatarMoeda(st.ticket)}</td>
                  <td style={{ fontWeight: 700 }}>{formatarMoeda(st.soma)}</td>
                  <td>{st.perc}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="relatorio-secao-corporativa">
        <div className="relatorio-secao-cabecalho">
          <h2 className="relatorio-secao-titulo">
            <Stethoscope size={20} color="#778873" />
            <span>
              6. Indicadores de Produção do Corpo Clínico e Histórico de Pacientes
            </span>
          </h2>
          <p className="relatorio-secao-descricao">
            Visão comparativa da produção assistencial e financeira gerada por cada
            médico especialista e consolidação de atendimentos por paciente.
          </p>
        </div>

        <div className="grade-painel-duplo">
          <div className="demandas-section">
            <div>
              <h3
                style={{
                  fontSize: '1.08rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Stethoscope size={17} color="#778873" />
                <span>
                  Produtividade por Médico Especialista (
                  {corpoClinicoMedicos.length})
                </span>
              </h3>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.15rem'
                }}
              >
                Total de atendimentos agendados, concluídos e receita líquida por
                profissional.
              </p>
            </div>

            <div className="table-container">
              <table className="demandas-table">
                <thead>
                  <tr>
                    <th>Profissional Médico</th>
                    <th>Especialidade</th>
                    <th>Atd.</th>
                    <th>Realizados</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {corpoClinicoMedicos.map((med) => {
                    const atds = atendimentos.filter(
                      (a) => a.medicoId === med.id
                    );
                    const realizados = atds.filter(
                      (a) => a.status === 'Realizado'
                    ).length;
                    const soma = atds
                      .filter((a) => a.status !== 'Cancelado')
                      .reduce(
                        (acc, a) =>
                          acc + Math.max(0, a.valor - (a.desconto ?? 0)),
                        0
                      );

                    return (
                      <tr key={med.id}>
                        <td style={{ fontWeight: 600 }}>{med.nome}</td>
                        <td>{med.especialidade || med.cargo}</td>
                        <td>{atds.length}</td>
                        <td>{realizados}</td>
                        <td style={{ fontWeight: 600 }}>{formatarMoeda(soma)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="demandas-section">
            <div>
              <h3
                style={{
                  fontSize: '1.08rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Users size={17} color="#778873" />
                <span>
                  Resumo Assistencial por Paciente ({pacientes.length})
                </span>
              </h3>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.15rem'
                }}
              >
                Frequência de atendimentos, último status clínico e volume financeiro
                por paciente.
              </p>
            </div>

            <div className="table-container">
              <table className="demandas-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Cidade</th>
                    <th>Atendimentos</th>
                    <th>Último Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientes.map((pac) => {
                    const atds = atendimentos.filter(
                      (a) => a.pacienteId === pac.id
                    );
                    const ultimoStatus = atds[0]?.status;
                    const soma = atds
                      .filter((a) => a.status !== 'Cancelado')
                      .reduce(
                        (acc, a) =>
                          acc + Math.max(0, a.valor - (a.desconto ?? 0)),
                        0
                      );

                    return (
                      <tr key={pac.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {pac.nome} {pac.sobrenome}
                          </div>
                          <small style={{ color: 'var(--text-secondary)' }}>
                            {pac.id}
                          </small>
                        </td>
                        <td>{pac.cidade}</td>
                        <td>{atds.length}</td>
                        <td>
                          {ultimoStatus ? (
                            <span
                              className={obterClasseBadgeAtendimento(
                                ultimoStatus
                              )}
                            >
                              {ultimoStatus}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatarMoeda(soma)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="relatorio-secao-corporativa">
        <div className="relatorio-secao-cabecalho">
          <h2 className="relatorio-secao-titulo">
            <MessageSquareWarning size={20} color="#b45309" />
            <span>
              7. Auditoria de Recursos de Lotes Enviados e Justificativas de
              Retificação ({lotesComRecurso.length})
            </span>
          </h2>
          <p className="relatorio-secao-descricao">
            Controle de governança sobre lotes enviados com recursos administrativos
            abertos ou lotes que tiveram faturas excluídas mediante justificativa.
          </p>
        </div>

        <div className="table-container">
          <table className="demandas-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Categoria</th>
                <th>Operadora / Origem</th>
                <th>Descrição do Lote</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Justificativa / Motivo do Recurso</th>
              </tr>
            </thead>
            <tbody>
              {lotesComRecurso.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      padding: '1.75rem'
                    }}
                  >
                    Nenhum lote com recurso aberto ou exclusão de fatura registrada
                    nos filtros atuais.
                  </td>
                </tr>
              ) : (
                lotesComRecurso.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, color: '#778873' }}>
                      {item.id}
                    </td>
                    <td>{item.categoria}</td>
                    <td style={{ fontWeight: 600 }}>{item.operadora}</td>
                    <td>{item.descricao}</td>
                    <td>
                      <span className={obterClasseBadge(item.status)}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {formatarMoeda(item.valor)}
                    </td>
                    <td>
                      {item.recurso ? (
                        <div>
                          <strong style={{ color: '#b45309' }}>
                            Recurso ({item.recurso.dataAbertura}):
                          </strong>{' '}
                          {item.recurso.motivo}
                        </div>
                      ) : item.motivoUltimaExclusaoFatura ? (
                        <div>
                          <strong style={{ color: '#dc2626' }}>
                            Exclusão de Fatura:
                          </strong>{' '}
                          {item.motivoUltimaExclusaoFatura}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {item.observacoes || '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
