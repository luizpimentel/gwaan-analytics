/** Tipos de dados e base inicial de demanda do Faturamento */

export type StatusFaturamento = 'Faturar' | 'Faturado' | 'Auditoria' | 'Pendencia' | 'Glosado';

export type PrioridadeDemanda = 'Alta' | 'Média' | 'Baixa';

export interface DemandaFinanceira {
  id: string;
  cliente: string;
  descricao: string;
  valor: number;
  status: StatusFaturamento;
  prioridade: PrioridadeDemanda;
  atualizadoHa: string;
}

export interface ClientesConvenio {
  nome: string;
}

export const CONVENIOS_PADRAO: ClientesConvenio[] = [
  { nome: 'Bradesco Saúde' },
  { nome: 'Unimed' },
  { nome: 'SulAmérica Saúde' },
  { nome: 'Amil' },
  { nome: 'Particular' }
];

export const DEMANDAS_INICIAIS: DemandaFinanceira[] = [
  {
    id: 'FAT-4821',
    cliente: 'Bradesco Saúde',
    descricao: 'Lote Oncologia Ambulatorial #42',
    valor: 18500.00,
    status: 'Faturado',
    prioridade: 'Alta',
    atualizadoHa: 'Hoje às 09:15'
  },
  {
    id: 'FAT-5190',
    cliente: 'Unimed',
    descricao: 'Guias SADT Diagnóstico por Imagem #18',
    valor: 14200.50,
    status: 'Faturar',
    prioridade: 'Alta',
    atualizadoHa: 'Hoje às 10:30'
  },
  {
    id: 'FAT-6034',
    cliente: 'SulAmérica Saúde',
    descricao: 'Internação Clínica Cirúrgica #07',
    valor: 22400.00,
    status: 'Auditoria',
    prioridade: 'Média',
    atualizadoHa: 'Hoje às 11:45'
  },
  {
    id: 'FAT-7215',
    cliente: 'Amil',
    descricao: 'Lote Pronto Atendimento Ortopedia #31',
    valor: 9850.00,
    status: 'Pendencia',
    prioridade: 'Média',
    atualizadoHa: 'Hoje às 13:20'
  },
  {
    id: 'FAT-8492',
    cliente: 'Particular',
    descricao: 'Procedimento Check-up Executivo #12',
    valor: 6300.00,
    status: 'Glosado',
    prioridade: 'Baixa',
    atualizadoHa: 'Hoje às 14:10'
  }
];
