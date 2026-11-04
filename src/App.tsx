import { useState, useEffect, type FormEvent } from 'react';
import {
  LayoutDashboard, Settings,
  Radio, DollarSign, Clock, AlertTriangle, CheckCircle2, FileText,
  Pause, Play, Search, Filter, BarChart3, PieChart as PieChartIcon, Check,
  RotateCcw,
  Plus,
  Trash2,
  X,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  CONVENIOS_PADRAO,
  DEMANDAS_INICIAIS,
  type ClientesConvenio,
  type DemandaFinanceira,
  type PrioridadeDemanda,
  type StatusFaturamento
} from './data/dadosFaturamento';
import './index.css';

const CHAVE_DEMANDAS = 'gwaan_demandas_v2';
const CHAVE_CONVENIOS = 'gwaan_convenios_v2';
const CHAVE_META = 'gwaan_meta_v1';
const META_PADRAO = 25000;

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  });
}

function obterClasseBadge(status: StatusFaturamento): string {
  switch (status) {
    case 'Faturar': return 'badge badge-faturar';
    case 'Faturado': return 'badge badge-faturado';
    case 'Auditoria': return 'badge badge-auditoria';
    case 'Pendencia': return 'badge badge-pendente';
    case 'Glosado': return 'badge badge-glosado';
    default: return 'badge';
  }
}

export function App() {
  const [abaAtiva, setAbaAtiva] = useState<string>('dashboard');

  const [demandas, setDemandas] = useState<DemandaFinanceira[]>(() => {
    const dadosSalvos = localStorage.getItem(CHAVE_DEMANDAS);
    if (dadosSalvos) {
      try {
        const parsed = JSON.parse(dadosSalvos);
        return Array.isArray(parsed) ? parsed : DEMANDAS_INICIAIS;
      } catch {
        return DEMANDAS_INICIAIS;
      }
    }
    return DEMANDAS_INICIAIS;
  });

  const [convenios, setConvenios] = useState<ClientesConvenio[]>(() => {
    const salvo = localStorage.getItem(CHAVE_CONVENIOS);
    if (salvo) {
      try {
        const parsed = JSON.parse(salvo);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : CONVENIOS_PADRAO;
      } catch {
        return CONVENIOS_PADRAO;
      }
    }
    return CONVENIOS_PADRAO;
  });

  const [metaFinanceira, setMetaFinanceira] = useState<number>(() => {
    const salvo = localStorage.getItem(CHAVE_META);
    const numero = salvo ? Number(salvo) : META_PADRAO;
    return !isNaN(numero) && numero > 0 ? numero : META_PADRAO;
  });

  const [tempoRealAtivo, setTempoRealAtivo] = useState<boolean>(false);

  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('Todas');

  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [novoConvenioGuia, setNovoConvenioGuia] = useState<string>('');
  const [novaDescricao, setNovaDescricao] = useState<string>('');
  const [novoValor, setNovoValor] = useState<string>('');
  const [novoStatus, setNovoStatus] = useState<StatusFaturamento>('Faturar');
  const [novaPrioridade, setNovaPrioridade] = useState<PrioridadeDemanda>('Média');

  const [modalConfigAberto, setModalConfigAberto] = useState<boolean>(false);
  const [nomeNovoConvenio, setNomeNovoConvenio] = useState<string>('');
  const [metaDigitada, setMetaDigitada] = useState<string>(String(metaFinanceira));

  const convenioSelecionadoValido = convenios.some((c) => c.nome === novoConvenioGuia)
    ? novoConvenioGuia
    : '';

  useEffect(() => {
    localStorage.setItem(CHAVE_DEMANDAS, JSON.stringify(demandas));
  }, [demandas]);

  useEffect(() => {
    localStorage.setItem(CHAVE_CONVENIOS, JSON.stringify(convenios));
  }, [convenios]);

  useEffect(() => {
    localStorage.setItem(CHAVE_META, String(metaFinanceira));
  }, [metaFinanceira]);

  useEffect(() => {
    if (!tempoRealAtivo) return;

    const intervalo = setInterval(() => {
      const tiposLote = ['Lote Automático', 'Guias SADT', 'Internação Clínica', 'Lote Oncologia'];
      const statusOpcoes: StatusFaturamento[] = ['Faturar', 'Faturado', 'Auditoria', 'Pendencia', 'Glosado'];
      const prioridades: PrioridadeDemanda[] = ['Alta', 'Média', 'Baixa'];
      const operadorasDisponiveis = convenios.length > 0 ? convenios : CONVENIOS_PADRAO;

      const horarioEntrada = new Date().toLocaleTimeString('pt-BR');

      const novaDemanda: DemandaFinanceira = {
        id: `FAT-${Math.floor(1050 + Math.random() * 8950)}`,
        cliente: operadorasDisponiveis[Math.floor(Math.random() * operadorasDisponiveis.length)].nome,
        descricao: `${tiposLote[Math.floor(Math.random() * tiposLote.length)]} #${Math.floor(10 + Math.random() * 89)}`,
        valor: Math.floor(150 + Math.random() * 15000),
        status: statusOpcoes[Math.floor(Math.random() * statusOpcoes.length)],
        prioridade: prioridades[Math.floor(Math.random() * prioridades.length)],
        atualizadoHa: `Às ${horarioEntrada}`
      };

      setDemandas((listaAnterior) => [novaDemanda, ...listaAnterior.slice(0, 24)]);
    }, 6000);

    return () => clearInterval(intervalo);
  }, [tempoRealAtivo, convenios]);

  function alterarStatusDemanda(idAlvo: string, statusDestino: StatusFaturamento) {
    const horarioAtual = new Date().toLocaleTimeString('pt-BR');

    setDemandas((listaAnterior) =>
      listaAnterior.map((item) =>
        item.id === idAlvo
          ? { ...item, status: statusDestino, atualizadoHa: `Alterado às ${horarioAtual}` }
          : item
      )
    );
  }

  function adicionarNovaGuia(evento: FormEvent) {
    evento.preventDefault();

    const valorNumerico = parseFloat(novoValor);
    if (!convenioSelecionadoValido || !novaDescricao.trim() || isNaN(valorNumerico) || valorNumerico <= 0) {
      alert('Preencha os dados corretamente!');
      return;
    }

    const horarioAtual = new Date().toLocaleTimeString('pt-BR');
    const guiaCriada: DemandaFinanceira = {
      id: `FAT-${Math.floor(1000 + Math.random() * 9000)}`,
      cliente: convenioSelecionadoValido,
      descricao: novaDescricao.trim(),
      valor: valorNumerico,
      status: novoStatus,
      prioridade: novaPrioridade,
      atualizadoHa: `Criado às ${horarioAtual}`
    };

    setDemandas((listaAnterior) => [guiaCriada, ...listaAnterior]);

    setNovoConvenioGuia('');
    setNovaDescricao('');
    setNovoValor('');
    setModalAberto(false);
  }

  function excluirDemanda(idAlvo: string) {
    if (!confirm('Deseja realmente excluir a demanda?')) return;
    setDemandas((listaAnterior) => listaAnterior.filter((item) => item.id !== idAlvo));
  }

  function adicionarConvenio(evento: FormEvent) {
    evento.preventDefault();
    const nomeLimpo = nomeNovoConvenio.trim();
    if (!nomeLimpo) return;

    if (convenios.some((c) => c.nome.toLowerCase() === nomeLimpo.toLowerCase())) {
      alert('Convênio já cadastrado!');
      return;
    }

    setConvenios((listaAnterior) => [{ nome: nomeLimpo }, ...listaAnterior]);
    setNovoConvenioGuia(nomeLimpo);
    setNomeNovoConvenio('');
  }

  function removerConvenio(nomeAlvo: string) {
    if (convenios.length <= 1) {
      alert('Não é possível remover o único convênio cadastrado!');
      return;
    }
    setConvenios((listaAnterior) => {
      const novaLista = listaAnterior.filter((c) => c.nome !== nomeAlvo);
      if (novoConvenioGuia === nomeAlvo) {
        setNovoConvenioGuia('');
      }
      return novaLista;
    });
  }

  function salvarNovaMeta(evento: FormEvent) {
    evento.preventDefault();

    const valorMeta = parseFloat(metaDigitada);
    if (isNaN(valorMeta) || valorMeta <= 0) {
      alert('Digite um valor válido e maior que 0!');
      return;
    }

    setMetaFinanceira(valorMeta);
    setModalConfigAberto(false);
    setAbaAtiva('dashboard');
  }

  function restaurarDadosIniciais() {
    localStorage.removeItem(CHAVE_DEMANDAS);
    localStorage.removeItem(CHAVE_CONVENIOS);
    localStorage.removeItem(CHAVE_META);
    setDemandas(DEMANDAS_INICIAIS);
    setConvenios(CONVENIOS_PADRAO);
    setNovoConvenioGuia('');
    setMetaFinanceira(META_PADRAO);
    setMetaDigitada(String(META_PADRAO));
  }

  const demandasFiltradas = demandas.filter((demanda) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const bateTexto =
      demanda.id.toLocaleLowerCase().includes(termo) ||
      demanda.cliente.toLocaleLowerCase().includes(termo) ||
      demanda.descricao.toLocaleLowerCase().includes(termo);
    const bateStatus = filtroStatus === 'Todos' || demanda.status === filtroStatus;
    const batePrioridade = filtroPrioridade === 'Todas' || demanda.prioridade === filtroPrioridade;

    return bateTexto && bateStatus && batePrioridade;
  });

  function exportarCSV() {
    if (demandasFiltradas.length === 0) {
      alert('Não há guias para serem exportadas!');
      return;
    }

    const cabecalho = [
      'Código',
      'Convênio / Cliente',
      'Descrição do Lote',
      'Prioridade',
      'Valor (R$)',
      'Status',
      'Última Atualização'
    ];

    const escaparCelula = (valor: string | number) =>
      `"${String(valor).replace(/"/g, '""')}"`;

    const linhas = demandasFiltradas.map((item) =>
      [
        escaparCelula(item.id),
        escaparCelula(item.cliente),
        escaparCelula(item.descricao),
        escaparCelula(item.prioridade),
        escaparCelula(item.valor.toFixed(2).replace('.', ',')),
        escaparCelula(item.status),
        escaparCelula(item.atualizadoHa)
      ].join(';')
    );

    const conteudoCSV = '\uFEFF' + [cabecalho.join(';'), ...linhas].join('\r\n');
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    const dataHoje = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `gwaan-demandas-${dataHoje}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const valorTotalGeral = demandas.reduce((soma, item) => soma + item.valor, 0);
  const demandasParaFaturar = demandas.filter((d) => d.status === 'Faturar');
  const totalFaturar = demandasParaFaturar.reduce((soma, item) => soma + item.valor, 0);
  const totalFaturado = demandas.filter((d) => d.status === 'Faturado').reduce((soma, item) => soma + item.valor, 0);
  const totalAuditoria = demandas.filter((d) => d.status === 'Auditoria').reduce((soma, item) => soma + item.valor, 0);
  const totalPendencia = demandas.filter((d) => d.status === 'Pendencia').reduce((soma, item) => soma + item.valor, 0);
  const totalGlosado = demandas.filter((d) => d.status === 'Glosado').reduce((soma, item) => soma + item.valor, 0);
  const percentualMeta = metaFinanceira > 0 ? Math.round((totalFaturado / metaFinanceira) * 100) : 0;
  const larguraBarraMeta = Math.min(100, Math.max(0, percentualMeta));

  const dadosGraficoStatus = [
    { name: 'Faturar', valor: totalFaturar, cor: '#A1BC98' },
    { name: 'Faturado', valor: totalFaturado, cor: '#778873' },
    { name: 'Auditoria', valor: totalAuditoria, cor: '#3b82f6' },
    { name: 'Pendencia', valor: totalPendencia, cor: '#d97706' },
    { name: 'Glosado', valor: totalGlosado, cor: '#dc2626' },
  ];

  const clientesLista: string[] = Array.from(
    new Set([
      ...convenios.map((c) => c.nome),
      ...demandas.map((d) => d.cliente)
    ])
  );

  const dadosGraficosClientes = clientesLista.map((nomeCl) => {
    const somaCl = demandas
      .filter((d) => d.cliente === nomeCl)
      .reduce((soma, item) => soma + item.valor, 0);
    const nomeCurto = nomeCl.replace(/\s*Saúde$/i, '').trim() || nomeCl;
    return { cliente: nomeCurto, valor: somaCl };
  });

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand-title">
          <img
            src="/favicon.svg"
            alt="Logo Gwaan Analytics"
            className="brand-logo"
          />
          <span>Gwaan Analytics</span>
        </div>

        <nav>
          <ul className="nav-list">
            <li
              className={`nav-item ${abaAtiva === 'dashboard' && !modalConfigAberto ? 'active' : ''}`}
              onClick={() => {
                setAbaAtiva('dashboard');
                setModalConfigAberto(false);
              }}
            >
              <LayoutDashboard size={20} />
              <span>Visão Geral</span>
            </li>
            <li
              className={`nav-item ${modalConfigAberto ? 'active' : ''}`}
              onClick={() => {
                setAbaAtiva('configuracoes');
                setMetaDigitada(String(metaFinanceira));
                setModalConfigAberto(true);
              }}
            >
              <Settings size={20} />
              <span>Configurações</span>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: tempoRealAtivo ? '#778873' : '#b45309',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}>
              <Radio size={18} />
              <span>{tempoRealAtivo ? 'Simulação Ativada (Guia a cada 6s)' : 'Simulação Pausada'}</span>
            </div>

            <button
              className="btn-realtime"
              onClick={() => setTempoRealAtivo(!tempoRealAtivo)}
            >
              {tempoRealAtivo ? <Pause size={15} /> : <Play size={15} />}
              <span>{tempoRealAtivo ? 'Pausar' : 'Retomar'}</span>
            </button>

            <button
              className="btn-realtime"
              title="Restaurar dados e configurações de fábrica"
              onClick={restaurarDadosIniciais}
            >
              <RotateCcw size={15} />
              <span>Restaurar Padrão</span>
            </button>
          </div>

          <a
            href="https://www.linkedin.com/in/luiz-felipe-de-almeida-pimentel/"
            target="_blank"
            rel="noopener noreferrer"
            className="user-profile user-profile-link"
            title="Acessar perfil de Luiz Felipe no LinkedIn"
          >
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Luiz Felipe</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Analista de Sistemas</p>
            </div>
            <img
              src="/imagens/profile.jpg"
              alt="Foto de Perfil de Luiz Felipe"
              className="user-avatar"
            />
          </a>
        </header>

        <main className="dashboard-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>
                Monitoramento de Faturamento
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Dados salvos automaticamente no navegador • Meta: <strong>{formatarMoeda(metaFinanceira)}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn-outline"
                onClick={exportarCSV}
                title="Exportar lista filtrada para CSV"
              >
                <Download size={16} />
                <span>Exportar CSV</span>
              </button>

              <button className="btn-primary" onClick={() => setModalAberto(true)}>
                <Plus size={18} />
                <span>Nova Guia Manual</span>
              </button>
            </div>
          </div>

          <section className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span>Contas para Faturar</span>
                <FileText size={20} color="#778873" />
              </div>
              <div className="kpi-value">{formatarMoeda(totalFaturar)}</div>
              <div className="kpi-subtitle">
                {demandasParaFaturar.length} {demandasParaFaturar.length === 1 ? 'guia pronta' : 'guias prontas'} para envio
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span>Receita Faturada</span>
                <CheckCircle2 size={20} color="#778873" />
              </div>
              <div className="kpi-value">{formatarMoeda(totalFaturado)}</div>
              <div className="meta-progress-wrapper">
                <div className="meta-progress-track">
                  <div
                    className="meta-progress-fill"
                    style={{ width: `${larguraBarraMeta}%` }}
                  />
                </div>
                <div className="meta-progress-label">
                  <span>{percentualMeta}% da meta atingida</span>
                </div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span>Em Auditoria / Pendente</span>
                <Clock size={20} color="#3b82f6" />
              </div>
              <div className="kpi-value">{formatarMoeda(totalAuditoria + totalPendencia)}</div>
              <div className="kpi-subtitle">Aguardando liberação ou envio</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span>Valor Glosado / Retido</span>
                <AlertTriangle size={20} color="#dc2626" />
              </div>
              <div className="kpi-value">{formatarMoeda(totalGlosado)}</div>
              <div className="kpi-subtitle">Exige recurso ou correção</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span>Volume Total Processado</span>
                <DollarSign size={20} color="#778873" />
              </div>
              <div className="kpi-value">{formatarMoeda(valorTotalGeral)}</div>
              <div className="kpi-subtitle">{demandas.length} lotes salvos na base</div>
            </div>
          </section>

          <section className="charts-grid">
            <div className="chart-card">
              <div className="chart-title">
                <PieChartIcon size={20} color="#778873" />
                <span>Distribuição Financeira por Status</span>
              </div>

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
                      contentStyle={{ backgroundColor: '#FAFBF5', borderColor: '#A1BC98', borderRadius: '8px', color: '#2C352B' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-legend">
                {dadosGraficoStatus.map((item) => (
                  <div className="legend-item" key={item.name}>
                    <span className="legend-dot" style={{ backgroundColor: item.cor }} />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title">
                <BarChart3 size={20} color="#778873" />
                <span>Volume por Convênio vs. Meta ({formatarMoeda(metaFinanceira)})</span>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGraficosClientes} margin={{ top: 20, right: 15, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D2DCB6" vertical={false} />
                    <XAxis dataKey="cliente" stroke="#5A6B57" fontSize={12} />
                    <YAxis
                      stroke="#5A6B57"
                      fontSize={12}
                      tickFormatter={(valor) => `R$ ${(Number(valor) / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(valor) => [formatarMoeda(Number(valor ?? 0)), 'Volume']}
                      contentStyle={{ backgroundColor: '#FAFBF5', borderColor: '#A1BC98', borderRadius: '8px', color: '#2C352B' }}
                    />
                    <ReferenceLine
                      y={metaFinanceira}
                      stroke="#5A6B57"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{ value: `Meta ${formatarMoeda(metaFinanceira)}`, position: 'top', fill: '#5A6B57', fontSize: 12 }}
                    />
                    <Bar dataKey="valor" fill="#778873" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="demandas-section">
            <div className="filters-bar">
              <div>
                <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={18} color="#778873" />
                  <span>Fila de Guias e Lotes Processados</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Exibindo {demandasFiltradas.length} de {demandas.length} guias armazenadas.
                </p>
              </div>

              <div className="filters-controls">
                <div className="search-box">
                  <Search size={16} color="#5A6B57" />
                  <input
                    type="text"
                    placeholder="Buscar guia, convênio ou lote..."
                    value={buscaTexto}
                    onChange={(e) => setBuscaTexto(e.target.value)}
                  />
                </div>

                <select
                  className="filter-select"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <option value="Todos">Status: Todos</option>
                  <option value="Faturar">Faturar</option>
                  <option value="Faturado">Faturado</option>
                  <option value="Auditoria">Em Auditoria</option>
                  <option value="Pendencia">Pendente</option>
                  <option value="Glosado">Glosado</option>
                </select>

                <select
                  className="filter-select"
                  value={filtroPrioridade}
                  onChange={(e) => setFiltroPrioridade(e.target.value)}
                >
                  <option value="Todas">Prioridade: Todas</option>
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>
            </div>

            <div className="table-container">
              <table className="demandas-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Convênio / Cliente</th>
                    <th>Descrição do Lote</th>
                    <th>Prioridade</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Última Atualização</th>
                    <th>Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody>
                  {demandasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                        Nenhuma guia encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    demandasFiltradas.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 700, color: '#778873' }}>{item.id}</td>
                        <td style={{ fontWeight: 500 }}>{item.cliente}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{item.descricao}</td>
                        <td>{item.prioridade}</td>
                        <td style={{ fontWeight: 600 }}>{formatarMoeda(item.valor)}</td>
                        <td>
                          <span className={obterClasseBadge(item.status)}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                          {item.atualizadoHa}
                        </td>
                        <td>
                          <div className="action-buttons">
                            {item.status !== 'Faturado' && (
                              <button
                                className="btn-action"
                                title="Aprovar e Faturar Lote"
                                onClick={() => alterarStatusDemanda(item.id, 'Faturado')}
                              >
                                <Check size={14} />
                                <span>Faturar</span>
                              </button>
                            )}
                            {item.status === 'Pendencia' && (
                              <button
                                className="btn-action"
                                onClick={() => alterarStatusDemanda(item.id, 'Auditoria')}
                              >
                                <span>Auditar</span>
                              </button>
                            )}
                            <button
                              className="btn-danger"
                              title="Excluir Guia"
                              onClick={() => excluirDemanda(item.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>Cadastrar Nova Guia / Lote</h3>
              <button
                className="btn-realtime"
                onClick={() => setModalAberto(false)}
                style={{ padding: '0.3rem 0.5rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={adicionarNovaGuia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Operadora / Convênio</label>
                <select
                  className="form-input"
                  value={convenioSelecionadoValido}
                  onChange={(e) => setNovoConvenioGuia(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    {convenios.length === 0 ? 'Cadastre um Cliente/Operadora' : 'Escolha a Operadora'}
                  </option>
                  {convenios.map((convenio) => (
                    <option key={convenio.nome} value={convenio.nome}>
                      {convenio.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Descrição do Lote ou Guia</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Lote Quimioterapia Ambulatorial #92"
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Valor Financeiro (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-input"
                  placeholder="Ex: 12500.00"
                  value={novoValor}
                  onChange={(e) => setNovoValor(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Status Inicial</label>
                  <select
                    className="form-input"
                    value={novoStatus}
                    onChange={(e) => setNovoStatus(e.target.value as StatusFaturamento)}
                  >
                    <option value="Faturar">Faturar</option>
                    <option value="Pendencia">Pendente</option>
                    <option value="Auditoria">Em Auditoria</option>
                    <option value="Faturado">Faturado</option>
                    <option value="Glosado">Glosado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Prioridade</label>
                  <select
                    className="form-input"
                    value={novaPrioridade}
                    onChange={(e) => setNovaPrioridade(e.target.value as PrioridadeDemanda)}
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-realtime"
                  onClick={() => setModalAberto(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar Guia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalConfigAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>Configurações do Painel</h3>
              <button
                className="btn-realtime"
                onClick={() => {
                  setModalConfigAberto(false);
                  setAbaAtiva('dashboard');
                }}
                style={{ padding: '0.3rem 0.5rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={salvarNovaMeta} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Meta Financeira por Convênio (R$)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="100"
                    min="1"
                    className="form-input"
                    style={{ flex: 1 }}
                    value={metaDigitada}
                    onChange={(e) => setMetaDigitada(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-primary">
                    Salvar Meta
                  </button>
                </div>
              </div>
            </form>

            <hr className="divisor-modal" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <form onSubmit={adicionarConvenio} className="form-group">
                <label>Cadastrar Novo Convênio / Operadora</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Ex: Bradesco Saúde"
                    value={nomeNovoConvenio}
                    onChange={(e) => setNomeNovoConvenio(e.target.value)}
                  />
                  <button type="submit" className="btn-outline">
                    <Plus size={16} />
                    <span>Adicionar</span>
                  </button>
                </div>
              </form>

              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Convênios Cadastrados ({convenios.length})
                </span>
                <div className="convenios-list">
                  {convenios.map((c) => (
                    <div key={c.nome} className="convenio-item">
                      <span>{c.nome}</span>
                      <button
                        type="button"
                        className="btn-danger"
                        title="Remover convênio"
                        onClick={() => removerConvenio(c.nome)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-realtime"
                onClick={() => {
                  setModalConfigAberto(false);
                  setAbaAtiva('dashboard');
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
