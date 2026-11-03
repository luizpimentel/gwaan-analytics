/** Tipos de dados e base incial de demanda do Faturamento */

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

// Mock
export const DEMANDAS_INICIAIS: DemandaFinanceira[] = [
    {
        id: 'FAT-000',
        cliente: 'Bradesco Saúde',
        descricao: 'Lote de Guias Ambulatoriais 00',
        valor: 1560.89,
        status: 'Faturado',
        prioridade: 'Alta',
        atualizadoHa: 'Agora mesmo'
    }, {
        id: 'FAT-001',
        cliente: 'Particular',
        descricao: 'Lote de guias de atendimentos particulares 00',
        valor: 12621.89,
        status: 'Pendencia',
        prioridade: 'Alta',
        atualizadoHa: 'Há 10 min'
    },
    {
        id: 'FAT-002',
        cliente: 'Sul América Saúde',
        descricao: 'Lote de Guias Ambulatoriais 00',
        valor: 2398.89,
        status: 'Auditoria',
        prioridade: 'Baixa',
        atualizadoHa: 'Há 20 min'
    },
    {
        id: 'FAT-003',
        cliente: 'Amil Saúde',
        descricao: 'Lote de Guias Hospitalares 00',
        valor: 982.89,
        status: 'Faturado',
        prioridade: 'Baixa',
        atualizadoHa: 'Há 25 min'
    },
    {
        id: 'FAT-004',
        cliente: 'Bradesco Saúde',
        descricao: 'Lote de Guias Ambulatoriais 01',
        valor: 1560.89,
        status: 'Faturar',
        prioridade: 'Alta',
        atualizadoHa: 'Há 40 min'
    },
    {
        id: 'FAT-005',
        cliente: 'Sul América Saúde',
        descricao: 'Lote de Guias Hospitalares 01',
        valor: 1560.89,
        status: 'Pendencia',
        prioridade: 'Alta',
        atualizadoHa: 'Há 45 min'
    },
    {
        id: 'FAT-006',
        cliente: 'Bradesco Saúde',
        descricao: 'Lote de Guias Hospitalares 02',
        valor: 10716.89,
        status: 'Faturado',
        prioridade: 'Alta',
        atualizadoHa: 'Há 50 min'
    },
    {
        id: 'FAT-007',
        cliente: 'Sul América Saúde',
        descricao: 'Lote de Guias Hospitalares 01',
        valor: 6524.89,
        status: 'Glosado',
        prioridade: 'Média',
        atualizadoHa: 'Há 55 min'
    }
]