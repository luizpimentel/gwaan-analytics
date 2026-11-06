import { useState, type FormEvent } from 'react';
import {
  FileText,
  Search,
  Printer,
  CheckCircle2,
  Layers,
  DollarSign,
  Pencil,
  XCircle,
  X,
  Check,
  Plus,
  KeyRound
} from 'lucide-react';
import {
  extrairGuiasDaConsulta,
  type Atendimento,
  type DemandaFinanceira,
  type GuiaLote,
  type Operadora,
  type Paciente,
  type Profissional,
  type TipoAtendimentoLote
} from '../data/dadosFaturamento';
import {
  formatarDataBR,
  formatarMoeda,
  obterClasseBadgeAtendimento
} from '../utils/formatadores';
import { ActionMenu } from '../components/ActionMenu';
import {
  ExpandableFilterPanel,
  ExpandableFilterToggle
} from '../components/ExpandableFilterBar';
import { ModalGuiaTuss } from '../components/ModalGuiaTuss';

interface GuiasPageProps {
  atendimentos: Atendimento[];
  demandas: DemandaFinanceira[];
  guiasExtrasCriadas?: GuiaLote[];
  pacientes: Paciente[];
  medicos: Profissional[];
  operadoras: Operadora[];
  aoCriarNovaGuiaTuss?: (novaGuia: GuiaLote) => void;
  aoEditarGuiaTuss: (
    guiaId: string,
    dados: {
      codigoTuss: string;
      descricao: string;
      valor: number;
      senhaAutorizacao?: string;
    }
  ) => void;
  aoCancelarGuiaTuss: (guiaId: string) => void;
  aoExcluirGuiaTuss: (guiaId: string) => void;
}

const TIPOS_ATENDIMENTO_GUIA: TipoAtendimentoLote[] = [
  'Consulta',
  'SADT / Exames',
  'Internação',
  'Cirurgia / Procedimento',
  'Oncologia / Terapia',
  'Misto'
];

type GuiaConsolidadaRow = Atendimento & {
  numeroGuiaPK: string;
  numeroGuiaOperadoraExibido: string;
  consultaIdPK: string;
  loteVinculadoId?: string;
  faturaVinculadaId?: string;
};

export function GuiasPage({
  atendimentos,
  demandas,
  guiasExtrasCriadas = [],
  pacientes,
  medicos,
  operadoras,
  aoCriarNovaGuiaTuss,
  aoEditarGuiaTuss,
  aoCancelarGuiaTuss,
  aoExcluirGuiaTuss
}: GuiasPageProps) {
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(false);
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroOperadora, setFiltroOperadora] = useState<string>('Todas');

  const [guiaSelecionada, setGuiaSelecionada] =
    useState<GuiaConsolidadaRow | null>(null);

  // Modal de Edição de Guia
  const [guiaEmEdicao, setGuiaEmEdicao] = useState<GuiaConsolidadaRow | null>(
    null
  );
  const [abaModalEdicao, setAbaModalEdicao] = useState<'dados' | 'chaves'>(
    'dados'
  );
  const [editCodigoTuss, setEditCodigoTuss] = useState<string>('');
  const [editSenhaAutorizacao, setEditSenhaAutorizacao] = useState<string>('');
  const [editDescricao, setEditDescricao] = useState<string>('');
  const [editValor, setEditValor] = useState<string>('');

  // Modal de Criar Nova Guia (G-nº) para Consulta já Realizada (CONS-nº)
  const [modalNovaGuiaAberto, setModalNovaGuiaAberto] = useState<boolean>(false);
  const [abaModalNovaGuia, setAbaModalNovaGuia] = useState<
    'vinculo' | 'procedimento'
  >('vinculo');
  const [atdRealizadoId, setAtdRealizadoId] = useState<string>('');
  const [novoNumeroGuia, setNovoNumeroGuia] = useState<string>('');
  const [novaSenhaAutorizacao, setNovaSenhaAutorizacao] = useState<string>('');
  const [novoTipoAtendimento, setNovoTipoAtendimento] =
    useState<TipoAtendimentoLote>('SADT / Exames');
  const [novoCodigoTuss, setNovoCodigoTuss] = useState<string>('3010155');
  const [novaDescricaoGuia, setNovaDescricaoGuia] = useState<string>('');
  const [novoValorGuia, setNovoValorGuia] = useState<string>('');

  // Apenas consultas Realizadas são visíveis no sistema
  const atendimentosRealizados = atendimentos.filter(
    (a) => a.status === 'Realizado' && !a.guiaCancelada
  );

  // Extrai todas as guias de cada consulta realizada
  const guiasDeAtendimentos: GuiaConsolidadaRow[] =
    atendimentosRealizados.flatMap((a) => {
      const guiasExtraidas = extrairGuiasDaConsulta(a);
      return guiasExtraidas.map((gd) => {
        const numPK = gd.numeroGuia;
        const numOpe =
          a.operadora === 'Particular'
            ? numPK
            : gd.numeroGuiaOperadora || a.numeroGuiaOperadora || numPK;
        const lote = demandas.find((d) =>
          d.guias.some((g) => g.id.toUpperCase() === numPK.toUpperCase())
        );
        const guiaNoLote = lote?.guias.find(
          (g) => g.id.toUpperCase() === numPK.toUpperCase()
        );
        return {
          ...a,
          numeroGuia: numPK,
          numeroGuiaPK: numPK,
          numeroGuiaOperadora: numOpe,
          numeroGuiaOperadoraExibido: guiaNoLote?.numeroGuiaOperadora || numOpe,
          consultaIdPK: a.id,
          senhaAutorizacao: gd.senhaAutorizacao,
          codigoTuss: gd.codigoTussPrincipal,
          descricao: gd.descricao,
          procedimentos: gd.procedimentos,
          valor: gd.valorTotal,
          desconto: gd.desconto,
          loteVinculadoId: lote?.id,
          faturaVinculadaId: guiaNoLote?.faturaId
        };
      });
    });

  const todasGuiasMap = new Map<string, GuiaConsolidadaRow>();

  guiasDeAtendimentos.forEach((ga) => {
    todasGuiasMap.set(ga.numeroGuiaPK.toUpperCase(), ga);
  });

  // Inclui guias extras criadas para consultas já realizadas
  guiasExtrasCriadas.forEach((ge) => {
    const chave = ge.id.toUpperCase();
    if (!todasGuiasMap.has(chave)) {
      const atdPai = atendimentos.find((a) => a.id === ge.atendimentoId);
      const lote = demandas.find((d) =>
        d.guias.some((g) => g.id.toUpperCase() === chave)
      );
      const guiaNoLote = lote?.guias.find((g) => g.id.toUpperCase() === chave);
      const opGuiaExtra = atdPai?.operadora || 'Bradesco Saúde';
      const numOpe =
        ge.numeroGuiaOperadora || guiaNoLote?.numeroGuiaOperadora || ge.id;
      todasGuiasMap.set(chave, {
        id: atdPai?.id || ge.atendimentoId || ge.id,
        consultaIdPK: atdPai?.id || ge.atendimentoId || 'CONS-EXTRA',
        numeroGuia: ge.id,
        numeroGuiaPK: ge.id,
        numeroGuiaOperadora: numOpe,
        numeroGuiaOperadoraExibido: numOpe,
        senhaAutorizacao:
          opGuiaExtra === 'Particular'
            ? undefined
            : ge.senhaAutorizacao || 'AUTH-EXTRA',
        tipoAtendimento: ge.tipoAtendimento || 'SADT / Exames',
        codigoTuss: ge.codigoTuss || '10101012',
        pacienteId: ge.pacienteId || atdPai?.pacienteId || 'PAC-REALIZADO',
        pacienteNome: ge.pacienteNome,
        medicoId: atdPai?.medicoId || 'PROF-101',
        medicoNome: ge.medicoNome,
        especialidade: atdPai?.especialidade || ge.tipoAtendimento || 'Clínica',
        descricao: ge.procedimento,
        procedimentos: ge.procedimentos,
        data: ge.data,
        hora: atdPai?.hora || '10:00',
        operadora: opGuiaExtra,
        status: 'Realizado',
        valor: ge.valor,
        loteVinculadoId: lote?.id,
        faturaVinculadaId: guiaNoLote?.faturaId || ge.faturaId
      });
    }
  });

  // Inclui também guias que estejam dentro dos lotes caso não estejam acima
  demandas.forEach((lote) => {
    lote.guias.forEach((g) => {
      const chave = g.id.toUpperCase();
      if (!todasGuiasMap.has(chave)) {
        const numOpe = g.numeroGuiaOperadora || g.id;
        todasGuiasMap.set(chave, {
          id: g.atendimentoId || g.id,
          consultaIdPK: g.atendimentoId || 'CONS-LOTE',
          numeroGuia: g.id,
          numeroGuiaPK: g.id,
          numeroGuiaOperadora: numOpe,
          numeroGuiaOperadoraExibido: numOpe,
          senhaAutorizacao: g.senhaAutorizacao || `AUTH-${g.id}`,
          tipoAtendimento: g.tipoAtendimento || lote.tipoAtendimento,
          codigoTuss: g.codigoTuss || '10101012',
          pacienteId: g.pacienteId || 'PAC-LOTE',
          pacienteNome: g.pacienteNome,
          medicoId: 'PROF-101',
          medicoNome: g.medicoNome,
          especialidade: lote.tipoAtendimento,
          descricao: g.procedimento,
          procedimentos: g.procedimentos,
          data: g.data,
          hora: '10:00',
          operadora: lote.operadora,
          status: 'Realizado',
          valor: g.valor,
          loteVinculadoId: lote.id,
          faturaVinculadaId: g.faturaId
        });
      }
    });
  });

  const todasGuias = Array.from(todasGuiasMap.values());

  const qtdFiltrosAtivos =
    (buscaTexto.trim() ? 1 : 0) + (filtroOperadora !== 'Todas' ? 1 : 0);

  function limparFiltros() {
    setBuscaTexto('');
    setFiltroOperadora('Todas');
  }

  function gerarCodigoGuiaLivre(): string {
    let candidato = 310 + Math.floor(Math.random() * 500);
    while (todasGuiasMap.has(`G-${candidato}`)) {
      candidato++;
    }
    return `G-${candidato}`;
  }

  function abrirModalNovaGuiaParaAtendimento() {
    const atdPadrao =
      atendimentosRealizados.find((a) => a.operadora !== 'Particular') ||
      atendimentosRealizados[0];
    if (!atdPadrao) {
      alert('Não há consultas realizadas disponíveis!');
      return;
    }
    setAtdRealizadoId(atdPadrao.id);
    setNovoNumeroGuia(gerarCodigoGuiaLivre());
    setNovaSenhaAutorizacao(
      atdPadrao.operadora === 'Particular'
        ? ''
        : `AUTH-${Math.floor(100000 + Math.random() * 900000)}`
    );
    setNovoTipoAtendimento(atdPadrao.tipoAtendimento || 'SADT / Exames');
    setNovoCodigoTuss('3010155');
    setNovaDescricaoGuia('');
    setNovoValorGuia('450');
    setAbaModalNovaGuia('vinculo');
    setModalNovaGuiaAberto(true);
  }

  function submeterNovaGuia(evento: FormEvent) {
    evento.preventDefault();
    const numLimpo = novoNumeroGuia.trim().toUpperCase();
    if (!numLimpo) {
      alert('Informe o código da Guia (G-nº)!');
      return;
    }

    if (todasGuiasMap.has(numLimpo)) {
      alert(
        `Já existe uma guia com o código "${numLimpo}". O código G-nº é chave primária única no sistema!`
      );
      return;
    }

    const atdAlvo = atendimentosRealizados.find((a) => a.id === atdRealizadoId);
    if (!atdAlvo) {
      alert('Selecione uma consulta realizada válida!');
      return;
    }

    const valNum = parseFloat(novoValorGuia);
    if (!novaDescricaoGuia.trim() || isNaN(valNum) || valNum <= 0) {
      setAbaModalNovaGuia('procedimento');
      alert('Preencha o procedimento e um valor válido para a guia!');
      return;
    }

    if (aoCriarNovaGuiaTuss) {
      const ehParticular = atdAlvo.operadora === 'Particular';
      const senhaFinal = ehParticular
        ? undefined
        : novaSenhaAutorizacao.trim() ||
          `AUTH-${Date.now().toString().slice(-5)}`;

      aoCriarNovaGuiaTuss({
        id: numLimpo,
        atendimentoId: atdAlvo.id,
        senhaAutorizacao: senhaFinal,
        tipoAtendimento: novoTipoAtendimento,
        codigoTuss: novoCodigoTuss.trim() || '3010155',
        pacienteId: atdAlvo.pacienteId,
        pacienteNome: atdAlvo.pacienteNome,
        medicoNome: atdAlvo.medicoNome,
        procedimento: novaDescricaoGuia.trim(),
        procedimentos: [
          {
            id: `PROC-${Date.now()}`,
            codigoTuss: novoCodigoTuss.trim() || '3010155',
            descricao: novaDescricaoGuia.trim(),
            valor: valNum,
            senhaAutorizacao: senhaFinal,
            numeroGuia: numLimpo
          }
        ],
        data: atdAlvo.data,
        valor: valNum,
        statusGuia: 'Realizado'
      });
    }

    setModalNovaGuiaAberto(false);
  }

  function abrirModalEditarGuia(guia: GuiaConsolidadaRow) {
    setGuiaEmEdicao(guia);
    setAbaModalEdicao('dados');
    setEditCodigoTuss(guia.codigoTuss || '10101012');
    setEditSenhaAutorizacao(
      guia.operadora === 'Particular' ? '' : guia.senhaAutorizacao || 'AUTH-1001'
    );
    setEditDescricao(guia.descricao);
    setEditValor(String(guia.valor));
  }

  function salvarEdicaoGuia(evento: FormEvent) {
    evento.preventDefault();
    if (!guiaEmEdicao) return;
    const valNum = parseFloat(editValor);
    if (!editDescricao.trim() || isNaN(valNum) || valNum <= 0) {
      setAbaModalEdicao('dados');
      alert('Preencha o procedimento e um valor válido para a guia!');
      return;
    }

    aoEditarGuiaTuss(guiaEmEdicao.numeroGuiaPK, {
      codigoTuss: editCodigoTuss.trim() || '10101012',
      senhaAutorizacao:
        guiaEmEdicao.operadora === 'Particular'
          ? undefined
          : editSenhaAutorizacao.trim() || 'AUTH-1001',
      descricao: editDescricao.trim(),
      valor: valNum
    });
    setGuiaEmEdicao(null);
  }

  const filtradas = todasGuias.filter((g) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const bateTexto =
      g.numeroGuiaPK.toLocaleLowerCase().includes(termo) ||
      g.consultaIdPK.toLocaleLowerCase().includes(termo) ||
      g.pacienteId.toLocaleLowerCase().includes(termo) ||
      (g.senhaAutorizacao || '').toLocaleLowerCase().includes(termo) ||
      (g.codigoTuss || '').toLocaleLowerCase().includes(termo) ||
      g.pacienteNome.toLocaleLowerCase().includes(termo) ||
      g.medicoNome.toLocaleLowerCase().includes(termo) ||
      g.descricao.toLocaleLowerCase().includes(termo) ||
      (g.loteVinculadoId || '').toLocaleLowerCase().includes(termo) ||
      (g.faturaVinculadaId || '').toLocaleLowerCase().includes(termo);
    const bateOp =
      filtroOperadora === 'Todas' || g.operadora === filtroOperadora;
    return bateTexto && bateOp;
  });

  const volumeTotalGuias = filtradas.reduce(
    (acc, g) => acc + Math.max(0, g.valor - (g.desconto ?? 0)),
    0
  );
  const qtdEmLote = filtradas.filter((g) => Boolean(g.loteVinculadoId)).length;
  const qtdDisponiveisParaLote = filtradas.filter(
    (g) => !g.loteVinculadoId
  ).length;

  const opcoesOperadoras = Array.from(
    new Set([...operadoras.map((o) => o.nome), 'Particular'])
  );

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
            Central de Guias de Consulta (G-nº)
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Cada senha de autorização emitida pela operadora gera uma{' '}
            <strong>Guia única (G-nº)</strong> vinculada à{' '}
            <strong>Consulta (CONS-nº)</strong>. Consultas particulares não usam
            senha (cobrança na clínica).
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={abrirModalNovaGuiaParaAtendimento}
        >
          <Plus size={18} />
          <span>Nova Guia (G-nº) para Consulta Realizada</span>
        </button>
      </div>

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Guias de Consulta (G-nº)</span>
            <FileText size={20} color="#778873" />
          </div>
          <div className="kpi-value">{filtradas.length}</div>
          <div className="kpi-subtitle">
            nº guias === nº de senhas de autorização
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Volume Financeiro das Guias</span>
            <DollarSign size={20} color="#778873" />
          </div>
          <div className="kpi-value">{formatarMoeda(volumeTotalGuias)}</div>
          <div className="kpi-subtitle">Soma líquida das guias emitidas</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Livres para Novo Lote (LOTE-nº)</span>
            <CheckCircle2 size={20} color="#4d6b53" />
          </div>
          <div className="kpi-value">{qtdDisponiveisParaLote}</div>
          <div className="kpi-subtitle">Disponíveis para alocação em lote</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Alocadas em Lote / Fatura</span>
            <Layers size={20} color="#3b82f6" />
          </div>
          <div className="kpi-value">{qtdEmLote}</div>
          <div className="kpi-subtitle">Vinculadas a LOTE-nº e FAT-nº</div>
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
              <FileText size={18} color="#778873" />
              <span>Relação de Guias de Consulta ({filtradas.length})</span>
            </h2>
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
              placeholder="Buscar por G-nº, CONS-nº, PAC-nº, LOTE-nº, FAT-nº, senha de autorização ou paciente..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filtroOperadora}
            onChange={(e) => setFiltroOperadora(e.target.value)}
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
                <th>Cód. Guia Empresa</th>
                <th>Cód. Guia Operadora</th>
                <th>Consulta</th>
                <th>Senha de Autorização</th>
                <th>Cód. TUSS</th>
                <th>Paciente</th>
                <th>Médico Executante</th>
                <th>Procedimento(s) da Guia</th>
                <th>Data</th>
                <th>Operadora / Lote / Fatura</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      padding: '2rem'
                    }}
                  >
                    Nenhuma guia encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtradas.map((g) => {
                  const liquido = Math.max(0, g.valor - (g.desconto ?? 0));
                  return (
                    <tr
                      key={g.numeroGuiaPK}
                      className="clickable-row"
                      onClick={() => setGuiaSelecionada(g)}
                      title="Clique para visualizar ou imprimir a Guia de Consulta"
                    >
                      <td style={{ fontWeight: 700, color: '#778873' }}>
                        {g.numeroGuiaPK}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {g.numeroGuiaOperadoraExibido}
                      </td>
                      <td>
                        <span className="badge badge-aberto">
                          {g.consultaIdPK}
                        </span>
                      </td>
                      <td>
                        {g.operadora === 'Particular' ? (
                          <span
                            style={{
                              color: 'var(--text-secondary)',
                              fontSize: '0.78rem'
                            }}
                          >
                            Sem Senha (Clínica)
                          </span>
                        ) : (
                          <span className="badge badge-faturar">
                            {g.senhaAutorizacao || `AUTH-${g.numeroGuiaPK}`}
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {g.codigoTuss || '10101012'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{g.pacienteNome}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>
                          {g.pacienteId}
                        </small>
                      </td>
                      <td>
                        <div>{g.medicoNome}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>
                          {g.especialidade}
                        </small>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {g.descricao}
                      </td>
                      <td>{formatarDataBR(g.data)}</td>
                      <td>
                        <span className="badge badge-faturado">{g.operadora}</span>
                        {g.loteVinculadoId ? (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#4d6b53',
                              marginTop: '0.2rem',
                              fontWeight: 600
                            }}
                          >
                            {g.loteVinculadoId}
                            {g.faturaVinculadaId
                              ? ` • ${g.faturaVinculadaId}`
                              : ''}
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: '0.73rem',
                              color: 'var(--text-secondary)',
                              marginTop: '0.2rem'
                            }}
                          >
                            {g.operadora === 'Particular'
                              ? 'Cobrança na Clínica'
                              : 'Livre p/ Lote'}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatarMoeda(liquido)}</td>
                      <td>
                        <span className={obterClasseBadgeAtendimento('Realizado')}>
                          Realizado
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            flexWrap: 'nowrap'
                          }}
                        >
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => setGuiaSelecionada(g)}
                            title="Visualizar e Imprimir Guia G-nº"
                          >
                            <Printer size={13} />
                            <span>Ver/Imprimir</span>
                          </button>

                          <ActionMenu
                            opcoes={[
                              {
                                rotulo: 'Editar Guia',
                                icone: <Pencil size={14} />,
                                aoClicar: () => abrirModalEditarGuia(g)
                              },
                              {
                                rotulo: 'Cancelar Guia',
                                icone: <XCircle size={14} />,
                                aoClicar: () =>
                                  aoCancelarGuiaTuss(g.numeroGuiaPK)
                              }
                            ]}
                            aoExcluir={() => aoExcluirGuiaTuss(g.numeroGuiaPK)}
                            tituloExcluir="Excluir Guia"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {guiaSelecionada && (
        <ModalGuiaTuss
          atendimento={guiaSelecionada}
          paciente={pacientes.find((p) => p.id === guiaSelecionada.pacienteId)}
          medico={medicos.find((m) => m.id === guiaSelecionada.medicoId)}
          loteVinculadoId={guiaSelecionada.loteVinculadoId}
          faturaVinculadaId={guiaSelecionada.faturaVinculadaId}
          aoFechar={() => setGuiaSelecionada(null)}
        />
      )}

      {/* Modal de Criar Nova Guia (G-nº) para Consulta já Realizada (CONS-nº) */}
      {modalNovaGuiaAberto && (
        <div
          className="modal-overlay"
          onClick={() => setModalNovaGuiaAberto(false)}
        >
          <div
            className="modal-content modal-content-90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>
                  Emitir Nova Guia para Consulta Realizada
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Vincule um procedimento autorizado a uma consulta existente para emissão de guia.
                </p>
              </div>
              <button
                type="button"
                className="btn-icon-square"
                onClick={() => setModalNovaGuiaAberto(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-abas">
              <button
                type="button"
                className={`modal-aba-btn ${abaModalNovaGuia === 'vinculo' ? 'active' : ''}`}
                onClick={() => setAbaModalNovaGuia('vinculo')}
              >
                <KeyRound size={15} />
                <span>1. Consulta (CONS-nº), Guia (G-nº) & Senha</span>
              </button>
              <button
                type="button"
                className={`modal-aba-btn ${abaModalNovaGuia === 'procedimento' ? 'active' : ''}`}
                onClick={() => setAbaModalNovaGuia('procedimento')}
              >
                <FileText size={15} />
                <span>2. Procedimento TUSS e Valor</span>
              </button>
            </div>

            <form
              onSubmit={submeterNovaGuia}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {abaModalNovaGuia === 'vinculo' && (
                <>
                  <div className="form-group">
                    <label>Selecionar Consulta Realizada (CONS-nº)</label>
                    <select
                      className="form-input"
                      value={atdRealizadoId}
                      onChange={(e) => {
                        const idEscolhido = e.target.value;
                        setAtdRealizadoId(idEscolhido);
                        const atdEscolhido = atendimentosRealizados.find(
                          (a) => a.id === idEscolhido
                        );
                        if (atdEscolhido?.operadora === 'Particular') {
                          setNovaSenhaAutorizacao('');
                        } else if (!novaSenhaAutorizacao) {
                          setNovaSenhaAutorizacao(
                            `AUTH-${Math.floor(100000 + Math.random() * 900000)}`
                          );
                        }
                      }}
                      required
                    >
                      {atendimentosRealizados.map((atd) => (
                        <option key={atd.id} value={atd.id}>
                          [{atd.id}] {atd.pacienteNome} ({atd.pacienteId}) —{' '}
                          {atd.operadora} • {formatarDataBR(atd.data)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const atdSel = atendimentosRealizados.find(
                      (a) => a.id === atdRealizadoId
                    );
                    const ehPart = atdSel?.operadora === 'Particular';
                    return (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: ehPart
                            ? '1fr 1.2fr'
                            : '1fr 1fr 1.2fr',
                          gap: '0.75rem'
                        }}
                      >
                        <div className="form-group">
                          <label>Código da Guia (Chave Primária G-nº)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={novoNumeroGuia}
                            onChange={(e) => setNovoNumeroGuia(e.target.value)}
                            placeholder="Ex: G-305"
                            required
                          />
                        </div>

                        {!ehPart && (
                          <div className="form-group">
                            <label>Senha de Autorização (Operadora)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={novaSenhaAutorizacao}
                              onChange={(e) =>
                                setNovaSenhaAutorizacao(e.target.value)
                              }
                              placeholder="Ex: AUTH-884120"
                              required
                            />
                          </div>
                        )}

                        <div className="form-group">
                          <label>Modalidade da Guia</label>
                          <select
                            className="form-input"
                            value={novoTipoAtendimento}
                            onChange={(e) =>
                              setNovoTipoAtendimento(
                                e.target.value as TipoAtendimentoLote
                              )
                            }
                          >
                            {TIPOS_ATENDIMENTO_GUIA.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

              {abaModalNovaGuia === 'procedimento' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1fr',
                    gap: '0.75rem'
                  }}
                >
                  <div className="form-group">
                    <label>Código TUSS</label>
                    <input
                      type="text"
                      className="form-input"
                      value={novoCodigoTuss}
                      onChange={(e) => setNovoCodigoTuss(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Procedimento Autorizado na Guia ({novoNumeroGuia})</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Ressonância Magnética Complementar"
                      value={novaDescricaoGuia}
                      onChange={(e) => setNovaDescricaoGuia(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Valor da Guia (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      className="form-input"
                      value={novoValorGuia}
                      onChange={(e) => setNovoValorGuia(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-realtime"
                  onClick={() => setModalNovaGuiaAberto(false)}
                >
                  Cancelar
                </button>
                {abaModalNovaGuia === 'vinculo' ? (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setAbaModalNovaGuia('procedimento')}
                  >
                    <span>Avançar para Procedimento</span>
                  </button>
                ) : (
                  <button type="submit" className="btn-primary">
                    <Check size={16} />
                    <span>Salvar Nova Guia ({novoNumeroGuia})</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {guiaEmEdicao && (
        <div className="modal-overlay" onClick={() => setGuiaEmEdicao(null)}>
          <div
            className="modal-content modal-content-90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>
                  Editar Guia de Consulta — {guiaEmEdicao.numeroGuiaPK}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Atualize a senha de autorização, código TUSS e valores desta guia (
                  {guiaEmEdicao.operadora}).
                </p>
              </div>
              <button
                type="button"
                className="btn-icon-square"
                onClick={() => setGuiaEmEdicao(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="lote-summary-strip">
              <div>
                <span className="strip-label">Cód. Guia Empresa</span>
                <strong style={{ color: '#778873' }}>
                  {guiaEmEdicao.numeroGuiaPK}
                </strong>
              </div>
              <div>
                <span className="strip-label">Cód. Guia Operadora</span>
                <strong style={{ color: '#778873' }}>
                  {guiaEmEdicao.numeroGuiaOperadoraExibido}
                </strong>
              </div>
              <div>
                <span className="strip-label">Cód. Consulta</span>
                <strong>{guiaEmEdicao.consultaIdPK}</strong>
              </div>
              <div>
                <span className="strip-label">Paciente</span>
                <strong>
                  {guiaEmEdicao.pacienteId} — {guiaEmEdicao.pacienteNome}
                </strong>
              </div>
              <div>
                <span className="strip-label">Operadora</span>
                <strong>{guiaEmEdicao.operadora}</strong>
              </div>
            </div>

            <div className="modal-abas">
              <button
                type="button"
                className={`modal-aba-btn ${abaModalEdicao === 'dados' ? 'active' : ''}`}
                onClick={() => setAbaModalEdicao('dados')}
              >
                <Pencil size={15} />
                <span>Dados da Guia &amp; Senha de Autorização</span>
              </button>
              <button
                type="button"
                className={`modal-aba-btn ${abaModalEdicao === 'chaves' ? 'active' : ''}`}
                onClick={() => setAbaModalEdicao('chaves')}
              >
                <KeyRound size={15} />
                <span>Identificadores Vinculados</span>
              </button>
            </div>

            <form
              onSubmit={salvarEdicaoGuia}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}
            >

              {abaModalEdicao === 'dados' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      guiaEmEdicao.operadora === 'Particular'
                        ? '1fr 1.8fr 1fr'
                        : '1fr 1fr 1.8fr 1fr',
                    gap: '0.75rem'
                  }}
                >
                  {guiaEmEdicao.operadora !== 'Particular' && (
                    <div className="form-group">
                      <label>Senha de Autorização (Operadora)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editSenhaAutorizacao}
                        onChange={(e) => setEditSenhaAutorizacao(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Código TUSS</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editCodigoTuss}
                      onChange={(e) => setEditCodigoTuss(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Procedimento / Descrição da Guia</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editDescricao}
                      onChange={(e) => setEditDescricao(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Valor da Guia (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      className="form-input"
                      value={editValor}
                      onChange={(e) => setEditValor(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {abaModalEdicao === 'chaves' && (
                <div className="tuss-grid">
                  <div className="tuss-field-box">
                    <span className="tuss-field-label">Guia de Consulta (PK)</span>
                    <span className="tuss-field-value">
                      {guiaEmEdicao.numeroGuiaPK}
                    </span>
                  </div>
                  <div className="tuss-field-box">
                    <span className="tuss-field-label">Consulta (PK)</span>
                    <span className="tuss-field-value">
                      {guiaEmEdicao.consultaIdPK}
                    </span>
                  </div>
                  <div className="tuss-field-box">
                    <span className="tuss-field-label">Paciente (PK)</span>
                    <span className="tuss-field-value">
                      {guiaEmEdicao.pacienteId}
                    </span>
                  </div>
                  <div className="tuss-field-box">
                    <span className="tuss-field-label">Lote / Fatura (PK)</span>
                    <span className="tuss-field-value">
                      {guiaEmEdicao.loteVinculadoId || 'Livre'}{' '}
                      {guiaEmEdicao.faturaVinculadaId
                        ? `/ ${guiaEmEdicao.faturaVinculadaId}`
                        : ''}
                    </span>
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-realtime"
                  onClick={() => setGuiaEmEdicao(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} />
                  <span>Salvar Alterações da Guia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
