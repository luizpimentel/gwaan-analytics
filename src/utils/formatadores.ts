import type {
  Atendimento,
  DemandaFinanceira,
  GuiaParticular,
  PrioridadeDemanda,
  StatusAtendimento,
  StatusFaturamento,
  StatusLoteParticular,
  StatusParticular
} from '../data/dadosFaturamento';

export function formatarMoeda(valor: number): string {
  const num = Number.isFinite(valor) ? valor : 0;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  });
}

export function obterClasseBadge(status: StatusFaturamento | string): string {
  switch (status) {
    case 'Aberto':
      return 'badge badge-auditoria';
    case 'Fechado':
    case 'Faturada':
      return 'badge badge-faturado';
    case 'Enviado':
    case 'Enviada':
    case 'Reenviado':
      return 'badge badge-enviado';
    case 'Glosado':
      return 'badge badge-glosado';
    case 'Pendente':
      return 'badge badge-pendente';
    default:
      return 'badge badge-faturado';
  }
}

export function obterClasseBadgeParticular(status: StatusParticular): string {
  switch (status) {
    case 'Pago':
      return 'badge badge-enviado';
    case 'Não pago':
      return 'badge badge-pendente';
    case 'Fechado':
      return 'badge badge-faturado';
    default:
      return 'badge';
  }
}

export function obterClasseBadgeLoteParticular(status: StatusLoteParticular | string): string {
  switch (status) {
    case 'Aberto':
      return 'badge badge-auditoria';
    case 'Fechado':
      return 'badge badge-faturado';
    default:
      return 'badge';
  }
}

export function obterClasseBadgeGuiaTuss(status: 'Ativa' | 'Cancelada' | string): string {
  switch (status) {
    case 'Ativa':
      return 'badge badge-enviado';
    case 'Cancelada':
      return 'badge badge-glosado';
    default:
      return 'badge badge-faturado';
  }
}

export function obterClasseBadgeAtendimento(status: StatusAtendimento): string {
  switch (status) {
    case 'Agendado':
      return 'badge badge-auditoria';
    case 'Confirmado':
      return 'badge badge-faturado';
    case 'Realizado':
      return 'badge badge-enviado';
    case 'Cancelado':
      return 'badge badge-glosado';
    default:
      return 'badge';
  }
}

export function obterClassePrioridade(prioridade: PrioridadeDemanda): string {
  switch (prioridade) {
    case 'Alta':
      return 'priority-tag priority-alta';
    case 'Média':
      return 'priority-tag priority-media';
    case 'Baixa':
      return 'priority-tag priority-baixa';
    default:
      return 'priority-tag priority-media';
  }
}

export function formatarCNPJ(valor: string): string {
  const apenasDigitos = valor.replace(/\D/g, '').slice(0, 14);
  return apenasDigitos
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function formatarCPF(valor: string): string {
  const apenasDigitos = valor.replace(/\D/g, '').slice(0, 11);
  return apenasDigitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatarTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return d.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

export function formatarDataBR(dataISO: string): string {
  if (!dataISO) return '-';
  const limpa = dataISO.slice(0, 10);
  const partes = limpa.split('-');
  if (partes.length !== 3) return dataISO;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function formatarUltimaAtualizacao(valorDataOuTexto: string): string {
  if (!valorDataOuTexto) return '-';

  if (/^Hoje às \d{2}:\d{2}/.test(valorDataOuTexto)) {
    return valorDataOuTexto.slice(0, 13);
  }

  const dataObj = new Date(valorDataOuTexto);
  if (isNaN(dataObj.getTime())) {
    const matchHora = valorDataOuTexto.match(/(\d{2}:\d{2})/);
    if (matchHora) {
      return `Hoje às ${matchHora[1]}`;
    }
    return valorDataOuTexto;
  }

  const agora = new Date();
  const ehHoje =
    dataObj.getFullYear() === agora.getFullYear() &&
    dataObj.getMonth() === agora.getMonth() &&
    dataObj.getDate() === agora.getDate();

  if (ehHoje) {
    const hh = String(dataObj.getHours()).padStart(2, '0');
    const mm = String(dataObj.getMinutes()).padStart(2, '0');
    return `Hoje às ${hh}:${mm}`;
  }

  const dia = String(dataObj.getDate()).padStart(2, '0');
  const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
  const anoCurto = String(dataObj.getFullYear()).slice(-2);
  return `${dia}/${mes}/${anoCurto}`;
}

export type FiltroPeriodoVisaoGeral = 'Todos' | 'Hoje' | '7dias' | '15dias' | 'Mes';

export function estaDentroDoPeriodo(
  dataString: string | undefined,
  periodo: FiltroPeriodoVisaoGeral
): boolean {
  if (periodo === 'Todos' || !dataString) return true;

  const dataAlvo = new Date(dataString.length === 10 ? `${dataString}T12:00:00` : dataString);
  if (isNaN(dataAlvo.getTime())) return true;

  const agora = new Date();
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const dataAlvoDia = new Date(
    dataAlvo.getFullYear(),
    dataAlvo.getMonth(),
    dataAlvo.getDate()
  );

  const diffMs = inicioHoje.getTime() - dataAlvoDia.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  switch (periodo) {
    case 'Hoje':
      return diffDias === 0;
    case '7dias':
      return diffDias >= 0 && diffDias <= 7;
    case '15dias':
      return diffDias >= 0 && diffDias <= 15;
    case 'Mes':
      return (
        dataAlvo.getMonth() === agora.getMonth() &&
        dataAlvo.getFullYear() === agora.getFullYear()
      );
    default:
      return true;
  }
}

function escaparCelulaSegura(valor: string | number | undefined): string {
  let texto = String(valor ?? '');
  if (/^[=+\-@\t\r]/.test(texto)) {
    texto = `'${texto}`;
  }
  return `"${texto.replace(/"/g, '""')}"`;
}

export function exportarParaCSV(
  registros: (DemandaFinanceira | GuiaParticular)[],
  prefixoArquivo = 'gwaan-relatorio-faturamento'
): void {
  if (registros.length === 0) {
    alert('Não há registros para serem exportados!');
    return;
  }

  const cabecalho = [
    'Código',
    'Categoria',
    'Operadora / Origem',
    'Descrição',
    'Prioridade',
    'Valor (R$)',
    'Status',
    'Última Atualização'
  ];

  const linhas = registros.map((item) => {
    const ehParticular = 'nf' in item;
    const operadoraOuPart = ehParticular ? `Particular (${item.paciente})` : item.operadora;
    const dataAtu = ehParticular
      ? formatarUltimaAtualizacao(item.atualizadoEm)
      : formatarUltimaAtualizacao(item.dataAlteracaoOuEnvio || item.atualizadoHa);

    return [
      escaparCelulaSegura(item.id),
      escaparCelulaSegura(ehParticular ? 'Particular' : 'Operadora'),
      escaparCelulaSegura(operadoraOuPart),
      escaparCelulaSegura(item.descricao),
      escaparCelulaSegura(item.prioridade),
      escaparCelulaSegura(item.valor.toFixed(2).replace('.', ',')),
      escaparCelulaSegura(item.status),
      escaparCelulaSegura(dataAtu)
    ].join(';');
  });

  const conteudoCSV = '\uFEFF' + [cabecalho.join(';'), ...linhas].join('\r\n');
  const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const dataHoje = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `${prefixoArquivo}-${dataHoje}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportarAtendimentosCSV(
  atendimentos: Atendimento[],
  prefixoArquivo = 'gwaan-relatorio-atendimentos'
): void {
  if (atendimentos.length === 0) {
    alert('Não há atendimentos para serem exportados!');
    return;
  }

  const cabecalho = [
    'Código Atendimento',
    'ID Paciente',
    'Nome do Paciente',
    'Profissional / Médico',
    'Especialidade',
    'Descrição',
    'Data',
    'Hora',
    'Operadora / Origem',
    'Status',
    'Valor (R$)',
    'Desconto (R$)'
  ];

  const linhas = atendimentos.map((item) =>
    [
      escaparCelulaSegura(item.id),
      escaparCelulaSegura(item.pacienteId),
      escaparCelulaSegura(item.pacienteNome),
      escaparCelulaSegura(item.medicoNome),
      escaparCelulaSegura(item.especialidade),
      escaparCelulaSegura(item.descricao),
      escaparCelulaSegura(formatarDataBR(item.data)),
      escaparCelulaSegura(item.hora || '09:00'),
      escaparCelulaSegura(item.operadora),
      escaparCelulaSegura(item.status),
      escaparCelulaSegura(item.valor.toFixed(2).replace('.', ',')),
      escaparCelulaSegura((item.desconto ?? 0).toFixed(2).replace('.', ','))
    ].join(';')
  );

  const conteudoCSV = '\uFEFF' + [cabecalho.join(';'), ...linhas].join('\r\n');
  const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const dataHoje = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `${prefixoArquivo}-${dataHoje}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
