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
  Eye,
  Printer,
  Receipt
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
  aoAlterarStatusGuiaParticular: (
    id: string,
    novoStatus: StatusParticular
  ) => void;
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
  'Primeiro Atendimento',
  'Consulta',
  'Retorno',
  'Complementação'
];

export function imprimirDocumentoFinanceiroGuiaParticular(
  tipoDoc: 'NF' | 'Comprovante',
  dados: {
    codigoGuia: string;
    atendimentoId: string;
    paciente: string;
    medicoNome: string;
    descricao: string;
    data: string;
    nf: string;
    comprovanteCodigo: string;
    valorBruto: number;
    desconto: number;
    valorLiquido: number;
    formaPagamento: FormaPagamentoParticular;
    status: StatusParticular;
  }
) {
  const janela = window.open('', '_blank', 'width=850,height=720');
  if (!janela) {
    alert(
      'Permita pop-ups no navegador para gerar e imprimir o documento financeiro!'
    );
    return;
  }

  const titulo =
    tipoDoc === 'NF'
      ? `NOTA FISCAL DE SERVIÇOS MÉDICOS (${dados.nf || 'NF-e Emitida'})`
      : `COMPROVANTE DE CONSULTA PARTICULAR (${dados.comprovanteCodigo || 'COMP-Emitido'})`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${titulo} — ${dados.paciente}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; }
    body { padding: 32px; color: #1f2922; background: #fff; }
    .card { border: 2px solid #2c352b; border-radius: 10px; padding: 26px; max-width: 780px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #778873; padding-bottom: 14px; margin-bottom: 18px; }
    .brand { font-size: 18px; font-weight: 800; color: #2c352b; }
    .sub { font-size: 12px; color: #5a6b57; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 18px; background: #f6f8f3; padding: 14px; border-radius: 8px; border: 1px solid #d2dcb6; }
    .field span { display: block; font-size: 10px; text-transform: uppercase; color: #5a6b57; font-weight: 700; }
    .field strong { font-size: 13px; color: #1f2922; }
    .valores { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; padding: 14px; border: 1px solid #a1bc98; border-radius: 8px; background: #eef3ea; }
    .footer { margin-top: 28px; display: flex; justify-content: space-between; font-size: 11px; color: #5a6b57; border-top: 1px dashed #a1bc98; padding-top: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="brand">GWAAN HEALTH & ANALYTICS — COBRANÇA NA CLÍNICA</div>
        <div class="sub">${titulo}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700;font-size:13px;">Guia (PK): ${dados.codigoGuia}</div>
        <div class="sub">Data: ${formatarDataBR(dados.data)}</div>
      </div>
    </div>
    <div class="grid">
      <div class="field"><span>Paciente</span><strong>${dados.paciente}</strong></div>
      <div class="field"><span>Médico Executante</span><strong>${dados.medicoNome || '-'}</strong></div>
      <div class="field"><span>Consulta Vinculada (PK)</span><strong>${dados.atendimentoId}</strong></div>
      <div class="field"><span>Forma de Pagamento / Senha</span><strong>${dados.formaPagamento} • Sem Senha (Particular)</strong></div>
      <div class="field" style="grid-column: 1 / -1;"><span>Procedimento / Descrição</span><strong>${dados.descricao}</strong></div>
    </div>
    <div class="valores">
      <div class="field"><span>Valor Bruto</span><strong>${formatarMoeda(dados.valorBruto)}</strong></div>
      <div class="field"><span>Desconto Aplicado</span><strong>${formatarMoeda(dados.desconto)}</strong></div>
      <div class="field"><span>Valor Líquido Real</span><strong style="font-size:15px;color:#2c352b;">${formatarMoeda(dados.valorLiquido)}</strong></div>
    </div>
    <div class="footer">
      <span>NF: ${dados.nf || 'Emitida'} • Comprovante: ${dados.comprovanteCodigo || 'Emitido'}</span>
      <span>Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 250); };</script>
</body>
</html>`;

  janela.document.open();
  janela.document.write(html);
  janela.document.close();
}

export function imprimirComprovanteLoteParticularFechado(
  lote: LoteParticular,
  guiasDoLote: GuiaParticular[]
) {
  const janela = window.open('', '_blank', 'width=960,height=780');
  if (!janela) {
    alert(
      'Permita pop-ups no navegador para imprimir o comprovante do lote particular fechado!'
    );
    return;
  }

  const totalBruto = guiasDoLote.reduce((acc, g) => acc + g.valorBruto, 0);
  const totalDesconto = guiasDoLote.reduce(
    (acc, g) => acc + (g.desconto ?? 0),
    0
  );
  const totalLiquido = guiasDoLote.reduce((acc, g) => acc + g.valor, 0);

  const linhas = guiasDoLote
    .map(
      (g, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${g.id}</strong><br/><small>${g.atendimentoId}</small></td>
        <td>${g.tipoGuia}</td>
        <td><strong>${g.paciente}</strong><br/><small>${g.medicoNome || '-'}</small></td>
        <td>${g.descricao}</td>
        <td>${formatarDataBR(g.data)}</td>
        <td>${g.formaPagamento}</td>
        <td>${g.nf || '-'}</td>
        <td style="text-align:right;">${formatarMoeda(g.valorBruto)}</td>
        <td style="text-align:right;">${formatarMoeda(g.desconto ?? 0)}</td>
        <td style="text-align:right;font-weight:700;">${formatarMoeda(g.valor)}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Comprovante de Lote Particular Fechado — ${lote.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; }
    body { padding: 28px; color: #1f2922; background: #fff; }
    .container { border: 2px solid #2c352b; border-radius: 10px; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #778873; padding-bottom: 14px; margin-bottom: 16px; }
    .title { font-size: 19px; font-weight: 800; color: #2c352b; }
    .subtitle { font-size: 12px; color: #5a6b57; margin-top: 4px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f6f8f3; border: 1px solid #d2dcb6; border-radius: 8px; padding: 12px; margin-bottom: 18px; }
    .summary div span { display: block; font-size: 10px; text-transform: uppercase; color: #5a6b57; font-weight: 700; }
    .summary div strong { font-size: 14px; color: #1f2922; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    th, td { border: 1px solid #cbd5c0; padding: 8px; font-size: 11px; text-align: left; }
    th { background: #eef3ea; font-weight: 700; text-transform: uppercase; color: #2c352b; }
    .totals { display: flex; justify-content: flex-end; gap: 24px; padding: 12px 16px; background: #eef3ea; border-radius: 8px; border: 1px solid #778873; font-size: 13px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 38px; text-align: center; font-size: 11px; color: #5a6b57; }
    .sig-line { border-top: 1px solid #5a6b57; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="title">COMPROVANTE DE FECHAMENTO DE LOTE PARTICULAR — ${lote.id}</div>
        <div class="subtitle">${lote.descricao}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700;font-size:13px;">Status: ${lote.status.toUpperCase()}</div>
        <div class="subtitle">Fechado em: ${formatarUltimaAtualizacao(lote.dataFechamento)}</div>
      </div>
    </div>

    <div class="summary">
      <div><span>Código do Lote (PK)</span><strong>${lote.id}</strong></div>
      <div><span>Data de Criação</span><strong>${formatarDataBR(lote.dataCriacao)}</strong></div>
      <div><span>Qtd. Guias Alocadas (G-nº)</span><strong>${guiasDoLote.length} guia(s)</strong></div>
      <div><span>Valor Líquido Total</span><strong>${formatarMoeda(totalLiquido)}</strong></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Guia (G-nº) / Consulta (CONS-nº)</th>
          <th>Tipo de Guia</th>
          <th>Paciente / Médico</th>
          <th>Procedimento</th>
          <th>Data</th>
          <th>Pagamento</th>
          <th>NF</th>
          <th style="text-align:right;">Bruto</th>
          <th style="text-align:right;">Desc.</th>
          <th style="text-align:right;">Líquido</th>
        </tr>
      </thead>
      <tbody>
        ${linhas}
      </tbody>
    </table>

    <div class="totals">
      <div>Total Bruto: <strong>${formatarMoeda(totalBruto)}</strong></div>
      <div>Total Descontos: <strong>${formatarMoeda(totalDesconto)}</strong></div>
      <div>Valor Líquido Fechado: <strong>${formatarMoeda(totalLiquido)}</strong></div>
    </div>

    ${lote.observacoes ? `<p style="margin-top:12px;font-size:11px;color:#5a6b57;"><strong>Observações Contábeis:</strong> ${lote.observacoes}</p>` : ''}

    <div class="signatures">
      <div class="sig-line">Responsável pelo Faturamento / Caixa da Clínica</div>
      <div class="sig-line">Conferência Contábil / Diretoria Financeira</div>
    </div>
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 250); };</script>
</body>
</html>`;

  janela.document.open();
  janela.document.write(html);
  janela.document.close();
}

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
  const [abaModalGuia, setAbaModalGuia] = useState<'principal' | 'financeiros'>(
    'principal'
  );
  const [guiaEditando, setGuiaEditando] = useState<GuiaParticular | null>(null);
  const [atendimentoIdSelecionado, setAtendimentoIdSelecionado] =
    useState<string>('');
  const [tipoGuia, setTipoGuia] = useState<TipoGuiaParticular>(
    'Primeiro Atendimento'
  );
  const [paciente, setPaciente] = useState<string>('');
  const [medicoNome, setMedicoNome] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [dataGuia, setDataGuia] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [nf, setNf] = useState<string>('');
  const [comprovanteEmitido, setComprovanteEmitido] = useState<boolean>(false);
  const [comprovanteCodigo, setComprovanteCodigo] = useState<string>('');
  const [valorBruto, setValorBruto] = useState<string>('');
  const [desconto, setDesconto] = useState<string>('0');
  const [status, setStatus] = useState<StatusParticular>('Não pago');
  const [prioridade, setPrioridade] = useState<PrioridadeDemanda>('Média');
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamentoParticular>('PIX');
  const [observacoes, setObservacoes] = useState<string>('');

  const [modalLoteAberto, setModalLoteAberto] = useState<boolean>(false);
  const [abaModalLote, setAbaModalLote] = useState<'dados' | 'guias'>('dados');
  const [loteDetalheSelecionado, setLoteDetalheSelecionado] =
    useState<LoteParticular | null>(null);
  const [descricaoLote, setDescricaoLote] = useState<string>('');
  const [prioridadeLote, setPrioridadeLote] =
    useState<PrioridadeDemanda>('Média');
  const [statusLote, setStatusLote] = useState<StatusLoteParticular>('Aberto');
  const [guiasSelecionadasParaLote, setGuiasSelecionadasParaLote] = useState<
    string[]
  >([]);
  const [obsLote, setObsLote] = useState<string>('');

  const atendimentosRealizados = atendimentos.filter(
    (a) => a.status === 'Realizado'
  );

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

  function preencherDadosAPartirDeAtendimento(
    idAtd: string,
    tipo: TipoGuiaParticular
  ) {
    const atd = atendimentosRealizados.find((a) => a.id === idAtd);
    if (!atd) return;
    setAtendimentoIdSelecionado(atd.id);
    setPaciente(atd.pacienteNome);
    setMedicoNome(atd.medicoNome);
    setDataGuia(atd.data);
    const prefixoTipo =
      tipo !== 'Primeiro Atendimento' ? `[${tipo}] ` : '';
    setDescricao(`${prefixoTipo}${atd.descricao}`);
    setValorBruto(String(atd.valor));
    setDesconto(String(atd.desconto ?? 0));
  }

  function abrirModalNovaGuia() {
    if (atendimentosRealizados.length === 0) {
      alert('Não há consultas realizadas disponíveis para gerar guia particular!');
      return;
    }
    const atdPadrao =
      atendimentosRealizados.find((a) => a.operadora === 'Particular') ??
      atendimentosRealizados[0];

    const qtdGuiasExistentes = guiasParticulares.filter(
      (g) => g.atendimentoId === atdPadrao.id
    ).length;
    const tipoInicial: TipoGuiaParticular =
      qtdGuiasExistentes > 0 ? 'Complementação' : 'Primeiro Atendimento';

    setGuiaEditando(null);
    setAbaModalGuia('principal');
    setTipoGuia(tipoInicial);
    preencherDadosAPartirDeAtendimento(atdPadrao.id, tipoInicial);
    setNf('');
    setComprovanteEmitido(false);
    setComprovanteCodigo('');
    setStatus('Não pago');
    setPrioridade('Média');
    setFormaPagamento('PIX');
    setObservacoes('');
    setModalGuiaAberto(true);
  }

  function abrirModalEditarGuia(
    guia: GuiaParticular,
    abaInicial: 'principal' | 'financeiros' = 'principal'
  ) {
    setGuiaEditando(guia);
    setAbaModalGuia(abaInicial);
    setAtendimentoIdSelecionado(
      guia.atendimentoId || (atendimentosRealizados[0]?.id ?? '')
    );
    const tipoValido: TipoGuiaParticular =
      guia.tipoGuia && TIPOS_GUIA_PARTICULAR.includes(guia.tipoGuia)
        ? guia.tipoGuia
        : 'Primeiro Atendimento';
    setTipoGuia(tipoValido);
    setPaciente(guia.paciente);
    setMedicoNome(guia.medicoNome ?? '');
    setDescricao(guia.descricao);
    setDataGuia(guia.data);
    setNf(guia.nf);
    setComprovanteEmitido(Boolean(guia.comprovanteEmitido));
    setComprovanteCodigo(guia.comprovanteCodigo ?? '');
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
    setAbaModalLote('dados');
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
    setAbaModalLote('dados');
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

  const guiaBloqueadaPorPagamento =
    guiaEditando?.status === 'Pago' || guiaEditando?.status === 'Fechado';

  function submeterFormularioGuia(evento: FormEvent) {
    evento.preventDefault();
    if (guiaBloqueadaPorPagamento) {
      setModalGuiaAberto(false);
      return;
    }

    if (!atendimentoIdSelecionado) {
      alert(
        'Uma guia particular deve obrigatoriamente estar vinculada a uma consulta realizada (CONS-nº)!'
      );
      return;
    }

    const brutoNum = parseFloat(valorBruto);
    const descNum = Math.max(0, parseFloat(desconto) || 0);

    if (
      !paciente.trim() ||
      !descricao.trim() ||
      isNaN(brutoNum) ||
      brutoNum <= 0
    ) {
      alert('Preencha a consulta, descrição e um valor bruto válido!');
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
      comprovanteEmitido:
        comprovanteEmitido || Boolean(comprovanteCodigo.trim()),
      comprovanteCodigo: comprovanteCodigo.trim() || undefined,
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

    if (guiasSelecionadasParaLote.length === 0) {
      setAbaModalLote('guias');
      alert(
        'Selecione ao menos 1 guia particular (G-nº) com status Pago para alocar no lote (LOTE-nº)!'
      );
      return;
    }

    const descricaoFinal =
      descricaoLote.trim() ||
      `Lote Contábil Particular — ${new Date().toLocaleDateString('pt-BR')}`;

    aoSalvarLoteParticular({
      id: loteDetalheSelecionado?.id,
      descricao: descricaoFinal,
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
      (item.loteId || '').toLocaleLowerCase().includes(termo) ||
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
    if (item.status === 'Pago' || item.status === 'Fechado') {
      return [
        {
          rotulo: `Visualizar Guia (${item.status} — Bloqueada)`,
          icone: <Eye size={14} />,
          aoClicar: () => abrirModalEditarGuia(item, 'principal')
        },
        {
          rotulo: 'Ver Aba Financeiros (NF / Comprovante)',
          icone: <Receipt size={14} />,
          aoClicar: () => abrirModalEditarGuia(item, 'financeiros')
        }
      ];
    }

    return [
      {
        rotulo: 'Editar Guia Particular (G-nº)',
        icone: <Pencil size={14} />,
        aoClicar: () => abrirModalEditarGuia(item, 'principal')
      },
      {
        rotulo: 'Abrir Aba Financeiros',
        icone: <Receipt size={14} />,
        aoClicar: () => abrirModalEditarGuia(item, 'financeiros')
      },
      {
        rotulo: 'Marcar como Pago (Bloqueia alterações)',
        icone: <Check size={14} />,
        aoClicar: () => aoAlterarStatusGuiaParticular(item.id, 'Pago')
      }
    ];
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
            Guias (G-nº) e Lotes (LOTE-nº) de Consultas Particulares
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Consultas particulares (<strong>CONS-nº</strong>) não necessitam de
            senha de autorização — a cobrança é feita diretamente na clínica.
            Guias com status <strong>Pago</strong> podem ser alocadas em{' '}
            <strong>+ Lote (LOTE-nº)</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={abrirModalNovaGuia}>
            <Plus size={18} />
            <span>Guia Particular (G-nº)</span>
          </button>

          <button className="btn-primary" onClick={abrirModalNovoLote}>
            <Plus size={18} />
            <span>Lote Particular (LOTE-nº)</span>
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
            {guiasParticulares.length} guias de consulta particular (G-nº)
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Pago na Clínica (Apto p/ Lote)</span>
            <CheckCircle2 size={20} color="#778873" />
          </div>
          <div className="kpi-value">{formatarMoeda(totalPago)}</div>
          <div className="kpi-subtitle">Guias quitadas prontas p/ LOTE-nº</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Não Pago</span>
            <Clock size={20} color="#d97706" />
          </div>
          <div className="kpi-value">{formatarMoeda(totalNaoPago)}</div>
          <div className="kpi-subtitle">Aguardando cobrança na clínica / NF</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Fechado (Alocadas em Lote)</span>
            <Archive size={20} color="#4d6b53" />
          </div>
          <div className="kpi-value">{formatarMoeda(totalFechado)}</div>
          <div className="kpi-subtitle">
            {lotesParticularesArquivados.length} lote(s) particular(es) LOTE-nº
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
              <span>Guias de Consultas Particulares ({filtrados.length})</span>
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginTop: '0.2rem'
              }}
            >
              Cobrança direta na clínica (sem senha de operadora). Quando uma guia
              possui status <strong>Pago</strong> ou <strong>Fechado</strong>,
              nenhum dado pode ser alterado.
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
              placeholder="Buscar por G-nº, CONS-nº, LOTE-nº, paciente, NF ou procedimento..."
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
                <th>Cód. Guia (PK)</th>
                <th>Consulta (PK) / Tipo</th>
                <th>Paciente</th>
                <th>Procedimento / Guia</th>
                <th>NF / Comprovante</th>
                <th>Pagamento (Clínica)</th>
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
                      item.status === 'Pago' || item.status === 'Fechado'
                        ? `Guia ${item.status} (Somente visualização — edição bloqueada)`
                        : 'Clique para editar a guia de consulta particular'
                    }
                  >
                    <td style={{ fontWeight: 700, color: '#778873' }}>{item.id}</td>
                    <td>
                      <span className="badge badge-faturado">
                        {item.atendimentoId || 'CONS-VINC'}
                      </span>
                      <div
                        style={{
                          fontSize: '0.73rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.15rem',
                          fontWeight: 600
                        }}
                      >
                        {item.tipoGuia}
                      </div>
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
                      <div
                        style={{ color: 'var(--text-primary)', fontWeight: 500 }}
                      >
                        {item.descricao}
                      </div>
                      <small className="obs-preview">
                        Data: {formatarDataBR(item.data)} • Sem Senha (Clínica)
                        {item.loteId ? ` • Lote ${item.loteId}` : ''}
                      </small>
                    </td>
                    <td>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.82rem',
                          fontWeight: 600
                        }}
                      >
                        {item.nf || '-'}
                      </div>
                      {item.comprovanteCodigo && (
                        <small style={{ color: '#4d6b53', fontSize: '0.73rem' }}>
                          {item.comprovanteCodigo}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-faturar">
                        {item.formaPagamento}
                      </span>
                    </td>
                    <td>
                      <span className={obterClassePrioridade(item.prioridade)}>
                        {item.prioridade}
                      </span>
                    </td>
                    <td
                      style={{
                        color:
                          item.desconto > 0 ? '#d97706' : 'var(--text-secondary)'
                      }}
                    >
                      {item.desconto > 0
                        ? `Desc: ${formatarMoeda(item.desconto)}`
                        : 'Sem desc.'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>
                        {formatarMoeda(item.valor)}
                      </div>
                      {item.desconto > 0 && (
                        <small
                          style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem'
                          }}
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
                    <td
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.82rem'
                      }}
                    >
                      {formatarUltimaAtualizacao(item.atualizadoEm)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        opcoes={construirOpcoesParticular(item)}
                        aoExcluir={
                          item.status === 'Pago' || item.status === 'Fechado'
                            ? undefined
                            : () => aoExcluirGuiaParticular(item.id)
                        }
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
              Lotes particulares (<strong>LOTE-nº</strong>) com status{' '}
              <strong>Fechado</strong> disponibilizam o botão para imprimir o
              comprovante consolidado do lote fechado.
            </p>
          </div>
        </div>

        <div className="table-container">
          <table className="demandas-table">
            <thead>
              <tr>
                <th>Código Lote (PK)</th>
                <th>Descrição do Lote</th>
                <th>Data Criação</th>
                <th>Qtd. Guias (G-nº)</th>
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
                    Nenhum lote particular cadastrado. Use o botão "+ Lote
                    Particular (LOTE-nº)" no topo para alocar guias pagas.
                  </td>
                </tr>
              ) : (
                lotesParticularesArquivados.map((lote) => {
                  const guiasDoLote = guiasParticulares.filter((g) =>
                    lote.guiasIds.includes(g.id)
                  );

                  return (
                    <tr
                      key={lote.id}
                      className="clickable-row"
                      onClick={() => abrirModalInspecionarLote(lote)}
                    >
                      <td style={{ fontWeight: 700, color: '#778873' }}>
                        {lote.id}
                      </td>
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
                      <td style={{ fontWeight: 700 }}>
                        {formatarMoeda(lote.valorTotal)}
                      </td>
                      <td>
                        <span
                          className={obterClasseBadgeLoteParticular(lote.status)}
                        >
                          {lote.status}
                        </span>
                      </td>
                      <td
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.82rem'
                        }}
                      >
                        {formatarUltimaAtualizacao(lote.dataFechamento)}
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
                          {lote.status === 'Fechado' && (
                            <button
                              type="button"
                              className="btn-action"
                              onClick={() =>
                                imprimirComprovanteLoteParticularFechado(
                                  lote,
                                  guiasDoLote
                                )
                              }
                              title="Imprimir comprovante consolidado do lote particular fechado"
                            >
                              <Printer size={13} />
                              <span>Imprimir Comprovante</span>
                            </button>
                          )}

                          <ActionMenu
                            opcoes={[
                              {
                                rotulo:
                                  lote.status === 'Aberto'
                                    ? 'Gerenciar / Alocar Guias Pagas'
                                    : 'Ver Guias do Lote Fechado',
                                icone: <FileText size={14} />,
                                aoClicar: () => abrirModalInspecionarLote(lote)
                              },
                              ...(lote.status === 'Fechado'
                                ? [
                                  {
                                    rotulo:
                                      'Imprimir Comprovante do Lote Fechado',
                                    icone: <Printer size={14} />,
                                    aoClicar: () =>
                                      imprimirComprovanteLoteParticularFechado(
                                        lote,
                                        guiasDoLote
                                      )
                                  }
                                ]
                                : [])
                            ]}
                            aoExcluir={() =>
                              aoExcluirLoteParticularArquivado(lote.id)
                            }
                            tituloExcluir="Excluir Lote Particular"
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
                    ? guiaBloqueadaPorPagamento
                      ? `Visualizar Guia Particular (${guiaEditando.id} — ${guiaEditando.status})`
                      : `Editar Guia Particular (${guiaEditando.id})`
                    : 'Registrar Nova Guia de Consulta Particular (G-nº)'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Consultas particulares não necessitam de senha de autorização
                  (cobrança feita diretamente na clínica).
                </p>
              </div>
              <button
                type="button"
                className="btn-icon-square"
                onClick={() => setModalGuiaAberto(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="lote-summary-strip">
              <div>
                <span className="strip-label">Código da Guia</span>
                <strong style={{ color: '#778873' }}>
                  {guiaEditando?.id || 'G-0001'}
                </strong>
              </div>
              <div>
                <span className="strip-label">Consulta Vinculada</span>
                <strong style={{ color: '#778873' }}>
                  {atendimentoIdSelecionado || '-'}
                </strong>
              </div>
              <div>
                <span className="strip-label">Modalidade</span>
                <strong>Particular (Unidade)</strong>
              </div>
              <div>
                <span className="strip-label">Valor Bruto / Desconto</span>
                <strong>
                  {formatarMoeda(brutoPreview)} (-{formatarMoeda(descPreview)})
                </strong>
              </div>
              <div>
                <span className="strip-label">Valor Líquido</span>
                <strong style={{ color: 'var(--accent-color)' }}>
                  {formatarMoeda(liquidoPreview)}
                </strong>
              </div>
              <div>
                <span className="strip-label">Status</span>
                <span className={obterClasseBadgeParticular(status)}>
                  {status}
                </span>
              </div>
            </div>

            {/* Menu de abas abaixo do sumário */}
            <div className="modal-abas">
              <button
                type="button"
                className={`modal-aba-btn ${abaModalGuia === 'principal' ? 'active' : ''}`}
                onClick={() => setAbaModalGuia('principal')}
              >
                <FileText size={15} />
                <span>Dados da Consulta &amp; Guia</span>
              </button>
              <button
                type="button"
                className={`modal-aba-btn ${abaModalGuia === 'financeiros' ? 'active' : ''}`}
                onClick={() => setAbaModalGuia('financeiros')}
              >
                <Receipt size={15} />
                <span>Dados Financeiros, NF &amp; Comprovante</span>
              </button>
            </div>

            <form
              onSubmit={submeterFormularioGuia}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem', flex: 1 }}
            >
              {guiaBloqueadaPorPagamento && (
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
                      Guia Particular com Status &ldquo;{guiaEditando?.status}&rdquo; — Edição Bloqueada
                    </span>
                  </div>
                  <p style={{ fontSize: '0.84rem', marginTop: '0.2rem' }}>
                    Conforme diretriz financeira, guias particulares com status{' '}
                    <strong>Pago</strong> (ou alocadas em lote{' '}
                    <strong>Fechado</strong>) têm todos os seus campos protegidos
                    contra modificações.
                  </p>
                </div>
              )}

              {abaModalGuia === 'principal' ? (
                <>
                  <div className="guias-lote-box">
                    <strong>
                      Vínculo com Consulta Realizada (CONS-nº) e Tipo de Guia
                    </strong>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr',
                        gap: '0.75rem'
                      }}
                    >
                      <div className="form-group">
                        <label>Selecionar Consulta Realizada (CONS-nº)</label>
                        <select
                          className="form-input"
                          value={atendimentoIdSelecionado}
                          onChange={(e) =>
                            preencherDadosAPartirDeAtendimento(
                              e.target.value,
                              tipoGuia
                            )
                          }
                          disabled={guiaBloqueadaPorPagamento}
                          required
                        >
                          {atendimentosRealizados.map((atd) => {
                            const qtdGuiasDoAtd = guiasParticulares.filter(
                              (g) => g.atendimentoId === atd.id
                            ).length;
                            return (
                              <option key={atd.id} value={atd.id}>
                                [{atd.id}] {atd.pacienteNome} ({atd.pacienteId}) •{' '}
                                {atd.medicoNome} • {formatarDataBR(atd.data)} •{' '}
                                {qtdGuiasDoAtd} guia(s)
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Tipo de Guia</label>
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
                          disabled={guiaBloqueadaPorPagamento}
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
                      gridTemplateColumns: '1.2fr 1fr 0.8fr 0.8fr',
                      gap: '0.75rem'
                    }}
                  >
                    <div className="form-group">
                      <label>Paciente da Consulta</label>
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

                    <div className="form-group">
                      <label>Data da Guia</label>
                      <input
                        type="date"
                        className="form-input"
                        value={dataGuia}
                        onChange={(e) => setDataGuia(e.target.value)}
                        disabled={guiaBloqueadaPorPagamento}
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
                        disabled={guiaBloqueadaPorPagamento}
                      >
                        <option value="Alta">Alta</option>
                        <option value="Média">Média</option>
                        <option value="Baixa">Baixa</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Descrição da Consulta / Procedimento na Guia</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Check-up Cardiológico Executivo"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      disabled={guiaBloqueadaPorPagamento}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Observações Clínicas / Administrativas</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Observações gerais da consulta particular..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      disabled={guiaBloqueadaPorPagamento}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="guias-lote-box">
                    <strong>
                      Cobrança Direta na Clínica (Valores, Desconto, Forma de
                      Pagamento, NF e Comprovante)
                    </strong>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr 1fr',
                        gap: '0.75rem',
                        marginTop: '0.5rem'
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
                          disabled={guiaBloqueadaPorPagamento}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Desconto Concedido (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input"
                          placeholder="0.00"
                          value={desconto}
                          onChange={(e) => setDesconto(e.target.value)}
                          disabled={guiaBloqueadaPorPagamento}
                        />
                      </div>

                      <div className="form-group">
                        <label>Valor Líquido Real (R$)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formatarMoeda(liquidoPreview)}
                          disabled
                        />
                      </div>

                      <div className="form-group">
                        <label>Forma de Pagamento (Clínica)</label>
                        <select
                          className="form-input"
                          value={formaPagamento}
                          onChange={(e) =>
                            setFormaPagamento(
                              e.target.value as FormaPagamentoParticular
                            )
                          }
                          disabled={guiaBloqueadaPorPagamento}
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
                        gridTemplateColumns: '1.2fr 1.2fr 1fr',
                        gap: '0.75rem',
                        marginTop: '0.75rem'
                      }}
                    >
                      <div className="form-group">
                        <label>Emissão de Nota Fiscal (NF-e)</label>
                        <div style={{ display: 'flex', gap: '0.45rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ex: NF-e 004890"
                            value={nf}
                            onChange={(e) => setNf(e.target.value)}
                            disabled={guiaBloqueadaPorPagamento}
                          />
                          <button
                            type="button"
                            className="btn-outline"
                            onClick={() => {
                              const codigoGerado =
                                nf.trim() && nf.trim() !== 'Pendente emissão'
                                  ? nf.trim()
                                  : `NF-e 00${Math.floor(4900 + Math.random() * 999)}`;
                              if (!guiaBloqueadaPorPagamento) {
                                setNf(codigoGerado);
                              }
                              imprimirDocumentoFinanceiroGuiaParticular('NF', {
                                codigoGuia: guiaEditando?.id || 'G-NOVA',
                                atendimentoId: atendimentoIdSelecionado,
                                paciente,
                                medicoNome,
                                descricao,
                                data: dataGuia,
                                nf: codigoGerado,
                                comprovanteCodigo:
                                  comprovanteCodigo || 'COMP-Emitido',
                                valorBruto: brutoPreview,
                                desconto: descPreview,
                                valorLiquido: liquidoPreview,
                                formaPagamento,
                                status
                              });
                            }}
                            title="Emitir e Imprimir Nota Fiscal"
                          >
                            <Printer size={15} />
                            <span>Emitir NF</span>
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Emissão de Comprovante de Pagamento</label>
                        <div style={{ display: 'flex', gap: '0.45rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ex: COMP-2026-991"
                            value={comprovanteCodigo}
                            onChange={(e) => {
                              setComprovanteCodigo(e.target.value);
                              setComprovanteEmitido(
                                Boolean(e.target.value.trim())
                              );
                            }}
                            disabled={guiaBloqueadaPorPagamento}
                          />
                          <button
                            type="button"
                            className="btn-outline"
                            onClick={() => {
                              const compGerado =
                                comprovanteCodigo.trim() ||
                                `COMP-2026-${Math.floor(100 + Math.random() * 899)}`;
                              if (!guiaBloqueadaPorPagamento) {
                                setComprovanteCodigo(compGerado);
                                setComprovanteEmitido(true);
                              }
                              imprimirDocumentoFinanceiroGuiaParticular(
                                'Comprovante',
                                {
                                  codigoGuia: guiaEditando?.id || 'G-NOVA',
                                  atendimentoId: atendimentoIdSelecionado,
                                  paciente,
                                  medicoNome,
                                  descricao,
                                  data: dataGuia,
                                  nf: nf || 'Pendente emissão',
                                  comprovanteCodigo: compGerado,
                                  valorBruto: brutoPreview,
                                  desconto: descPreview,
                                  valorLiquido: liquidoPreview,
                                  formaPagamento,
                                  status
                                }
                              );
                            }}
                            title="Emitir e Imprimir Comprovante"
                          >
                            <Receipt size={15} />
                            <span>Comprovante</span>
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Status Financeiro da Guia</label>
                        <select
                          className="form-input"
                          value={status}
                          onChange={(e) =>
                            setStatus(e.target.value as StatusParticular)
                          }
                          disabled={guiaBloqueadaPorPagamento}
                        >
                          <option value="Não pago">Não pago</option>
                          <option value="Pago">Pago (Trava Edições)</option>
                          {guiaEditando?.status === 'Fechado' && (
                            <option value="Fechado">Fechado (Em Lote)</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-realtime"
                  onClick={() => setModalGuiaAberto(false)}
                >
                  {guiaBloqueadaPorPagamento ? 'Fechar Visualização' : 'Cancelar'}
                </button>
                {!guiaBloqueadaPorPagamento && (
                  <button type="submit" className="btn-primary">
                    <Check size={16} />
                    <span>
                      {guiaEditando
                        ? 'Salvar Alterações'
                        : 'Salvar Guia Particular (G-nº)'}
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
                    : 'Alocar Guias Pagas em Lote Particular (+ Lote LOTE-nº)'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Somente guias (G-nº) com status <strong>Pago</strong> podem ser
                  colocadas no lote (LOTE-nº), passando automaticamente para o
                  status <strong>Fechado</strong>.
                </p>
              </div>
              <button
                type="button"
                className="btn-icon-square"
                onClick={() => setModalLoteAberto(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="lote-summary-strip">
              <div>
                <span className="strip-label">Código do Lote</span>
                <strong style={{ color: '#778873' }}>
                  {loteDetalheSelecionado?.id || 'LOTE-0001'}
                </strong>
              </div>
              <div>
                <span className="strip-label">Guias no Lote</span>
                <strong>{guiasSelecionadasParaLote.length} guia(s)</strong>
              </div>
              <div>
                <span className="strip-label">Status nas Guias</span>
                <span className="badge badge-faturado">Fechado</span>
              </div>
              <div>
                <span className="strip-label">Status do Lote</span>
                <span className={obterClasseBadgeLoteParticular(statusLote)}>
                  {statusLote}
                </span>
              </div>
              <div>
                <span className="strip-label">Valor Líquido do Lote</span>
                <strong
                  style={{ color: 'var(--accent-color)', fontSize: '1.05rem' }}
                >
                  {formatarMoeda(somaGuiasSelecionadasLote)}
                </strong>
              </div>
            </div>

            {/* Menu de abas abaixo do sumário */}
            <div className="modal-abas">
              <button
                type="button"
                className={`modal-aba-btn ${abaModalLote === 'dados' ? 'active' : ''}`}
                onClick={() => setAbaModalLote('dados')}
              >
                <Layers size={15} />
                <span>Dados do Lote Particular</span>
              </button>
              <button
                type="button"
                className={`modal-aba-btn ${abaModalLote === 'guias' ? 'active' : ''}`}
                onClick={() => setAbaModalLote('guias')}
              >
                <FileText size={15} />
                <span>
                  Guias Pagas Alocadas ({guiasSelecionadasParaLote.length})
                </span>
              </button>
            </div>

            <form
              onSubmit={submeterFormularioLote}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}
            >
              {loteDetalheSelecionado?.status === 'Fechado' && (
                <div
                  className="alert-box alert-enviado"
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
                        gap: '0.5rem',
                        fontWeight: 600
                      }}
                    >
                      <Lock size={16} />
                      <span>Lote Particular Fechado para Contabilidade</span>
                    </div>
                    <p style={{ fontSize: '0.84rem', marginTop: '0.2rem' }}>
                      Este lote encontra-se <strong>Fechado</strong>. Utilize o
                      botão ao lado para imprimir o comprovante do lote fechado.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() =>
                      imprimirComprovanteLoteParticularFechado(
                        loteDetalheSelecionado,
                        guiasParticulares.filter((g) =>
                          loteDetalheSelecionado.guiasIds.includes(g.id)
                        )
                      )
                    }
                  >
                    <Printer size={16} />
                    <span>Imprimir Comprovante do Lote Fechado</span>
                  </button>
                </div>
              )}

              {abaModalLote === 'dados' && (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.2fr',
                      gap: '0.75rem'
                    }}
                  >
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
                </>
              )}

              {abaModalLote === 'guias' && (
                <div className="guias-lote-box">
                  <strong>
                    {loteDetalheSelecionado?.status === 'Fechado'
                      ? 'Guias (G-nº) Alocadas neste Lote Contábil'
                      : 'Guias Pagas (G-nº) Disponíveis e Alocadas neste Lote'}
                  </strong>

                  {guiasCandidatasAoLote.length === 0 ? (
                    <p
                      style={{
                        fontSize: '0.84rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Não há guias particulares com status "Pago" disponíveis para
                      alocação no momento.
                    </p>
                  ) : (
                    <div className="guias-lote-list">
                      {guiasCandidatasAoLote.map((g) => {
                        const marcada = guiasSelecionadasParaLote.includes(g.id);
                        const jaEstavaNoLote =
                          loteDetalheSelecionado?.guiasIds.includes(g.id) ??
                          false;
                        const desabilitarCheckbox =
                          loteDetalheSelecionado?.status === 'Fechado' ||
                          jaEstavaNoLote;

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
                                  Consulta: {g.atendimentoId || 'CONS'} (
                                  {g.tipoGuia}) • NF: {g.nf} • Pagamento:{' '}
                                  {g.formaPagamento} • Status na guia:{' '}
                                  <strong>
                                    {marcada ? 'Fechado (No Lote)' : g.status}
                                  </strong>
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
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-realtime"
                  onClick={() => setModalLoteAberto(false)}
                >
                  Fechar
                </button>
                {loteDetalheSelecionado?.status === 'Fechado' ? (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() =>
                      imprimirComprovanteLoteParticularFechado(
                        loteDetalheSelecionado,
                        guiasParticulares.filter((g) =>
                          loteDetalheSelecionado.guiasIds.includes(g.id)
                        )
                      )
                    }
                  >
                    <Printer size={16} />
                    <span>Imprimir Comprovante do Lote Fechado</span>
                  </button>
                ) : (
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
