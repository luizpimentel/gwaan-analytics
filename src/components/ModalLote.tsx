import { useState, type FormEvent } from 'react';
import {
  X,
  AlertCircle,
  Lock,
  MessageSquareWarning,
  Plus,
  Trash2,
  FileText,
  CalendarCheck,
  Printer,
  History,
  Layers,
  CheckCircle2
} from 'lucide-react';
import type {
  Atendimento,
  DemandaFinanceira,
  GuiaLote,
  HistoricoAlteracaoLote,
  Operadora,
  PrioridadeDemanda,
  StatusFaturamento,
  TipoAtendimentoLote
} from '../data/dadosFaturamento';
import {
  formatarDataBR,
  formatarMoeda,
  formatarUltimaAtualizacao,
  obterClasseBadge
} from '../utils/formatadores';

interface ModalLoteProps {
  operadoras: Operadora[];
  atendimentos: Atendimento[];
  loteInicial?: DemandaFinanceira | null;
  aoFechar: () => void;
  aoSalvar: (dados: {
    id?: string;
    codigoCustomizado?: string;
    operadora: string;
    descricao: string;
    tipoAtendimento: TipoAtendimentoLote;
    dataCriacao: string;
    dataAlteracaoOuEnvio: string;
    valor: number;
    status: StatusFaturamento;
    prioridade: PrioridadeDemanda;
    guias: GuiaLote[];
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

interface GrupoAtendimentoFatura {
  chaveAtendimento: string;
  pacienteNome: string;
  medicoNome: string;
  data: string;
  guias: GuiaLote[];
  subtotal: number;
}

function agruparGuiasPorAtendimento(guias: GuiaLote[]): GrupoAtendimentoFatura[] {
  const mapa = new Map<string, GrupoAtendimentoFatura>();

  guias.forEach((g) => {
    const chave = g.atendimentoId || `AVULSO-${g.id}`;
    const existente = mapa.get(chave);
    if (existente) {
      existente.guias.push(g);
      existente.subtotal += g.valor;
    } else {
      mapa.set(chave, {
        chaveAtendimento: chave,
        pacienteNome: g.pacienteNome,
        medicoNome: g.medicoNome,
        data: g.data,
        guias: [g],
        subtotal: g.valor
      });
    }
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
}) {
  const grupos = agruparGuiasPorAtendimento(dadosLote.guias);
  const dataEmissao = new Date().toLocaleString('pt-BR');

  const paginasHtml = grupos
    .map((grupo, idx) => {
      const linhasGuias = grupo.guias
        .map(
          (g) => `
          <tr>
            <td><strong>${g.id}</strong></td>
            <td>${g.codigoTuss || '10101012'}</td>
            <td>${g.procedimento}</td>
            <td>${formatarDataBR(g.data)}</td>
            <td><strong>${formatarMoeda(g.valor)}</strong></td>
          </tr>`
        )
        .join('');

      return `
      <div class="invoice-page">
        <div class="header-box">
          <div>
            <div class="title">FATURA DE ATENDIMENTO HOSPITALAR — LOTE ${dadosLote.id}</div>
            <div class="subtitle">Gwaan Analytics • Faturamento de Convênios (${dadosLote.operadora})</div>
          </div>
          <div style="text-align: right;">
            <div class="label">Página da Fatura</div>
            <div class="val" style="font-size: 15px;">Atendimento ${idx + 1} de ${grupos.length}</div>
            <div class="subtitle">Emissão: ${dataEmissao}</div>
          </div>
        </div>

        <div class="section-title">1. Identificação do Lote e Convênio</div>
        <div class="grid">
          <div class="cell"><span class="label">Código do Lote</span><span class="val">${dadosLote.id}</span></div>
          <div class="cell"><span class="label">Operadora</span><span class="val">${dadosLote.operadora}</span></div>
          <div class="cell"><span class="label">Tipo de Tratamento</span><span class="val">${dadosLote.tipoAtendimento}</span></div>
          <div class="cell"><span class="label">Descrição do Lote</span><span class="val">${dadosLote.descricao}</span></div>
        </div>

        <div class="section-title">2. Dados Consolidados do Atendimento (${grupo.chaveAtendimento})</div>
        <div class="grid">
          <div class="cell"><span class="label">Cód. Atendimento</span><span class="val">${grupo.chaveAtendimento}</span></div>
          <div class="cell"><span class="label">Paciente Beneficiário</span><span class="val">${grupo.pacienteNome}</span></div>
          <div class="cell"><span class="label">Profissional Executante</span><span class="val">${grupo.medicoNome}</span></div>
          <div class="cell"><span class="label">Data Base</span><span class="val">${formatarDataBR(grupo.data)}</span></div>
        </div>

        <div class="section-title">3. Guias Incluídas na Fatura deste Atendimento (${grupo.guias.length} guia(s))</div>
        <table>
          <thead>
            <tr>
              <th>Nº da Guia</th>
              <th>Código TUSS</th>
              <th>Descrição do Procedimento / Exame</th>
              <th>Data</th>
              <th>Valor Faturado</th>
            </tr>
          </thead>
          <tbody>
            ${linhasGuias}
            <tr style="background: #f5f7ed;">
              <td colspan="4"><strong>Total da Fatura do Atendimento (${grupo.chaveAtendimento})</strong></td>
              <td><strong>${formatarMoeda(grupo.subtotal)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-line">Auditoria e Faturamento — Gwaan Analytics</div>
          <div class="sig-line">Conferência Operadora (${dadosLote.operadora})</div>
        </div>
      </div>`;
    })
    .join('');

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
  ${paginasHtml}
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
  loteInicial,
  aoFechar,
  aoSalvar,
  aoAbrirRecurso
}: ModalLoteProps) {
  const modoEdicao = Boolean(loteInicial);
  const bloqueadoPorEnviada = loteInicial?.status === 'Enviada';

  const hojeISO = new Date().toISOString().slice(0, 10);

  const [abaAtiva, setAbaAtiva] = useState<'dados' | 'atendimentos' | 'historico'>(
    'dados'
  );

  const [codigo, setCodigo] = useState<string>(
    loteInicial?.id ?? `FAT-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [operadoraSelecionada, setOperadoraSelecionada] = useState<string>(
    loteInicial?.operadora ?? (operadoras[0]?.nome || '')
  );
  const [descricao, setDescricao] = useState<string>(loteInicial?.descricao ?? '');
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimentoLote>(
    loteInicial?.tipoAtendimento ?? 'SADT / Exames'
  );
  const [dataCriacao, setDataCriacao] = useState<string>(
    loteInicial?.dataCriacao ?? hojeISO
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
  const [motivoUltimaExclusaoFatura, setMotivoUltimaExclusaoFatura] = useState<
    string | undefined
  >(loteInicial?.motivoUltimaExclusaoFatura);

  const [exibindoCaixaExcluirFatura, setExibindoCaixaExcluirFatura] =
    useState<boolean>(false);
  const [justificativaExclusaoFatura, setJustificativaExclusaoFatura] =
    useState<string>('');

  const [atendimentoParaImportarId, setAtendimentoParaImportarId] =
    useState<string>('');
  const [guiaPaciente, setGuiaPaciente] = useState<string>('');
  const [guiaMedico, setGuiaMedico] = useState<string>('');
  const [guiaProcedimento, setGuiaProcedimento] = useState<string>('');
  const [guiaCodigoTuss, setGuiaCodigoTuss] = useState<string>('10101012');
  const [guiaData, setGuiaData] = useState<string>(hojeISO);
  const [guiaValor, setGuiaValor] = useState<string>('');

  const valorTotalCalculado = guias.reduce((acc, g) => acc + g.valor, 0);
  const gruposAtendimentos = agruparGuiasPorAtendimento(guias);

  const permiteAlocarMaisGuias = status === 'Aberto' && !bloqueadoPorEnviada;

  const atendimentosDaOperadora = atendimentos.filter(
    (a) =>
      a.operadora === operadoraSelecionada &&
      (a.status === 'Confirmado' || a.status === 'Realizado')
  );

  function gerarCarimboDataHora(): { iso: string; formatado: string } {
    const agora = new Date();
    const iso = agora.toISOString();
    const formatado = `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString(
      'pt-BR',
      { hour: '2-digit', minute: '2-digit' }
    )}`;
    return { iso, formatado };
  }

  function registrarEventoNoHistorico(
    acao: string,
    detalhe: string,
    motivo?: string
  ): HistoricoAlteracaoLote[] {
    const { formatado } = gerarCarimboDataHora();
    const novoItem: HistoricoAlteracaoLote = {
      id: `HL-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      dataHora: formatado,
      acao,
      detalhe,
      motivo
    };
    const novaLista = [novoItem, ...historicoLote];
    setHistoricoLote(novaLista);
    return novaLista;
  }

  function importarAtendimentoComoGuia() {
    if (!atendimentoParaImportarId || !permiteAlocarMaisGuias) return;
    const atd = atendimentos.find((a) => a.id === atendimentoParaImportarId);
    if (!atd) return;

    const novaGuia: GuiaLote = {
      id: `GUIA-${Math.floor(100 + Math.random() * 900)}`,
      atendimentoId: atd.id,
      codigoTuss: atd.codigoTuss || '10101012',
      pacienteNome: atd.pacienteNome,
      medicoNome: atd.medicoNome,
      procedimento: atd.descricao,
      data: atd.data,
      valor: atd.valor
    };

    setGuias((ant) => [...ant, novaGuia]);
    registrarEventoNoHistorico(
      'Alocação de Guia de Atendimento',
      `Guia ${novaGuia.id} (Atendimento ${atd.id} — ${atd.pacienteNome}) alocada ao lote.`
    );
    setAtendimentoParaImportarId('');
  }

  function adicionarGuiaManualNoLote() {
    if (!permiteAlocarMaisGuias) return;
    const valNum = parseFloat(guiaValor);
    if (
      !guiaPaciente.trim() ||
      !guiaProcedimento.trim() ||
      isNaN(valNum) ||
      valNum <= 0
    ) {
      alert(
        'Informe Paciente, Procedimento e um Valor válido para alocar a guia ao lote!'
      );
      return;
    }

    const novaGuia: GuiaLote = {
      id: `GUIA-${Math.floor(100 + Math.random() * 900)}`,
      codigoTuss: guiaCodigoTuss.trim() || '10101012',
      pacienteNome: guiaPaciente.trim(),
      medicoNome: guiaMedico.trim() || 'Corpo Clínico',
      procedimento: guiaProcedimento.trim(),
      data: guiaData || hojeISO,
      valor: valNum
    };

    setGuias((ant) => [...ant, novaGuia]);
    registrarEventoNoHistorico(
      'Alocação Manual de Guia',
      `Guia ${novaGuia.id} (${novaGuia.pacienteNome} — ${formatarMoeda(valNum)}) incluída no lote.`
    );
    setGuiaPaciente('');
    setGuiaMedico('');
    setGuiaProcedimento('');
    setGuiaValor('');
  }

  function removerGuiaDoLote(idGuia: string) {
    if (!permiteAlocarMaisGuias) return;
    const guiaAlvo = guias.find((g) => g.id === idGuia);
    setGuias((ant) => ant.filter((g) => g.id !== idGuia));
    if (guiaAlvo) {
      registrarEventoNoHistorico(
        'Remoção de Guia do Lote',
        `Guia ${guiaAlvo.id} (${guiaAlvo.pacienteNome}) removida do lote.`
      );
    }
  }

  function faturarAtendimentosDoLote() {
    if (guias.length === 0) {
      alert('Aloque ao menos 1 guia no lote antes de emitir as faturas em PDF!');
      return;
    }

    const { iso, formatado } = gerarCarimboDataHora();
    const novoHistorico = registrarEventoNoHistorico(
      'Emissão de Faturas do Lote (PDF)',
      `Faturas geradas para ${gruposAtendimentos.length} atendimento(s) (${guias.length} guia(s)). Status alterado para Faturada.`
    );

    setStatus('Faturada');
    setFaturasEmitidasEm(formatado);
    setExibindoCaixaExcluirFatura(false);

    gerarEImprimirFaturasLotePDF({
      id: loteInicial?.id || codigo,
      operadora: operadoraSelecionada,
      descricao: descricao.trim() || `Lote ${operadoraSelecionada}`,
      tipoAtendimento,
      dataCriacao,
      guias
    });

    aoSalvar({
      id: loteInicial?.id,
      codigoCustomizado: codigo.trim() || undefined,
      operadora: operadoraSelecionada,
      descricao: descricao.trim() || `Lote ${operadoraSelecionada}`,
      tipoAtendimento,
      dataCriacao: dataCriacao || hojeISO,
      dataAlteracaoOuEnvio: iso,
      valor: valorTotalCalculado,
      status: 'Faturada',
      prioridade,
      guias,
      observacoes: observacoes.trim(),
      historicoLote: novoHistorico,
      faturasEmitidasEm: formatado,
      motivoUltimaExclusaoFatura
    });
  }

  function confirmarExclusaoFaturasEmitidas() {
    const motivoLimpo = justificativaExclusaoFatura.trim();
    if (!motivoLimpo) {
      alert(
        'É obrigatório justificar o motivo pelo qual está excluindo as faturas emitidas deste lote!'
      );
      return;
    }

    const { iso } = gerarCarimboDataHora();
    const novoHistorico = registrarEventoNoHistorico(
      'Exclusão de Faturas Emitidas',
      'Faturas do lote foram excluídas e o status retornou para Aberto para correção.',
      motivoLimpo
    );

    setStatus('Aberto');
    setFaturasEmitidasEm(undefined);
    setMotivoUltimaExclusaoFatura(motivoLimpo);
    setExibindoCaixaExcluirFatura(false);
    setJustificativaExclusaoFatura('');

    aoSalvar({
      id: loteInicial?.id,
      codigoCustomizado: codigo.trim() || undefined,
      operadora: operadoraSelecionada,
      descricao: descricao.trim(),
      tipoAtendimento,
      dataCriacao: dataCriacao || hojeISO,
      dataAlteracaoOuEnvio: iso,
      valor: valorTotalCalculado,
      status: 'Aberto',
      prioridade,
      guias,
      observacoes: observacoes.trim(),
      historicoLote: novoHistorico,
      faturasEmitidasEm: undefined,
      motivoUltimaExclusaoFatura: motivoLimpo
    });
  }

  function submeterFormulario(evento: FormEvent) {
    evento.preventDefault();
    if (bloqueadoPorEnviada) return;

    if (!operadoraSelecionada || !descricao.trim()) {
      alert('Preencha a Operadora e a Descrição do Lote!');
      return;
    }

    if (guias.length === 0) {
      alert(
        'O lote precisa conter pelo menos 1 guia de atendimento para calcular o valor total!'
      );
      return;
    }

    const { iso, formatado } = gerarCarimboDataHora();
    const acaoPrincipal = modoEdicao
      ? `Atualização Cadastral do Lote (Status: ${status})`
      : `Criação do Lote (${operadoraSelecionada} — ${tipoAtendimento})`;
    const detalhePrincipal = `Lote salvo com ${guias.length} guia(s) em ${gruposAtendimentos.length} atendimento(s), totalizando ${formatarMoeda(valorTotalCalculado)}.`;

    const historicoFinal: HistoricoAlteracaoLote[] = [
      {
        id: `HL-${Date.now()}`,
        dataHora: formatado,
        acao: acaoPrincipal,
        detalhe: detalhePrincipal
      },
      ...historicoLote
    ];

    aoSalvar({
      id: loteInicial?.id,
      codigoCustomizado: codigo.trim() || undefined,
      operadora: operadoraSelecionada,
      descricao: descricao.trim(),
      tipoAtendimento,
      dataCriacao: dataCriacao || hojeISO,
      dataAlteracaoOuEnvio: iso,
      valor: valorTotalCalculado,
      status,
      prioridade,
      guias,
      observacoes: observacoes.trim(),
      historicoLote: historicoFinal,
      faturasEmitidasEm:
        status === 'Faturada' || status === 'Enviada'
          ? faturasEmitidasEm || formatado
          : undefined,
      motivoUltimaExclusaoFatura
    });
    aoFechar();
  }

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
                ? `Gestão do Lote de Convênio (${loteInicial?.id})`
                : 'Novo Lote de Convênio (+ Lote)'}
            </h3>
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                marginTop: '0.2rem'
              }}
            >
              {modoEdicao && loteInicial
                ? `Criado em ${formatarDataBR(loteInicial.dataCriacao)} • Última alteração automática: ${formatarUltimaAtualizacao(loteInicial.dataAlteracaoOuEnvio || loteInicial.atualizadoHa)}`
                : 'Defina Operadora e Tipo de Tratamento na criação (bloqueados para troca futura).'}
            </p>
          </div>
          <button
            type="button"
            className="btn-realtime"
            onClick={aoFechar}
            style={{ padding: '0.3rem 0.5rem' }}
          >
            <X size={18} />
          </button>
        </div>

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
              Atendimentos Vinculados ({gruposAtendimentos.length} atd. /{' '}
              {guias.length} guias)
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

        {bloqueadoPorEnviada && loteInicial && (
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
              <span>Lote com status "Enviada" — Enviado para a Operadora</span>
            </div>
            <p style={{ fontSize: '0.84rem', marginTop: '0.25rem' }}>
              Lotes já enviados ao convênio para pagamento não podem ser editados
              diretamente. Caso exista alguma divergência, registre um{' '}
              <strong>Recurso</strong> abaixo.
            </p>
            {loteInicial.recurso && (
              <div className="recurso-info-card">
                <strong>
                  Recurso Registrado ({loteInicial.recurso.dataAbertura}):
                </strong>
                <p>{loteInicial.recurso.motivo}</p>
              </div>
            )}
          </div>
        )}

        {!bloqueadoPorEnviada && loteInicial?.recurso && (
          <div className="alert-box alert-recurso">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600
              }}
            >
              <AlertCircle size={16} />
              <span>
                Histórico de Recurso ({loteInicial.recurso.dataAbertura})
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', marginTop: '0.2rem' }}>
              {loteInicial.recurso.motivo}
            </p>
          </div>
        )}

        <div className="lote-summary-strip">
          <div>
            <span className="strip-label">Código do Lote</span>
            <strong style={{ color: '#778873' }}>{codigo}</strong>
          </div>
          <div>
            <span className="strip-label">Operadora {modoEdicao ? '(Fixa)' : ''}</span>
            <strong>{operadoraSelecionada}</strong>
          </div>
          <div>
            <span className="strip-label">
              Tipo de Tratamento {modoEdicao ? '(Fixo)' : ''}
            </span>
            <strong>{tipoAtendimento}</strong>
          </div>
          <div>
            <span className="strip-label">Atendimentos / Guias</span>
            <strong>
              {gruposAtendimentos.length} atd. ({guias.length} guias)
            </strong>
          </div>
          <div>
            <span className="strip-label">Status do Lote</span>
            <span className={obterClasseBadge(status)}>{status}</span>
          </div>
          <div>
            <span className="strip-label">Valor Total (Soma Guias)</span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--accent-color)' }}>
              {formatarMoeda(valorTotalCalculado)}
            </strong>
          </div>
        </div>

        <form
          onSubmit={submeterFormulario}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
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
                  <label>Código do Lote</label>
                  <input
                    type="text"
                    className="form-input"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    disabled={modoEdicao || bloqueadoPorEnviada}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Operadora {modoEdicao ? '(Definida na criação — Sem alteração)' : ''}
                  </label>
                  <select
                    className="form-input"
                    value={operadoraSelecionada}
                    onChange={(e) => setOperadoraSelecionada(e.target.value)}
                    disabled={modoEdicao || bloqueadoPorEnviada}
                    required
                  >
                    {operadoras.map((op) => (
                      <option key={op.id} value={op.nome}>
                        {op.nome} ({op.cnpj})
                      </option>
                    ))}
                    {operadoraSelecionada &&
                      !operadoras.some(
                        (op) => op.nome === operadoraSelecionada
                      ) && (
                        <option value={operadoraSelecionada}>
                          {operadoraSelecionada}
                        </option>
                      )}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Tipo de Tratamento{' '}
                    {modoEdicao ? '(Definido na criação — Sem alteração)' : ''}
                  </label>
                  <select
                    className="form-input"
                    value={tipoAtendimento}
                    onChange={(e) =>
                      setTipoAtendimento(e.target.value as TipoAtendimentoLote)
                    }
                    disabled={modoEdicao || bloqueadoPorEnviada}
                  >
                    {TIPOS_ATENDIMENTO_LOTE.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Descrição do Lote</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Lote Quimioterapia Ambulatorial #92"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={bloqueadoPorEnviada}
                  required
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1.2fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Data de Criação</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dataCriacao}
                    onChange={(e) => setDataCriacao(e.target.value)}
                    disabled={modoEdicao || bloqueadoPorEnviada}
                    required
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
                    disabled={bloqueadoPorEnviada}
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status do Lote de Convênio</label>
                  <select
                    className="form-input"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as StatusFaturamento)
                    }
                    disabled={bloqueadoPorEnviada}
                  >
                    <option value="Aberto">
                      Aberto (Alocar guias para faturar em lote)
                    </option>
                    <option value="Faturada">
                      Faturada (Faturas emitidas das guias incluídas)
                    </option>
                    <option value="Enviada">
                      Enviada (Lote enviado ao convênio para pagamento)
                    </option>
                  </select>
                </div>
              </div>

              {status === 'Aberto' && !bloqueadoPorEnviada && (
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
                      <strong>
                        Lote Aberto para Faturamento ({gruposAtendimentos.length}{' '}
                        atendimento(s) / {guias.length} guia(s))
                      </strong>
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.15rem'
                        }}
                      >
                        Fature os atendimentos incluídos neste lote para gerar o
                        arquivo PDF com páginas equivalentes às faturas de cada
                        atendimento (agrupando múltiplas guias do mesmo atendimento
                        na mesma fatura).
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={faturarAtendimentosDoLote}
                    >
                      <Printer size={16} />
                      <span>Faturar Atendimentos do Lote (Gerar PDF)</span>
                    </button>
                  </div>
                </div>
              )}

              {status === 'Faturada' && (
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
                          gap: '0.45rem'
                        }}
                      >
                        <CheckCircle2 size={17} color="#4d6b53" />
                        <strong>
                          Faturas Emitidas do Lote ({gruposAtendimentos.length}{' '}
                          página(s) de fatura por atendimento)
                        </strong>
                      </div>
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.15rem'
                        }}
                      >
                        {faturasEmitidasEm
                          ? `Faturas geradas em ${faturasEmitidasEm}. `
                          : ''}
                        Visualize/imprima o PDF das faturas ou exclua mediante
                        justificativa obrigatória caso haja algum erro.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() =>
                          gerarEImprimirFaturasLotePDF({
                            id: loteInicial?.id || codigo,
                            operadora: operadoraSelecionada,
                            descricao:
                              descricao.trim() || `Lote ${operadoraSelecionada}`,
                            tipoAtendimento,
                            dataCriacao,
                            guias
                          })
                        }
                      >
                        <Printer size={15} />
                        <span>Visualizar / Imprimir Faturas (PDF)</span>
                      </button>

                      <button
                        type="button"
                        className="btn-danger"
                        style={{ padding: '0.45rem 0.85rem', fontWeight: 600 }}
                        onClick={() =>
                          setExibindoCaixaExcluirFatura((ant) => !ant)
                        }
                      >
                        <Trash2 size={15} style={{ marginRight: '0.35rem' }} />
                        <span>Excluir Faturas</span>
                      </button>
                    </div>
                  </div>

                  {exibindoCaixaExcluirFatura && (
                    <div
                      style={{
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem'
                      }}
                    >
                      <label
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          color: '#dc2626'
                        }}
                      >
                        Justificativa Obrigatória para Exclusão das Faturas Emitidas:
                      </label>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="Descreva o erro ou motivo pelo qual está excluindo as faturas deste lote..."
                        value={justificativaExclusaoFatura}
                        onChange={(e) =>
                          setJustificativaExclusaoFatura(e.target.value)
                        }
                      />
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '0.5rem'
                        }}
                      >
                        <button
                          type="button"
                          className="btn-realtime"
                          onClick={() => {
                            setExibindoCaixaExcluirFatura(false);
                            setJustificativaExclusaoFatura('');
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="btn-recurso"
                          onClick={confirmarExclusaoFaturasEmitidas}
                        >
                          Confirmar Exclusão das Faturas e Reabrir Lote
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Observações / Protocolo do Lote</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Informações complementares sobre remessa XML TISS, autorizações ou protocolo..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  disabled={bloqueadoPorEnviada}
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
                    Atendimentos e Guias Vinculados ao Lote ({gruposAtendimentos.length}{' '}
                    atendimento(s) / {guias.length} guia(s))
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

              {permiteAlocarMaisGuias && (
                <>
                  {atendimentosDaOperadora.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                      }}
                    >
                      <CalendarCheck size={16} color="#778873" />
                      <select
                        className="form-input"
                        style={{ flex: 1 }}
                        value={atendimentoParaImportarId}
                        onChange={(e) =>
                          setAtendimentoParaImportarId(e.target.value)
                        }
                      >
                        <option value="">
                          Alocar guia a partir de atendimento registrado (
                          {operadoraSelecionada})...
                        </option>
                        {atendimentosDaOperadora.map((atd) => (
                          <option key={atd.id} value={atd.id}>
                            {atd.id} — {atd.pacienteNome} | {atd.descricao} (
                            {formatarMoeda(atd.valor)})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={importarAtendimentoComoGuia}
                      >
                        <Plus size={15} />
                        <span>Alocar Guia do Atendimento</span>
                      </button>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.1fr 1fr 0.8fr 1.3fr 0.85fr 0.85fr auto',
                      gap: '0.5rem',
                      alignItems: 'end'
                    }}
                  >
                    <div className="form-group">
                      <label>Paciente da Guia</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Nome do paciente"
                        value={guiaPaciente}
                        onChange={(e) => setGuiaPaciente(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Médico</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Dr(a)."
                        value={guiaMedico}
                        onChange={(e) => setGuiaMedico(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Cód. TUSS</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="10101012"
                        value={guiaCodigoTuss}
                        onChange={(e) => setGuiaCodigoTuss(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Procedimento / Guia</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Guia SADT Ressonância"
                        value={guiaProcedimento}
                        onChange={(e) => setGuiaProcedimento(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Data</label>
                      <input
                        type="date"
                        className="form-input"
                        value={guiaData}
                        onChange={(e) => setGuiaData(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Valor Guia (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        className="form-input"
                        placeholder="0.00"
                        value={guiaValor}
                        onChange={(e) => setGuiaValor(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={adicionarGuiaManualNoLote}
                      style={{ height: '38px' }}
                      title="Incluir guia neste lote"
                    >
                      <Plus size={16} />
                      <span>Incluir</span>
                    </button>
                  </div>
                </>
              )}

              <div
                className="guias-lote-list"
                style={{ maxHeight: '340px', gap: '0.75rem' }}
              >
                {gruposAtendimentos.length === 0 ? (
                  <p
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '0.84rem',
                      padding: '1rem'
                    }}
                  >
                    Nenhum atendimento ou guia vinculado a este lote.
                  </p>
                ) : (
                  gruposAtendimentos.map((grupo) => (
                    <div
                      key={grupo.chaveAtendimento}
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
                        <div>
                          <span
                            className="badge badge-faturado"
                            style={{ marginRight: '0.5rem' }}
                          >
                            Atendimento: {grupo.chaveAtendimento}
                          </span>
                          <strong>{grupo.pacienteNome}</strong>
                          <span
                            style={{
                              color: 'var(--text-secondary)',
                              fontSize: '0.82rem',
                              marginLeft: '0.5rem'
                            }}
                          >
                            • Profissional: {grupo.medicoNome} • Data:{' '}
                            {formatarDataBR(grupo.data)}
                          </span>
                        </div>
                        <strong style={{ color: 'var(--accent-color)' }}>
                          Fatura do Atendimento ({grupo.guias.length} guia(s)):{' '}
                          {formatarMoeda(grupo.subtotal)}
                        </strong>
                      </div>

                      {grupo.guias.map((g) => (
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
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem'
                            }}
                          >
                            <strong>{formatarMoeda(g.valor)}</strong>
                            {permiteAlocarMaisGuias && (
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
                  Datas e horários gerados automaticamente a cada evento no lote
                </span>
              </div>

              {motivoUltimaExclusaoFatura && (
                <div className="alert-box alert-recurso">
                  <strong>
                    Última Justificativa de Exclusão de Fatura Registrada:
                  </strong>
                  <p style={{ marginTop: '0.2rem' }}>{motivoUltimaExclusaoFatura}</p>
                </div>
              )}

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
                    Nenhuma alteração registrada ainda. A data e hora serão geradas
                    automaticamente ao salvar o lote.
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
                          Data de Alteração: {h.dataHora}
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
                      {h.motivo && (
                        <div
                          style={{
                            marginTop: '0.25rem',
                            color: '#d97706',
                            fontWeight: 600,
                            fontSize: '0.82rem'
                          }}
                        >
                          Motivo Justificado: {h.motivo}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-realtime" onClick={aoFechar}>
              {bloqueadoPorEnviada ? 'Fechar' : 'Cancelar'}
            </button>

            {bloqueadoPorEnviada && loteInicial && aoAbrirRecurso ? (
              <button
                type="button"
                className="btn-recurso"
                onClick={() => {
                  aoFechar();
                  aoAbrirRecurso(loteInicial);
                }}
              >
                <MessageSquareWarning size={16} />
                <span>
                  {loteInicial.recurso ? 'Atualizar Recurso' : 'Abrir Recurso'}
                </span>
              </button>
            ) : (
              <button type="submit" className="btn-primary">
                {modoEdicao ? 'Salvar Alterações do Lote' : 'Salvar Novo Lote'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
