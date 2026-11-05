import { useState, type FormEvent } from 'react';
import {
  Building2,
  Calendar as CalendarIcon,
  Plus,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Search
} from 'lucide-react';
import type { DemandaFinanceira, Operadora } from '../data/dadosFaturamento';
import { formatarCNPJ, formatarDataBR, formatarMoeda } from '../utils/formatadores';
import { ActionMenu } from '../components/ActionMenu';
import {
  ExpandableFilterPanel,
  ExpandableFilterToggle
} from '../components/ExpandableFilterBar';

interface OperadorasPageProps {
  operadoras: Operadora[];
  demandas: DemandaFinanceira[];
  aoAdicionarOperadora: (dados: Omit<Operadora, 'id'>) => void;
  aoEditarOperadora: (operadora: Operadora) => void;
  aoRemoverOperadora: (id: string) => void;
}

const CORES_OPERADORAS_CALENDARIO = [
  '#778873',
  '#5A6B57',
  '#8FA986',
  '#63735f'
];

const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function OperadorasPage({
  operadoras,
  demandas,
  aoAdicionarOperadora,
  aoEditarOperadora,
  aoRemoverOperadora
}: OperadorasPageProps) {
  const [anoCalendario, setAnoCalendario] = useState<number>(() =>
    new Date().getFullYear()
  );
  const [mesCalendario, setMesCalendario] = useState<number>(() =>
    new Date().getMonth()
  );
  const [operadoraFocoCalendario, setOperadoraFocoCalendario] = useState<string>('Todas');

  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(false);
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroComDatas, setFiltroComDatas] = useState<string>('Todas');

  const [idEmEdicao, setIdEmEdicao] = useState<string | null>(null);
  const [nome, setNome] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
  const [datasEnvioForm, setDatasEnvioForm] = useState<string[]>([]);
  const [novaDataInput, setNovaDataInput] = useState<string>('');
  const [indiceDataEditando, setIndiceDataEditando] = useState<number | null>(null);
  const [valorDataEditando, setValorDataEditando] = useState<string>('');

  const qtdFiltrosAtivos =
    (buscaTexto.trim() ? 1 : 0) + (filtroComDatas !== 'Todas' ? 1 : 0);

  function limparFiltrosTabela() {
    setBuscaTexto('');
    setFiltroComDatas('Todas');
  }

  function limparFormulario() {
    setIdEmEdicao(null);
    setNome('');
    setCnpj('');
    setDatasEnvioForm([]);
    setNovaDataInput('');
    setIndiceDataEditando(null);
    setValorDataEditando('');
  }

  function iniciarEdicao(op: Operadora) {
    setIdEmEdicao(op.id);
    setNome(op.nome);
    setCnpj(op.cnpj);
    setDatasEnvioForm([...op.datasEnvio].sort());
    setNovaDataInput('');
    setIndiceDataEditando(null);
    setOperadoraFocoCalendario(op.id);
  }

  function adicionarDataNoFormulario() {
    if (!novaDataInput) return;
    if (datasEnvioForm.includes(novaDataInput)) {
      alert('Esta data de envio já está incluída para a operadora!');
      return;
    }
    setDatasEnvioForm((ant) => [...ant, novaDataInput].sort());
    setNovaDataInput('');
  }

  function salvarEdicaoDataFormulario(indice: number) {
    if (!valorDataEditando) return;
    setDatasEnvioForm((ant) => {
      const copia = [...ant];
      copia[indice] = valorDataEditando;
      return Array.from(new Set(copia)).sort();
    });
    setIndiceDataEditando(null);
    setValorDataEditando('');
  }

  function removerDataDoFormulario(dataAlvo: string) {
    setDatasEnvioForm((ant) => ant.filter((d) => d !== dataAlvo));
  }

  function submeterOperadora(evento: FormEvent) {
    evento.preventDefault();
    const nomeLimpo = nome.trim();
    const cnpjLimpo = cnpj.trim();

    if (!nomeLimpo || cnpjLimpo.replace(/\D/g, '').length < 14) {
      alert('Informe o Nome da Operadora e um CNPJ válido com 14 dígitos!');
      return;
    }

    const duplicada = operadoras.some(
      (op) =>
        op.id !== idEmEdicao &&
        (op.nome.toLocaleLowerCase() === nomeLimpo.toLocaleLowerCase() ||
          op.cnpj === cnpjLimpo)
    );

    if (duplicada) {
      alert('Já existe uma operadora cadastrada com este Nome ou CNPJ!');
      return;
    }

    if (idEmEdicao) {
      aoEditarOperadora({
        id: idEmEdicao,
        nome: nomeLimpo,
        cnpj: cnpjLimpo,
        datasEnvio: datasEnvioForm
      });
    } else {
      aoAdicionarOperadora({
        nome: nomeLimpo,
        cnpj: cnpjLimpo,
        datasEnvio: datasEnvioForm
      });
    }

    limparFormulario();
  }

  function alternarDataNoCalendario(dataISO: string) {
    if (idEmEdicao) {
      if (datasEnvioForm.includes(dataISO)) {
        removerDataDoFormulario(dataISO);
      } else {
        setDatasEnvioForm((ant) => [...ant, dataISO].sort());
      }
      return;
    }

    if (operadoraFocoCalendario !== 'Todas') {
      const opAlvo = operadoras.find((op) => op.id === operadoraFocoCalendario);
      if (!opAlvo) return;
      const jaPossui = opAlvo.datasEnvio.includes(dataISO);
      const novasDatas = jaPossui
        ? opAlvo.datasEnvio.filter((d) => d !== dataISO)
        : [...opAlvo.datasEnvio, dataISO].sort();

      aoEditarOperadora({
        ...opAlvo,
        datasEnvio: novasDatas
      });
      return;
    }

    if (!datasEnvioForm.includes(dataISO)) {
      setDatasEnvioForm((ant) => [...ant, dataISO].sort());
    }
  }

  function navegarMes(direcao: -1 | 1) {
    let novoMes = mesCalendario + direcao;
    let novoAno = anoCalendario;
    if (novoMes < 0) {
      novoMes = 11;
      novoAno -= 1;
    } else if (novoMes > 11) {
      novoMes = 0;
      novoAno += 1;
    }
    setMesCalendario(novoMes);
    setAnoCalendario(novoAno);
  }

  const primeiroDiaSemana = new Date(anoCalendario, mesCalendario, 1).getDay();
  const totalDiasMes = new Date(anoCalendario, mesCalendario + 1, 0).getDate();

  const celulasCalendario: (number | null)[] = [];
  for (let i = 0; i < primeiroDiaSemana; i++) {
    celulasCalendario.push(null);
  }
  for (let dia = 1; dia <= totalDiasMes; dia++) {
    celulasCalendario.push(dia);
  }

  function montarDataISO(dia: number): string {
    const m = String(mesCalendario + 1).padStart(2, '0');
    const d = String(dia).padStart(2, '0');
    return `${anoCalendario}-${m}-${d}`;
  }

  const operadorasFiltradas = operadoras.filter((op) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const bateTexto =
      op.id.toLocaleLowerCase().includes(termo) ||
      op.nome.toLocaleLowerCase().includes(termo) ||
      op.cnpj.toLocaleLowerCase().includes(termo);
    const bateDatas =
      filtroComDatas === 'Todas' ||
      (filtroComDatas === 'ComDatas'
        ? op.datasEnvio.length > 0
        : op.datasEnvio.length === 0);
    return bateTexto && bateDatas;
  });

  return (
    <main className="dashboard-body">
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>
          Cadastro de Operadoras e Calendário de Envios
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Gerencie operadoras (Nome, CNPJ e Datas de Envio) e acompanhe no calendário os
          prazos de faturamento marcados com a paleta do sistema.
        </p>
      </div>

      <section className="operadoras-grid-layout">
        <div className="demandas-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="#778873" />
              <span>{idEmEdicao ? 'Editar Operadora' : 'Nova Operadora'}</span>
            </h2>
            {idEmEdicao && (
              <button type="button" className="btn-realtime" onClick={limparFormulario}>
                <X size={14} />
                <span>Cancelar Edição</span>
              </button>
            )}
          </div>

          <form onSubmit={submeterOperadora} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Nome da Operadora</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Bradesco Saúde"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>CNPJ</label>
              <input
                type="text"
                className="form-input"
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label>Datas de Envio Programadas</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="date"
                  className="form-input"
                  style={{ flex: 1 }}
                  value={novaDataInput}
                  onChange={(e) => setNovaDataInput(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-outline"
                  onClick={adicionarDataNoFormulario}
                >
                  <Plus size={16} />
                  <span>Incluir Data</span>
                </button>
              </div>
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                Dica: Você também pode clicar diretamente nos dias do calendário ao lado para
                marcar ou desmarcar datas de envio.
              </small>

              <div className="datas-chips-container">
                {datasEnvioForm.length === 0 ? (
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Nenhuma data de envio adicionada.
                  </span>
                ) : (
                  datasEnvioForm.map((dataISO, idx) => (
                    <div key={dataISO} className="data-envio-chip">
                      {indiceDataEditando === idx ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <input
                            type="date"
                            className="chip-date-input"
                            value={valorDataEditando}
                            onChange={(e) => setValorDataEditando(e.target.value)}
                          />
                          <button
                            type="button"
                            className="chip-btn"
                            title="Confirmar alteração de data"
                            onClick={() => salvarEdicaoDataFormulario(idx)}
                          >
                            <Check size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span>{formatarDataBR(dataISO)}</span>
                          <button
                            type="button"
                            className="chip-btn"
                            title="Alterar esta data"
                            onClick={() => {
                              setIndiceDataEditando(idx);
                              setValorDataEditando(dataISO);
                            }}
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            className="chip-btn chip-btn-danger"
                            title="Excluir esta data"
                            onClick={() => removerDataDoFormulario(dataISO)}
                          >
                            <X size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
              <Check size={17} />
              <span>{idEmEdicao ? 'Salvar Alterações da Operadora' : 'Cadastrar Operadora'}</span>
            </button>
          </form>
        </div>

        <div className="demandas-section">
          <div className="filters-bar">
            <div>
              <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarIcon size={18} color="#778873" />
                <span>Calendário de Datas de Envio</span>
              </h2>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                {idEmEdicao
                  ? `Modo Edição Ativo: clique nos dias para alterar as datas de "${nome || 'Operadora'}"`
                  : operadoraFocoCalendario !== 'Todas'
                    ? 'Clique em qualquer dia do calendário para marcar/desmarcar envio na operadora filtrada.'
                    : 'Exibindo datas de envio de todas as operadoras cadastradas.'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                className="filter-select"
                value={operadoraFocoCalendario}
                onChange={(e) => setOperadoraFocoCalendario(e.target.value)}
              >
                <option value="Todas">Filtrar: Todas as Operadoras</option>
                {operadoras.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.nome}
                  </option>
                ))}
              </select>

              <div className="calendar-nav">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => navegarMes(-1)}
                  title="Mês Anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="calendar-month-label">
                  {NOMES_MESES[mesCalendario]} {anoCalendario}
                </span>
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => navegarMes(1)}
                  title="Próximo Mês"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="calendar-grid-header">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="calendar-weekday">
                {dia}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {celulasCalendario.map((dia, index) => {
              if (dia === null) {
                return <div key={`empty-${index}`} className="calendar-day empty" />;
              }

              const dataISO = montarDataISO(dia);

              const operadorasNoDia = operadoras.filter((op) => {
                if (operadoraFocoCalendario !== 'Todas' && op.id !== operadoraFocoCalendario) {
                  return false;
                }
                if (idEmEdicao && op.id === idEmEdicao) {
                  return datasEnvioForm.includes(dataISO);
                }
                return op.datasEnvio.includes(dataISO);
              });

              const marcadaNoFormNovo = !idEmEdicao && datasEnvioForm.includes(dataISO);
              const possuiEnvio = operadorasNoDia.length > 0 || marcadaNoFormNovo;

              return (
                <div
                  key={dataISO}
                  className={`calendar-day ${possuiEnvio ? 'marked' : ''}`}
                  onClick={() => alternarDataNoCalendario(dataISO)}
                  title={`Dia ${formatarDataBR(dataISO)} — Clique para adicionar/remover envio`}
                >
                  <span className="calendar-day-number">{dia}</span>

                  <div className="calendar-day-tags">
                    {operadorasNoDia.map((op) => {
                      const idxCor =
                        operadoras.findIndex((item) => item.id === op.id) %
                        CORES_OPERADORAS_CALENDARIO.length;
                      const corFundo = CORES_OPERADORAS_CALENDARIO[Math.max(0, idxCor)];
                      return (
                        <span
                          key={op.id}
                          className="calendar-op-pill"
                          style={{ backgroundColor: corFundo }}
                        >
                          {op.nome.replace(/\s*Saúde$/i, '')}
                        </span>
                      );
                    })}
                    {marcadaNoFormNovo && (
                      <span
                        className="calendar-op-pill"
                        style={{ backgroundColor: '#A1BC98', color: '#2C352B' }}
                      >
                        Nova Op.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="calendar-legend-bar">
            {operadoras.map((op, index) => {
              const cor =
                CORES_OPERADORAS_CALENDARIO[index % CORES_OPERADORAS_CALENDARIO.length];
              return (
                <div key={op.id} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: cor }} />
                  <span>
                    <strong>{op.nome}</strong> ({op.datasEnvio.length}{' '}
                    {op.datasEnvio.length === 1 ? 'data' : 'datas'})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="demandas-section">
        <div className="filters-bar">
          <div>
            <h2 style={{ fontSize: '1.2rem' }}>
              Operadoras Cadastradas ({operadorasFiltradas.length})
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Visualize CNPJ, volume vinculado, calendário de envios e gerencie os registros.
            </p>
          </div>

          <ExpandableFilterToggle
            aberto={painelFiltrosAberto}
            aoAlternar={() => setPainelFiltrosAberto((ant) => !ant)}
            qtdAtivos={qtdFiltrosAtivos}
            aoLimpar={limparFiltrosTabela}
          />
        </div>

        <ExpandableFilterPanel aberto={painelFiltrosAberto} aoLimpar={limparFiltrosTabela}>
          <div className="search-box" style={{ flex: 1, minWidth: '240px' }}>
            <Search size={16} color="#5A6B57" />
            <input
              type="text"
              placeholder="Buscar operadora por código, nome ou CNPJ..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filtroComDatas}
            onChange={(e) => setFiltroComDatas(e.target.value)}
          >
            <option value="Todas">Datas de Envio: Todas</option>
            <option value="ComDatas">Com Datas Programadas</option>
            <option value="SemDatas">Sem Datas Programadas</option>
          </select>
        </ExpandableFilterPanel>

        <div className="table-container">
          <table className="demandas-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Operadora</th>
                <th>CNPJ</th>
                <th>Datas de Envio Marcadas</th>
                <th>Lotes Vinculados</th>
                <th>Volume Financeiro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {operadorasFiltradas.map((op) => {
                const lotesOp = demandas.filter((d) => d.operadora === op.nome);
                const volumeOp = lotesOp.reduce((soma, item) => soma + item.valor, 0);

                return (
                  <tr key={op.id}>
                    <td style={{ fontWeight: 700, color: '#778873' }}>{op.id}</td>
                    <td style={{ fontWeight: 600 }}>{op.nome}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}>{op.cnpj}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {op.datasEnvio.length === 0 ? (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            Sem datas definidas
                          </span>
                        ) : (
                          op.datasEnvio.map((d) => (
                            <span key={d} className="badge badge-faturar">
                              {formatarDataBR(d)}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td>{lotesOp.length} lotes</td>
                    <td style={{ fontWeight: 600 }}>{formatarMoeda(volumeOp)}</td>
                    <td>
                      <ActionMenu
                        opcoes={[
                          {
                            rotulo: 'Editar Operadora',
                            icone: <Pencil size={14} />,
                            aoClicar: () => iniciarEdicao(op)
                          },
                          {
                            rotulo: 'Focar no Calendário',
                            icone: <CalendarIcon size={14} />,
                            aoClicar: () => setOperadoraFocoCalendario(op.id)
                          }
                        ]}
                        aoExcluir={() => aoRemoverOperadora(op.id)}
                        tituloExcluir="Excluir Operadora"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
