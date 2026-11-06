import { useState, useEffect } from 'react';
import {
  OPERADORAS_PADRAO,
  DEMANDAS_INICIAIS,
  GUIAS_PARTICULARES_INICIAIS,
  LOTES_PARTICULARES_ARQUIVADOS_INICIAIS,
  PROFISSIONAIS_INICIAIS,
  PACIENTES_INICIAIS,
  ATENDIMENTOS_INICIAIS,
  REGRAS_GESTAO_PADRAO,
  PREFERENCIAS_PADRAO,
  aplicarCancelamentoAutomaticoAtendimentos,
  extrairGuiasDaConsulta,
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
  type TipoGlosaLote,
  type HistoricoAlteracaoLote,
  type Profissional,
  type Paciente,
  type Atendimento,
  type StatusAtendimento,
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
import { RelatoriosPage } from './pages/RelatoriosPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import './index.css';

const CHAVE_DEMANDAS = 'gwaan_demandas_v8';
const CHAVE_OPERADORAS = 'gwaan_operadoras_v4';
const CHAVE_GUIAS_PARTICULARES = 'gwaan_guias_particulares_v8';
const CHAVE_LOTES_PARTICULARES = 'gwaan_lotes_particulares_v8';
const CHAVE_PROFISSIONAIS = 'gwaan_profissionais_v5';
const CHAVE_PACIENTES = 'gwaan_pacientes_v8';
const CHAVE_ATENDIMENTOS = 'gwaan_atendimentos_v8';
const CHAVE_GUIAS_EXTRAS = 'gwaan_guias_extras_v8';
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
  const [guiasExtrasCriadas, setGuiasExtrasCriadas] = useState<GuiaLote[]>(() =>
    lerLocalStorage(CHAVE_GUIAS_EXTRAS, [])
  );
  const [regrasGestao, setRegrasGestao] = useState<RegrasGestao>(() =>
    lerLocalStorage(CHAVE_REGRAS, REGRAS_GESTAO_PADRAO)
  );
  const [preferencias, setPreferencias] = useState<PreferenciasSistema>(() =>
    lerLocalStorage(CHAVE_PREFERENCIAS, PREFERENCIAS_PADRAO)
  );

  const [modalLoteAberto, setModalLoteAberto] = useState<boolean>(false);
  const [loteSelecionadoId, setLoteSelecionadoId] = useState<string | null>(null);
  const [loteParaRecurso, setLoteParaRecurso] = useState<DemandaFinanceira | null>(
    null
  );

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
    salvarLocalStorageSeguro(CHAVE_GUIAS_EXTRAS, guiasExtrasCriadas);
  }, [guiasExtrasCriadas]);

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

  function obterTodosCodigosLotes(
    listaDemandas = demandas,
    listaLotesParticulares = lotesParticularesArquivados
  ): string[] {
    return [
      ...listaDemandas.map((d) => d.id),
      ...listaLotesParticulares.map((l) => l.id)
    ];
  }

  function obterTodosCodigosGuias(
    listaAtendimentos = atendimentos,
    listaGuiasExtras = guiasExtrasCriadas,
    listaDemandas = demandas,
    listaGuiasPart = guiasParticulares
  ): string[] {
    const ids: string[] = [];
    for (const a of listaAtendimentos) {
      if (a.numeroGuia) ids.push(a.numeroGuia);
      for (const p of a.procedimentos ?? []) {
        if (p.numeroGuia) ids.push(p.numeroGuia);
      }
      for (const gd of extrairGuiasDaConsulta(a)) {
        ids.push(gd.numeroGuia);
      }
    }
    for (const ge of listaGuiasExtras) ids.push(ge.id);
    for (const d of listaDemandas) {
      for (const g of d.guias ?? []) ids.push(g.id);
    }
    for (const gp of listaGuiasPart) ids.push(gp.id);
    return ids;
  }

  function atribuirCodigosFaturaParaGuias(
    guiasAlvo: GuiaLote[],
    listaDemandas: DemandaFinanceira[]
  ): GuiaLote[] {
    const usados = new Set<string>();
    for (const d of listaDemandas) {
      for (const g of d.guias ?? []) {
        if (g.faturaId) usados.add(g.faturaId.toUpperCase());
      }
    }
    for (const g of guiasAlvo) {
      if (g.faturaId) usados.add(g.faturaId.toUpperCase());
    }

    let proximoNumero = 1001;
    for (const cod of usados) {
      const m = cod.match(/^FAT-(\d+)$/i);
      if (m) {
        const n = Number(m[1]);
        if (n >= proximoNumero) proximoNumero = n + 1;
      }
    }

    return guiasAlvo.map((g) => {
      if (g.faturaId && g.faturaId.trim()) return g;
      while (usados.has(`FAT-${proximoNumero}`)) {
        proximoNumero++;
      }
      const novoFaturaId = `FAT-${proximoNumero}`;
      usados.add(novoFaturaId);
      proximoNumero++;
      return {
        ...g,
        faturaId: novoFaturaId
      };
    });
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

    const mantemFaturas =
      statusDestino === 'Fechado' ||
      statusDestino === 'Enviado' ||
      statusDestino === 'Glosado' ||
      statusDestino === 'Reenviado';

    setDemandas((listaAnterior) =>
      listaAnterior.map((item) => {
        if (item.id !== idAlvo) return item;
        const guiasAtualizadas = mantemFaturas
          ? atribuirCodigosFaturaParaGuias(item.guias ?? [], listaAnterior)
          : (item.guias ?? []).map((g) => ({ ...g, faturaId: undefined }));

        const codigosFat = guiasAtualizadas
          .map((g) => g.faturaId)
          .filter(Boolean)
          .join(', ');

        const novoEvento: HistoricoAlteracaoLote = {
          id: `HL-${Date.now()}`,
          dataHora: dataHoraFormatada,
          acao: `Alteração de Status para ${statusDestino}`,
          detalhes: `Status do lote alterado de ${item.status} para ${statusDestino}${
            mantemFaturas && codigosFat ? ` (Faturas: ${codigosFat})` : ''
          }.`
        };
        return {
          ...item,
          guias: guiasAtualizadas,
          status: statusDestino,
          dataAlteracaoOuEnvio: agoraISO,
          atualizadoHa: agoraISO,
          faturasEmitidas: mantemFaturas,
          faturasEmitidasEm: mantemFaturas
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
  }) {
    const somaGuias = dados.guias.reduce((acc, g) => acc + g.valor, 0);
    const possuiFaturasEmitidas =
      dados.status === 'Fechado' ||
      dados.status === 'Enviado' ||
      dados.status === 'Glosado' ||
      dados.status === 'Reenviado';

    const guiasFinais = possuiFaturasEmitidas
      ? atribuirCodigosFaturaParaGuias(dados.guias, demandas)
      : dados.guias.map((g) => ({ ...g, faturaId: undefined }));

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
                horaCriacao: dados.horaCriacao || item.horaCriacao,
                dataAlteracaoOuEnvio: dados.dataAlteracaoOuEnvio,
                valor: somaGuias,
                status: dados.status,
                prioridade: dados.prioridade,
                guias: guiasFinais,
                codigoEnvioOperadora: dados.codigoEnvioOperadora,
                codigoReenvioOperadora: dados.codigoReenvioOperadora,
                observacoes: dados.observacoes,
                historicoLote: dados.historicoLote,
                faturasEmitidas: possuiFaturasEmitidas,
                faturasEmitidasEm: dados.faturasEmitidasEm,
                motivoUltimaExclusaoFatura: dados.motivoUltimaExclusaoFatura,
                atualizadoHa: dados.dataAlteracaoOuEnvio
              }
            : item
        )
      );
      setLoteSelecionadoId(dados.id);
    } else {
      const todosCodigosLote = obterTodosCodigosLotes();
      const idNovo =
        dados.codigoCustomizado &&
        !todosCodigosLote.includes(dados.codigoCustomizado)
          ? dados.codigoCustomizado
          : gerarIdUnico('LOTE', todosCodigosLote);

      const novoLote: DemandaFinanceira = {
        id: idNovo,
        operadora: dados.operadora,
        descricao: dados.descricao,
        tipoAtendimento: dados.tipoAtendimento,
        dataCriacao: dados.dataCriacao,
        horaCriacao: dados.horaCriacao,
        dataAlteracaoOuEnvio: dados.dataAlteracaoOuEnvio,
        valor: somaGuias,
        status: dados.status,
        prioridade: dados.prioridade,
        guias: guiasFinais,
        codigoEnvioOperadora: dados.codigoEnvioOperadora,
        codigoReenvioOperadora: dados.codigoReenvioOperadora,
        observacoes: dados.observacoes,
        historicoLote: dados.historicoLote,
        faturasEmitidas: possuiFaturasEmitidas,
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

  function salvarRecursoLote(
    idLote: string,
    dadosGlosa: {
      tipoGlosa: TipoGlosaLote;
      motivo: string;
      justificativaRecurso: string;
    }
  ) {
    const horarioAtual = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    const dataHoraFormatada = `${dataHoje} às ${horarioAtual}`;
    const agoraISO = new Date().toISOString();

    setDemandas((listaAnterior) =>
      listaAnterior.map((item) => {
        if (item.id !== idLote) return item;
        const novoEvento: HistoricoAlteracaoLote = {
          id: `HL-${Date.now()}`,
          dataHora: dataHoraFormatada,
          acao: `Tratamento de Glosa (${dadosGlosa.tipoGlosa})`,
          detalhes: `Motivo: ${dadosGlosa.motivo}${
            dadosGlosa.justificativaRecurso
              ? ` | Providência: ${dadosGlosa.justificativaRecurso}`
              : ''
          }`
        };

        return {
          ...item,
          status: item.status === 'Reenviado' ? 'Reenviado' : 'Glosado',
          recurso: {
            tipoGlosa: dadosGlosa.tipoGlosa,
            motivo: dadosGlosa.motivo,
            justificativaRecurso: dadosGlosa.justificativaRecurso,
            dataAbertura: dataHoraFormatada
          },
          historicoLote: [novoEvento, ...(item.historicoLote ?? [])],
          dataAlteracaoOuEnvio: agoraISO,
          atualizadoHa: agoraISO
        };
      })
    );

    setLoteParaRecurso(null);
  }

  function criarNovaGuiaTussParaAtendimento(novaGuia: GuiaLote) {
    setGuiasExtrasCriadas((ant) => [novaGuia, ...ant]);
  }

  function editarGuiaTussConsolidada(
    guiaId: string,
    dados: {
      codigoTuss: string;
      descricao: string;
      valor: number;
      senhaAutorizacao?: string;
    }
  ) {
    setAtendimentos((ant) =>
      aplicarCancelamentoAutomaticoAtendimentos(
        ant.map((atd) => {
          const guiasDerivadas = extrairGuiasDaConsulta(atd);
          const guiaAlvo = guiasDerivadas.find((gd) => gd.numeroGuia === guiaId);
          if (!guiaAlvo && atd.id !== guiaId && atd.numeroGuia !== guiaId) {
            return atd;
          }

          if (guiaAlvo && atd.procedimentos && atd.procedimentos.length > 0 && guiasDerivadas.length > 1) {
            const idsProcsGuia = new Set(guiaAlvo.procedimentos.map((p) => p.id));
            const novosProcs = atd.procedimentos.map((p) => {
              if (!idsProcsGuia.has(p.id)) return p;
              return {
                ...p,
                senhaAutorizacao: dados.senhaAutorizacao || p.senhaAutorizacao,
                numeroGuia: guiaId
              };
            });
            return {
              ...atd,
              procedimentos: novosProcs
            };
          }

          return {
            ...atd,
            codigoTuss: dados.codigoTuss,
            senhaAutorizacao: dados.senhaAutorizacao || atd.senhaAutorizacao,
            descricao: dados.descricao,
            valor: dados.valor
          };
        })
      ).listaAtualizada
    );

    setGuiasExtrasCriadas((ant) =>
      ant.map((ge) =>
        ge.id === guiaId
          ? {
              ...ge,
              codigoTuss: dados.codigoTuss,
              senhaAutorizacao: dados.senhaAutorizacao || ge.senhaAutorizacao,
              procedimento: dados.descricao,
              valor: dados.valor
            }
          : ge
      )
    );

    setDemandas((ant) =>
      ant.map((lote) => {
        const possui = lote.guias.some((g) => g.id === guiaId);
        if (!possui) return lote;
        const novasGuias = lote.guias.map((g) =>
          g.id === guiaId
            ? {
                ...g,
                codigoTuss: dados.codigoTuss,
                senhaAutorizacao: dados.senhaAutorizacao || g.senhaAutorizacao,
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
    setGuiasExtrasCriadas((ant) => ant.filter((ge) => ge.id !== guiaId));

    setDemandas((ant) =>
      ant.map((lote) => {
        const possui = lote.guias.some((g) => g.id === guiaId);
        if (!possui) return lote;
        return {
          ...lote,
          guias: lote.guias.map((g) =>
            g.id === guiaId ? { ...g, statusGuia: 'Cancelada' } : g
          )
        };
      })
    );
  }

  function excluirGuiaTussConsolidada(guiaId: string) {
    if (!pedirConfirmacaoExclusao(`Deseja realmente excluir a guia ${guiaId}?`)) {
      return;
    }

    setAtendimentos((ant) => {
      const novaLista: Atendimento[] = [];
      for (const atd of ant) {
        const guiasDerivadas = extrairGuiasDaConsulta(atd);
        const guiaAlvo = guiasDerivadas.find((gd) => gd.numeroGuia === guiaId);
        if (!guiaAlvo && atd.id !== guiaId && atd.numeroGuia !== guiaId) {
          novaLista.push(atd);
          continue;
        }
        if (guiaAlvo && guiasDerivadas.length > 1 && atd.procedimentos) {
          const idsRemover = new Set(guiaAlvo.procedimentos.map((p) => p.id));
          const procsRestantes = atd.procedimentos.filter((p) => !idsRemover.has(p.id));
          if (procsRestantes.length > 0) {
            const novoBruto = procsRestantes.reduce((s, p) => s + p.valor, 0);
            novaLista.push({
              ...atd,
              procedimentos: procsRestantes,
              numeroGuia: procsRestantes[0]?.numeroGuia || atd.numeroGuia,
              senhaAutorizacao: procsRestantes[0]?.senhaAutorizacao || atd.senhaAutorizacao,
              codigoTuss: procsRestantes.map((p) => p.codigoTuss).join(' + '),
              descricao: procsRestantes.map((p) => p.descricao).join(' + '),
              valor: novoBruto
            });
          }
        }
      }
      return novaLista;
    });
    setGuiasExtrasCriadas((ant) => ant.filter((ge) => ge.id !== guiaId));

    setDemandas((ant) =>
      ant.map((lote) => {
        const possui = lote.guias.some((g) => g.id === guiaId);
        if (!possui) return lote;
        const novasGuias = lote.guias.filter((g) => g.id !== guiaId);
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
      if (
        guiaExistente?.status === 'Pago' ||
        guiaExistente?.status === 'Fechado'
      ) {
        alert(
          `Guias particulares com status "${guiaExistente.status}" estão bloqueadas e não podem sofrer alterações!`
        );
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
        id: gerarIdUnico('G', obterTodosCodigosGuias(), 5000, 9999),
        atualizadoEm: agoraISO
      };
      setGuiasParticulares((listaAnterior) => [novaGuia, ...listaAnterior]);
    }
  }

  function alterarStatusGuiaParticular(idAlvo: string, novoStatus: StatusParticular) {
    const guiaExistente = guiasParticulares.find((g) => g.id === idAlvo);
    if (guiaExistente?.status === 'Pago' || guiaExistente?.status === 'Fechado') {
      alert(
        `Guias particulares com status "${guiaExistente.status}" não permitem nenhuma alteração!`
      );
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
    const guiaExistente = guiasParticulares.find((g) => g.id === idAlvo);
    if (guiaExistente?.status === 'Pago' || guiaExistente?.status === 'Fechado') {
      alert(
        `Guias particulares com status "${guiaExistente.status}" estão bloqueadas e não podem ser excluídas!`
      );
      return;
    }
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
      'LOTE',
      obterTodosCodigosLotes(),
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
    const jaExiste = Boolean(
      dados.id && atendimentos.some((a) => a.id === dados.id)
    );

    if (jaExiste && dados.id) {
      const consultaAtualizada: Atendimento = { ...dados, id: dados.id };
      const guiasDerivadas = extrairGuiasDaConsulta(consultaAtualizada);
      const mapaGuias = new Map(guiasDerivadas.map((gd) => [gd.numeroGuia, gd]));

      setAtendimentos((listaAnterior) =>
        aplicarCancelamentoAutomaticoAtendimentos(
          listaAnterior.map((a) =>
            a.id === dados.id ? consultaAtualizada : a
          )
        ).listaAtualizada
      );

      // Atualiza também guias vinculadas em lotes abertos/pendentes/glosados
      setDemandas((ant) =>
        ant.map((lote) => {
          if (
            lote.status === 'Fechado' ||
            lote.status === 'Enviado' ||
            lote.status === 'Reenviado'
          ) {
            return lote;
          }
          const possui = lote.guias.some(
            (g) =>
              g.atendimentoId === dados.id ||
              mapaGuias.has(g.id) ||
              (dados.numeroGuia && g.id === dados.numeroGuia)
          );
          if (!possui) return lote;
          const novasGuias = lote.guias.map((g) => {
            const gd =
              mapaGuias.get(g.id) ||
              (g.atendimentoId === dados.id && guiasDerivadas.length === 1
                ? guiasDerivadas[0]
                : undefined);
            if (!gd) return g;
            return {
              ...g,
              id: gd.numeroGuia,
              numeroGuiaOperadora: gd.numeroGuiaOperadora || gd.numeroGuia,
              senhaAutorizacao:
                dados.operadora === 'Particular'
                  ? undefined
                  : gd.senhaAutorizacao || g.senhaAutorizacao,
              codigoTuss: gd.codigoTuss,
              procedimento: gd.descricao,
              procedimentos: gd.procedimentos,
              valor: gd.valorLiquido
            };
          });
          const novoTotal = novasGuias.reduce((acc, g) => acc + g.valor, 0);
          return {
            ...lote,
            guias: novasGuias,
            valor: novoTotal
          };
        })
      );
    } else {
      const novoId =
        dados.id && !atendimentos.some((a) => a.id === dados.id)
          ? dados.id
          : gerarIdUnico(
              'CONS',
              atendimentos.map((a) => a.id),
              910,
              9999
            );
      const guiasExistentes = obterTodosCodigosGuias();
      const numeroGuiaPrincipal =
        dados.numeroGuia && !guiasExistentes.includes(dados.numeroGuia)
          ? dados.numeroGuia
          : gerarIdUnico('G', guiasExistentes, 5000, 9999);
      const numeroGuiaOperadoraFinal =
        dados.numeroGuiaOperadora?.trim() || numeroGuiaPrincipal;

      const novoAtd: Atendimento = {
        ...dados,
        id: novoId,
        numeroGuia: numeroGuiaPrincipal,
        numeroGuiaOperadora: numeroGuiaOperadoraFinal,
        senhaAutorizacao:
          dados.operadora === 'Particular'
            ? undefined
            : dados.senhaAutorizacao ||
              `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'Realizado'
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
    if (
      !pedirConfirmacaoExclusao(
        'Deseja realmente excluir este lançamento de produção?'
      )
    )
      return;
    setAtendimentos((listaAnterior) =>
      listaAnterior.filter((a) => a.id !== idAlvo)
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
      guiasExtrasCriadas,
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
            guiasExtrasCriadas={guiasExtrasCriadas}
            pacientes={pacientes}
            medicos={profissionais}
            operadoras={operadoras}
            aoCriarNovaGuiaTuss={criarNovaGuiaTussParaAtendimento}
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
            demandas={demandas}
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
          demandas={demandas}
          guiasExtrasCriadas={guiasExtrasCriadas}
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
