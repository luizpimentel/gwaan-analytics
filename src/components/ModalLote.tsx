import { useEffect, useState, type FormEvent } from 'react';
import {
  X,
  AlertCircle,
  MessageSquareWarning,
  Plus,
  Trash2,
  FileText,
  CalendarCheck,
  Printer,
  History,
  Layers,
  CheckCircle2,
  Search,
  Send,
  FolderOpen,
  Clock,
  RotateCcw,
  Check
} from 'lucide-react';
import {
  extrairGuiasDaConsulta,
  type Atendimento,
  type DemandaFinanceira,
  type GuiaLote,
  type HistoricoAlteracaoLote,
  type Operadora,
  type PrioridadeDemanda,
  type ProcedimentoAtendimento,
  type StatusFaturamento,
  type TipoAtendimentoLote
} from '../data/dadosFaturamento';
import {
  formatarDataBR,
  formatarMoeda,
  formatarUltimaAtualizacao,
  obterClasseBadge
} from '../utils/formatadores';

export interface GuiaCandidataDisponivel {
  numeroGuia: string;
  atendimentoId: string;
  senhaAutorizacao: string;
  tipoAtendimento: TipoAtendimentoLote;
  codigoTuss: string;
  pacienteId: string;
  pacienteNome: string;
  medicoNome: string;
  procedimento: string;
  procedimentos?: ProcedimentoAtendimento[];
  data: string;
  operadora: string;
  valor: number;
}

interface ModalLoteProps {
  operadoras: Operadora[];
  atendimentos: Atendimento[];
  demandas: DemandaFinanceira[];
  guiasExtrasCriadas?: GuiaLote[];
  loteInicial?: DemandaFinanceira | null;
  aoFechar: () => void;
  aoSalvar: (dados: {
    id?: string;
    codigoCustomizado?: string;
    operadora: string;
    descricao: string;
    tipoAtendimento: TipoAtendimentoLote;
    dataCriacao: string;
    horaCriacao?: string;
    dataAlteracaoOuEnvio: string;
    valor: number;
    status: StatusFaturamento;
    prioridade: PrioridadeDemanda;
    guias: GuiaLote[];
    codigoEnvioOperadora?: string;
    codigoReenvioOperadora?: string;
    observacoes: string;
    historicoLote: HistoricoAlteracaoLote[];
    faturasEmitidasEm?: string;
    motivoUltimaExclusaoFatura?: string;
  }) => void;
  aoAbrirRecurso?: (lote: DemandaFinanceira) => void;
}

const TIPOS_ATENDIMENTO_LOTE: TipoAtendimentoLote[] = [
  'Consulta',
  'SADT / Exames',
  'Internação',
  'Cirurgia / Procedimento',
  'Oncologia / Terapia',
  'Misto'
];

export interface GrupoFaturaPorSenha {
  chaveFatura: string;
  faturaId?: string;
  senhaAutorizacao: string;
  atendimentoId: string;
  pacienteId?: string;
  pacienteNome: string;
  medicoNome: string;
  data: string;
  guias: GuiaLote[];
  procedimentos: (ProcedimentoAtendimento & { guiaId: string })[];
  subtotal: number;
}

export function agruparGuiasPorSenhaAutorizacao(
  guias: GuiaLote[]
): GrupoFaturaPorSenha[] {
  const mapa = new Map<string, GrupoFaturaPorSenha>();

  guias.forEach((g) => {
    const senhaGuiaPadrao = g.senhaAutorizacao || `SENHA-${g.id}`;
    const procsDaGuia: ProcedimentoAtendimento[] =
      g.procedimentos && g.procedimentos.length > 0
        ? g.procedimentos.map((proc) => ({
          ...proc,
          senhaAutorizacao: proc.senhaAutorizacao || senhaGuiaPadrao
        }))
        : [
          {
            id: `PROC-${g.id}`,
            codigoTuss: g.codigoTuss || '10101012',
            descricao: g.procedimento,
            valor: g.valor,
            senhaAutorizacao: senhaGuiaPadrao,
            numeroGuia: g.id
          }
        ];

    procsDaGuia.forEach((proc) => {
      const senhaProc = proc.senhaAutorizacao || senhaGuiaPadrao;
      const chave = `${g.pacienteId || g.pacienteNome}-${senhaProc}`;
      const existente = mapa.get(chave);
      if (existente) {
        if (!existente.guias.some((eg) => eg.id === g.id)) {
          existente.guias.push(g);
        }
        if (!existente.faturaId && g.faturaId) {
          existente.faturaId = g.faturaId;
        }
        existente.procedimentos.push({ ...proc, guiaId: g.id });
        existente.subtotal += proc.valor;
      } else {
        mapa.set(chave, {
          chaveFatura: chave,
          faturaId: g.faturaId,
          senhaAutorizacao: senhaProc,
          atendimentoId: g.atendimentoId || g.id,
          pacienteId: g.pacienteId,
          pacienteNome: g.pacienteNome,
          medicoNome: g.medicoNome,
          data: g.data,
          guias: [g],
          procedimentos: [{ ...proc, guiaId: g.id }],
          subtotal: proc.valor
        });
      }
    });
  });

  return Array.from(mapa.values());
}

export function gerarEImprimirFaturasLotePDF(dadosLote: {
  id: string;
  operadora: string;
  descricao: string;
  tipoAtendimento: TipoAtendimentoLote;
  dataCriacao: string;
  guias: GuiaLote[];
  codigoEnvioOperadora?: string;
}) {
  const faturasPorSenha = agruparGuiasPorSenhaAutorizacao(dadosLote.guias);
  const dataEmissao = new Date().toLocaleString('pt-BR');

  // Agrupamos as faturas por paciente para que a paginação (ex: 1/2 e 2/2) seja equivalente ao paciente
  const faturasPorPaciente = new Map<string, GrupoFaturaPorSenha[]>();
  faturasPorSenha.forEach((fat) => {
    const listaPac = faturasPorPaciente.get(fat.pacienteNome) || [];
    listaPac.push(fat);
    faturasPorPaciente.set(fat.pacienteNome, listaPac);
  });

  const blocosPaginasHtml: string[] = [];

  faturasPorPaciente.forEach((faturasDoPaciente) => {
    const totalPaginasPaciente = faturasDoPaciente.length;

    faturasDoPaciente.forEach((fatura, idxPaginaPac) => {
      const numeroPaginaAtual = idxPaginaPac + 1;
      const numerosGuiasTexto = fatura.guias.map((g) => g.id).join(', ');
      const codigoFaturaPK = fatura.faturaId || `FAT-${100 + idxPaginaPac}`;

      const linhasProcedimentos = fatura.procedimentos
        .map(
          (proc) => `
          <tr>
            <td><strong>${proc.guiaId || fatura.guias[0]?.id}</strong></td>
            <td><strong>${proc.senhaAutorizacao || fatura.senhaAutorizacao}</strong></td>
            <td>${proc.codigoTuss || '10101012'}</td>
            <td>${proc.descricao}</td>
            <td>${formatarDataBR(fatura.data)}</td>
            <td><strong>${formatarMoeda(proc.valor)}</strong></td>
          </tr>`
        )
        .join('');

      blocosPaginasHtml.push(`
      <div class="invoice-page">
        <div class="header-box">
          <div>
            <div class="title">FATURA ${codigoFaturaPK} — LOTE ${dadosLote.id}</div>
            <div class="subtitle">Gwaan Analytics • Cobrança de Operadora (${dadosLote.operadora}) • Guia(s): ${numerosGuiasTexto}</div>
          </div>
          <div style="text-align: right;">
            <div class="label">Chave Primária da Fatura</div>
            <div class="val" style="font-size: 16px;">${codigoFaturaPK} (Pág. ${numeroPaginaAtual}/${totalPaginasPaciente})</div>
            <div class="subtitle">Emissão: ${dataEmissao}</div>
          </div>
        </div>

        <div class="section-title">1. Chaves Primárias do Documento (Lote, Fatura, Guia, Consulta e Paciente)</div>
        <div class="grid">
          <div class="cell"><span class="label">Cód. Lote (PK)</span><span class="val">${dadosLote.id}</span></div>
          <div class="cell"><span class="label">Cód. Fatura (PK)</span><span class="val">${codigoFaturaPK}</span></div>
          <div class="cell"><span class="label">Cód. Guia(s) (PK)</span><span class="val">${numerosGuiasTexto}</span></div>
          <div class="cell"><span class="label">Cód. Consulta / Paciente</span><span class="val">${fatura.atendimentoId} / ${fatura.pacienteId || '-'}</span></div>
        </div>

        <div class="section-title">2. Dados do Paciente, Operadora e Senha de Autorização (Obrigatória para Cobrança)</div>
        <div class="grid">
          <div class="cell"><span class="label">Paciente Beneficiário</span><span class="val">${fatura.pacienteNome} (${fatura.pacienteId || '-'})</span></div>
          <div class="cell"><span class="label">Senha de Autorização</span><span class="val">${fatura.senhaAutorizacao}</span></div>
          <div class="cell"><span class="label">Operadora</span><span class="val">${dadosLote.operadora}</span></div>
          <div class="cell"><span class="label">Profissional Executante</span><span class="val">${fatura.medicoNome}</span></div>
        </div>

        <div class="section-title">3. Procedimentos Autorizados nesta Senha / Guia (${fatura.procedimentos.length} item(ns))</div>
        <table>
          <thead>
            <tr>
              <th>Nº da Guia (G-nº)</th>
              <th>Senha Autorização</th>
              <th>Código TUSS</th>
              <th>Descrição do Procedimento / Exame</th>
              <th>Data</th>
              <th>Valor Cobrado</th>
            </tr>
          </thead>
          <tbody>
            ${linhasProcedimentos}
            <tr style="background: #f5f7ed;">
              <td colspan="5"><strong>Total da Fatura ${codigoFaturaPK} (Guia ${numerosGuiasTexto} • Senha ${fatura.senhaAutorizacao})</strong></td>
              <td><strong>${formatarMoeda(fatura.subtotal)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-line">Auditoria e Faturamento — Gwaan Analytics</div>
          <div class="sig-line">Conferência Operadora (${dadosLote.operadora})</div>
        </div>
      </div>`);
    });
  });

  const htmlCompleto = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Faturas PDF — Lote ${dadosLote.id} (${dadosLote.operadora})</title>
  <style>
    * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; }
    body { color: #1f2920; background: #fff; }
    .invoice-page { padding: 28px; page-break-after: always; min-height: 95vh; display: flex; flex-direction: column; }
    .invoice-page:last-child { page-break-after: auto; }
    .header-box { border: 2px solid #4d5e4a; border-radius: 8px; padding: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; background: #f5f7ed; }
    .title { font-size: 16px; font-weight: 700; text-transform: uppercase; color: #2c352b; }
    .subtitle { font-size: 12px; color: #5a6b57; margin-top: 4px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; background: #e5ecd0; padding: 6px 10px; border: 1px solid #b8c9a9; border-bottom: none; margin-top: 14px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #b8c9a9; }
    .cell { padding: 8px 10px; border-right: 1px solid #b8c9a9; border-bottom: 1px solid #b8c9a9; }
    .cell:last-child { border-right: none; }
    .label { font-size: 9px; text-transform: uppercase; color: #5a6b57; display: block; margin-bottom: 3px; font-weight: 700; }
    .val { font-size: 12px; font-weight: 600; color: #1f2920; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #b8c9a9; }
    th, td { border: 1px solid #b8c9a9; padding: 8px 10px; text-align: left; font-size: 12px; }
    th { background: #f1f3e0; font-size: 10px; text-transform: uppercase; color: #5a6b57; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; margin-top: auto; padding-top: 42px; }
    .sig-line { border-top: 1px solid #2c352b; text-align: center; padding-top: 6px; font-size: 11px; color: #5a6b57; }
  </style>
</head>
<body>
  ${blocosPaginasHtml.join('')}
</body>
</html>`;

  const janela = window.open('', '_blank', 'width=960,height=760');
  if (!janela) {
    window.print();
    return;
  }
  janela.document.open();
  janela.document.write(htmlCompleto);
  janela.document.close();
  janela.focus();
  setTimeout(() => {
    janela.print();
  }, 280);
}

export function ModalLote({
  operadoras,
  atendimentos,
  demandas,
  guiasExtrasCriadas = [],
  loteInicial,
  aoFechar,
  aoSalvar,
  aoAbrirRecurso
}: ModalLoteProps) {
  const modoEdicao = Boolean(loteInicial);
  const agoraRef = new Date();
  const hojeISO = agoraRef.toISOString().slice(0, 10);
  const horaAgora = agoraRef.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const [abaAtiva, setAbaAtiva] = useState<'dados' | 'atendimentos' | 'historico'>(
    'dados'
  );

  const [abaSubModalLupa, setAbaSubModalLupa] = useState<'catalogo' | 'conferencia'>(
    'catalogo'
  );

  const [codigo, setCodigo] = useState<string>(() => {
    if (loteInicial?.id) return loteInicial.id;
    const usados = new Set(demandas.map((d) => d.id.toUpperCase()));
    let num = Math.floor(4900 + Math.random() * 4000);
    while (usados.has(`LOTE-${num}`)) {
      num++;
    }
    return `LOTE-${num}`;
  });
  const [operadoraSelecionada, setOperadoraSelecionada] = useState<string>(
    loteInicial?.operadora ?? (operadoras[0]?.nome || '')
  );
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimentoLote>(
    loteInicial?.tipoAtendimento ?? 'SADT / Exames'
  );
  const [dataCriacao] = useState<string>(loteInicial?.dataCriacao ?? hojeISO);
  const [horaCriacao] = useState<string>(() => {
    if (loteInicial?.horaCriacao) return loteInicial.horaCriacao;
    const match = (loteInicial?.dataAlteracaoOuEnvio || '').match(/(\d{2}:\d{2})/);
    return match ? match[1] : horaAgora;
  });

  // Status salvo no lote vs status selecionado no modal
  const [statusSalvo, setStatusSalvo] = useState<StatusFaturamento>(
    loteInicial?.status ?? 'Aberto'
  );
  const [status, setStatus] = useState<StatusFaturamento>(
    loteInicial?.status ?? 'Aberto'
  );

  const [prioridade, setPrioridade] = useState<PrioridadeDemanda>(
    loteInicial?.prioridade ?? 'Média'
  );
  const [observacoes, setObservacoes] = useState<string>(
    loteInicial?.observacoes ?? ''
  );
  const [guias, setGuias] = useState<GuiaLote[]>(() => loteInicial?.guias ?? []);
  const [historicoLote, setHistoricoLote] = useState<HistoricoAlteracaoLote[]>(
    () => loteInicial?.historicoLote ?? []
  );
  const [faturasEmitidasEm, setFaturasEmitidasEm] = useState<string | undefined>(
    loteInicial?.faturasEmitidasEm
  );
  const motivoUltimaExclusaoFatura = loteInicial?.motivoUltimaExclusaoFatura;

  const [codigoEnvioOperadora, setCodigoEnvioOperadora] = useState<string>(
    loteInicial?.codigoEnvioOperadora ?? ''
  );
  const [codigoReenvioOperadora, setCodigoReenvioOperadora] = useState<string>(
    loteInicial?.codigoReenvioOperadora ?? ''
  );
  const [inputCodigoOperadora, setInputCodigoOperadora] = useState<string>('');
  const [inputCodigoReenvio, setInputCodigoReenvio] = useState<string>('');

  // Snapshot dos últimos dados salvos
  const [snapshotSalvo, setSnapshotSalvo] = useState(() => ({
    operadora: loteInicial?.operadora ?? (operadoras[0]?.nome || ''),
    tipoAtendimento: (loteInicial?.tipoAtendimento ??
      'SADT / Exames') as TipoAtendimentoLote,
    status: (loteInicial?.status ?? 'Aberto') as StatusFaturamento,
    prioridade: (loteInicial?.prioridade ?? 'Média') as PrioridadeDemanda,
    observacoes: loteInicial?.observacoes ?? '',
    codigoEnvioOperadora: loteInicial?.codigoEnvioOperadora ?? '',
    codigoReenvioOperadora: loteInicial?.codigoReenvioOperadora ?? '',
    guias: [...(loteInicial?.guias ?? [])]
  }));

  // Sincroniza quando o ModalRecurso salva uma tratativa de glosa com o ModalLote aberto ao fundo
  useEffect(() => {
    if (!loteInicial) return;
    setHistoricoLote(loteInicial.historicoLote ?? []);
    if (loteInicial.recurso && loteInicial.status === 'Glosado') {
      setStatus('Glosado');
      setStatusSalvo('Glosado');
      setSnapshotSalvo((ant) => ({
        ...ant,
        status: 'Glosado'
      }));
    }
  }, [loteInicial?.recurso, loteInicial?.historicoLote, loteInicial?.status]);

  // Busca de guia por Nº da Guia (G-nº) ou modal de lupa
  const [numeroGuiaInput, setNumeroGuiaInput] = useState<string>('');
  const [modalLupaGuiasAberto, setModalLupaGuiasAberto] = useState<boolean>(false);
  const [buscaModalLupa, setBuscaModalLupa] = useState<string>('');
  const [guiasSelecionadasNoModalLupa, setGuiasSelecionadasNoModalLupa] = useState<
    string[]
  >([]);

  const valorTotalCalculado = guias.reduce((acc, g) => acc + g.valor, 0);
  const faturasEmitidasPorSenha = agruparGuiasPorSenhaAutorizacao(guias);
  const qtdFaturasLote = faturasEmitidasPorSenha.length;
  const mudancaStatusNaoSalva = status !== statusSalvo;

  // Só é permitido incluir novas guias no lote quando estiver com o status "Aberto"
  const bloqueadoParaEdicaoGuias =
    statusSalvo !== 'Aberto' || status !== 'Aberto';
  const permiteIncluirNovasGuias =
    statusSalvo === 'Aberto' && status === 'Aberto';
  const permiteRemoverGuias =
    statusSalvo === 'Aberto' && status === 'Aberto';

  // Conjunto de Nº de Guia (G-nº) já alocados em OUTROS lotes
  const guiasAlocadasEmOutrosLotes = new Map<string, string>();
  demandas.forEach((lote) => {
    if (loteInicial && lote.id === loteInicial.id) return;
    lote.guias.forEach((g) => {
      guiasAlocadasEmOutrosLotes.set(g.id.toUpperCase(), lote.id);
    });
  });

  // Gera códigos únicos FAT-nº para cada guia/senha quando o lote é fechado/faturado
  function atribuirCodigosFaturaUnicos(listaGuias: GuiaLote[]): GuiaLote[] {
    const faturasUsadas = new Set<string>();
    demandas.forEach((lote) => {
      if (loteInicial && lote.id === loteInicial.id) return;
      lote.guias.forEach((g) => {
        if (g.faturaId) faturasUsadas.add(g.faturaId.toUpperCase());
      });
    });
    listaGuias.forEach((g) => {
      if (g.faturaId) faturasUsadas.add(g.faturaId.toUpperCase());
    });

    const mapaSenhaParaFatura = new Map<string, string>();
    let proximoNumeroFatura = 101;

    return listaGuias.map((g) => {
      const chaveGrupo = `${g.pacienteId || g.pacienteNome}-${g.senhaAutorizacao || g.id}`;
      let fatId = g.faturaId || mapaSenhaParaFatura.get(chaveGrupo);
      if (!fatId) {
        while (faturasUsadas.has(`FAT-${proximoNumeroFatura}`)) {
          proximoNumeroFatura++;
        }
        fatId = `FAT-${proximoNumeroFatura}`;
        faturasUsadas.add(fatId);
      }
      mapaSenhaParaFatura.set(chaveGrupo, fatId);
      return {
        ...g,
        faturaId: fatId
      };
    });
  }

  // Construir catálogo de todas as guias realizadas (G-nº) disponíveis para esta operadora
  // Usa extrairGuiasDaConsulta para que consultas com 2+ senhas de autorização exponham todas as suas guias G-nº!
  const catalogoGuiasRealizadas: GuiaCandidataDisponivel[] = [];

  atendimentos
    .filter(
      (a) =>
        a.status === 'Realizado' &&
        a.operadora === operadoraSelecionada &&
        a.operadora !== 'Particular' &&
        !a.guiaCancelada
    )
    .forEach((atd) => {
      const tipoInferido: TipoAtendimentoLote =
        atd.tipoAtendimento ||
        (atd.descricao.toLocaleLowerCase().includes('consulta')
          ? 'Consulta'
          : atd.descricao.toLocaleLowerCase().includes('interna')
            ? 'Internação'
            : atd.descricao.toLocaleLowerCase().includes('quimioterapia') ||
              atd.descricao.toLocaleLowerCase().includes('imuno') ||
              atd.especialidade.toLocaleLowerCase().includes('onco')
              ? 'Oncologia / Terapia'
              : 'SADT / Exames');

      const guiasDaConsulta = extrairGuiasDaConsulta(atd);
      guiasDaConsulta.forEach((gd) => {
        catalogoGuiasRealizadas.push({
          numeroGuia: gd.numeroGuia,
          atendimentoId: atd.id,
          senhaAutorizacao:
            gd.senhaAutorizacao || `AUTH-${atd.id.replace(/\D/g, '')}01`,
          tipoAtendimento: tipoInferido,
          codigoTuss: gd.codigoTussPrincipal || '10101012',
          pacienteId: atd.pacienteId,
          pacienteNome: atd.pacienteNome,
          medicoNome: atd.medicoNome,
          procedimento: gd.descricao,
          procedimentos: gd.procedimentos,
          data: atd.data,
          operadora: atd.operadora,
          valor: gd.valorTotal
        });
      });
    });

  guiasExtrasCriadas
    .filter((ge) => {
      const atdPai = atendimentos.find((a) => a.id === ge.atendimentoId);
      return !atdPai || atdPai.operadora === operadoraSelecionada;
    })
    .forEach((ge) => {
      if (
        !catalogoGuiasRealizadas.some(
          (c) => c.numeroGuia.toUpperCase() === ge.id.toUpperCase()
        )
      ) {
        const senhaGe =
          ge.senhaAutorizacao || `AUTH-${ge.id.replace(/\D/g, '')}`;
        catalogoGuiasRealizadas.push({
          numeroGuia: ge.id,
          atendimentoId: ge.atendimentoId || 'CONS-REALIZADA',
          senhaAutorizacao: senhaGe,
          tipoAtendimento: ge.tipoAtendimento || tipoAtendimento,
          codigoTuss: ge.codigoTuss || '10101012',
          pacienteId: ge.pacienteId || 'PAC-REALIZADO',
          pacienteNome: ge.pacienteNome,
          medicoNome: ge.medicoNome,
          procedimento: ge.procedimento,
          procedimentos: ge.procedimentos?.map((p) => ({
            ...p,
            senhaAutorizacao: p.senhaAutorizacao || senhaGe,
            numeroGuia: ge.id
          })),
          data: ge.data,
          operadora: operadoraSelecionada,
          valor: ge.valor
        });
      }
    });

  const guiasRealizadasCompativeis = catalogoGuiasRealizadas.filter((g) => {
    if (tipoAtendimento === 'Misto') return true;
    return g.tipoAtendimento === tipoAtendimento || true;
  });

  function gerarCarimboDataHora(): { iso: string; formatado: string } {
    const agora = new Date();
    const iso = agora.toISOString();
    const formatado = `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString(
      'pt-BR',
      { hour: '2-digit', minute: '2-digit' }
    )}`;
    return { iso, formatado };
  }

  function incluirGuiaPeloNumeroInput() {
    if (!permiteIncluirNovasGuias) {
      alert(
        'Só é permitido incluir novas guias quando o lote estiver salvo com o status "Aberto"!'
      );
      return;
    }
    const codigoDigitado = numeroGuiaInput.trim().toUpperCase();
    if (!codigoDigitado) {
      alert(
        'Digite o código da guia (ex: G-210) ou clique na lupa para pesquisar!'
      );
      return;
    }

    if (guias.some((g) => g.id.toUpperCase() === codigoDigitado)) {
      alert(
        `A guia ${codigoDigitado} já está incluída neste lote! (G-nº é chave primária única)`
      );
      return;
    }

    const loteConflito = guiasAlocadasEmOutrosLotes.get(codigoDigitado);
    if (loteConflito) {
      alert(
        `A guia ${codigoDigitado} já pertence ao lote ${loteConflito}. O código G-nº é chave primária e não pode se repetir em outro lote!`
      );
      return;
    }

    // Permite buscar por G-nº ou CONS-nº (adicionando a primeira guia livre daquela consulta)
    const candidata = catalogoGuiasRealizadas.find(
      (c) =>
        (c.numeroGuia.toUpperCase() === codigoDigitado ||
          c.atendimentoId.toUpperCase() === codigoDigitado) &&
        !guias.some((g) => g.id.toUpperCase() === c.numeroGuia.toUpperCase())
    );

    if (!candidata) {
      alert(
        `Nenhuma guia realizada livre encontrada com o código "${codigoDigitado}" para a operadora ${operadoraSelecionada}. Use o botão da lupa para selecionar da lista de guias realizadas!`
      );
      return;
    }

    const loteConflitoPorGuiaReal = guiasAlocadasEmOutrosLotes.get(
      candidata.numeroGuia.toUpperCase()
    );
    if (loteConflitoPorGuiaReal) {
      alert(
        `A guia ${candidata.numeroGuia} já pertence ao lote ${loteConflitoPorGuiaReal}!`
      );
      return;
    }

    const novaGuia: GuiaLote = {
      id: candidata.numeroGuia,
      atendimentoId: candidata.atendimentoId,
      senhaAutorizacao: candidata.senhaAutorizacao,
      tipoAtendimento: candidata.tipoAtendimento,
      codigoTuss: candidata.codigoTuss,
      pacienteId: candidata.pacienteId,
      pacienteNome: candidata.pacienteNome,
      medicoNome: candidata.medicoNome,
      procedimento: candidata.procedimento,
      procedimentos: candidata.procedimentos,
      data: candidata.data,
      valor: candidata.valor,
      statusGuia: 'Realizado'
    };

    setGuias((ant) => [...ant, novaGuia]);
    setNumeroGuiaInput('');
  }

  function abrirModalSelecaoLupa() {
    if (!permiteIncluirNovasGuias) {
      alert(
        'Só é permitido incluir novas guias quando o lote estiver salvo com o status "Aberto"!'
      );
      return;
    }
    setGuiasSelecionadasNoModalLupa([]);
    setBuscaModalLupa('');
    setAbaSubModalLupa('catalogo');
    setModalLupaGuiasAberto(true);
  }

  function alternarGuiaNoModalLupa(numeroGuia: string) {
    const loteConflito = guiasAlocadasEmOutrosLotes.get(
      numeroGuia.toUpperCase()
    );
    if (loteConflito) return;

    setGuiasSelecionadasNoModalLupa((ant) => {
      if (ant.includes(numeroGuia)) {
        return ant.filter((id) => id !== numeroGuia);
      }
      return [...ant, numeroGuia];
    });
  }

  function confirmarSelecaoModalLupa() {
    if (guiasSelecionadasNoModalLupa.length === 0) {
      setModalLupaGuiasAberto(false);
      return;
    }

    const novasGuias: GuiaLote[] = [...guias];

    guiasSelecionadasNoModalLupa.forEach((numGuia) => {
      if (!novasGuias.some((g) => g.id === numGuia)) {
        const cand = catalogoGuiasRealizadas.find(
          (c) => c.numeroGuia === numGuia
        );
        if (cand) {
          novasGuias.push({
            id: cand.numeroGuia,
            atendimentoId: cand.atendimentoId,
            senhaAutorizacao: cand.senhaAutorizacao,
            tipoAtendimento: cand.tipoAtendimento,
            codigoTuss: cand.codigoTuss,
            pacienteId: cand.pacienteId,
            pacienteNome: cand.pacienteNome,
            medicoNome: cand.medicoNome,
            procedimento: cand.procedimento,
            procedimentos: cand.procedimentos,
            data: cand.data,
            valor: cand.valor,
            statusGuia: 'Realizado'
          });
        }
      }
    });

    setGuias(novasGuias);
    setModalLupaGuiasAberto(false);
  }

  function removerGuiaDoLote(idGuia: string) {
    if (!permiteRemoverGuias) return;
    setGuias((ant) => ant.filter((g) => g.id !== idGuia));
  }

  function acaoFaturarGuiasDoLote() {
    if (guias.length === 0) {
      alert('Selecione ao menos 1 guia realizada antes de faturar o lote!');
      return;
    }
    const { formatado } = gerarCarimboDataHora();
    setGuias((ant) => atribuirCodigosFaturaUnicos(ant));
    setStatus('Fechado');
    setFaturasEmitidasEm(formatado);
  }

  function acaoAbrirLote() {
    setStatus('Aberto');
  }

  function acaoColocarLotePendente() {
    setStatus('Pendente');
  }

  function acaoConfirmarEnvioComCodigoOperadora() {
    const protocoloLimpo = inputCodigoOperadora.trim();
    if (!protocoloLimpo) {
      alert(
        'Digite o código/protocolo informado pela operadora para preparar o envio!'
      );
      return;
    }
    setCodigoEnvioOperadora(protocoloLimpo);
    setStatus('Enviado');
    setInputCodigoOperadora('');
  }

  function acaoGlosarLote() {
    setStatus('Glosado');
  }

  function acaoReenviarLoteGlosado() {
    const protocoloReenvio =
      inputCodigoReenvio.trim() || `REENV-${codigoEnvioOperadora || codigo}`;
    setCodigoReenvioOperadora(protocoloReenvio);
    setStatus('Reenviado');
    setInputCodigoReenvio('');
  }

  function submeterFormulario(evento: FormEvent) {
    evento.preventDefault();

    if (!operadoraSelecionada) {
      alert('Selecione a Operadora do lote!');
      return;
    }

    if (guias.length === 0) {
      alert(
        'O lote precisa conter pelo menos 1 guia realizada (G-nº) para calcular o valor total!'
      );
      return;
    }

    const { iso, formatado } = gerarCarimboDataHora();
    const descricaoAutomatica =
      loteInicial?.descricao || `Lote ${operadoraSelecionada} — ${tipoAtendimento}`;

    const loteFaturadoOuEnviado =
      status === 'Fechado' ||
      status === 'Enviado' ||
      status === 'Glosado' ||
      status === 'Reenviado';

    const guiasFinaisParaSalvar: GuiaLote[] = loteFaturadoOuEnviado
      ? atribuirCodigosFaturaUnicos(guias)
      : guias.map((g) => ({ ...g, faturaId: undefined }));

    const novosEventosHistorico: HistoricoAlteracaoLote[] = [];

    if (!modoEdicao) {
      novosEventosHistorico.push({
        id: `HL-${Date.now()}-CRIACAO`,
        dataHora: formatado,
        acao: `Criação do Lote (${operadoraSelecionada} — ${tipoAtendimento})`,
        detalhe: `Data/Hora: ${formatado} | Campos iniciais: Operadora="${operadoraSelecionada}", Tipo="${tipoAtendimento}", Status="${status}", Prioridade="${prioridade}", Guias=[${guiasFinaisParaSalvar.map((g) => `${g.id} (Consulta ${g.atendimentoId || '-'} / Senha ${g.senhaAutorizacao || 'N/A'})`).join(', ')}], Valor Total=${formatarMoeda(valorTotalCalculado)}${observacoes.trim() ? `, Observações="${observacoes.trim()}"` : ''}.`
      });
    } else {
      const alteracoesCampos: string[] = [];

      if (status !== snapshotSalvo.status) {
        alteracoesCampos.push(
          `Status: "${snapshotSalvo.status}" → "${status}"`
        );
      }

      if (prioridade !== snapshotSalvo.prioridade) {
        alteracoesCampos.push(
          `Prioridade: "${snapshotSalvo.prioridade}" → "${prioridade}"`
        );
      }

      if (
        (codigoEnvioOperadora || '') !==
        (snapshotSalvo.codigoEnvioOperadora || '')
      ) {
        alteracoesCampos.push(
          `Protocolo de Envio à Operadora: "${snapshotSalvo.codigoEnvioOperadora || 'Vazio'}" → "${codigoEnvioOperadora || 'Vazio'}"`
        );
      }

      if (
        (codigoReenvioOperadora || '') !==
        (snapshotSalvo.codigoReenvioOperadora || '')
      ) {
        alteracoesCampos.push(
          `Protocolo de Reenvio: "${snapshotSalvo.codigoReenvioOperadora || 'Vazio'}" → "${codigoReenvioOperadora || 'Vazio'}"`
        );
      }

      if (observacoes.trim() !== (snapshotSalvo.observacoes || '').trim()) {
        alteracoesCampos.push(
          `Observações: "${(snapshotSalvo.observacoes || '').trim() || 'Vazio'}" → "${observacoes.trim() || 'Vazio'}"`
        );
      }

      const idsAntigos = new Set(snapshotSalvo.guias.map((g) => g.id));
      const idsNovos = new Set(guiasFinaisParaSalvar.map((g) => g.id));

      const guiasIncluidas = guiasFinaisParaSalvar.filter(
        (g) => !idsAntigos.has(g.id)
      );
      const guiasRemovidas = snapshotSalvo.guias.filter(
        (g) => !idsNovos.has(g.id)
      );

      if (guiasIncluidas.length > 0) {
        alteracoesCampos.push(
          `Guias Incluídas: ${guiasIncluidas.map((g) => `${g.id} (${g.pacienteNome} — Senha ${g.senhaAutorizacao || 'N/A'} — ${formatarMoeda(g.valor)})`).join('; ')}`
        );
      }

      if (guiasRemovidas.length > 0) {
        alteracoesCampos.push(
          `Guias Removidas: ${guiasRemovidas.map((g) => `${g.id} (${g.pacienteNome} — ${formatarMoeda(g.valor)})`).join('; ')}`
        );
      }

      const valorAntigo = snapshotSalvo.guias.reduce(
        (acc, g) => acc + g.valor,
        0
      );
      if (Math.abs(valorAntigo - valorTotalCalculado) > 0.009) {
        alteracoesCampos.push(
          `Valor Total do Lote: ${formatarMoeda(valorAntigo)} → ${formatarMoeda(valorTotalCalculado)}`
        );
      }

      if (alteracoesCampos.length > 0) {
        const tituloAcao =
          status !== snapshotSalvo.status
            ? `Alteração Salva (Status: ${snapshotSalvo.status} → ${status})`
            : 'Alteração de Dados/Guias Salva no Lote';

        novosEventosHistorico.push({
          id: `HL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          dataHora: formatado,
          acao: tituloAcao,
          detalhe: `${formatado} — Campos e valores alterados: ${alteracoesCampos.join(' | ')}`
        });
      }
    }

    const historicoFinal: HistoricoAlteracaoLote[] = [
      ...novosEventosHistorico,
      ...historicoLote
    ];

    const faturasEmFinal = loteFaturadoOuEnviado
      ? faturasEmitidasEm || formatado
      : undefined;

    const codigoEnvioFinal =
      status === 'Aberto' ? undefined : codigoEnvioOperadora || undefined;

    setGuias(guiasFinaisParaSalvar);
    setHistoricoLote(historicoFinal);
    setStatusSalvo(status);
    setFaturasEmitidasEm(faturasEmFinal);
    if (status === 'Aberto') {
      setCodigoEnvioOperadora('');
    }
    setSnapshotSalvo({
      operadora: operadoraSelecionada,
      tipoAtendimento,
      status,
      prioridade,
      observacoes: observacoes.trim(),
      codigoEnvioOperadora: codigoEnvioFinal ?? '',
      codigoReenvioOperadora,
      guias: [...guiasFinaisParaSalvar]
    });

    // Se acabou de mudar para Fechado ao salvar, imprime o PDF das faturas FAT-nº
    if (status === 'Fechado' && snapshotSalvo.status !== 'Fechado') {
      gerarEImprimirFaturasLotePDF({
        id: loteInicial?.id || codigo,
        operadora: operadoraSelecionada,
        descricao: descricaoAutomatica,
        tipoAtendimento,
        dataCriacao,
        guias: guiasFinaisParaSalvar,
        codigoEnvioOperadora: codigoEnvioFinal
      });
    }

    aoSalvar({
      id: loteInicial?.id,
      codigoCustomizado: codigo.trim() || undefined,
      operadora: operadoraSelecionada,
      descricao: descricaoAutomatica,
      tipoAtendimento,
      dataCriacao: dataCriacao || hojeISO,
      horaCriacao,
      dataAlteracaoOuEnvio: iso,
      valor: valorTotalCalculado,
      status,
      prioridade,
      guias: guiasFinaisParaSalvar,
      codigoEnvioOperadora: codigoEnvioFinal,
      codigoReenvioOperadora: codigoReenvioOperadora || undefined,
      observacoes: observacoes.trim(),
      historicoLote: historicoFinal,
      faturasEmitidasEm: faturasEmFinal,
      motivoUltimaExclusaoFatura
    });

    if (!modoEdicao) {
      aoFechar();
    }
  }

  // Filtragem de guias dentro do sub-modal da lupa:
  // O mesmo paciente/consulta (CONS-nº) PODE ter múltiplas guias (G-nº) com senhas diferentes no mesmo lote!
  // Apenas filtramos guias cujo G-nº exato já está neste lote.
  const guiasFiltradasNaLupa = guiasRealizadasCompativeis.filter((cand) => {
    const guiaJaEstaNoLote = guias.some(
      (g) => g.id.toUpperCase() === cand.numeroGuia.toUpperCase()
    );
    if (guiaJaEstaNoLote) return false;

    const termo = buscaModalLupa.toLocaleLowerCase();
    return (
      cand.numeroGuia.toLocaleLowerCase().includes(termo) ||
      cand.atendimentoId.toLocaleLowerCase().includes(termo) ||
      cand.pacienteId.toLocaleLowerCase().includes(termo) ||
      cand.pacienteNome.toLocaleLowerCase().includes(termo) ||
      cand.procedimento.toLocaleLowerCase().includes(termo) ||
      cand.senhaAutorizacao.toLocaleLowerCase().includes(termo)
    );
  });

  const guiasEscolhidasPreviewNaLupa = catalogoGuiasRealizadas.filter((c) =>
    guiasSelecionadasNoModalLupa.includes(c.numeroGuia)
  );

  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div
        className="modal-content modal-content-80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>
              {modoEdicao
                ? `Gestão do Lote de Operadora (${loteInicial?.id})`
                : 'Novo Lote de Operadora (+ Lote LOTE-nº)'}
            </h3>
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                marginTop: '0.2rem'
              }}
            >
              {modoEdicao && loteInicial
                ? `Criado em ${formatarDataBR(loteInicial.dataCriacao)} • Última alteração: ${formatarUltimaAtualizacao(loteInicial.dataAlteracaoOuEnvio || loteInicial.atualizadoHa)}`
                : 'Selecione guias de consultas realizadas usando o código G-nº (PK) ou a lupa de pesquisa.'}
            </p>
          </div>
          <button
            type="button"
            className="btn-icon-square"
            onClick={aoFechar}
            title="Fechar janela"
          >
            <X size={18} />
          </button>
        </div>

        <div className="lote-summary-strip">
          <div>
            <span className="strip-label">Código do Lote</span>
            <strong style={{ color: '#778873' }}>{codigo}</strong>
          </div>
          <div>
            <span className="strip-label">
              Operadora {modoEdicao ? '(Fixa)' : ''}
            </span>
            <strong>{operadoraSelecionada}</strong>
          </div>
          <div>
            <span className="strip-label">
              Modalidade {modoEdicao ? '(Fixa)' : ''}
            </span>
            <strong>{tipoAtendimento}</strong>
          </div>
          <div>
            <span className="strip-label">Guias / Faturas</span>
            <strong>
              {guias.length} guia(s) • {qtdFaturasLote}{' '}
              {qtdFaturasLote === 1 ? 'Fatura' : 'Faturas'}
            </strong>
          </div>
          <div>
            <span className="strip-label">Status do Lote</span>
            <span className={obterClasseBadge(status)}>{status}</span>
          </div>
          <div>
            <span className="strip-label">Valor Líquido do Lote</span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--accent-color)' }}>
              {formatarMoeda(valorTotalCalculado)}
            </strong>
          </div>
        </div>

        {/* Menu de abas posicionado abaixo do sumário */}
        <div className="modal-abas">
          <button
            type="button"
            className={`modal-aba-btn ${abaAtiva === 'dados' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('dados')}
          >
            <Layers size={15} />
            <span>Dados do Lote e Faturamento</span>
          </button>

          <button
            type="button"
            className={`modal-aba-btn ${abaAtiva === 'atendimentos' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('atendimentos')}
          >
            <CalendarCheck size={15} />
            <span>
              Guias do Lote ({guias.length} guia(s) / {qtdFaturasLote}{' '}
              {qtdFaturasLote === 1 ? 'Fatura' : 'Faturas'})
            </span>
          </button>

          <button
            type="button"
            className={`modal-aba-btn ${abaAtiva === 'historico' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('historico')}
          >
            <History size={15} />
            <span>Histórico de Alterações ({historicoLote.length})</span>
          </button>
        </div>

        <form
          onSubmit={submeterFormulario}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}
        >

          {abaAtiva === 'dados' && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.6fr 1.4fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Código do Lote (Chave Primária LOTE-nº)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    disabled={modoEdicao || bloqueadoParaEdicaoGuias}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Operadora {modoEdicao ? '(Definida na criação)' : ''}
                  </label>
                  <select
                    className="form-input"
                    value={operadoraSelecionada}
                    onChange={(e) => {
                      setOperadoraSelecionada(e.target.value);
                      if (!modoEdicao) setGuias([]);
                    }}
                    disabled={modoEdicao || bloqueadoParaEdicaoGuias}
                    required
                  >
                    {operadoras.map((op) => (
                      <option key={op.id} value={op.nome}>
                        {op.nome} ({op.cnpj})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Tipo de Consulta / Procedimento{' '}
                    {modoEdicao ? '(Definido na criação)' : ''}
                  </label>
                  <select
                    className="form-input"
                    value={tipoAtendimento}
                    onChange={(e) =>
                      setTipoAtendimento(e.target.value as TipoAtendimentoLote)
                    }
                    disabled={modoEdicao || bloqueadoParaEdicaoGuias}
                  >
                    {TIPOS_ATENDIMENTO_LOTE.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.15fr 0.85fr 2fr',
                  gap: '0.75rem',
                  alignItems: 'end'
                }}
              >
                <div className="form-group">
                  <label>Data e Hora da Criação</label>
                  <input
                    type="text"
                    className="form-input"
                    value={`${formatarDataBR(dataCriacao)} às ${horaCriacao}`}
                    disabled
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>Prioridade</label>
                  <select
                    className="form-input"
                    value={prioridade}
                    onChange={(e) =>
                      setPrioridade(e.target.value as PrioridadeDemanda)
                    }
                    disabled={bloqueadoParaEdicaoGuias}
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Status do Lote e Ações de Transição{' '}
                    {mudancaStatusNaoSalva ? (
                      <span
                        style={{
                          color: 'var(--accent-color)',
                          fontWeight: 700,
                          marginLeft: '0.35rem'
                        }}
                      >
                        (Pendente salvar: {statusSalvo} → {status})
                      </span>
                    ) : (
                      ''
                    )}
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      style={{
                        width: '145px',
                        fontWeight: 700,
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-primary)'
                      }}
                      value={status}
                      disabled
                      readOnly
                    />

                    {status === 'Aberto' && (
                      <>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={acaoFaturarGuiasDoLote}
                          title="Emitir códigos FAT-nº para cada guia/senha e mudar status para Fechado"
                        >
                          <Check size={15} />
                          <span>Faturar Guias (Gerar FAT-nº)</span>
                        </button>
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={acaoColocarLotePendente}
                          title="Marcar lote como Pendente"
                        >
                          <Clock size={15} />
                          <span>Pendente</span>
                        </button>
                      </>
                    )}

                    {status === 'Pendente' && (
                      <>
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={acaoAbrirLote}
                        >
                          <FolderOpen size={15} />
                          <span>Abrir lote</span>
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={acaoFaturarGuiasDoLote}
                        >
                          <Check size={15} />
                          <span>Faturar Guias (Gerar FAT-nº)</span>
                        </button>
                      </>
                    )}

                    {status === 'Fechado' && !codigoEnvioOperadora && (
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={acaoAbrirLote}
                      >
                        <FolderOpen size={15} />
                        <span>Abrir lote</span>
                      </button>
                    )}

                    {((status === 'Fechado' && Boolean(codigoEnvioOperadora)) ||
                      status === 'Enviado' ||
                      status === 'Reenviado') && (
                        <button
                          type="button"
                          className="btn-recurso"
                          onClick={acaoGlosarLote}
                        >
                          <MessageSquareWarning size={15} />
                          <span>Glosar lote</span>
                        </button>
                      )}

                    {status === 'Glosado' && (
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={acaoAbrirLote}
                      >
                        <FolderOpen size={15} />
                        <span>Abrir lote</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {mudancaStatusNaoSalva && (
                <div
                  style={{
                    padding: '0.65rem 0.9rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.84rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <span>
                    Mudança de status preparada:{' '}
                    <strong>
                      {statusSalvo} → {status}
                    </strong>
                    . Clique em <strong>Salvar Alterações do Lote</strong> para
                    registrar no histórico e efetivar os códigos de fatura (FAT-nº).
                  </span>
                </div>
              )}

              {/* Box de Faturas Emitidas (FAT-nº) e Código de Envio à Operadora */}
              {(status === 'Fechado' ||
                status === 'Enviado' ||
                status === 'Glosado' ||
                status === 'Reenviado') && (
                  <div className="guias-lote-box">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          <CheckCircle2 size={17} color="#4d6b53" />
                          <strong>
                            Faturas Emitidas no Lote ({qtdFaturasLote}{' '}
                            {qtdFaturasLote === 1 ? 'Fatura FAT-nº' : 'Faturas FAT-nº'})
                          </strong>
                          {faturasEmitidasPorSenha.map((f) =>
                            f.faturaId ? (
                              <span key={f.faturaId} className="badge badge-faturado">
                                {f.faturaId} (Guia {f.guias.map((g) => g.id).join(', ')} • Senha {f.senhaAutorizacao})
                              </span>
                            ) : null
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.2rem'
                          }}
                        >
                          {faturasEmitidasEm
                            ? `Faturas geradas em ${faturasEmitidasEm}. `
                            : ''}
                          Cada Fatura (FAT-nº) corresponde a 1 Guia (G-nº) e 1 Senha de Autorização da operadora.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() =>
                          gerarEImprimirFaturasLotePDF({
                            id: loteInicial?.id || codigo,
                            operadora: operadoraSelecionada,
                            descricao:
                              loteInicial?.descricao ||
                              `Lote ${operadoraSelecionada} — ${tipoAtendimento}`,
                            tipoAtendimento,
                            dataCriacao,
                            guias,
                            codigoEnvioOperadora
                          })
                        }
                      >
                        <Printer size={15} />
                        <span>Visualizar / Imprimir Faturas (PDF)</span>
                      </button>
                    </div>

                    {status === 'Fechado' && statusSalvo === 'Fechado' && (
                      <div
                        style={{
                          borderTop: '1px solid var(--border-color)',
                          paddingTop: '0.85rem',
                          marginTop: '0.35rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.9rem' }}>
                            Conclusão do Envio à Operadora (Muda para Enviado ao salvar)
                          </strong>
                          <p
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            Informe o código/protocolo gerado pela operadora após o envio
                            do lote {codigo}:
                          </p>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          <input
                            type="text"
                            className="form-input"
                            style={{ width: '240px' }}
                            placeholder="Código de envio da operadora..."
                            value={inputCodigoOperadora}
                            onChange={(e) => setInputCodigoOperadora(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={acaoConfirmarEnvioComCodigoOperadora}
                          >
                            <Send size={15} />
                            <span>Confirmar Envio</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {codigoEnvioOperadora && (
                      <div
                        style={{
                          borderTop: '1px solid var(--border-color)',
                          paddingTop: '0.65rem',
                          fontSize: '0.85rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}
                      >
                        <span>
                          Protocolo de Envio à Operadora:{' '}
                          <strong
                            style={{
                              color: 'var(--text-primary)',
                              backgroundColor: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '6px'
                            }}
                          >
                            {codigoEnvioOperadora}
                          </strong>
                        </span>
                        {(codigoReenvioOperadora ||
                          loteInicial?.codigoReenvioOperadora) && (
                            <span>
                              Protocolo de Reenvio pós-Glosa:{' '}
                              <strong
                                style={{
                                  color: 'var(--text-primary)',
                                  backgroundColor: 'var(--bg-primary)',
                                  border: '1px solid var(--border-color)',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px'
                                }}
                              >
                                {codigoReenvioOperadora ||
                                  loteInicial?.codigoReenvioOperadora}
                              </strong>
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                )}

              {/* Tratamento de Glosa e Reenvio quando status === 'Glosado' */}
              {status === 'Glosado' && (
                <div className="alert-box alert-recurso">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontWeight: 700
                        }}
                      >
                        <AlertCircle size={17} />
                        <span>
                          Lote Glosado pela Operadora — Tratamento e Reenvio
                        </span>
                      </div>
                      <p style={{ fontSize: '0.83rem', marginTop: '0.2rem' }}>
                        {loteInicial?.recurso
                          ? `[${loteInicial.recurso.tipoGlosa || 'Glosa'}] ${loteInicial.recurso.motivo}`
                          : statusSalvo !== 'Glosado'
                            ? 'Clique em "Salvar Alterações do Lote" para efetivar o status Glosado e liberar o tratamento/reenvio.'
                            : 'Realize os ajustes necessários nas guias/procedimentos ou registre a justificativa de recurso e confirme o reenvio.'}
                      </p>
                      <div
                        style={{
                          marginTop: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          flexWrap: 'wrap'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)'
                          }}
                        >
                          Protocolo de Envio à Operadora:
                        </span>
                        <input
                          type="text"
                          className="form-input"
                          style={{
                            width: '190px',
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)'
                          }}
                          value={codigoEnvioOperadora || 'Sem protocolo'}
                          disabled
                          readOnly
                        />
                      </div>
                    </div>

                    {statusSalvo === 'Glosado' && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          flexWrap: 'wrap'
                        }}
                      >
                        {loteInicial && aoAbrirRecurso && (
                          <button
                            type="button"
                            className="btn-outline"
                            onClick={() => aoAbrirRecurso(loteInicial)}
                          >
                            <MessageSquareWarning size={15} />
                            <span>Detalhar / Tratar Glosa</span>
                          </button>
                        )}
                        <input
                          type="text"
                          className="form-input"
                          style={{
                            width: '210px',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)'
                          }}
                          placeholder="Novo protocolo reenvio..."
                          value={inputCodigoReenvio}
                          onChange={(e) => setInputCodigoReenvio(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={acaoReenviarLoteGlosado}
                        >
                          <RotateCcw size={15} />
                          <span>Reenviar Lote</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Observações / Critérios de Pendência ou Protocolo</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Informações sobre critério de pendência, protocolo da operadora ou observações do lote..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  disabled={bloqueadoParaEdicaoGuias}
                />
              </div>
            </>
          )}

          {abaAtiva === 'atendimentos' && (
            <div className="guias-lote-box">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} color="#778873" />
                  <strong>
                    Guias de Consulta Vinculadas ({guias.length} guia(s) G-nº /{' '}
                    {qtdFaturasLote} {qtdFaturasLote === 1 ? 'Fatura' : 'Faturas'})
                  </strong>
                </div>
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--accent-color)'
                  }}
                >
                  Soma Consolidada: {formatarMoeda(valorTotalCalculado)}
                </span>
              </div>

              {permiteIncluirNovasGuias ? (
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}
                >
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1, minWidth: '220px' }}
                    placeholder="Digite o código da Guia (ex: G-210) ou da Consulta (ex: CONS-907)..."
                    value={numeroGuiaInput}
                    onChange={(e) => setNumeroGuiaInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={incluirGuiaPeloNumeroInput}
                  >
                    <Plus size={15} />
                    <span>Incluir Guia (G-nº)</span>
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={abrirModalSelecaoLupa}
                    title="Abrir modal com lista de guias realizadas (G-nº)"
                    aria-label="Abrir modal com lista de guias realizadas"
                    style={{
                      padding: '0.5rem 0.65rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Search size={16} />
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    padding: '0.55rem 0.8rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {status === 'Aberto' && statusSalvo !== 'Aberto'
                    ? 'Clique em "Salvar Alterações do Lote" para confirmar a abertura do lote e liberar a inclusão ou remoção de guias.'
                    : `Inclusão de novas guias bloqueada (só é permitido incluir novas guias quando o lote estiver salvo com o status "Aberto").`}
                </div>
              )}

              <div
                className="guias-lote-list"
                style={{ maxHeight: '340px', gap: '0.75rem' }}
              >
                {faturasEmitidasPorSenha.length === 0 ? (
                  <p
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '0.84rem',
                      padding: '1rem'
                    }}
                  >
                    Nenhuma guia (G-nº) vinculada a este lote. Utilize o campo acima
                    ou clique na lupa para selecionar guias realizadas.
                  </p>
                ) : (
                  faturasEmitidasPorSenha.map((fatura) => (
                    <div
                      key={fatura.chaveFatura}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.55rem'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          borderBottom: '1px solid var(--border-color)',
                          paddingBottom: '0.45rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          {fatura.faturaId && (
                            <span className="badge badge-enviado">
                              Fatura: {fatura.faturaId}
                            </span>
                          )}
                          <span className="badge badge-faturado">
                            Senha Operadora: {fatura.senhaAutorizacao}
                          </span>
                          <span className="badge badge-aberto">
                            Consulta: {fatura.atendimentoId}
                          </span>
                          <strong>
                            {fatura.pacienteNome}{' '}
                            {fatura.pacienteId ? `(${fatura.pacienteId})` : ''}
                          </strong>
                          <span
                            style={{
                              color: 'var(--text-secondary)',
                              fontSize: '0.82rem'
                            }}
                          >
                            • Médico: {fatura.medicoNome} • Data:{' '}
                            {formatarDataBR(fatura.data)}
                          </span>
                        </div>
                        <strong style={{ color: 'var(--accent-color)' }}>
                          {fatura.faturaId ? `${fatura.faturaId}: ` : 'Subtotal: '}
                          {formatarMoeda(fatura.subtotal)}
                        </strong>
                      </div>

                      {fatura.guias.map((g) => (
                        <div
                          key={g.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.35rem 0.5rem',
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: '6px',
                            fontSize: '0.84rem'
                          }}
                        >
                          <div>
                            <strong style={{ color: '#778873' }}>{g.id}</strong>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                marginLeft: '0.5rem',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              [{g.codigoTuss || '10101012'}]
                            </span>{' '}
                            <span>{g.procedimento}</span>
                            {g.senhaAutorizacao && (
                              <span
                                style={{
                                  marginLeft: '0.5rem',
                                  fontSize: '0.76rem',
                                  color: 'var(--text-secondary)'
                                }}
                              >
                                (Senha: {g.senhaAutorizacao})
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem'
                            }}
                          >
                            <strong>{formatarMoeda(g.valor)}</strong>
                            {permiteRemoverGuias && (
                              <button
                                type="button"
                                className="btn-danger"
                                onClick={() => removerGuiaDoLote(g.id)}
                                title="Remover guia do lote"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {abaAtiva === 'historico' && (
            <div className="guias-lote-box">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={18} color="#778873" />
                  <strong>
                    Histórico Automático de Alterações do Lote ({historicoLote.length})
                  </strong>
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Registro salvo com data, hora, campos e valores alterados
                </span>
              </div>

              <div className="guias-lote-list" style={{ maxHeight: '340px' }}>
                {historicoLote.length === 0 ? (
                  <p
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '0.84rem',
                      padding: '1rem'
                    }}
                  >
                    Nenhuma alteração registrada ainda.
                  </p>
                ) : (
                  historicoLote.map((h) => (
                    <div
                      key={h.id}
                      className="guia-lote-item"
                      style={{ flexDirection: 'column', alignItems: 'flex-start' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          width: '100%',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}
                      >
                        <strong>{h.acao}</strong>
                        <span
                          className="badge badge-faturado"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {h.dataHora}
                        </span>
                      </div>
                      <span
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.83rem'
                        }}
                      >
                        {h.detalhe || h.detalhes}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: 'auto' }}>
            <button type="button" className="btn-secondary" onClick={aoFechar}>
              Fechar
            </button>

            {(mudancaStatusNaoSalva ||
              (statusSalvo !== 'Enviado' && statusSalvo !== 'Reenviado')) && (
                <button type="submit" className="btn-primary">
                  {modoEdicao ? 'Salvar Alterações do Lote' : 'Salvar Novo Lote'}
                </button>
              )}
          </div>
        </form>

        {/* Sub-Modal da Lupa: Seleção Múltipla de Guias Realizadas (G-nº) */}
        {modalLupaGuiasAberto && (
          <div
            className="modal-overlay"
            onClick={() => setModalLupaGuiasAberto(false)}
            style={{ zIndex: 1200 }}
          >
            <div
              className="modal-content modal-content-90"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>
                    Selecionar Guias de Consultas Realizadas — {operadoraSelecionada}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Selecione uma ou mais guias emitidas para inclusão no lote de faturamento.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-icon-square"
                  onClick={() => setModalLupaGuiasAberto(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-abas">
                <button
                  type="button"
                  className={`modal-aba-btn ${abaSubModalLupa === 'catalogo' ? 'active' : ''}`}
                  onClick={() => setAbaSubModalLupa('catalogo')}
                >
                  <Search size={15} />
                  <span>
                    1. Guias Disponíveis ({guiasFiltradasNaLupa.length})
                  </span>
                </button>
                <button
                  type="button"
                  className={`modal-aba-btn ${abaSubModalLupa === 'conferencia' ? 'active' : ''}`}
                  onClick={() => setAbaSubModalLupa('conferencia')}
                >
                  <CheckCircle2 size={15} />
                  <span>
                    2. Conferência das Selecionadas ({guiasEscolhidasPreviewNaLupa.length})
                  </span>
                </button>
              </div>

              <div
                className="modal-body-scroll"
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                {abaSubModalLupa === 'catalogo' && (
                  <>
                    <div className="search-box">
                      <Search size={16} color="#5A6B57" />
                      <input
                        type="text"
                        placeholder="Filtrar por G-nº, CONS-nº, PAC-nº, paciente, senha de autorização ou procedimento..."
                        value={buscaModalLupa}
                        onChange={(e) => setBuscaModalLupa(e.target.value)}
                      />
                    </div>

                    <div className="guias-lote-box">
                      <strong>
                        Lista de Guias Realizadas ({guiasFiltradasNaLupa.length})
                      </strong>
                      <div className="guias-lote-list" style={{ maxHeight: '340px' }}>
                        {guiasFiltradasNaLupa.length === 0 ? (
                          <p
                            style={{
                              fontSize: '0.84rem',
                              color: 'var(--text-secondary)',
                              padding: '0.75rem'
                            }}
                          >
                            Nenhuma guia realizada disponível para {operadoraSelecionada}.
                          </p>
                        ) : (
                          guiasFiltradasNaLupa.map((cand) => {
                            const loteOcupado = guiasAlocadasEmOutrosLotes.get(
                              cand.numeroGuia.toUpperCase()
                            );
                            const selecionada = guiasSelecionadasNoModalLupa.includes(
                              cand.numeroGuia
                            );
                            const mesmoTipoLote =
                              tipoAtendimento === 'Misto' ||
                              cand.tipoAtendimento === tipoAtendimento;

                            return (
                              <label
                                key={cand.numeroGuia}
                                className="guia-lote-item"
                                style={{
                                  cursor: loteOcupado ? 'not-allowed' : 'pointer',
                                  opacity: loteOcupado ? 0.55 : 1
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
                                    checked={selecionada}
                                    disabled={Boolean(loteOcupado)}
                                    onChange={() =>
                                      alternarGuiaNoModalLupa(cand.numeroGuia)
                                    }
                                  />
                                  <div>
                                    <div style={{ fontWeight: 600 }}>
                                      <span
                                        style={{
                                          color: '#778873',
                                          marginRight: '0.4rem'
                                        }}
                                      >
                                        {cand.numeroGuia}
                                      </span>
                                      {cand.pacienteNome} ({cand.pacienteId}) —{' '}
                                      {cand.procedimento}
                                    </div>
                                    <small style={{ color: 'var(--text-secondary)' }}>
                                      Consulta: <strong>{cand.atendimentoId}</strong> •
                                      Senha Operadora:{' '}
                                      <strong>{cand.senhaAutorizacao}</strong> • Tipo:{' '}
                                      <strong>{cand.tipoAtendimento}</strong>
                                      {!mesmoTipoLote ? ' (Outro tipo)' : ''}
                                      {loteOcupado
                                        ? ` • Já incluída no lote ${loteOcupado}`
                                        : ''}
                                    </small>
                                  </div>
                                </div>
                                <strong>{formatarMoeda(cand.valor)}</strong>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}

                {abaSubModalLupa === 'conferencia' && (
                  <div className="guias-lote-box">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                      }}
                    >
                      <strong>
                        Conferência das Guias Escolhidas para o Lote ({codigo}) —{' '}
                        {guiasEscolhidasPreviewNaLupa.length} selecionada(s)
                      </strong>
                      <strong style={{ color: 'var(--accent-color)' }}>
                        Subtotal Selecionado:{' '}
                        {formatarMoeda(
                          guiasEscolhidasPreviewNaLupa.reduce((s, g) => s + g.valor, 0)
                        )}
                      </strong>
                    </div>

                    <div className="guias-lote-list" style={{ maxHeight: '340px' }}>
                      {guiasEscolhidasPreviewNaLupa.length === 0 ? (
                        <p
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            padding: '0.5rem'
                          }}
                        >
                          Marque uma ou mais guias na aba "1. Guias Disponíveis" para
                          conferi-las aqui antes de confirmar.
                        </p>
                      ) : (
                        guiasEscolhidasPreviewNaLupa.map((g) => (
                          <div key={g.numeroGuia} className="guia-lote-item">
                            <div>
                              <strong style={{ color: '#778873' }}>
                                {g.numeroGuia}
                              </strong>{' '}
                              — <strong>{g.pacienteNome}</strong> ({g.pacienteId}) •{' '}
                              {g.procedimento}
                              <small
                                style={{
                                  display: 'block',
                                  color: 'var(--text-secondary)'
                                }}
                              >
                                Consulta: {g.atendimentoId} • Senha:{' '}
                                {g.senhaAutorizacao} • Tipo: {g.tipoAtendimento}
                              </small>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              <strong>{formatarMoeda(g.valor)}</strong>
                              <button
                                type="button"
                                className="btn-danger"
                                onClick={() => alternarGuiaNoModalLupa(g.numeroGuia)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-realtime"
                  onClick={() => setModalLupaGuiasAberto(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={confirmarSelecaoModalLupa}
                >
                  <Check size={16} />
                  <span>
                    Confirmar Guias Selecionadas ({guiasEscolhidasPreviewNaLupa.length})
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
