import { useState, useEffect } from 'react';
import {
  OPERADORAS_PADRAO,
  DEMANDAS_INICIAIS,
  GUIAS_PARTICULARES_INICIAIS,
  LOTES_PARTICULARES_ARQUIVADOS_INICIAIS,
  PROFISSIONAIS_INICIAIS,
  PACIENTES_INICIAIS,
  ATENDIMENTOS_INICIAIS,
  CLIENTES_VIP_INICIAIS,
  REGRAS_GESTAO_PADRAO,
  PREFERENCIAS_PADRAO,
  aplicarCancelamentoAutomaticoAtendimentos,
  type Operadora,
  type DemandaFinanceira,
  type GuiaLote,
  type GuiaParticular,
  type LoteParticular,
  type PrioridadeDemanda,
  type StatusFaturamento,
  type StatusParticular,
  type StatusLoteParticular,
  type TipoAtendimentoLote,
  type HistoricoAlteracaoLote,
  type Profissional,
  type Paciente,
  type Atendimento,
  type StatusAtendimento,
  type ClienteVIP,
  type RegrasGestao,
  type PreferenciasSistema
} from './data/dadosFaturamento';
import { Sidebar, type AbaSistema } from './components/Sidebar';
import { Header } from './components/Header';
import { ModalLote } from './components/ModalLote';
import { ModalRecurso } from './components/ModalRecurso';
import { VisaoGeralPage } from './pages/VisaoGeralPage';
import { LotesPage } from './pages/LotesPage';
import { GuiasPage } from './pages/GuiasPage';
import { OperadorasPage } from './pages/OperadorasPage';
import { ParticularesPage } from './pages/ParticularesPage';
import { AtendimentosPage } from './pages/AtendimentosPage';
import { Profissionais } from './pages/Profissionais';
import { PacientesPage } from './pages/PacientesPage';
import { ClientesPage } from './pages/Clientes';
import { RelatoriosPage } from './pages/RelatoriosPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import './index.css';

const CHAVE_DEMANDAS = 'gwaan_demandas_v5';
const CHAVE_OPERADORAS = 'gwaan_operadoras_v4';
const CHAVE_GUIAS_PARTICULARES = 'gwaan_guias_particulares_v2';
const CHAVE_LOTES_PARTICULARES = 'gwaan_lotes_particulares_v5';
const CHAVE_PROFISSIONAIS = 'gwaan_profissionais_v4';
const CHAVE_PACIENTES = 'gwaan_pacientes_v3';
const CHAVE_ATENDIMENTOS = 'gwaan_atendimentos_v5';
const CHAVE_CLIENTES_VIP = 'gwaan_clientes_vip_v1';
const CHAVE_REGRAS = 'gwaan_regras_v2';
const CHAVE_PREFERENCIAS = 'gwaan_preferencias_v2';

function lerLocalStorage<T>(chave: string, padrao: T): T {
  try {
    const salvo = localStorage.getItem(chave);
    if (!salvo) return padrao;
    const parsed = JSON.parse(salvo);
    if (parsed === null || parsed === undefined) return padrao;
    if (Array.isArray(padrao)) {
      if (Array.isArray(parsed)) return parsed as unknown as T;
      if (
        typeof parsed === 'object' &&
        Array.isArray((parsed as { listaAtualizada?: unknown[] }).listaAtualizada)
      ) {
        return (parsed as { listaAtualizada: unknown[] })
          .listaAtualizada as unknown as T;
      }
      return padrao;
    }
    return parsed as T;
  } catch {
    return padrao;
  }
}

function salvarLocalStorageSeguro<T>(chave: string, valor: T): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    console.warn(`Aviso ao salvar no armazenamento local (${chave}):`, erro);
  }
}

function gerarIdUnico(
  prefixo: string,
  idsExistentes: string[],
  min = 1000,
  max = 9999
): string {
  const conjunto = new Set(idsExistentes);
  for (let tentativa = 0; tentativa < 200; tentativa++) {
    const num = Math.floor(min + Math.random() * (max - min));
    const candidato = `${prefixo}-${num}`;
    if (!conjunto.has(candidato)) return candidato;
  }
  return `${prefixo}-${Date.now().toString().slice(-5)}`;
}

export function App() {
  const [abaAtiva, setAbaAtiva] = useState<AbaSistema>('dashboard');
  const [sidebarExpandida, setSidebarExpandida] = useState<boolean>(false);

  const [demandas, setDemandas] = useState<DemandaFinanceira[]>(() =>
    lerLocalStorage(CHAVE_DEMANDAS, DEMANDAS_INICIAIS)
  );
  const [operadoras, setOperadoras] = useState<Operadora[]>(() =>
    lerLocalStorage(CHAVE_OPERADORAS, OPERADORAS_PADRAO)
  );
  const [guiasParticulares, setGuiasParticulares] = useState<GuiaParticular[]>(() =>
    lerLocalStorage(CHAVE_GUIAS_PARTICULARES, GUIAS_PARTICULARES_INICIAIS)
  );
  const [lotesParticularesArquivados, setLotesParticularesArquivados] = useState<
    LoteParticular[]
  >(() =>
    lerLocalStorage(CHAVE_LOTES_PARTICULARES, LOTES_PARTICULARES_ARQUIVADOS_INICIAIS)
  );

  const [profissionais, setProfissionais] = useState<Profissional[]>(() =>
    lerLocalStorage(CHAVE_PROFISSIONAIS, PROFISSIONAIS_INICIAIS)
  );
  const [pacientes, setPacientes] = useState<Paciente[]>(() =>
    lerLocalStorage(CHAVE_PACIENTES, PACIENTES_INICIAIS)
  );
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>(() =>
    aplicarCancelamentoAutomaticoAtendimentos(
      lerLocalStorage(CHAVE_ATENDIMENTOS, ATENDIMENTOS_INICIAIS)
    ).listaAtualizada
  );
  const [clientesVip, setClientesVip] = useState<ClienteVIP[]>(() =>
    lerLocalStorage(CHAVE_CLIENTES_VIP, CLIENTES_VIP_INICIAIS)
  );
  const [regrasGestao, setRegrasGestao] = useState<RegrasGestao>(() =>
    lerLocalStorage(CHAVE_REGRAS, REGRAS_GESTAO_PADRAO)
  );
  const [preferencias, setPreferencias] = useState<PreferenciasSistema>(() =>
    lerLocalStorage(CHAVE_PREFERENCIAS, PREFERENCIAS_PADRAO)
  );

  const [modalLoteAberto, setModalLoteAberto] = useState<boolean>(false);
  const [loteSelecionadoId, setLoteSelecionadoId] = useState<string | null>(null);
  const [loteParaRecurso, setLoteParaRecurso] = useState<DemandaFinanceira | null>(null);

  const loteSelecionado = loteSelecionadoId
    ? demandas.find((d) => d.id === loteSelecionadoId) ?? null
    : null;

  useEffect(() => {
    salvarLocalStorageSeguro(CHAVE_DEMANDAS, demandas);
  }, [demandas]);

  useEffect(() => {
    salvarLocalStorageSeguro(CHAVE_OPERADORAS, operadoras);
  }, [operadoras]);

  useEffect(() => {
    salvarLocalStorageSeguro(CHAVE_GUIAS_PARTICULARES, guiasParticulares);
  }, [guiasParticulares]);

  useEffect(() => {
    salvarLocalStorageSeguro(CHAVE_LOTES_PARTICULARES, lotesParticularesArquivados);
  }, [lotesParticularesArquivados]);

  useEffect(() => {
    salvarLocalStorageSeguro(CHAVE_PROFISSIONAIS, profissionais);
  }, [profissionais]);

  useEffect(() => {
    salvarLocalStorageSeguro(CHAVE_PACIENTES, pacientes);
  }, [pacientes]);

  useEffect(() => {
    salvarLocalStorageSeguro(CHAVE_ATENDIMENTOS, atendimentos);
  }, [atendimentos]);

  useEffect(() => {
    salvarLocalStorageSeguro(CHAVE_CLIENTES_VIP, clientesVip);
  }, [clientesVip]);

  useEffect(() => {
    salvarLocalStorageSeguro(CHAVE_REGRAS, regrasGestao);
  }, [regrasGestao]);

  useEffect(() => {
    salvarLocalStorageSeguro(CHAVE_PREFERENCIAS, preferencias);
    if (preferencias.modoEscuro) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [preferencias]);

  function pedirConfirmacaoExclusao(mensagem: string): boolean {
    if (!preferencias.confirmarExclusao) return true;
    return confirm(mensagem);
  }

  function alterarStatusDemanda(idAlvo: string, statusDestino: StatusFaturamento) {
    const agora = new Date();
    const agoraISO = agora.toISOString();
    const dataHoraFormatada = `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    )}`;

    setDemandas((listaAnterior) =>
      listaAnterior.map((item) => {
        if (item.id !== idAlvo) return item;
        const novoEvento: HistoricoAlteracaoLote = {
          id: `HL-${Date.now()}`,
          dataHora: dataHoraFormatada,
          acao: `Alteração de Status para ${statusDestino}`,
          detalhes: `Status do lote alterado de ${item.status} para ${statusDestino}.`
        };
        return {
          ...item,
          status: statusDestino,
          dataAlteracaoOuEnvio: agoraISO,
          atualizadoHa: agoraISO,
          faturasEmitidas:
            statusDestino === 'Faturada' || statusDestino === 'Enviada',
          faturasEmitidasEm:
            statusDestino === 'Faturada' || statusDestino === 'Enviada'
              ? item.faturasEmitidasEm || dataHoraFormatada
              : undefined,
          historicoLote: [novoEvento, ...(item.historicoLote ?? [])]
        };
      })
    );
  }

  function salvarLoteOperadora(dados: {
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
  }) {
    const somaGuias = dados.guias.reduce((acc, g) => acc + g.valor, 0);

    if (dados.id) {
      setDemandas((listaAnterior) =>
        listaAnterior.map((item) =>
          item.id === dados.id
            ? {
                ...item,
                operadora: item.operadora,
                descricao: dados.descricao,
                tipoAtendimento: item.tipoAtendimento,
                dataCriacao: dados.dataCriacao,
                dataAlteracaoOuEnvio: dados.dataAlteracaoOuEnvio,
                valor: somaGuias,
                status: dados.status,
                prioridade: dados.prioridade,
                guias: dados.guias,
                observacoes: dados.observacoes,
                historicoLote: dados.historicoLote,
                faturasEmitidas:
                  dados.status === 'Faturada' || dados.status === 'Enviada',
                faturasEmitidasEm: dados.faturasEmitidasEm,
                motivoUltimaExclusaoFatura: dados.motivoUltimaExclusaoFatura,
                atualizadoHa: dados.dataAlteracaoOuEnvio
              }
            : item
        )
      );
      setLoteSelecionadoId(dados.id);
    } else {
      const idNovo =
        dados.codigoCustomizado &&
        !demandas.some((d) => d.id === dados.codigoCustomizado)
          ? dados.codigoCustomizado
          : gerarIdUnico(
              'FAT',
              demandas.map((d) => d.id)
            );

      const novoLote: DemandaFinanceira = {
        id: idNovo,
        operadora: dados.operadora,
        descricao: dados.descricao,
        tipoAtendimento: dados.tipoAtendimento,
        dataCriacao: dados.dataCriacao,
        dataAlteracaoOuEnvio: dados.dataAlteracaoOuEnvio,
        valor: somaGuias,
        status: dados.status,
        prioridade: dados.prioridade,
        guias: dados.guias,
        observacoes: dados.observacoes,
        historicoLote: dados.historicoLote,
        faturasEmitidas:
          dados.status === 'Faturada' || dados.status === 'Enviada',
        faturasEmitidasEm: dados.faturasEmitidasEm,
        motivoUltimaExclusaoFatura: dados.motivoUltimaExclusaoFatura,
        categoria: 'Operadora',
        atualizadoHa: dados.dataAlteracaoOuEnvio
      };

      setDemandas((listaAnterior) => [novoLote, ...listaAnterior]);
      setLoteSelecionadoId(idNovo);
    }
  }

  function excluirDemanda(idAlvo: string) {
    if (!pedirConfirmacaoExclusao('Deseja realmente excluir este lote?')) return;
    setDemandas((listaAnterior) => listaAnterior.filter((item) => item.id !== idAlvo));
  }

  function salvarRecursoLote(idLote: string, motivo: string) {
    const horarioAtual = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    const agoraISO = new Date().toISOString();

    setDemandas((listaAnterior) =>
      listaAnterior.map((item) =>
        item.id === idLote
          ? {
              ...item,
              recurso: {
                motivo,
                dataAbertura: `${dataHoje} às ${horarioAtual}`
              },
              dataAlteracaoOuEnvio: agoraISO,
              atualizadoHa: agoraISO
            }
          : item
      )
    );

    setLoteParaRecurso(null);
  }

  function editarGuiaTussConsolidada(
    guiaId: string,
    dados: { codigoTuss: string; descricao: string; valor: number }
  ) {
    setAtendimentos((ant) =>
      aplicarCancelamentoAutomaticoAtendimentos(
        ant.map((atd) =>
          atd.id === guiaId
            ? {
                ...atd,
                codigoTuss: dados.codigoTuss,
                descricao: dados.descricao,
                valor: dados.valor
              }
            : atd
        )
      ).listaAtualizada
    );

    setDemandas((ant) =>
      ant.map((lote) => {
        const possui = lote.guias.some(
          (g) => g.id === guiaId || g.atendimentoId === guiaId
        );
        if (!possui) return lote;
        const novasGuias = lote.guias.map((g) =>
          g.id === guiaId || g.atendimentoId === guiaId
            ? {
                ...g,
                codigoTuss: dados.codigoTuss,
                procedimento: dados.descricao,
                valor: dados.valor
              }
            : g
        );
        const novoTotal = novasGuias.reduce((acc, g) => acc + g.valor, 0);
        return {
          ...lote,
          guias: novasGuias,
          valor: novoTotal
        };
      })
    );
  }

  function cancelarGuiaTussConsolidada(guiaId: string) {
    setAtendimentos((ant) =>
      ant.map((atd) =>
        atd.id === guiaId
          ? { ...atd, status: 'Cancelado', guiaCancelada: true }
          : atd
      )
    );

    setDemandas((ant) =>
      ant.map((lote) => {
        const possui = lote.guias.some(
          (g) => g.id === guiaId || g.atendimentoId === guiaId
        );
        if (!possui) return lote;
        return {
          ...lote,
          guias: lote.guias.map((g) =>
            g.id === guiaId || g.atendimentoId === guiaId
              ? { ...g, statusGuia: 'Cancelada' }
              : g
          )
        };
      })
    );
  }

  function excluirGuiaTussConsolidada(guiaId: string) {
    if (!pedirConfirmacaoExclusao(`Deseja realmente excluir a guia ${guiaId}?`)) {
      return;
    }

    setAtendimentos((ant) => ant.filter((atd) => atd.id !== guiaId));

    setDemandas((ant) =>
      ant.map((lote) => {
        const possui = lote.guias.some(
          (g) => g.id === guiaId || g.atendimentoId === guiaId
        );
        if (!possui) return lote;
        const novasGuias = lote.guias.filter(
          (g) => g.id !== guiaId && g.atendimentoId !== guiaId
        );
        const novoTotal = novasGuias.reduce((acc, g) => acc + g.valor, 0);
        return {
          ...lote,
          guias: novasGuias,
          valor: novoTotal
        };
      })
    );
  }

  function adicionarOperadora(dados: Omit<Operadora, 'id'>) {
    const novoId = gerarIdUnico(
      'OP',
      operadoras.map((o) => o.id),
      10,
      99
    );
    const novaOp: Operadora = {
      id: novoId,
      nome: dados.nome,
      cnpj: dados.cnpj,
      datasEnvio: dados.datasEnvio
    };
    setOperadoras((listaAnterior) => [...listaAnterior, novaOp]);
  }

  function editarOperadora(operadoraAtualizada: Operadora) {
    const operadoraAntiga = operadoras.find((op) => op.id === operadoraAtualizada.id);
    setOperadoras((listaAnterior) =>
      listaAnterior.map((op) =>
        op.id === operadoraAtualizada.id ? operadoraAtualizada : op
      )
    );

    if (operadoraAntiga && operadoraAntiga.nome !== operadoraAtualizada.nome) {
      setDemandas((listaAnterior) =>
        listaAnterior.map((d) =>
          d.operadora === operadoraAntiga.nome
            ? { ...d, operadora: operadoraAtualizada.nome }
            : d
        )
      );
      setAtendimentos((listaAnterior) =>
        listaAnterior.map((a) =>
          a.operadora === operadoraAntiga.nome
            ? { ...a, operadora: operadoraAtualizada.nome }
            : a
        )
      );
    }
  }

  function removerOperadora(idAlvo: string) {
    if (operadoras.length <= 1) {
      alert('Não é possível remover a única operadora cadastrada!');
      return;
    }
    if (!pedirConfirmacaoExclusao('Deseja realmente excluir esta operadora?')) return;
    setOperadoras((listaAnterior) => listaAnterior.filter((op) => op.id !== idAlvo));
  }

  function salvarGuiaParticular(
    dados: Omit<GuiaParticular, 'id' | 'atualizadoEm'> & { id?: string }
  ) {
    const agoraISO = new Date().toISOString();

    if (dados.id) {
      const guiaExistente = guiasParticulares.find((g) => g.id === dados.id);
      if (guiaExistente?.status === 'Fechado') {
        alert('Guias com status Fechado não podem ser editadas!');
        return;
      }

      setGuiasParticulares((listaAnterior) =>
        listaAnterior.map((item) =>
          item.id === dados.id
            ? {
                ...dados,
                id: dados.id,
                atualizadoEm: agoraISO
              }
            : item
        )
      );
    } else {
      const novaGuia: GuiaParticular = {
        ...dados,
        id: gerarIdUnico(
          'GPART',
          guiasParticulares.map((g) => g.id)
        ),
        atualizadoEm: agoraISO
      };
      setGuiasParticulares((listaAnterior) => [novaGuia, ...listaAnterior]);
    }
  }

  function alterarStatusGuiaParticular(idAlvo: string, novoStatus: StatusParticular) {
    const guiaExistente = guiasParticulares.find((g) => g.id === idAlvo);
    if (guiaExistente?.status === 'Fechado') {
      alert('Guias com status Fechado já estão em lote e não podem ser alteradas!');
      return;
    }

    const agoraISO = new Date().toISOString();
    setGuiasParticulares((listaAnterior) =>
      listaAnterior.map((item) =>
        item.id === idAlvo
          ? {
              ...item,
              status: novoStatus,
              atualizadoEm: agoraISO
            }
          : item
      )
    );
  }

  function excluirGuiaParticular(idAlvo: string) {
    if (!pedirConfirmacaoExclusao('Deseja realmente excluir esta guia particular?')) {
      return;
    }
    setGuiasParticulares((listaAnterior) =>
      listaAnterior.filter((item) => item.id !== idAlvo)
    );
  }

  function salvarLoteParticular(dados: {
    id?: string;
    descricao: string;
    prioridade: PrioridadeDemanda;
    guiasIds: string[];
    status: StatusLoteParticular;
    observacoes: string;
  }) {
    const agoraISO = new Date().toISOString();
    const hojeISO = agoraISO.slice(0, 10);

    if (dados.id) {
      const loteAlvo = lotesParticularesArquivados.find((l) => l.id === dados.id);
      if (!loteAlvo) return;

      const idsUnificados = Array.from(
        new Set([...loteAlvo.guiasIds, ...dados.guiasIds])
      );
      const somaTotal = guiasParticulares
        .filter((g) => idsUnificados.includes(g.id))
        .reduce((acc, g) => acc + g.valor, 0);

      setLotesParticularesArquivados((ant) =>
        ant.map((l) =>
          l.id === dados.id
            ? {
                ...l,
                descricao: dados.descricao,
                prioridade: dados.prioridade,
                status: dados.status,
                dataFechamento:
                  dados.status === 'Fechado' ? agoraISO : l.dataFechamento,
                guiasIds: idsUnificados,
                valorTotal: somaTotal,
                observacoes: dados.observacoes
              }
            : l
        )
      );

      setGuiasParticulares((ant) =>
        ant.map((g) =>
          idsUnificados.includes(g.id)
            ? {
                ...g,
                status: 'Fechado',
                loteId: dados.id,
                atualizadoEm: agoraISO
              }
            : g
        )
      );
      return;
    }

    const idNovoLote = gerarIdUnico(
      'LPART',
      lotesParticularesArquivados.map((l) => l.id),
      500,
      999
    );

    const somaTotal = guiasParticulares
      .filter((g) => dados.guiasIds.includes(g.id))
      .reduce((acc, g) => acc + g.valor, 0);

    const novoLote: LoteParticular = {
      id: idNovoLote,
      descricao: dados.descricao,
      dataCriacao: hojeISO,
      dataFechamento: agoraISO,
      prioridade: dados.prioridade,
      status: dados.status,
      guiasIds: dados.guiasIds,
      valorTotal: somaTotal,
      observacoes: dados.observacoes
    };

    setLotesParticularesArquivados((ant) => [novoLote, ...ant]);

    setGuiasParticulares((ant) =>
      ant.map((g) =>
        dados.guiasIds.includes(g.id)
          ? {
              ...g,
              status: 'Fechado',
              loteId: idNovoLote,
              atualizadoEm: agoraISO
            }
          : g
      )
    );
  }

  function excluirLoteParticularArquivado(idAlvo: string) {
    if (
      !pedirConfirmacaoExclusao(
        'Deseja realmente excluir este lote particular?'
      )
    ) {
      return;
    }
    setLotesParticularesArquivados((ant) => ant.filter((l) => l.id !== idAlvo));
    setGuiasParticulares((ant) =>
      ant.map((g) =>
        g.loteId === idAlvo ? { ...g, loteId: undefined, status: 'Pago' } : g
      )
    );
  }

  function salvarProfissional(
    dados: Omit<Profissional, 'id'> & { id?: string }
  ) {
    if (dados.id) {
      setProfissionais((listaAnterior) =>
        listaAnterior.map((p) =>
          p.id === dados.id ? { ...dados, id: dados.id } : p
        )
      );
      setAtendimentos((listaAnterior) =>
        listaAnterior.map((a) =>
          a.medicoId === dados.id
            ? {
                ...a,
                medicoNome: dados.nome,
                especialidade: dados.especialidade || a.especialidade
              }
            : a
        )
      );
    } else {
      const novoProfissional: Profissional = {
        ...dados,
        id: gerarIdUnico(
          'PRF',
          profissionais.map((p) => p.id),
          105,
          999
        )
      };
      setProfissionais((listaAnterior) => [novoProfissional, ...listaAnterior]);
    }
  }

  function excluirProfissional(idAlvo: string) {
    if (profissionais.length <= 1) {
      alert('Mantenha pelo menos um profissional cadastrado no sistema!');
      return;
    }
    if (
      !pedirConfirmacaoExclusao(
        'Deseja realmente excluir este profissional da empresa?'
      )
    ) {
      return;
    }
    setProfissionais((listaAnterior) =>
      listaAnterior.filter((p) => p.id !== idAlvo)
    );
  }

  function salvarPaciente(dados: Omit<Paciente, 'id'> & { id?: string }) {
    if (dados.id) {
      setPacientes((listaAnterior) =>
        listaAnterior.map((p) =>
          p.id === dados.id ? { ...dados, id: dados.id } : p
        )
      );
      const nomeCompleto = `${dados.nome} ${dados.sobrenome}`.trim();
      setAtendimentos((listaAnterior) =>
        listaAnterior.map((a) =>
          a.pacienteId === dados.id ? { ...a, pacienteNome: nomeCompleto } : a
        )
      );
    } else {
      const novoPaciente: Paciente = {
        ...dados,
        id: gerarIdUnico(
          'PAC',
          pacientes.map((p) => p.id),
          2005,
          9999
        )
      };
      setPacientes((listaAnterior) => [novoPaciente, ...listaAnterior]);
    }
  }

  function cadastrarPacienteRapido(dados: Omit<Paciente, 'id'>): Paciente {
    const novoPaciente: Paciente = {
      ...dados,
      id: gerarIdUnico(
        'PAC',
        pacientes.map((p) => p.id),
        2005,
        9999
      )
    };
    setPacientes((listaAnterior) => [novoPaciente, ...listaAnterior]);
    return novoPaciente;
  }

  function excluirPaciente(idAlvo: string) {
    if (pacientes.length <= 1) {
      alert('Mantenha pelo menos um paciente cadastrado no sistema!');
      return;
    }
    if (!pedirConfirmacaoExclusao('Deseja realmente excluir este paciente?')) return;
    setPacientes((listaAnterior) => listaAnterior.filter((p) => p.id !== idAlvo));
  }

  function salvarAtendimento(dados: Omit<Atendimento, 'id'> & { id?: string }) {
    if (dados.id) {
      setAtendimentos((listaAnterior) =>
        aplicarCancelamentoAutomaticoAtendimentos(
          listaAnterior.map((a) =>
            a.id === dados.id ? { ...dados, id: dados.id } : a
          )
        ).listaAtualizada
      );
    } else {
      const novoAtd: Atendimento = {
        ...dados,
        id: gerarIdUnico(
          'ATD',
          atendimentos.map((a) => a.id),
          910,
          9999
        )
      };
      setAtendimentos((listaAnterior) =>
        aplicarCancelamentoAutomaticoAtendimentos([novoAtd, ...listaAnterior])
          .listaAtualizada
      );
    }
  }

  function alterarStatusAtendimento(
    idAlvo: string,
    novoStatus: StatusAtendimento
  ) {
    setAtendimentos((listaAnterior) =>
      aplicarCancelamentoAutomaticoAtendimentos(
        listaAnterior.map((a) =>
          a.id === idAlvo ? { ...a, status: novoStatus } : a
        )
      ).listaAtualizada
    );
  }

  function excluirAtendimento(idAlvo: string) {
    if (!pedirConfirmacaoExclusao('Deseja realmente excluir este atendimento?')) return;
    setAtendimentos((listaAnterior) =>
      listaAnterior.filter((a) => a.id !== idAlvo)
    );
  }

  function salvarClienteVip(dados: Omit<ClienteVIP, 'id'> & { id?: string }) {
    if (dados.id) {
      setClientesVip((listaAnterior) =>
        listaAnterior.map((c) =>
          c.id === dados.id ? { ...dados, id: dados.id } : c
        )
      );
    } else {
      const novoCliente: ClienteVIP = {
        ...dados,
        id: gerarIdUnico(
          'VIP',
          clientesVip.map((c) => c.id),
          500,
          999
        )
      };
      setClientesVip((listaAnterior) => [novoCliente, ...listaAnterior]);
    }
  }

  function excluirClienteVip(idAlvo: string) {
    if (clientesVip.length <= 1) {
      alert('Mantenha pelo menos um cliente VIP cadastrado no sistema!');
      return;
    }
    if (
      !pedirConfirmacaoExclusao(
        'Deseja realmente excluir este cliente VIP / Influencer?'
      )
    ) {
      return;
    }
    setClientesVip((listaAnterior) =>
      listaAnterior.filter((c) => c.id !== idAlvo)
    );
  }

  function exportarBackupJSON() {
    const backup = {
      geradoEm: new Date().toISOString(),
      demandas,
      operadoras,
      guiasParticulares,
      lotesParticularesArquivados,
      profissionais,
      pacientes,
      atendimentos,
      clientesVip,
      regrasGestao,
      preferencias
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `gwaan-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className={`app-container ${sidebarExpandida ? 'sidebar-expanded' : ''} ${
        preferencias.tabelaCompacta ? 'table-compact' : ''
      }`}
    >
      <Sidebar
        abaAtiva={abaAtiva}
        expandida={sidebarExpandida}
        aoAlternarExpansao={() => setSidebarExpandida((ant) => !ant)}
        aoSelecionarAba={(aba) => setAbaAtiva(aba)}
      />

      <div className="main-content">
        <Header />

        {abaAtiva === 'dashboard' && (
          <VisaoGeralPage
            demandas={demandas}
            metaFinanceira={regrasGestao.metaPorOperadora}
            aoAlterarStatus={alterarStatusDemanda}
            aoEditarDemanda={(demanda) => {
              setLoteSelecionadoId(demanda.id);
              setModalLoteAberto(true);
            }}
            aoAbrirRecurso={(demanda) => setLoteParaRecurso(demanda)}
            aoExcluirDemanda={excluirDemanda}
          />
        )}

        {abaAtiva === 'guias' && (
          <GuiasPage
            atendimentos={atendimentos}
            demandas={demandas}
            pacientes={pacientes}
            medicos={profissionais}
            operadoras={operadoras}
            aoEditarGuiaTuss={editarGuiaTussConsolidada}
            aoCancelarGuiaTuss={cancelarGuiaTussConsolidada}
            aoExcluirGuiaTuss={excluirGuiaTussConsolidada}
          />
        )}

        {abaAtiva === 'lotes' && (
          <LotesPage
            demandas={demandas}
            operadoras={operadoras}
            aoAbrirNovoLote={() => {
              setLoteSelecionadoId(null);
              setModalLoteAberto(true);
            }}
            aoSelecionarLote={(lote) => {
              setLoteSelecionadoId(lote.id);
              setModalLoteAberto(true);
            }}
            aoAbrirRecurso={(lote) => setLoteParaRecurso(lote)}
            aoAlterarStatus={alterarStatusDemanda}
            aoExcluirDemanda={excluirDemanda}
          />
        )}

        {abaAtiva === 'particulares' && (
          <ParticularesPage
            atendimentos={atendimentos}
            guiasParticulares={guiasParticulares}
            lotesParticularesArquivados={lotesParticularesArquivados}
            aoSalvarGuiaParticular={salvarGuiaParticular}
            aoAlterarStatusGuiaParticular={alterarStatusGuiaParticular}
            aoExcluirGuiaParticular={excluirGuiaParticular}
            aoSalvarLoteParticular={salvarLoteParticular}
            aoExcluirLoteParticularArquivado={excluirLoteParticularArquivado}
          />
        )}

        {abaAtiva === 'atendimentos' && (
          <AtendimentosPage
            atendimentos={atendimentos}
            pacientes={pacientes}
            medicos={profissionais}
            operadoras={operadoras}
            aoSalvarAtendimento={salvarAtendimento}
            aoCadastrarPacienteRapido={cadastrarPacienteRapido}
            aoAlterarStatusAtendimento={alterarStatusAtendimento}
            aoExcluirAtendimento={excluirAtendimento}
          />
        )}

        {abaAtiva === 'pacientes' && (
          <PacientesPage
            pacientes={pacientes}
            atendimentos={atendimentos}
            medicos={profissionais}
            operadoras={operadoras}
            aoSalvarPaciente={salvarPaciente}
            aoExcluirPaciente={excluirPaciente}
            aoSalvarAtendimento={salvarAtendimento}
          />
        )}

        {abaAtiva === 'profissionais' && (
          <Profissionais
            profissionais={profissionais}
            atendimentos={atendimentos}
            pacientes={pacientes}
            operadoras={operadoras}
            aoSalvarProfissional={salvarProfissional}
            aoExcluirProfissional={excluirProfissional}
            aoSalvarAtendimento={salvarAtendimento}
          />
        )}

        {abaAtiva === 'operadoras' && (
          <OperadorasPage
            operadoras={operadoras}
            demandas={demandas}
            aoAdicionarOperadora={adicionarOperadora}
            aoEditarOperadora={editarOperadora}
            aoRemoverOperadora={removerOperadora}
          />
        )}

        {abaAtiva === 'clientes' && (
          <ClientesPage
            clientesVip={clientesVip}
            profissionais={profissionais}
            aoSalvarClienteVip={salvarClienteVip}
            aoExcluirClienteVip={excluirClienteVip}
          />
        )}

        {abaAtiva === 'relatorios' && (
          <RelatoriosPage
            demandasOperadoras={demandas}
            guiasParticulares={guiasParticulares}
            operadoras={operadoras}
            atendimentos={atendimentos}
            medicos={profissionais}
            pacientes={pacientes}
            regrasGestao={regrasGestao}
            aoSalvarRegras={setRegrasGestao}
          />
        )}

        {abaAtiva === 'configuracoes' && (
          <ConfiguracoesPage
            preferencias={preferencias}
            aoAtualizarPreferencias={setPreferencias}
            aoExportarBackupJSON={exportarBackupJSON}
          />
        )}
      </div>

      {modalLoteAberto && (
        <ModalLote
          operadoras={operadoras}
          atendimentos={atendimentos}
          loteInicial={loteSelecionado}
          aoFechar={() => {
            setModalLoteAberto(false);
            setLoteSelecionadoId(null);
          }}
          aoSalvar={salvarLoteOperadora}
          aoAbrirRecurso={(lote) => setLoteParaRecurso(lote)}
        />
      )}

      {loteParaRecurso && (
        <ModalRecurso
          lote={loteParaRecurso}
          aoFechar={() => setLoteParaRecurso(null)}
          aoSalvarRecurso={salvarRecursoLote}
        />
      )}
    </div>
  );
}

export default App;
