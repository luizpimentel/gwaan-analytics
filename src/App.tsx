import {
  Activity, LayoutDashboard, ListTodo, Settings,
  Radio, DollarSign, Clock, AlertTriangle, CheckCircle2, Pause, Play,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { DEMANDAS_INICIAIS, type DemandaFinanceira, type StatusFaturamento } from './data/dadosFaturamento';
import './index.css';
import { useState, useEffect } from 'react';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-Br', {
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
  const [demandas, setDemandas] = useState<DemandaFinanceira[]>(DEMANDAS_INICIAIS);
  const [tempoRealAtivo, setTempoRealAtivo] = useState<boolean>(true);

  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('Todas');

  useEffect(() => {
    if (!tempoRealAtivo) return;

    const intervalo = setInterval(() => {
      const clientes = ['Bradesco Saúde', 'Sul América Saúde', 'Amil Saúde', 'Particular'];
      const statusOpcoes: DemandaFinanceira['status'][] = ['Faturar', 'Faturado', 'Auditoria', 'Pendencia', 'Glosado'];
      const prioridades: DemandaFinanceira['prioridade'][] = ['Alta', 'Média', 'Baixa'];

      const novaDemanda: DemandaFinanceira = {
        id: `FAT-${Math.floor(1050 + Math.random() * 900)}`,
        cliente: clientes[Math.floor(Math.random() * clientes.length)],
        descricao: `Lote Automático #${Math.floor(10 + Math.random() * 89)}`,
        valor: Math.floor(150 + Math.random() * 15000),
        status: statusOpcoes[Math.floor(Math.random() * statusOpcoes.length)],
        prioridade: prioridades[Math.floor(Math.random() * prioridades.length)],
        atualizadoHa: 'Agora mesmo'
      };

      setDemandas((listaAnterior) => [novaDemanda, ...listaAnterior.slice(0, 19)])

    }, 6000);

    return () => clearInterval(intervalo);

  }, [tempoRealAtivo]);

  const demandasFiltradas = demandas.filter((demanda) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const bateTexto = demanda.id.toLocaleLowerCase().includes(termo) || demanda.cliente.toLocaleLowerCase().includes(termo) || demanda.descricao.toLowerCase().includes(termo);
    const bateStatus = filtroStatus === 'Todos' || demanda.status === filtroStatus;
    const batePrioridade = filtroPrioridade === 'Todas' || demanda.prioridade === filtroPrioridade;

    return bateTexto && bateStatus && batePrioridade;
  });


  const totalFaturado = demandas.filter((d) => d.status === 'Faturado').reduce((soma, item) => soma + item.valor, 0)
  const totalAuditoria = demandas.filter((d) => d.status === 'Auditoria').reduce((soma, item) => soma + item.valor, 0)
  const totalPendencia = demandas.filter((d) => d.status === 'Pendencia').reduce((soma, item) => soma + item.valor, 0)
  const totalGlosado = demandas.filter((d) => d.status === 'Glosado').reduce((soma, item) => soma + item.valor, 0)

  return (
    <div className="app-container">
      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className="sidebar">
        <div className="brand-title">
          <Activity size={28} />
          <span>Gwaan Analytics</span>
        </div>

        <nav>
          <ul className="nav-list">
            <li
              className={`nav-item ${abaAtiva === 'dashboard' ? 'active' : ''}`}
              onClick={() => setAbaAtiva('dashboard')}
            >
              <LayoutDashboard size={20} />
              <span>Visão Geral</span>
            </li>
            <li
              className={`nav-item ${abaAtiva === 'demandas' ? 'active' : ''}`}
              onClick={() => setAbaAtiva('demandas')}
            >
              <ListTodo size={20} />
              <span>Controle de Demandas</span>
            </li>
            <li
              className={`nav-item ${abaAtiva === 'configuracoes' ? 'active' : ''}`}
              onClick={() => setAbaAtiva('configuracoes')}
            >
              <Settings size={20} />
              <span>Configurações</span>
            </li>
          </ul>
        </nav>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="main-content">
        <header className="header">
          {/* Indicador e Botão de Pausa do Tempo Real */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: tempoRealAtivo ? '#10b981' : '#f59e0b',
              fontSize: '0.9rem'
            }}>
              <Radio size={18} />
              <span>{tempoRealAtivo ? 'Recebendo Lotes em Tempo Real (6s)' : 'Tempo Real Pausado'}</span>
            </div>

            <button
              className="btn-realtime"
              onClick={() => setTempoRealAtivo(!tempoRealAtivo)}
            >
              {tempoRealAtivo ? <Pause size={15} /> : <Play size={15} />}
              <span>{tempoRealAtivo ? 'Pausar' : 'Retomar'}</span>
            </button>
          </div>

          <div className="user-profile">
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Analista Senior</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Faturamento & Contas</p>
            </div>
            <img
              src="/imagens/profile.jpg"
              alt="Foto de Perfil"
              className="user-avatar"
            />
          </div>
        </header>

        <main className="dashboard-body">
          <div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
              Monitoramento de Faturamento
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Acompanhamento financeiro de lotes, auditoria e controle de glosas em tempo real.
            </p>
          </div>

          <section className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span>Receita Faturada</span>
                <CheckCircle2 size={20} color="#10b981" />
              </div>
              <div className="kpi-value">{formatarMoeda(totalFaturado)}</div>
              <div className="kpi-subtitle">Guias e faturas aprovadas</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span>Em Auditoria</span>
                <Clock size={20} color="#3b82f6" />
              </div>
              <div className="kpi-value">{formatarMoeda(totalAuditoria)}</div>
              <div className="kpi-subtitle">Aguardando liberação ou envio</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span>Pendente</span>
                <AlertCircle size={20} color="#effd25ff" />
              </div>
              <div className="kpi-value">{formatarMoeda(totalPendencia)}</div>
              <div className="kpi-subtitle">Aguardando envio ou correção</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span>Valor Glosado / Retido</span>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <div className="kpi-value">{formatarMoeda(totalGlosado)}</div>
              <div className="kpi-subtitle">Exige recurso ou correção</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span>Total de Demandas Ativas</span>
                <DollarSign size={20} color="#a855f7" />
              </div>
              <div className="kpi-value">{demandas.length} Lotes</div>
              <div className="kpi-subtitle">Exibindo {demandasFiltradas.length} na lista abaixo</div>
            </div>
          </section>

          <section className="demandas-section">
            <div className="filters-bar">
              <div>
                <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={18} color="#10b981" />
                  <span>Fila de Guias e Lotes Processados</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Use os filtros ao lado para localizar guias específicas em tempo real.
                </p>
              </div>

              <div className="filters-controls">
                <div className="search-box">
                  <Search size={16} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Buscar guia, convênio ou lote..."
                    value={buscaTexto}
                    onChange={(evento) => setBuscaTexto(evento.target.value)}
                  />
                </div>

                <select
                  className="filter-select"
                  value={filtroStatus}
                  onChange={(evento) => setFiltroStatus(evento.target.value)}
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
                  onChange={(evento) => setFiltroPrioridade(evento.target.value)}
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
                  </tr>
                </thead>
                <tbody>
                  {demandasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                        Nenhuma guia encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    demandasFiltradas.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600, color: '#10b981' }}>{item.id}</td>
                        <td style={{ fontWeight: 500 }}>{item.cliente}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{item.descricao}</td>
                        <td>{item.prioridade}</td>
                        <td style={{ fontWeight: 600 }}>{formatarMoeda(item.valor)}</td>
                        <td>
                          <span className={obterClasseBadge(item.status)}>
                            {item.status}
                          </span>
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
    </div>
  );
}

export default App;