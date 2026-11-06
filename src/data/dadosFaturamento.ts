export type StatusFaturamento =
  | 'Aberto'
  | 'Fechado'
  | 'Enviado'
  | 'Glosado'
  | 'Reenviado'
  | 'Pendente';

export type StatusParticular = 'Pago' | 'Não pago' | 'Fechado';

export type StatusLoteParticular = 'Aberto' | 'Fechado';

export type TipoGuiaParticular =
  | 'Primeiro Atendimento'
  | 'Consulta'
  | 'Retorno'
  | 'Complementação';

export type TipoGlosaLote =
  | 'Administrativa'
  | 'Técnica / Médica'
  | 'Divergência de Valor / Tabela TUSS'
  | 'Elegibilidade / Carteirinha'
  | 'Ausência de Senha / Autorização';

export type PrioridadeDemanda = 'Alta' | 'Média' | 'Baixa';

export type FormaPagamentoParticular =
  | 'PIX'
  | 'Cartão'
  | 'Boleto'
  | 'Transferência'
  | 'Dinheiro';

export type StatusAtendimento =
  | 'Agendado'
  | 'Confirmado'
  | 'Realizado'
  | 'Cancelado';

export type StatusGuiaTuss = 'Realizado' | 'Cancelada';

export type TipoAtendimentoLote =
  | 'Consulta'
  | 'SADT / Exames'
  | 'Internação'
  | 'Cirurgia / Procedimento'
  | 'Oncologia / Terapia'
  | 'Misto';

export interface RecursoLote {
  tipoGlosa?: TipoGlosaLote;
  motivo: string;
  justificativaRecurso?: string;
  dataAbertura: string;
  resolvidoEm?: string;
}

export interface HistoricoAlteracaoLote {
  id: string;
  dataHora: string;
  acao: string;
  detalhes?: string;
  detalhe?: string;
  motivo?: string;
}

export interface GuiaLote {
  id: string; // Chave primária: G-nº
  numeroGuiaOperadora?: string; // Código da guia fornecido pela operadora (fallback: id G-nº)
  atendimentoId?: string; // Chave primária da Consulta: CONS-nº
  faturaId?: string; // Chave primária da Fatura (gerada quando o Lote fecha): FAT-nº
  senhaAutorizacao?: string; // Senha emitida pela operadora (obrigatória para operadoras, ausente para particular)
  tipoAtendimento?: TipoAtendimentoLote;
  codigoTuss?: string;
  pacienteId?: string; // Chave primária do Paciente: PAC-nº
  pacienteNome: string;
  medicoNome: string;
  procedimento: string;
  procedimentos?: ProcedimentoAtendimento[];
  data: string;
  valor: number;
  statusGuia?: StatusGuiaTuss;
}

export interface DemandaFinanceira {
  id: string; // Chave primária do Lote: LOTE-nº
  operadora: string;
  descricao: string;
  tipoAtendimento: TipoAtendimentoLote;
  dataCriacao: string;
  horaCriacao?: string;
  dataAlteracaoOuEnvio: string;
  valor: number;
  status: StatusFaturamento;
  prioridade: PrioridadeDemanda;
  atualizadoHa: string;
  guias: GuiaLote[];
  codigoEnvioOperadora?: string;
  codigoReenvioOperadora?: string;
  faturasEmitidas?: boolean;
  faturasEmitidasEm?: string;
  motivoUltimaExclusaoFatura?: string;
  categoria?: 'Operadora' | 'Particular';
  historicoLote?: HistoricoAlteracaoLote[];
  observacoes?: string;
  recurso?: RecursoLote;
}

export interface GuiaParticular {
  id: string; // Chave primária da Guia: G-nº
  atendimentoId: string; // Chave primária da Consulta: CONS-nº
  tipoGuia?: TipoGuiaParticular;
  tipoGuiaComplementar?: TipoGuiaParticular;
  pacienteId?: string; // Chave primária do Paciente: PAC-nº
  paciente: string;
  medicoNome?: string;
  descricao: string;
  data: string;
  nf: string;
  comprovanteEmitido?: boolean;
  comprovanteCodigo?: string;
  valorBruto: number;
  desconto: number;
  valor: number;
  status: StatusParticular;
  prioridade: PrioridadeDemanda;
  formaPagamento: FormaPagamentoParticular;
  loteId?: string; // Chave primária do Lote: LOTE-nº
  observacoes?: string;
  atualizadoEm: string;
  recurso?: RecursoLote;
}

export interface LoteParticular {
  id: string; // Chave primária do Lote: LOTE-nº
  descricao: string;
  dataCriacao: string;
  dataFechamento: string;
  prioridade: PrioridadeDemanda;
  status: StatusLoteParticular;
  guiasIds: string[]; // Lista de G-nº
  valorTotal: number;
  observacoes?: string;
}

export interface Operadora {
  id: string;
  nome: string;
  cnpj: string;
  datasEnvio: string[];
  planos?: string[];
}

export interface Profissional {
  id: string;
  foto: string;
  nome: string;
  cpf: string;
  cargo: string;
  crm: string;
  ufCrm: string;
  cbo?: string;
  percentualRepasse?: number;
  especialidade: string;
  telefone: string;
  email: string;
  endereco: string;
  ativo: boolean;
}

export function ehProfissionalMedico(cargoOuFuncao: string): boolean {
  const texto = (cargoOuFuncao || '').toLocaleLowerCase();
  return (
    texto.includes('médico') ||
    texto.includes('medico') ||
    texto.includes('médica') ||
    texto.includes('medica')
  );
}

export interface Paciente {
  id: string; // Chave primária do Paciente: PAC-nº
  foto: string;
  nome: string;
  sobrenome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataNascimento: string;
  endereco: string;
  cidade: string;
  convenioPadrao?: string;
  numeroCarteirinha?: string;
  planoConvenio?: string;
  observacoesClinicas?: string;
}

export interface HistoricoValorAtendimento {
  id: string;
  dataHora: string;
  descricaoAcao?: string;
  valorAnterior: number;
  valorNovo: number;
  descontoAnterior: number;
  descontoNovo: number;
}

export interface ProcedimentoAtendimento {
  id: string;
  codigoTuss: string;
  descricao: string;
  valor: number;
  desconto?: number;
  senhaAutorizacao?: string;
  numeroGuia?: string; // Código da Guia Empresa (G-nº) associada à senha deste procedimento
  numeroGuiaOperadora?: string; // Código da Guia Operadora (quando Operadora !== Particular; fallback para numeroGuia)
}

export interface Atendimento {
  id: string; // Código da Consulta: CONS-nº
  numeroGuia?: string; // Guia empresa principal: G-nº
  numeroGuiaOperadora?: string; // Guia operadora principal
  senhaAutorizacao?: string;
  tipoAtendimento?: TipoAtendimentoLote;
  codigoTuss?: string;
  pacienteId: string; // Código do Paciente: PAC-nº
  pacienteNome: string;
  medicoId: string;
  medicoNome: string;
  especialidade: string;
  descricao: string;
  procedimentos?: ProcedimentoAtendimento[];
  data: string;
  hora: string;
  operadora: string;
  plano?: string;
  matricula?: string;
  status: StatusAtendimento;
  valor: number;
  desconto?: number;
  historicoAlteracoes?: HistoricoValorAtendimento[];
  guiaCancelada?: boolean;
}

export interface GuiaDerivadaDaConsulta extends Atendimento {
  numeroGuia: string;
  numeroGuiaOperadora?: string;
  numeroGuiaPK: string;
  consultaIdPK: string;
  codigoTussPrincipal: string;
  procedimentos: ProcedimentoAtendimento[];
  valorTotal: number;
  valorLiquido: number;
  loteVinculadoId?: string;
  faturaVinculadaId?: string;
}

export function extrairGuiasDaConsulta(
  consulta: Atendimento
): GuiaDerivadaDaConsulta[] {
  const numConsBase = consulta.id.replace(/\D/g, '') || '100';
  const guiaPrincipalPadrao =
    consulta.numeroGuia && consulta.numeroGuia.startsWith('G-')
      ? consulta.numeroGuia
      : `G-${numConsBase}`;

  const procs: ProcedimentoAtendimento[] =
    consulta.procedimentos && consulta.procedimentos.length > 0
      ? consulta.procedimentos
      : [
        {
          id: `PROC-${consulta.id}-1`,
          codigoTuss: consulta.codigoTuss,
          descricao: consulta.descricao,
          valor: consulta.valor,
          desconto: consulta.operadora === 'Particular' ? consulta.desconto : undefined,
          senhaAutorizacao:
            consulta.operadora === 'Particular'
              ? undefined
              : consulta.senhaAutorizacao,
          numeroGuia: guiaPrincipalPadrao,
          numeroGuiaOperadora:
            consulta.operadora === 'Particular'
              ? guiaPrincipalPadrao
              : consulta.numeroGuiaOperadora || guiaPrincipalPadrao
        }
      ];

  if (consulta.operadora === 'Particular') {
    const somaParticular = procs.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    const somaDescontoProcs = procs.reduce(
      (acc, p) => acc + (Number(p.desconto) || 0),
      0
    );
    const descontoFinalPart =
      somaDescontoProcs > 0 ? somaDescontoProcs : (consulta.desconto ?? 0);
    const guiaId = procs[0]?.numeroGuia?.startsWith('G-')
      ? procs[0].numeroGuia
      : guiaPrincipalPadrao;
    const tussPart = procs[0]?.codigoTuss || consulta.codigoTuss;
    const valorBrutoPart = somaParticular > 0 ? somaParticular : consulta.valor;
    const valorLiqPart = Math.max(0, valorBrutoPart - descontoFinalPart);

    return [
      {
        ...consulta,
        id: guiaId,
        numeroGuia: guiaId,
        numeroGuiaOperadora: guiaId,
        numeroGuiaPK: guiaId,
        consultaIdPK: consulta.id,
        senhaAutorizacao: undefined,
        codigoTuss: tussPart,
        codigoTussPrincipal: tussPart,
        descricao: procs.map((p) => p.descricao).join(' + ') || consulta.descricao,
        procedimentos: procs.map((p) => ({
          ...p,
          senhaAutorizacao: undefined,
          numeroGuia: guiaId,
          numeroGuiaOperadora: guiaId
        })),
        valor: valorBrutoPart,
        desconto: descontoFinalPart,
        valorTotal: valorBrutoPart,
        valorLiquido: valorLiqPart
      }
    ];
  }

  // Agrupa procedimentos pela Senha de Autorização
  const gruposPorSenha = new Map<string, ProcedimentoAtendimento[]>();
  procs.forEach((proc, idx) => {
    const senhaLimpa =
      (proc.senhaAutorizacao || consulta.senhaAutorizacao || '').trim() ||
      `AUTH-${numConsBase}${idx + 1}`;
    const listaAtual = gruposPorSenha.get(senhaLimpa) || [];
    listaAtual.push({
      ...proc,
      senhaAutorizacao: senhaLimpa
    });
    gruposPorSenha.set(senhaLimpa, listaAtual);
  });

  const guiasGeradas: GuiaDerivadaDaConsulta[] = [];
  const guiasUsadasNestaConsulta = new Set<string>();
  let indiceGrupo = 0;

  gruposPorSenha.forEach((procsDoGrupo, senhaGrupo) => {
    const guiaExistenteNoProc = procsDoGrupo.find(
      (p) => p.numeroGuia && p.numeroGuia.startsWith('G-')
    )?.numeroGuia;

    let idGuiaGrupo = '';
    if (
      guiaExistenteNoProc &&
      !guiasUsadasNestaConsulta.has(guiaExistenteNoProc.toUpperCase())
    ) {
      idGuiaGrupo = guiaExistenteNoProc;
    } else if (
      indiceGrupo === 0 &&
      !guiasUsadasNestaConsulta.has(guiaPrincipalPadrao.toUpperCase())
    ) {
      idGuiaGrupo = guiaPrincipalPadrao;
    } else {
      idGuiaGrupo = `G-${numConsBase}${indiceGrupo + 1}`;
    }

    guiasUsadasNestaConsulta.add(idGuiaGrupo.toUpperCase());

    const guiaOperadoraInformada =
      procsDoGrupo.find(
        (p) => p.numeroGuiaOperadora && p.numeroGuiaOperadora.trim()
      )?.numeroGuiaOperadora?.trim() ||
      (indiceGrupo === 0 && consulta.numeroGuiaOperadora?.trim()
        ? consulta.numeroGuiaOperadora.trim()
        : '') ||
      idGuiaGrupo;

    const valorGrupo = procsDoGrupo.reduce(
      (acc, p) => acc + (Number(p.valor) || 0),
      0
    );
    const descricaoGrupo = procsDoGrupo.map((p) => p.descricao).join(' + ');
    const tussGrupo =
      procsDoGrupo[0]?.codigoTuss || consulta.codigoTuss || '10101012';

    guiasGeradas.push({
      ...consulta,
      id: idGuiaGrupo,
      numeroGuia: idGuiaGrupo,
      numeroGuiaOperadora: guiaOperadoraInformada,
      numeroGuiaPK: idGuiaGrupo,
      consultaIdPK: consulta.id,
      senhaAutorizacao: senhaGrupo,
      codigoTuss: tussGrupo,
      codigoTussPrincipal: tussGrupo,
      descricao: descricaoGrupo,
      procedimentos: procsDoGrupo.map((p) => ({
        ...p,
        senhaAutorizacao: senhaGrupo,
        numeroGuia: idGuiaGrupo,
        numeroGuiaOperadora:
          p.numeroGuiaOperadora && p.numeroGuiaOperadora.trim()
            ? p.numeroGuiaOperadora.trim()
            : guiaOperadoraInformada
      })),
      valor: valorGrupo,
      valorTotal: valorGrupo,
      valorLiquido: valorGrupo,
      desconto: undefined
    });

    indiceGrupo++;
  });

  return guiasGeradas;
}

export interface GuiaTussEditavel {
  id: string;
  atendimentoId?: string;
  loteVinculadoId?: string;
  codigoTuss: string;
  pacienteId: string;
  pacienteNome: string;
  medicoId: string;
  medicoNome: string;
  especialidade: string;
  descricao: string;
  procedimentos?: ProcedimentoAtendimento[];
  data: string;
  hora: string;
  operadora: string;
  valor: number;
  desconto?: number;
  status: StatusGuiaTuss;
}

export interface RegrasGestao {
  metaPorOperadora: number;
  metaGlobalMensal: number;
  valorMinimoLote: number;
  tetoGlosaPercentual: number;
  metaAtendimentosMensal: number;
  minimoAtendimentosPorMedico: number;
}

export interface PreferenciasSistema {
  modoEscuro: boolean;
  tabelaCompacta: boolean;
  confirmarExclusao: boolean;
}

export const UFS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const hoje = new Date();
const anoAtual = hoje.getFullYear();
const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
const diaHoje = String(hoje.getDate()).padStart(2, '0');
export const DATA_HOJE_ISO = `${anoAtual}-${mesAtual}-${diaHoje}`;

function deslocarDiasISO(dias: number, hora = '10:30'): { data: string; iso: string } {
  const d = new Date(hoje);
  d.setDate(d.getDate() + dias);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const data = `${yyyy}-${mm}-${dd}`;
  return { data, iso: `${data}T${hora}:00` };
}

export function aplicarCancelamentoAutomaticoAtendimentos(
  lista: Atendimento[]
): { listaAtualizada: Atendimento[]; houveAlteracao: boolean } {
  const listaSegura: Atendimento[] = Array.isArray(lista)
    ? lista
    : lista &&
      typeof lista === 'object' &&
      Array.isArray((lista as { listaAtualizada?: Atendimento[] }).listaAtualizada)
      ? (lista as { listaAtualizada: Atendimento[] }).listaAtualizada
      : [];

  const agora = new Date();
  const hojeMeiaNoite = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate()
  ).getTime();
  const umDiaEmMs = 24 * 60 * 60 * 1000;

  let houveAlteracao = false;

  const listaAtualizada = listaSegura.map((atd) => {
    if (atd.status === 'Realizado' || atd.status === 'Cancelado') {
      return atd;
    }

    const partes = (atd.data || '').slice(0, 10).split('-');
    if (partes.length !== 3) return atd;

    const dataMarcada = new Date(
      Number(partes[0]),
      Number(partes[1]) - 1,
      Number(partes[2])
    ).getTime();

    if (isNaN(dataMarcada)) return atd;

    if (hojeMeiaNoite - dataMarcada >= umDiaEmMs) {
      houveAlteracao = true;
      return {
        ...atd,
        status: 'Cancelado' as StatusAtendimento
      };
    }

    return atd;
  });

  return { listaAtualizada, houveAlteracao };
}

export const PLANOS_PARTICULAR: string[] = ['Particular', 'VIP', 'MRKT'];

export const OPERADORAS_PADRAO: Operadora[] = [
  {
    id: 'OP-01',
    nome: 'Bradesco Saúde',
    cnpj: '92.693.118/0001-60',
    datasEnvio: [`${anoAtual}-${mesAtual}-05`, `${anoAtual}-${mesAtual}-20`],
    planos: [
      'Bradesco Saúde Top Nacional Apartamento',
      'Bradesco Saúde Top Nacional',
      'Bradesco Saúde Nacional Plus',
      'Bradesco Saúde Efetivo'
    ]
  },
  {
    id: 'OP-02',
    nome: 'Unimed',
    cnpj: '48.090.146/0001-00',
    datasEnvio: [`${anoAtual}-${mesAtual}-10`, `${anoAtual}-${mesAtual}-25`],
    planos: [
      'Unimed Especial Nacional',
      'Unimed Seguros Apartamento',
      'Unimed Clássico Regional'
    ]
  },
  {
    id: 'OP-03',
    nome: 'SulAmérica Saúde',
    cnpj: '01.685.053/0001-56',
    datasEnvio: [`${anoAtual}-${mesAtual}-08`, `${anoAtual}-${mesAtual}-22`],
    planos: [
      'SulAmérica Prestige',
      'SulAmérica Executivo',
      'SulAmérica Especial 100',
      'SulAmérica Exato'
    ]
  },
  {
    id: 'OP-04',
    nome: 'Amil',
    cnpj: '29.309.127/0001-79',
    datasEnvio: [`${anoAtual}-${mesAtual}-12`, `${anoAtual}-${mesAtual}-28`],
    planos: [
      'Amil One S2500 Executivo',
      'Amil S750 Nacional',
      'Amil S450 Apartamento',
      'Amil Fácil'
    ]
  }
];

export function obterPlanosPorOperadora(
  nomeOperadora: string,
  operadoras: Operadora[] = OPERADORAS_PADRAO
): string[] {
  if (nomeOperadora === 'Particular') {
    return PLANOS_PARTICULAR;
  }
  const opEncontrada = operadoras.find((o) => o.nome === nomeOperadora);
  if (opEncontrada?.planos && opEncontrada.planos.length > 0) {
    return opEncontrada.planos;
  }
  const padraoEncontrado = OPERADORAS_PADRAO.find((o) => o.nome === nomeOperadora);
  if (padraoEncontrado?.planos && padraoEncontrado.planos.length > 0) {
    return padraoEncontrado.planos;
  }
  return ['Executivo Nacional', 'Especial Apartamento', 'Básico Enfermaria'];
}

function formatarDataSimples(isoData: string): string {
  const partes = isoData.slice(0, 10).split('-');
  if (partes.length !== 3) return isoData;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export const DEMANDAS_INICIAIS: DemandaFinanceira[] = [
  {
    id: 'LOTE-4821',
    operadora: 'Bradesco Saúde',
    descricao: 'Lote Oncologia Ambulatorial #42',
    tipoAtendimento: 'Oncologia / Terapia',
    dataCriacao: DATA_HOJE_ISO,
    horaCriacao: '09:15',
    dataAlteracaoOuEnvio: `${DATA_HOJE_ISO}T09:15:00`,
    valor: 18500.0,
    status: 'Aberto',
    prioridade: 'Alta',
    atualizadoHa: `${DATA_HOJE_ISO}T09:15:00`,
    faturasEmitidas: false,
    observacoes:
      'Lote aberto com 2 guias (G-101 e G-102) da mesma consulta (CONS-902) com senhas de autorização distintas.',
    historicoLote: [
      {
        id: 'HLOT-01',
        dataHora: `${diaHoje}/${mesAtual}/${anoAtual} às 09:15`,
        acao: 'Criação do Lote (LOTE-4821)',
        detalhes:
          'Lote criado com status Aberto contendo as guias G-101 (AUTH-884120) e G-102 (AUTH-884199).'
      }
    ],
    guias: [
      {
        id: 'G-101',
        atendimentoId: 'CONS-902',
        senhaAutorizacao: 'AUTH-884120',
        tipoAtendimento: 'Oncologia / Terapia',
        codigoTuss: '40304361',
        pacienteId: 'PAC-2002',
        pacienteNome: 'Roberto Almeida Prado',
        medicoNome: 'Dr. Eduardo Cavalcanti',
        procedimento: 'Quimioterapia Infusional Ciclo #01 + Monitoramento Cardiológico Contínuo',
        procedimentos: [
          {
            id: 'PROC-G101-1',
            codigoTuss: '40304361',
            descricao: 'Quimioterapia Infusional Ciclo #01',
            valor: 6200.0,
            senhaAutorizacao: 'AUTH-884120',
            numeroGuia: 'G-101'
          },
          {
            id: 'PROC-G101-2',
            codigoTuss: '20104090',
            descricao: 'Monitoramento Cardiológico Contínuo em Infusão',
            valor: 3600.0,
            senhaAutorizacao: 'AUTH-884120',
            numeroGuia: 'G-101'
          }
        ],
        data: DATA_HOJE_ISO,
        valor: 9800.0,
        statusGuia: 'Realizado'
      },
      {
        id: 'G-102',
        atendimentoId: 'CONS-902',
        senhaAutorizacao: 'AUTH-884199',
        tipoAtendimento: 'Oncologia / Terapia',
        codigoTuss: '20104294',
        pacienteId: 'PAC-2002',
        pacienteNome: 'Roberto Almeida Prado',
        medicoNome: 'Dr. Eduardo Cavalcanti',
        procedimento: 'Ecocardiograma Transtorácico de Controle Oncológico',
        procedimentos: [
          {
            id: 'PROC-G102-1',
            codigoTuss: '20104294',
            descricao: 'Ecocardiograma Transtorácico de Controle Oncológico',
            valor: 8700.0,
            senhaAutorizacao: 'AUTH-884199',
            numeroGuia: 'G-102'
          }
        ],
        data: DATA_HOJE_ISO,
        valor: 8700.0,
        statusGuia: 'Realizado'
      }
    ]
  },
  {
    id: 'LOTE-5190',
    operadora: 'Unimed',
    descricao: 'Guias SADT Diagnóstico por Imagem #18',
    tipoAtendimento: 'SADT / Exames',
    dataCriacao: DATA_HOJE_ISO,
    horaCriacao: '08:50',
    dataAlteracaoOuEnvio: `${DATA_HOJE_ISO}T10:30:00`,
    valor: 14200.5,
    status: 'Fechado',
    prioridade: 'Alta',
    atualizadoHa: `${DATA_HOJE_ISO}T10:30:00`,
    faturasEmitidas: true,
    faturasEmitidasEm: `${diaHoje}/${mesAtual}/${anoAtual} às 10:30`,
    observacoes: 'Faturas FAT-103 e FAT-104 emitidas por guia/senha e prontas para envio à operadora.',
    historicoLote: [
      {
        id: 'HLOT-02',
        dataHora: `${diaHoje}/${mesAtual}/${anoAtual} às 10:30`,
        acao: 'Faturamento das Guias (Lote Fechado)',
        detalhes: 'Faturas FAT-103 e FAT-104 geradas para as guias G-103 e G-104.'
      },
      {
        id: 'HLOT-03',
        dataHora: `${diaHoje}/${mesAtual}/${anoAtual} às 08:50`,
        acao: 'Criação do Lote (LOTE-5190)',
        detalhes: 'Lote registrado para Unimed (SADT / Exames).'
      }
    ],
    guias: [
      {
        id: 'G-103',
        atendimentoId: 'CONS-903',
        faturaId: 'FAT-103',
        senhaAutorizacao: 'AUTH-551029',
        tipoAtendimento: 'SADT / Exames',
        codigoTuss: '41101227',
        pacienteId: 'PAC-2003',
        pacienteNome: 'Marcos Vinícius Couto',
        medicoNome: 'Dr. Rafael Bittencourt',
        procedimento: 'Ressonância Magnética Articular + Infiltração Guiada',
        data: DATA_HOJE_ISO,
        valor: 6800.5,
        statusGuia: 'Realizado'
      },
      {
        id: 'G-104',
        atendimentoId: 'CONS-912',
        faturaId: 'FAT-104',
        senhaAutorizacao: 'AUTH-551088',
        tipoAtendimento: 'SADT / Exames',
        codigoTuss: '41001095',
        pacienteId: 'PAC-2001',
        pacienteNome: 'Helena Vasconcelos',
        medicoNome: 'Dr. Eduardo Cavalcanti',
        procedimento: 'Angiotomografia de Coronárias e Doppler',
        data: DATA_HOJE_ISO,
        valor: 7400.0,
        statusGuia: 'Realizado'
      }
    ]
  },
  {
    id: 'LOTE-5812',
    operadora: 'Bradesco Saúde',
    descricao: 'Lote Hemodinâmica e Cardiologia #11',
    tipoAtendimento: 'Cirurgia / Procedimento',
    dataCriacao: deslocarDiasISO(-3).data,
    horaCriacao: '10:15',
    dataAlteracaoOuEnvio: deslocarDiasISO(-2, '11:05').iso,
    valor: 27900.0,
    status: 'Enviado',
    codigoEnvioOperadora: 'PROT-BRAD-992841',
    prioridade: 'Alta',
    atualizadoHa: deslocarDiasISO(-2, '11:05').iso,
    faturasEmitidas: true,
    faturasEmitidasEm: `${formatarDataSimples(deslocarDiasISO(-2).data)} às 10:15`,
    observacoes: 'Protocolo de envio PROT-BRAD-992841 confirmado junto ao portal da operadora.',
    historicoLote: [
      {
        id: 'HLOT-04',
        dataHora: `${formatarDataSimples(deslocarDiasISO(-2).data)} às 11:05`,
        acao: 'Envio à Operadora (PROT-BRAD-992841)',
        detalhes: 'Lote LOTE-5812 enviado com faturas FAT-105 e FAT-106 para Bradesco Saúde.'
      }
    ],
    guias: [
      {
        id: 'G-105',
        atendimentoId: 'CONS-913',
        faturaId: 'FAT-105',
        senhaAutorizacao: 'AUTH-774011',
        tipoAtendimento: 'Cirurgia / Procedimento',
        codigoTuss: '30911079',
        pacienteId: 'PAC-2002',
        pacienteNome: 'Roberto Almeida Prado',
        medicoNome: 'Dr. Eduardo Cavalcanti',
        procedimento: 'Cateterismo Cardíaco Diagnóstico',
        data: deslocarDiasISO(-3).data,
        valor: 15400.0,
        statusGuia: 'Realizado'
      },
      {
        id: 'G-106',
        atendimentoId: 'CONS-914',
        faturaId: 'FAT-106',
        senhaAutorizacao: 'AUTH-774055',
        tipoAtendimento: 'Cirurgia / Procedimento',
        codigoTuss: '20201052',
        pacienteId: 'PAC-2001',
        pacienteNome: 'Helena Vasconcelos',
        medicoNome: 'Dr. Eduardo Cavalcanti',
        procedimento: 'Monitorização Hemodinâmica Contínua',
        data: deslocarDiasISO(-3).data,
        valor: 12500.0,
        statusGuia: 'Realizado'
      }
    ]
  },
  {
    id: 'LOTE-6034',
    operadora: 'SulAmérica Saúde',
    descricao: 'Internação Clínica Cirúrgica #07',
    tipoAtendimento: 'Internação',
    dataCriacao: deslocarDiasISO(-5).data,
    horaCriacao: '16:00',
    dataAlteracaoOuEnvio: deslocarDiasISO(-4, '11:45').iso,
    valor: 22400.0,
    status: 'Glosado',
    codigoEnvioOperadora: 'PROT-SULA-441092',
    prioridade: 'Alta',
    atualizadoHa: deslocarDiasISO(-4, '11:45').iso,
    faturasEmitidas: true,
    faturasEmitidasEm: `${formatarDataSimples(deslocarDiasISO(-5).data)} às 16:00`,
    observacoes: 'Retorno da operadora apontando glosa técnica em material especial OPME.',
    recurso: {
      tipoGlosa: 'Técnica / Médica',
      motivo: 'Glosa código 1804: Ausência de laudo justificativo para material especial na guia G-107 (FAT-107).',
      justificativaRecurso: 'Anexado relatório cirúrgico detalhado e etiqueta de rastreabilidade ANVISA.',
      dataAbertura: `${formatarDataSimples(deslocarDiasISO(-4).data)} às 11:45`
    },
    historicoLote: [
      {
        id: 'HLOT-05',
        dataHora: `${formatarDataSimples(deslocarDiasISO(-4).data)} às 11:45`,
        acao: 'Retorno de Glosa da Operadora',
        detalhes: 'Lote LOTE-6034 marcado como Glosado (Técnica / Médica) para tratamento e reenvio.'
      }
    ],
    guias: [
      {
        id: 'G-107',
        atendimentoId: 'CONS-904',
        faturaId: 'FAT-107',
        senhaAutorizacao: 'AUTH-901244',
        tipoAtendimento: 'Internação',
        codigoTuss: '10102019',
        pacienteId: 'PAC-2004',
        pacienteNome: 'Beatriz Nogueira Lima',
        medicoNome: 'Dra. Camila Montenegro',
        procedimento: 'Internação Hospital-Dia Oncológico + Medicação',
        data: deslocarDiasISO(-5).data,
        valor: 22400.0,
        statusGuia: 'Realizado'
      }
    ]
  },
  {
    id: 'LOTE-7215',
    operadora: 'Amil',
    descricao: 'Lote Pronto Atendimento Ortopedia #31',
    tipoAtendimento: 'Consulta',
    dataCriacao: deslocarDiasISO(-7).data,
    horaCriacao: '13:20',
    dataAlteracaoOuEnvio: deslocarDiasISO(-6, '13:20').iso,
    valor: 9850.0,
    status: 'Pendente',
    prioridade: 'Média',
    atualizadoHa: deslocarDiasISO(-6, '13:20').iso,
    faturasEmitidas: false,
    observacoes: 'Pendente aguardando conferência de guia complementar ortopédica antes de fechar.',
    historicoLote: [
      {
        id: 'HLOT-06',
        dataHora: `${formatarDataSimples(deslocarDiasISO(-6).data)} às 13:20`,
        acao: 'Alteração para Pendente',
        detalhes: 'Lote LOTE-7215 colocado em condição Pendente aguardando revisão de guia específica.'
      }
    ],
    guias: [
      {
        id: 'G-108',
        atendimentoId: 'CONS-905',
        senhaAutorizacao: 'AUTH-331902',
        tipoAtendimento: 'Consulta',
        codigoTuss: '10101012',
        pacienteId: 'PAC-2001',
        pacienteNome: 'Helena Vasconcelos',
        medicoNome: 'Dr. Eduardo Cavalcanti',
        procedimento: 'Avaliação pré-operatória e risco cirúrgico',
        data: deslocarDiasISO(-7).data,
        valor: 4950.0,
        statusGuia: 'Realizado'
      },
      {
        id: 'G-109',
        atendimentoId: 'CONS-915',
        senhaAutorizacao: 'AUTH-331950',
        tipoAtendimento: 'Consulta',
        codigoTuss: '40804054',
        pacienteId: 'PAC-2003',
        pacienteNome: 'Marcos Vinícius Couto',
        medicoNome: 'Dr. Rafael Bittencourt',
        procedimento: 'Reavaliação Pós-Trauma e Raio-X Digital',
        data: deslocarDiasISO(-7).data,
        valor: 4900.0,
        statusGuia: 'Realizado'
      }
    ]
  }
];

export const GUIAS_PARTICULARES_INICIAIS: GuiaParticular[] = [
  {
    id: 'G-901',
    atendimentoId: 'CONS-901',
    tipoGuia: 'Primeiro Atendimento',
    tipoGuiaComplementar: 'Primeiro Atendimento',
    pacienteId: 'PAC-2001',
    paciente: 'Helena Vasconcelos',
    medicoNome: 'Dra. Larissa Peixoto',
    descricao: 'Mapeamento corporal e biópsia dermatológica',
    data: DATA_HOJE_ISO,
    nf: 'NF-e 004812',
    comprovanteEmitido: true,
    comprovanteCodigo: 'COMP-901-A',
    valorBruto: 1450.0,
    desconto: 100.0,
    valor: 1350.0,
    status: 'Pago',
    prioridade: 'Média',
    formaPagamento: 'PIX',
    observacoes: 'Cobrança realizada na clínica (sem senha de operadora). Nota fiscal emitida.',
    atualizadoEm: `${DATA_HOJE_ISO}T09:40:00`
  },
  {
    id: 'G-1089',
    atendimentoId: 'CONS-901',
    tipoGuia: 'Complementação',
    tipoGuiaComplementar: 'Complementação',
    pacienteId: 'PAC-2001',
    paciente: 'Helena Vasconcelos',
    medicoNome: 'Dra. Larissa Peixoto',
    descricao: 'Análise Histopatológica Complementar #05',
    data: DATA_HOJE_ISO,
    nf: 'Pendente emissão',
    comprovanteEmitido: false,
    valorBruto: 850.0,
    desconto: 50.0,
    valor: 800.0,
    status: 'Não pago',
    prioridade: 'Alta',
    formaPagamento: 'Cartão',
    observacoes: 'Aguardando confirmação da operadora de cartão na clínica para emissão de NF.',
    atualizadoEm: `${DATA_HOJE_ISO}T11:20:00`
  },
  {
    id: 'G-906',
    atendimentoId: 'CONS-906',
    tipoGuia: 'Retorno',
    tipoGuiaComplementar: 'Retorno',
    pacienteId: 'PAC-2002',
    paciente: 'Roberto Almeida Prado',
    medicoNome: 'Dr. Rafael Bittencourt',
    descricao: 'Pacote Avaliação Postural e Ressonância Particular',
    data: deslocarDiasISO(-4).data,
    nf: 'NF-e 004790',
    comprovanteEmitido: true,
    comprovanteCodigo: 'COMP-906-B',
    valorBruto: 3120.0,
    desconto: 0,
    valor: 3120.0,
    status: 'Fechado',
    prioridade: 'Baixa',
    formaPagamento: 'Boleto',
    loteId: 'LOTE-501',
    observacoes: 'Arquivado no lote particular LOTE-501 para contabilidade.',
    atualizadoEm: deslocarDiasISO(-3, '13:50').iso
  }
];

export const LOTES_PARTICULARES_ARQUIVADOS_INICIAIS: LoteParticular[] = [
  {
    id: 'LOTE-501',
    descricao: 'Fechamento Caixa Particular — Semana 01',
    dataCriacao: deslocarDiasISO(-4).data,
    dataFechamento: deslocarDiasISO(-3, '13:50').iso,
    prioridade: 'Baixa',
    status: 'Fechado',
    guiasIds: ['G-906'],
    valorTotal: 3120.0,
    observacoes: 'Lote conferido e fechado para a contabilidade.'
  }
];

export const PROFISSIONAIS_INICIAIS: Profissional[] = [
  {
    id: 'PROF-101',
    foto: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=160&auto=format&fit=crop&q=80',
    nome: 'Dr. Eduardo Cavalcanti',
    cpf: '284.910.448-10',
    cargo: 'Médico Diretor Clínico',
    crm: '142.890',
    ufCrm: 'SP',
    cbo: '225120',
    percentualRepasse: 75,
    especialidade: 'Cardiologia',
    telefone: '(11) 99812-4401',
    email: 'eduardo.cavalcanti@gwaan.med.br',
    endereco: 'Av. Brigadeiro Luís Antônio, 2400 - Jardim Paulista, São Paulo - SP',
    ativo: true
  },
  {
    id: 'PROF-102',
    foto: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=160&auto=format&fit=crop&q=80',
    nome: 'Dra. Camila Montenegro',
    cpf: '319.840.221-54',
    cargo: 'Médico Especialista',
    crm: '168.321',
    ufCrm: 'SP',
    cbo: '225121',
    percentualRepasse: 70,
    especialidade: 'Oncologia Clínica',
    telefone: '(11) 99745-8820',
    email: 'camila.montenegro@gwaan.med.br',
    endereco: 'Rua Joaquim Floriano, 720 - Itaim Bibi, São Paulo - SP',
    ativo: true
  },
  {
    id: 'PROF-103',
    foto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=160&auto=format&fit=crop&q=80',
    nome: 'Dr. Rafael Bittencourt',
    cpf: '402.118.765-90',
    cargo: 'Médico Cirurgião',
    crm: '155.904',
    ufCrm: 'SP',
    cbo: '225270',
    percentualRepasse: 75,
    especialidade: 'Ortopedia e Traumatologia',
    telefone: '(11) 99123-6590',
    email: 'rafael.bittencourt@gwaan.med.br',
    endereco: 'Alameda Santos, 1180 - Cerqueira César, São Paulo - SP',
    ativo: true
  },
  {
    id: 'PROF-104',
    foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=160&auto=format&fit=crop&q=80',
    nome: 'Dra. Larissa Peixoto',
    cpf: '367.554.812-33',
    cargo: 'Médico Especialista',
    crm: '189.110',
    ufCrm: 'RJ',
    cbo: '225135',
    percentualRepasse: 70,
    especialidade: 'Dermatologia',
    telefone: '(21) 98841-2033',
    email: 'larissa.peixoto@gwaan.med.br',
    endereco: 'Rua Visconde de Pirajá, 410 - Ipanema, Rio de Janeiro - RJ',
    ativo: true
  },
  {
    id: 'PROF-105',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
    nome: 'Fernanda Siqueira',
    cpf: '418.209.331-72',
    cargo: 'Coordenadora de Faturamento e Auditoria TISS',
    crm: '',
    ufCrm: 'SP',
    cbo: '142305',
    percentualRepasse: 0,
    especialidade: '',
    telefone: '(11) 98520-1140',
    email: 'fernanda.siqueira@gwaan.med.br',
    endereco: 'Rua Vergueiro, 1850 - Vila Mariana, São Paulo - SP',
    ativo: true
  },
  {
    id: 'PROF-106',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80',
    nome: 'Gabriel Tavares',
    cpf: '391.440.982-05',
    cargo: 'Analista de Contas Médicas e Recursos de Glosa',
    crm: '',
    ufCrm: 'SP',
    cbo: '411010',
    percentualRepasse: 0,
    especialidade: '',
    telefone: '(11) 97411-8890',
    email: 'gabriel.tavares@gwaan.med.br',
    endereco: 'Av. Faria Lima, 3100 - Pinheiros, São Paulo - SP',
    ativo: true
  }
];

export const PACIENTES_INICIAIS: Paciente[] = [
  {
    id: 'PAC-2001',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    nome: 'Helena',
    sobrenome: 'Vasconcelos',
    cpf: '348.921.408-12',
    telefone: '(11) 98412-3094',
    email: 'helena.vasconcelos@email.com.br',
    dataNascimento: '1986-04-18',
    endereco: 'Av. Paulista, 1450 - Bela Vista',
    cidade: 'São Paulo - SP',
    convenioPadrao: 'Amil',
    numeroCarteirinha: '849201140028190',
    planoConvenio: 'Amil One S2500 Executivo',
    observacoesClinicas: 'Elegibilidade ativa sem carência para SADT e procedimentos ambulatoriais.'
  },
  {
    id: 'PAC-2002',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    nome: 'Roberto',
    sobrenome: 'Almeida Prado',
    cpf: '219.654.890-45',
    telefone: '(11) 99632-7781',
    email: 'roberto.prado@corporativo.com.br',
    dataNascimento: '1974-09-03',
    endereco: 'Rua Oscar Freire, 820 - Jardins',
    cidade: 'São Paulo - SP',
    convenioPadrao: 'Bradesco Saúde',
    numeroCarteirinha: '771009482100459',
    planoConvenio: 'Bradesco Saúde Top Nacional Apartamento',
    observacoesClinicas: 'Beneficiário corporativo — autorização prévia liberada para check-up cardiológico.'
  },
  {
    id: 'PAC-2003',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    nome: 'Marcos Vinícius',
    sobrenome: 'Couto',
    cpf: '412.887.109-88',
    telefone: '(19) 99214-5509',
    email: 'marcos.couto@email.com.br',
    dataNascimento: '1991-12-11',
    endereco: 'Av. Norte-Sul, 500 - Cambuí',
    cidade: 'Campinas - SP',
    convenioPadrao: 'Unimed',
    numeroCarteirinha: '006499201847102',
    planoConvenio: 'Unimed Especial Nacional',
    observacoesClinicas: 'Guias de infiltração ortopédica exigem anexo de laudo de imagem no envio do lote.'
  },
  {
    id: 'PAC-2004',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80',
    nome: 'Beatriz',
    sobrenome: 'Nogueira Lima',
    cpf: '389.110.275-06',
    telefone: '(11) 97120-9940',
    email: 'beatriz.nogueira@email.com.br',
    dataNascimento: '1982-07-25',
    endereco: 'Rua Ministro Jesuíno Cardoso, 310 - Itaim Bibi',
    cidade: 'São Paulo - SP',
    convenioPadrao: 'SulAmérica Saúde',
    numeroCarteirinha: '888120948571003',
    planoConvenio: 'SulAmérica Prestige',
    observacoesClinicas: 'Terapia oncológica de alto custo — senha de autorização TISS obrigatória.'
  },
  {
    id: 'PAC-2005',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
    nome: 'Carolina',
    sobrenome: 'Mendes',
    cpf: '451.820.339-14',
    telefone: '(11) 98711-4402',
    email: 'carolina.mendes@email.com.br',
    dataNascimento: '1989-02-14',
    endereco: 'Rua Haddock Lobo, 1300 - Cerqueira César',
    cidade: 'São Paulo - SP',
    convenioPadrao: 'Bradesco Saúde',
    numeroCarteirinha: '771009991234801',
    planoConvenio: 'Bradesco Saúde Nacional Plus',
    observacoesClinicas: 'Guias de oncologia e exames cardiológicos com autorização prévia validada.'
  },
  {
    id: 'PAC-2006',
    foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80',
    nome: 'Lucas',
    sobrenome: 'Albuquerque',
    cpf: '312.745.901-60',
    telefone: '(11) 99340-1288',
    email: 'lucas.albuquerque@email.com.br',
    dataNascimento: '1979-11-28',
    endereco: 'Av. República do Líbano, 990 - Moema',
    cidade: 'São Paulo - SP',
    convenioPadrao: 'Bradesco Saúde',
    numeroCarteirinha: '771008450019283',
    planoConvenio: 'Bradesco Saúde Top Nacional',
    observacoesClinicas: 'Acompanhamento oncológico e SADT autorizado pela operadora.'
  }
];

export const ATENDIMENTOS_INICIAIS: Atendimento[] = [
  {
    id: 'CONS-901',
    numeroGuia: 'G-901',
    tipoAtendimento: 'Cirurgia / Procedimento',
    codigoTuss: '30101239',
    pacienteId: 'PAC-2001',
    pacienteNome: 'Helena Vasconcelos',
    medicoId: 'PROF-104',
    medicoNome: 'Dra. Larissa Peixoto',
    especialidade: 'Dermatologia',
    descricao: 'Mapeamento corporal e biópsia dermatológica',
    procedimentos: [
      {
        id: 'PROC-01',
        codigoTuss: '30101239',
        descricao: 'Mapeamento corporal e biópsia dermatológica',
        valor: 1450.0,
        numeroGuia: 'G-901'
      }
    ],
    data: deslocarDiasISO(-1).data,
    hora: '09:30',
    operadora: 'Particular',
    status: 'Realizado',
    valor: 1450.0,
    desconto: 100.0,
    historicoAlteracoes: [
      {
        id: 'HIST-01',
        dataHora: `${diaHoje}/${mesAtual}/${anoAtual} às 08:45`,
        descricaoAcao: 'Inclusão Procedimento 30101239 — Mapeamento corporal e biópsia dermatológica',
        valorAnterior: 0,
        valorNovo: 1450.0,
        descontoAnterior: 0,
        descontoNovo: 100.0
      }
    ]
  },
  {
    id: 'CONS-902',
    numeroGuia: 'G-101',
    senhaAutorizacao: 'AUTH-884120',
    tipoAtendimento: 'Oncologia / Terapia',
    codigoTuss: '40304361',
    pacienteId: 'PAC-2002',
    pacienteNome: 'Roberto Almeida Prado',
    medicoId: 'PROF-101',
    medicoNome: 'Dr. Eduardo Cavalcanti',
    especialidade: 'Cardiologia',
    descricao:
      'Quimioterapia Infusional Ciclo #01 + Monitoramento Cardiológico Contínuo + Ecocardiograma Transtorácico de Controle Oncológico',
    procedimentos: [
      {
        id: 'PROC-G101-1',
        codigoTuss: '40304361',
        descricao: 'Quimioterapia Infusional Ciclo #01',
        valor: 6200.0,
        senhaAutorizacao: 'AUTH-884120',
        numeroGuia: 'G-101'
      },
      {
        id: 'PROC-G101-2',
        codigoTuss: '20104090',
        descricao: 'Monitoramento Cardiológico Contínuo em Infusão',
        valor: 3600.0,
        senhaAutorizacao: 'AUTH-884120',
        numeroGuia: 'G-101'
      },
      {
        id: 'PROC-G102-1',
        codigoTuss: '20104294',
        descricao: 'Ecocardiograma Transtorácico de Controle Oncológico',
        valor: 8700.0,
        senhaAutorizacao: 'AUTH-884199',
        numeroGuia: 'G-102'
      }
    ],
    data: DATA_HOJE_ISO,
    hora: '10:15',
    operadora: 'Bradesco Saúde',
    status: 'Realizado',
    valor: 18500.0
  },
  {
    id: 'CONS-903',
    numeroGuia: 'G-103',
    senhaAutorizacao: 'AUTH-551029',
    tipoAtendimento: 'SADT / Exames',
    codigoTuss: '41101227',
    pacienteId: 'PAC-2003',
    pacienteNome: 'Marcos Vinícius Couto',
    medicoId: 'PROF-103',
    medicoNome: 'Dr. Rafael Bittencourt',
    especialidade: 'Ortopedia e Traumatologia',
    descricao: 'Ressonância Magnética Articular + Infiltração Guiada',
    procedimentos: [
      {
        id: 'PROC-04',
        codigoTuss: '41101227',
        descricao: 'Ressonância Magnética Articular + Infiltração Guiada',
        valor: 6800.5,
        senhaAutorizacao: 'AUTH-551029',
        numeroGuia: 'G-103'
      }
    ],
    data: DATA_HOJE_ISO,
    hora: '14:00',
    operadora: 'Unimed',
    status: 'Realizado',
    valor: 6800.5
  },
  {
    id: 'CONS-904',
    numeroGuia: 'G-107',
    senhaAutorizacao: 'AUTH-901244',
    tipoAtendimento: 'Internação',
    codigoTuss: '10102019',
    pacienteId: 'PAC-2004',
    pacienteNome: 'Beatriz Nogueira Lima',
    medicoId: 'PROF-102',
    medicoNome: 'Dra. Camila Montenegro',
    especialidade: 'Oncologia Clínica',
    descricao: 'Internação Hospital-Dia Oncológico + Medicação',
    procedimentos: [
      {
        id: 'PROC-05',
        codigoTuss: '10102019',
        descricao: 'Internação Hospital-Dia Oncológico + Medicação',
        valor: 22400.0,
        senhaAutorizacao: 'AUTH-901244',
        numeroGuia: 'G-107'
      }
    ],
    data: deslocarDiasISO(-5).data,
    hora: '15:30',
    operadora: 'SulAmérica Saúde',
    status: 'Realizado',
    valor: 22400.0
  },
  {
    id: 'CONS-905',
    numeroGuia: 'G-108',
    senhaAutorizacao: 'AUTH-331902',
    tipoAtendimento: 'Consulta',
    codigoTuss: '10101012',
    pacienteId: 'PAC-2001',
    pacienteNome: 'Helena Vasconcelos',
    medicoId: 'PROF-101',
    medicoNome: 'Dr. Eduardo Cavalcanti',
    especialidade: 'Cardiologia',
    descricao: 'Avaliação pré-operatória e risco cirúrgico',
    procedimentos: [
      {
        id: 'PROC-06',
        codigoTuss: '10101012',
        descricao: 'Avaliação pré-operatória e risco cirúrgico',
        valor: 4950.0,
        senhaAutorizacao: 'AUTH-331902',
        numeroGuia: 'G-108'
      }
    ],
    data: deslocarDiasISO(-7).data,
    hora: '18:00',
    operadora: 'Amil',
    status: 'Realizado',
    valor: 4950.0
  },
  {
    id: 'CONS-906',
    numeroGuia: 'G-906',
    tipoAtendimento: 'Consulta',
    codigoTuss: '10101012',
    pacienteId: 'PAC-2002',
    pacienteNome: 'Roberto Almeida Prado',
    medicoId: 'PROF-103',
    medicoNome: 'Dr. Rafael Bittencourt',
    especialidade: 'Ortopedia e Traumatologia',
    descricao: 'Pacote Avaliação Postural e Ressonância Particular',
    procedimentos: [
      {
        id: 'PROC-07',
        codigoTuss: '10101012',
        descricao: 'Pacote Avaliação Postural e Ressonância Particular',
        valor: 3120.0,
        numeroGuia: 'G-906'
      }
    ],
    data: deslocarDiasISO(-4).data,
    hora: '19:00',
    operadora: 'Particular',
    status: 'Realizado',
    valor: 3120.0,
    desconto: 0
  },
  {
    id: 'CONS-907',
    numeroGuia: 'G-210',
    senhaAutorizacao: 'AUTH-998120',
    tipoAtendimento: 'Oncologia / Terapia',
    codigoTuss: '20104090',
    pacienteId: 'PAC-2002',
    pacienteNome: 'Roberto Almeida Prado',
    medicoId: 'PROF-102',
    medicoNome: 'Dra. Camila Montenegro',
    especialidade: 'Oncologia Clínica',
    descricao: 'Infusão Imunobiológica Ambulatorial + PET-CT Oncológico de Controle',
    procedimentos: [
      {
        id: 'PROC-08',
        codigoTuss: '20104090',
        descricao: 'Infusão Imunobiológica Ambulatorial',
        valor: 3800.0,
        senhaAutorizacao: 'AUTH-998120',
        numeroGuia: 'G-210'
      },
      {
        id: 'PROC-09',
        codigoTuss: '40304361',
        descricao: 'PET-CT Oncológico de Controle (Senha Distinta)',
        valor: 2450.0,
        senhaAutorizacao: 'AUTH-998155',
        numeroGuia: 'G-215'
      }
    ],
    data: DATA_HOJE_ISO,
    hora: '11:00',
    operadora: 'Bradesco Saúde',
    status: 'Realizado',
    valor: 6250.0
  },
  {
    id: 'CONS-908',
    numeroGuia: 'G-211',
    senhaAutorizacao: 'AUTH-445012',
    tipoAtendimento: 'SADT / Exames',
    codigoTuss: '41001095',
    pacienteId: 'PAC-2003',
    pacienteNome: 'Marcos Vinícius Couto',
    medicoId: 'PROF-101',
    medicoNome: 'Dr. Eduardo Cavalcanti',
    especialidade: 'Cardiologia',
    descricao: 'Teste Ergométrico Computadorizado + Monitorização Pelo Sistema Holter 24 Horas',
    procedimentos: [
      {
        id: 'PROC-10',
        codigoTuss: '41001095',
        descricao: 'Teste Ergométrico Computadorizado',
        valor: 620.0,
        senhaAutorizacao: 'AUTH-445012',
        numeroGuia: 'G-211'
      },
      {
        id: 'PROC-11',
        codigoTuss: '20102020',
        descricao: 'Monitorização Pelo Sistema Holter 24 Horas',
        valor: 580.0,
        senhaAutorizacao: 'AUTH-445012',
        numeroGuia: 'G-211'
      }
    ],
    data: DATA_HOJE_ISO,
    hora: '16:15',
    operadora: 'Unimed',
    status: 'Realizado',
    valor: 1200.0
  },
  {
    id: 'CONS-909',
    numeroGuia: 'G-212',
    senhaAutorizacao: 'AUTH-889301',
    tipoAtendimento: 'Oncologia / Terapia',
    codigoTuss: '20104090',
    pacienteId: 'PAC-2005',
    pacienteNome: 'Carolina Mendes',
    medicoId: 'PROF-102',
    medicoNome: 'Dra. Camila Montenegro',
    especialidade: 'Oncologia Clínica',
    descricao: 'Quimioterapia Ambulatorial Ciclo #02',
    procedimentos: [
      {
        id: 'PROC-12',
        codigoTuss: '20104090',
        descricao: 'Quimioterapia Ambulatorial Ciclo #02',
        valor: 5400.0,
        senhaAutorizacao: 'AUTH-889301',
        numeroGuia: 'G-212'
      }
    ],
    data: DATA_HOJE_ISO,
    hora: '11:45',
    operadora: 'Bradesco Saúde',
    status: 'Realizado',
    valor: 5400.0
  },
  {
    id: 'CONS-910',
    numeroGuia: 'G-213',
    senhaAutorizacao: 'AUTH-889450',
    tipoAtendimento: 'Oncologia / Terapia',
    codigoTuss: '40901106',
    pacienteId: 'PAC-2006',
    pacienteNome: 'Lucas Albuquerque',
    medicoId: 'PROF-101',
    medicoNome: 'Dr. Eduardo Cavalcanti',
    especialidade: 'Cardiologia',
    descricao: 'Avaliação Cardio-Oncológica e Ecocardiograma Doppler',
    procedimentos: [
      {
        id: 'PROC-13',
        codigoTuss: '40901106',
        descricao: 'Avaliação Cardio-Oncológica e Ecocardiograma Doppler',
        valor: 3200.0,
        senhaAutorizacao: 'AUTH-889450',
        numeroGuia: 'G-213'
      }
    ],
    data: DATA_HOJE_ISO,
    hora: '13:10',
    operadora: 'Bradesco Saúde',
    status: 'Realizado',
    valor: 3200.0
  },
  {
    id: 'CONS-911',
    numeroGuia: 'G-214',
    senhaAutorizacao: 'AUTH-559810',
    tipoAtendimento: 'SADT / Exames',
    codigoTuss: '41001095',
    pacienteId: 'PAC-2005',
    pacienteNome: 'Carolina Mendes',
    medicoId: 'PROF-103',
    medicoNome: 'Dr. Rafael Bittencourt',
    especialidade: 'Ortopedia e Traumatologia',
    descricao: 'Ressonância Magnética de Coluna Lombar',
    procedimentos: [
      {
        id: 'PROC-14',
        codigoTuss: '41001095',
        descricao: 'Ressonância Magnética de Coluna Lombar',
        valor: 1850.0,
        senhaAutorizacao: 'AUTH-559810',
        numeroGuia: 'G-214'
      }
    ],
    data: DATA_HOJE_ISO,
    hora: '15:00',
    operadora: 'Unimed',
    status: 'Realizado',
    valor: 1850.0
  }
];

export const REGRAS_GESTAO_PADRAO: RegrasGestao = {
  metaPorOperadora: 20000,
  metaGlobalMensal: 100000,
  valorMinimoLote: 10000,
  tetoGlosaPercentual: 12,
  metaAtendimentosMensal: 10,
  minimoAtendimentosPorMedico: 2
};

export const PREFERENCIAS_PADRAO: PreferenciasSistema = {
  modoEscuro: false,
  tabelaCompacta: false,
  confirmarExclusao: true
};
