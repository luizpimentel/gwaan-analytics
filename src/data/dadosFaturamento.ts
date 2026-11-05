export type StatusFaturamento = 'Aberto' | 'Faturada' | 'Enviada';

export type StatusParticular = 'Pago' | 'Não pago' | 'Fechado';

export type StatusLoteParticular = 'Aberto' | 'Fechado';

export type TipoGuiaParticular =
  | 'Guia Principal'
  | 'Retorno'
  | 'Complementação'
  | 'Prorrogação'
  | 'Nova Guia';

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

export type StatusGuiaTuss = 'Confirmado' | 'Realizado' | 'Cancelada';

export type TipoAtendimentoLote =
  | 'Consulta'
  | 'SADT / Exames'
  | 'Internação'
  | 'Cirurgia / Procedimento'
  | 'Oncologia / Terapia'
  | 'Misto';

export interface RecursoLote {
  motivo: string;
  dataAbertura: string;
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
  id: string;
  atendimentoId?: string;
  codigoTuss?: string;
  pacienteId?: string;
  pacienteNome: string;
  medicoNome: string;
  procedimento: string;
  data: string;
  valor: number;
  statusGuia?: StatusGuiaTuss;
}

export interface DemandaFinanceira {
  id: string;
  operadora: string;
  descricao: string;
  tipoAtendimento: TipoAtendimentoLote;
  dataCriacao: string;
  dataAlteracaoOuEnvio: string;
  valor: number;
  status: StatusFaturamento;
  prioridade: PrioridadeDemanda;
  atualizadoHa: string;
  guias: GuiaLote[];
  faturasEmitidas?: boolean;
  faturasEmitidasEm?: string;
  motivoUltimaExclusaoFatura?: string;
  categoria?: 'Operadora' | 'Particular';
  historicoLote?: HistoricoAlteracaoLote[];
  observacoes?: string;
  recurso?: RecursoLote;
}

export interface GuiaParticular {
  id: string;
  atendimentoId: string;
  tipoGuia?: TipoGuiaParticular;
  tipoGuiaComplementar?: TipoGuiaParticular;
  pacienteId?: string;
  paciente: string;
  medicoNome?: string;
  descricao: string;
  data: string;
  nf: string;
  valorBruto: number;
  desconto: number;
  valor: number;
  status: StatusParticular;
  prioridade: PrioridadeDemanda;
  formaPagamento: FormaPagamentoParticular;
  loteId?: string;
  observacoes?: string;
  atualizadoEm: string;
  recurso?: RecursoLote;
}

export interface LoteParticular {
  id: string;
  descricao: string;
  dataCriacao: string;
  dataFechamento: string;
  prioridade: PrioridadeDemanda;
  status: StatusLoteParticular;
  guiasIds: string[];
  valorTotal: number;
  observacoes?: string;
}

export interface Operadora {
  id: string;
  nome: string;
  cnpj: string;
  datasEnvio: string[];
}

export interface Profissional {
  id: string;
  foto: string;
  nome: string;
  cpf: string;
  cargo: string;
  crm: string;
  ufCrm: string;
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
  id: string;
  foto: string;
  nome: string;
  sobrenome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataNascimento: string;
  endereco: string;
  cidade: string;
  observacoesClinicas?: string;
}

export interface HistoricoValorAtendimento {
  id: string;
  dataHora: string;
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
}

export interface Atendimento {
  id: string;
  codigoTuss?: string;
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
  status: StatusAtendimento;
  valor: number;
  desconto?: number;
  historicoAlteracoes?: HistoricoValorAtendimento[];
  guiaCancelada?: boolean;
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

export type CategoriaClienteVIP =
  | 'Influencer'
  | 'Cliente VIP'
  | 'Embaixador'
  | 'Parceiro Marketing';

export type StatusVisitaMarketing =
  | 'Agendada'
  | 'Confirmada'
  | 'Realizada'
  | 'Cancelada';

export interface VisitaMarketing {
  id: string;
  data: string;
  hora: string;
  objetivo: string;
  responsavel: string;
  status: StatusVisitaMarketing;
  observacoes?: string;
}

export interface ClienteVIP {
  id: string;
  foto: string;
  nome: string;
  sobrenome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataNascimento: string;
  endereco: string;
  cidade: string;
  categoriaVip: CategoriaClienteVIP;
  redeSocial: string;
  alcanceSeguidores: string;
  assessorNome: string;
  assessorTelefone: string;
  assessorEmail: string;
  numeroContrato: string;
  vigenciaContrato: string;
  valorPermutaMensal: number;
  escopoMarketing: string;
  clausulasContrato: string;
  observacoes?: string;
  datasVisitas: VisitaMarketing[];
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

export const OPERADORAS_PADRAO: Operadora[] = [
  {
    id: 'OP-01',
    nome: 'Bradesco Saúde',
    cnpj: '92.693.118/0001-60',
    datasEnvio: [`${anoAtual}-${mesAtual}-05`, `${anoAtual}-${mesAtual}-20`]
  },
  {
    id: 'OP-02',
    nome: 'Unimed',
    cnpj: '48.090.146/0001-00',
    datasEnvio: [`${anoAtual}-${mesAtual}-10`, `${anoAtual}-${mesAtual}-25`]
  },
  {
    id: 'OP-03',
    nome: 'SulAmérica Saúde',
    cnpj: '01.685.053/0001-56',
    datasEnvio: [`${anoAtual}-${mesAtual}-08`, `${anoAtual}-${mesAtual}-22`]
  },
  {
    id: 'OP-04',
    nome: 'Amil',
    cnpj: '29.309.127/0001-79',
    datasEnvio: [`${anoAtual}-${mesAtual}-12`, `${anoAtual}-${mesAtual}-28`]
  }
];

export const DEMANDAS_INICIAIS: DemandaFinanceira[] = [
  {
    id: 'FAT-4821',
    operadora: 'Bradesco Saúde',
    descricao: 'Lote Oncologia Ambulatorial #42',
    tipoAtendimento: 'Oncologia / Terapia',
    dataCriacao: DATA_HOJE_ISO,
    dataAlteracaoOuEnvio: `${DATA_HOJE_ISO}T09:15:00`,
    valor: 18500.0,
    status: 'Aberto',
    prioridade: 'Alta',
    atualizadoHa: `${DATA_HOJE_ISO}T09:15:00`,
    faturasEmitidas: false,
    observacoes: 'Lote aberto aguardando emissão de faturas dos atendimentos.',
    historicoLote: [
      {
        id: 'HLOT-01',
        dataHora: `${diaHoje}/${mesAtual}/${anoAtual} às 09:15`,
        acao: 'Criação do Lote',
        detalhes: 'Lote criado com status Aberto para alocação de guias a faturar.'
      }
    ],
    guias: [
      {
        id: 'GUIA-101',
        atendimentoId: 'ATD-902',
        codigoTuss: '40304361',
        pacienteId: 'PAC-2002',
        pacienteNome: 'Roberto Almeida Prado',
        medicoNome: 'Dr. Eduardo Cavalcanti',
        procedimento: 'Quimioterapia Infusional + Monitoramento Cardiológico',
        data: DATA_HOJE_ISO,
        valor: 9800.0,
        statusGuia: 'Confirmado'
      },
      {
        id: 'GUIA-102',
        atendimentoId: 'ATD-902',
        codigoTuss: '20104294',
        pacienteId: 'PAC-2002',
        pacienteNome: 'Roberto Almeida Prado',
        medicoNome: 'Dr. Eduardo Cavalcanti',
        procedimento: 'Ecocardiograma Transtorácico de Controle',
        data: DATA_HOJE_ISO,
        valor: 8700.0,
        statusGuia: 'Confirmado'
      }
    ]
  },
  {
    id: 'FAT-5190',
    operadora: 'Unimed',
    descricao: 'Guias SADT Diagnóstico por Imagem #18',
    tipoAtendimento: 'SADT / Exames',
    dataCriacao: DATA_HOJE_ISO,
    dataAlteracaoOuEnvio: `${DATA_HOJE_ISO}T10:30:00`,
    valor: 14200.5,
    status: 'Faturada',
    prioridade: 'Alta',
    atualizadoHa: `${DATA_HOJE_ISO}T10:30:00`,
    faturasEmitidas: true,
    observacoes: 'Faturas emitidas por atendimento e prontas para envio ao convênio.',
    historicoLote: [
      {
        id: 'HLOT-02',
        dataHora: `${diaHoje}/${mesAtual}/${anoAtual} às 10:30`,
        acao: 'Faturamento do Lote',
        detalhes: 'Faturas geradas em PDF para os atendimentos vinculados.'
      },
      {
        id: 'HLOT-03',
        dataHora: `${diaHoje}/${mesAtual}/${anoAtual} às 08:50`,
        acao: 'Criação do Lote',
        detalhes: 'Lote registrado para Unimed (SADT / Exames).'
      }
    ],
    guias: [
      {
        id: 'GUIA-103',
        atendimentoId: 'ATD-903',
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
        id: 'GUIA-104',
        atendimentoId: 'ATD-905',
        codigoTuss: '41001095',
        pacienteId: 'PAC-2001',
        pacienteNome: 'Helena Vasconcelos',
        medicoNome: 'Dr. Eduardo Cavalcanti',
        procedimento: 'Angiotomografia de Coronárias e Doppler',
        data: DATA_HOJE_ISO,
        valor: 7400.0,
        statusGuia: 'Confirmado'
      }
    ]
  },
  {
    id: 'FAT-5812',
    operadora: 'Bradesco Saúde',
    descricao: 'Lote Hemodinâmica e Cardiologia #11',
    tipoAtendimento: 'Cirurgia / Procedimento',
    dataCriacao: deslocarDiasISO(-3).data,
    dataAlteracaoOuEnvio: deslocarDiasISO(-2, '11:05').iso,
    valor: 27900.0,
    status: 'Enviada',
    prioridade: 'Alta',
    atualizadoHa: deslocarDiasISO(-2, '11:05').iso,
    faturasEmitidas: true,
    observacoes: 'Protocolo de envio confirmado junto ao portal da operadora.',
    historicoLote: [
      {
        id: 'HLOT-04',
        dataHora: `${formatarDataSimples(deslocarDiasISO(-2).data)} às 11:05`,
        acao: 'Envio à Operadora',
        detalhes: 'Lote enviado para pagamento junto à Bradesco Saúde.'
      }
    ],
    guias: [
      {
        id: 'GUIA-105',
        atendimentoId: 'ATD-902',
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
        id: 'GUIA-106',
        atendimentoId: 'ATD-905',
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
    id: 'FAT-6034',
    operadora: 'SulAmérica Saúde',
    descricao: 'Internação Clínica Cirúrgica #07',
    tipoAtendimento: 'Internação',
    dataCriacao: deslocarDiasISO(-5).data,
    dataAlteracaoOuEnvio: deslocarDiasISO(-4, '11:45').iso,
    valor: 22400.0,
    status: 'Faturada',
    prioridade: 'Média',
    atualizadoHa: deslocarDiasISO(-4, '11:45').iso,
    faturasEmitidas: true,
    observacoes: 'Fatura emitida para conferência de materiais especiais (OPME).',
    historicoLote: [
      {
        id: 'HLOT-05',
        dataHora: `${formatarDataSimples(deslocarDiasISO(-4).data)} às 11:45`,
        acao: 'Faturamento do Lote',
        detalhes: 'Fatura gerada para o atendimento ATD-904.'
      }
    ],
    guias: [
      {
        id: 'GUIA-107',
        atendimentoId: 'ATD-904',
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
    id: 'FAT-7215',
    operadora: 'Amil',
    descricao: 'Lote Pronto Atendimento Ortopedia #31',
    tipoAtendimento: 'Consulta',
    dataCriacao: deslocarDiasISO(-7).data,
    dataAlteracaoOuEnvio: deslocarDiasISO(-6, '13:20').iso,
    valor: 9850.0,
    status: 'Aberto',
    prioridade: 'Média',
    atualizadoHa: deslocarDiasISO(-6, '13:20').iso,
    faturasEmitidas: false,
    observacoes: 'Lote aberto recebendo guias com status de faturar.',
    historicoLote: [
      {
        id: 'HLOT-06',
        dataHora: `${formatarDataSimples(deslocarDiasISO(-6).data)} às 13:20`,
        acao: 'Alocação de Guias',
        detalhes: 'Incluídas 2 guias de atendimento para faturamento em lote.'
      }
    ],
    guias: [
      {
        id: 'GUIA-108',
        atendimentoId: 'ATD-905',
        codigoTuss: '10101012',
        pacienteId: 'PAC-2001',
        pacienteNome: 'Helena Vasconcelos',
        medicoNome: 'Dr. Rafael Bittencourt',
        procedimento: 'Atendimento Ortopédico + Imobilização',
        data: deslocarDiasISO(-7).data,
        valor: 4950.0,
        statusGuia: 'Confirmado'
      },
      {
        id: 'GUIA-109',
        atendimentoId: 'ATD-903',
        codigoTuss: '40804054',
        pacienteId: 'PAC-2003',
        pacienteNome: 'Marcos Vinícius Couto',
        medicoNome: 'Dr. Rafael Bittencourt',
        procedimento: 'Reavaliação Pós-Trauma e Raio-X Digital',
        data: deslocarDiasISO(-7).data,
        valor: 4900.0,
        statusGuia: 'Confirmado'
      }
    ]
  }
];

function formatarDataSimples(isoData: string): string {
  const partes = isoData.slice(0, 10).split('-');
  if (partes.length !== 3) return isoData;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export const GUIAS_PARTICULARES_INICIAIS: GuiaParticular[] = [
  {
    id: 'GPART-1024',
    atendimentoId: 'ATD-901',
    tipoGuiaComplementar: 'Guia Principal',
    pacienteId: 'PAC-2001',
    paciente: 'Helena Vasconcelos',
    medicoNome: 'Dra. Larissa Peixoto',
    descricao: 'Mapeamento corporal e biópsia dermatológica',
    data: DATA_HOJE_ISO,
    nf: 'NF-e 004812',
    valorBruto: 1450.0,
    desconto: 100.0,
    valor: 1350.0,
    status: 'Pago',
    prioridade: 'Média',
    formaPagamento: 'PIX',
    observacoes: 'Nota fiscal emitida e comprovante anexado.',
    atualizadoEm: `${DATA_HOJE_ISO}T09:40:00`
  },
  {
    id: 'GPART-1089',
    atendimentoId: 'ATD-901',
    tipoGuiaComplementar: 'Complementação',
    pacienteId: 'PAC-2001',
    paciente: 'Helena Vasconcelos',
    medicoNome: 'Dra. Larissa Peixoto',
    descricao: 'Análise Histopatológica Complementar #05',
    data: DATA_HOJE_ISO,
    nf: 'Pendente emissão',
    valorBruto: 850.0,
    desconto: 50.0,
    valor: 800.0,
    status: 'Não pago',
    prioridade: 'Alta',
    formaPagamento: 'Cartão',
    observacoes: 'Aguardando confirmação da operadora de cartão para emissão de NF.',
    atualizadoEm: `${DATA_HOJE_ISO}T11:20:00`
  },
  {
    id: 'GPART-1142',
    atendimentoId: 'ATD-906',
    tipoGuiaComplementar: 'Guia Principal',
    pacienteId: 'PAC-2002',
    paciente: 'Roberto Almeida Prado',
    medicoNome: 'Dr. Rafael Bittencourt',
    descricao: 'Pacote Avaliação Postural e Ressonância Particular',
    data: deslocarDiasISO(-4).data,
    nf: 'NF-e 004790',
    valorBruto: 3120.0,
    desconto: 0,
    valor: 3120.0,
    status: 'Fechado',
    prioridade: 'Baixa',
    formaPagamento: 'Boleto',
    loteId: 'LPART-501',
    observacoes: 'Arquivado no lote particular para contabilidade.',
    atualizadoEm: deslocarDiasISO(-3, '13:50').iso
  }
];

export const LOTES_PARTICULARES_ARQUIVADOS_INICIAIS: LoteParticular[] = [
  {
    id: 'LPART-501',
    descricao: 'Fechamento Caixa Particular — Semana 01',
    dataCriacao: deslocarDiasISO(-4).data,
    dataFechamento: deslocarDiasISO(-3, '13:50').iso,
    prioridade: 'Baixa',
    status: 'Fechado',
    guiasIds: ['GPART-1142'],
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
    cargo: 'Coordenadora de Faturamento e Guias TISS',
    crm: '',
    ufCrm: 'SP',
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
    cargo: 'Gestor de Marketing e Relacionamento VIP',
    crm: '',
    ufCrm: 'SP',
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
    observacoesClinicas: 'Paciente em acompanhamento preventivo anual. Sem alergias medicamentosas.'
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
    observacoesClinicas: 'Check-up cardiológico semestral e controle de hipertensão leve.'
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
    observacoesClinicas: 'Reabilitação ortopédica pós-lesão ligamentar de joelho.'
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
    observacoesClinicas: 'Acompanhamento oncológico ambulatorial trimestral.'
  }
];

export const ATENDIMENTOS_INICIAIS: Atendimento[] = [
  {
    id: 'ATD-901',
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
        valor: 1450.0
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
        valorAnterior: 1500.0,
        valorNovo: 1450.0,
        descontoAnterior: 0,
        descontoNovo: 100.0
      }
    ]
  },
  {
    id: 'ATD-902',
    codigoTuss: '10101012',
    pacienteId: 'PAC-2002',
    pacienteNome: 'Roberto Almeida Prado',
    medicoId: 'PROF-101',
    medicoNome: 'Dr. Eduardo Cavalcanti',
    especialidade: 'Cardiologia',
    descricao: 'Consulta Cardiológica + Ecocardiograma Transtorácico',
    procedimentos: [
      {
        id: 'PROC-02',
        codigoTuss: '10101012',
        descricao: 'Consulta Cardiológica Especializada',
        valor: 480.0
      },
      {
        id: 'PROC-03',
        codigoTuss: '40901106',
        descricao: 'Ecocardiograma Transtorácico com Doppler',
        valor: 500.0
      }
    ],
    data: DATA_HOJE_ISO,
    hora: '10:15',
    operadora: 'Bradesco Saúde',
    status: 'Confirmado',
    valor: 980.0
  },
  {
    id: 'ATD-903',
    codigoTuss: '30713137',
    pacienteId: 'PAC-2003',
    pacienteNome: 'Marcos Vinícius Couto',
    medicoId: 'PROF-103',
    medicoNome: 'Dr. Rafael Bittencourt',
    especialidade: 'Ortopedia e Traumatologia',
    descricao: 'Infiltração articular guiada e avaliação funcional',
    procedimentos: [
      {
        id: 'PROC-04',
        codigoTuss: '30713137',
        descricao: 'Infiltração articular guiada e avaliação funcional',
        valor: 1200.0
      }
    ],
    data: deslocarDiasISO(1).data,
    hora: '14:00',
    operadora: 'Unimed',
    status: 'Agendado',
    valor: 1200.0
  },
  {
    id: 'ATD-904',
    codigoTuss: '20104294',
    pacienteId: 'PAC-2004',
    pacienteNome: 'Beatriz Nogueira Lima',
    medicoId: 'PROF-102',
    medicoNome: 'Dra. Camila Montenegro',
    especialidade: 'Oncologia Clínica',
    descricao: 'Sessão de Imunoterapia Supervisionada Ciclo #03',
    procedimentos: [
      {
        id: 'PROC-05',
        codigoTuss: '20104294',
        descricao: 'Sessão de Imunoterapia Supervisionada Ciclo #03',
        valor: 4600.0
      }
    ],
    data: deslocarDiasISO(-2).data,
    hora: '15:30',
    operadora: 'SulAmérica Saúde',
    status: 'Realizado',
    valor: 4600.0
  },
  {
    id: 'ATD-905',
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
        valor: 650.0
      }
    ],
    data: deslocarDiasISO(2).data,
    hora: '18:00',
    operadora: 'Amil',
    status: 'Confirmado',
    valor: 650.0
  },
  {
    id: 'ATD-906',
    codigoTuss: '10101012',
    pacienteId: 'PAC-2002',
    pacienteNome: 'Roberto Almeida Prado',
    medicoId: 'PROF-103',
    medicoNome: 'Dr. Rafael Bittencourt',
    especialidade: 'Ortopedia e Traumatologia',
    descricao: 'Retorno de avaliação postural e ressonância',
    procedimentos: [
      {
        id: 'PROC-07',
        codigoTuss: '10101012',
        descricao: 'Retorno de avaliação postural e ressonância',
        valor: 550.0
      }
    ],
    data: deslocarDiasISO(-3).data,
    hora: '19:00',
    operadora: 'Particular',
    status: 'Cancelado',
    valor: 550.0,
    desconto: 0
  }
];

export const CLIENTES_VIP_INICIAIS: ClienteVIP[] = [
  {
    id: 'VIP-3001',
    foto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&auto=format&fit=crop&q=80',
    nome: 'Carolina',
    sobrenome: 'Ferraz Alencar',
    cpf: '372.819.504-21',
    telefone: '(11) 99104-8821',
    email: 'carolina@alencarmidia.com.br',
    dataNascimento: '1994-06-14',
    endereco: 'Rua Haddock Lobo, 1320 - Jardins',
    cidade: 'São Paulo - SP',
    categoriaVip: 'Influencer',
    redeSocial: '@carolinaalencar.wellness',
    alcanceSeguidores: '1,2M seguidores (Instagram & TikTok)',
    assessorNome: 'Henrique Valadares (Agência Lumina Talent)',
    assessorTelefone: '(11) 98230-4410',
    assessorEmail: 'henrique@luminatalent.com.br',
    numeroContrato: `CTR-MKT-${anoAtual}/014`,
    vigenciaContrato: `01/01/${anoAtual} a 31/12/${anoAtual}`,
    valorPermutaMensal: 8500.0,
    escopoMarketing: '2 visitas presenciais/mês com cobertura de Reels institucional + 4 sequências de Stories sobre medicina preventiva e check-up executivo.',
    clausulasContrato: '1. O(A) Parceiro(a) / Influencer compromete-se a realizar as publicações acordadas nas datas de visita registradas junto à equipe de marketing da Gwaan.\n2. Todos os procedimentos médicos e protocolos de bem-estar cobertos pela cota mensal seguem rigorosamente as normas éticas do CFM.\n3. O agendamento de visitas presenciais com equipe de filmagem deve ser alinhado com antecedência mínima de 72 horas pelo Assessor/Representante.',
    observacoes: 'Embaixadora da campanha anual de Check-up Preventivo e Longevidade.',
    datasVisitas: [
      {
        id: 'VIS-01',
        data: `${anoAtual}-${mesAtual}-06`,
        hora: '10:30',
        objetivo: 'Gravação Reels Institucional — Check-up Cardiológico & Dermatologia',
        responsavel: 'Gabriel Tavares / Dra. Larissa Peixoto',
        status: 'Confirmada',
        observacoes: 'Equipe de vídeo autorizada na recepção VIP.'
      },
      {
        id: 'VIS-02',
        data: `${anoAtual}-${mesAtual}-20`,
        hora: '15:00',
        objetivo: 'Visita de Acompanhamento + Stories Bastidores Clínica',
        responsavel: 'Dr. Eduardo Cavalcanti',
        status: 'Agendada',
        observacoes: 'Alinhado com o assessor Henrique.'
      }
    ]
  },
  {
    id: 'VIP-3002',
    foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80',
    nome: 'Thiago',
    sobrenome: 'Castanho Bernardes',
    cpf: '295.441.802-66',
    telefone: '(11) 99402-1190',
    email: 'thiago@bernardessports.com.br',
    dataNascimento: '1989-11-22',
    endereco: 'Av. Europa, 680 - Jardim Europa',
    cidade: 'São Paulo - SP',
    categoriaVip: 'Embaixador',
    redeSocial: '@thiagobernardes.run',
    alcanceSeguidores: '640K seguidores (Instagram & YouTube)',
    assessorNome: 'Patrícia Lemos (P2 Assessoria Esportiva)',
    assessorTelefone: '(11) 97654-3309',
    assessorEmail: 'patricia@p2esportes.com.br',
    numeroContrato: `CTR-MKT-${anoAtual}/029`,
    vigenciaContrato: `01/03/${anoAtual} a 28/02/${anoAtual + 1}`,
    valorPermutaMensal: 6200.0,
    escopoMarketing: '1 visita mensal para avaliação ortopédica e performance + menção em vídeos de preparação para maratonas.',
    clausulasContrato: '1. Parceria voltada à divulgação do núcleo de Ortopedia Esportiva e Reabilitação da Gwaan.\n2. Uso de imagem autorizado em mídias digitais institucionais durante a vigência contratual.',
    observacoes: 'Atleta e criador de conteúdo de alta performance.',
    datasVisitas: [
      {
        id: 'VIS-03',
        data: `${anoAtual}-${mesAtual}-03`,
        hora: '11:00',
        objetivo: 'Avaliação Biomecânica + Conteúdo Ortopedia Esportiva',
        responsavel: 'Dr. Rafael Bittencourt',
        status: 'Realizada',
        observacoes: 'Material publicado com alto engajamento.'
      }
    ]
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
