import { useState, useRef, useEffect, type FormEvent } from 'react';
import {
  Check,
  X,
  UserPlus,
  Users,
  Lock,
  History,
  Printer,
  Plus,
  Trash2,
  FolderOpen,
  FileText,
  KeyRound,
  Copy,
  Search,
  Edit3
} from 'lucide-react';
import {
  ehProfissionalMedico,
  extrairGuiasDaConsulta,
  obterPlanosPorOperadora,
  type Atendimento,
  type DemandaFinanceira,
  type HistoricoValorAtendimento,
  type Operadora,
  type Paciente,
  type ProcedimentoAtendimento,
  type Profissional
} from '../data/dadosFaturamento';
import {
  formatarCPF,
  formatarMoeda,
  formatarTelefone
} from '../utils/formatadores';
import {
  imprimirGuiaTussAtendimento,
  imprimirTodasGuiasTussAtendimento
} from './ModalGuiaTuss';

interface ModalAtendimentoProps {
  atendimentoInicial: Atendimento | null;
  atendimentosExistentes?: Atendimento[];
  pacientes: Paciente[];
  medicos: Profissional[];
  operadoras: Operadora[];
  demandas?: DemandaFinanceira[];
  pacientePreSelecionadoId?: string;
  medicoPreSelecionadoId?: string;
  aoFechar: () => void;
  aoSalvarAtendimento: (dados: Omit<Atendimento, 'id'> & { id?: string }) => void;
  aoCadastrarPacienteRapido?: (dados: Omit<Paciente, 'id'>) => Paciente;
  aoVisualizarGuiaTuss?: (atendimento: Atendimento) => void;
  aoImprimirGuiaTuss?: (atendimento: Atendimento) => void;
}

const AVATAR_PADRAO_PACIENTE =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80';

function gerarProximoCodigoConsulta(atendimentos: Atendimento[]): string {
  const usados = new Set(atendimentos.map((a) => a.id.toUpperCase()));
  let sequencial = 1;
  while (usados.has(`CONS-${String(sequencial).padStart(4, '0')}`)) {
    sequencial++;
  }
  return `CONS-${String(sequencial).padStart(4, '0')}`;
}

function gerarProximoCodigoPacientePreview(pacientes: Paciente[]): string {
  const usados = new Set(pacientes.map((p) => p.id.toUpperCase()));
  let sequencial = 2001;
  while (usados.has(`PAC-${sequencial}`)) {
    sequencial++;
  }
  return `PAC-${sequencial}`;
}

export function ModalAtendimento({
  atendimentoInicial,
  atendimentosExistentes = [],
  pacientes,
  medicos,
  operadoras,
  demandas = [],
  pacientePreSelecionadoId,
  medicoPreSelecionadoId,
  aoFechar,
  aoSalvarAtendimento,
  aoCadastrarPacienteRapido,
  aoImprimirGuiaTuss
}: ModalAtendimentoProps) {
  const [abaAtiva, setAbaAtiva] = useState<'dados' | 'guias' | 'historico'>(
    'dados'
  );

  const apenasMedicos = medicos.filter(
    (m) =>
      ehProfissionalMedico(m.cargo) || m.id === atendimentoInicial?.medicoId
  );
  const listaMedicosFinal = apenasMedicos.length > 0 ? apenasMedicos : medicos;

  const modoEdicao = Boolean(atendimentoInicial);

  const [codigoConsultaGerado] = useState<string>(() =>
    atendimentoInicial?.id || gerarProximoCodigoConsulta(atendimentosExistentes)
  );

  const [codigoNovoPacientePreview] = useState<string>(() =>
    gerarProximoCodigoPacientePreview(pacientes)
  );

  // Verifica se a consulta já possui guia em lote Fechado, Enviado ou Reenviado
  const loteBloqueante = atendimentoInicial
    ? demandas.find(
      (lote) =>
        (lote.status === 'Fechado' ||
          lote.status === 'Enviado' ||
          lote.status === 'Reenviado') &&
        lote.guias.some(
          (g) =>
            g.atendimentoId === atendimentoInicial.id ||
            g.id === atendimentoInicial.numeroGuia
        )
    )
    : undefined;

  const bloqueadoPorLoteFechadoOuEnviado = Boolean(loteBloqueante);

  const [fichaAbertaParaEdicao, setFichaAbertaParaEdicao] = useState<boolean>(
    !modoEdicao
  );

  const camposDesabilitados =
    bloqueadoPorLoteFechadoOuEnviado || (modoEdicao && !fichaAbertaParaEdicao);

  // Controle de trava dos procedimentos ("Salvar Procedimentos" <-> "Editar Procedimentos")
  const [procedimentosSalvos, setProcedimentosSalvos] = useState<boolean>(
    modoEdicao
  );

  const procedimentosBloqueados = camposDesabilitados || procedimentosSalvos;

  function gerarNovoCodigoGuiaUnico(
    codigosJaUsadosLocalmente: string[] = []
  ): string {
    const usados = new Set<string>(codigosJaUsadosLocalmente);
    demandas.forEach((lote) => {
      lote.guias.forEach((g) => usados.add(g.id.toUpperCase()));
    });
    atendimentosExistentes.forEach((atd) => {
      if (atd.numeroGuia) usados.add(atd.numeroGuia.toUpperCase());
      (atd.procedimentos ?? []).forEach((p) => {
        if (p.numeroGuia) usados.add(p.numeroGuia.toUpperCase());
      });
    });
    if (atendimentoInicial?.numeroGuia) {
      usados.add(atendimentoInicial.numeroGuia.toUpperCase());
    }
    (atendimentoInicial?.procedimentos ?? []).forEach((p) => {
      if (p.numeroGuia) usados.add(p.numeroGuia.toUpperCase());
    });

    let candidatoNum = 220 + Math.floor(Math.random() * 700);
    while (usados.has(`G-${candidatoNum}`)) {
      candidatoNum++;
    }
    return `G-${candidatoNum}`;
  }

  const [guiaPrincipalBase] = useState<string>(() => {
    if (atendimentoInicial?.numeroGuia?.startsWith('G-')) {
      return atendimentoInicial.numeroGuia;
    }
    return gerarNovoCodigoGuiaUnico();
  });

  const [modoNovoPaciente, setModoNovoPaciente] = useState<boolean>(false);

  const pacienteInicialId =
    atendimentoInicial?.pacienteId ?? pacientePreSelecionadoId ?? '';

  const [pacienteId, setPacienteId] = useState<string>(pacienteInicialId);

  const [termoBuscaPaciente, setTermoBuscaPaciente] = useState<string>(() => {
    if (pacienteInicialId) {
      const pac = pacientes.find((p) => p.id === pacienteInicialId);
      if (pac) return `${pac.nome} ${pac.sobrenome}`.trim();
    }
    if (atendimentoInicial?.pacienteNome) {
      return atendimentoInicial.pacienteNome;
    }
    return '';
  });

  const [dropdownPacienteAberto, setDropdownPacienteAberto] =
    useState<boolean>(false);
  const autocompleteRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function fecharDropdownAoClicarFora(e: MouseEvent) {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(e.target as Node)
      ) {
        setDropdownPacienteAberto(false);
      }
    }
    document.addEventListener('mousedown', fecharDropdownAoClicarFora);
    return () =>
      document.removeEventListener('mousedown', fecharDropdownAoClicarFora);
  }, []);

  const [novoPacNome, setNovoPacNome] = useState<string>('');
  const [novoPacSobrenome, setNovoPacSobrenome] = useState<string>('');
  const [novoPacCpf, setNovoPacCpf] = useState<string>('');
  const [novoPacTelefone, setNovoPacTelefone] = useState<string>('');
  const [novoPacEmail, setNovoPacEmail] = useState<string>('');
  const novoPacCidade = 'São Paulo - SP';

  const [dataAtd, setDataAtd] = useState<string>(
    atendimentoInicial?.data ?? new Date().toISOString().slice(0, 10)
  );
  const [horaAtd, setHoraAtd] = useState<string>(
    atendimentoInicial?.hora || '09:30'
  );

  const operadoraInicial =
    atendimentoInicial?.operadora ?? (operadoras[0]?.nome || 'Particular');

  const [operadora, setOperadora] = useState<string>(operadoraInicial);

  const planosDisponiveis = obterPlanosPorOperadora(operadora, operadoras);

  const [plano, setPlano] = useState<string>(() => {
    if (atendimentoInicial?.plano) return atendimentoInicial.plano;
    const pacIni = pacientes.find((p) => p.id === pacienteInicialId);
    if (
      pacIni?.planoConvenio &&
      obterPlanosPorOperadora(operadoraInicial, operadoras).includes(
        pacIni.planoConvenio
      )
    ) {
      return pacIni.planoConvenio;
    }
    return obterPlanosPorOperadora(operadoraInicial, operadoras)[0] || '';
  });

  const [matricula, setMatricula] = useState<string>(() => {
    if (operadoraInicial === 'Particular') return '';
    if (atendimentoInicial?.matricula) return atendimentoInicial.matricula;
    const pacIni = pacientes.find((p) => p.id === pacienteInicialId);
    return pacIni?.numeroCarteirinha || '';
  });

  const [senhaAutorizacaoPadrao, setSenhaAutorizacaoPadrao] = useState<string>(
    () => {
      if (operadoraInicial === 'Particular') return '';
      return (
        atendimentoInicial?.senhaAutorizacao ||
        ''
      );
    }
  );

  const [medicoId, setMedicoId] = useState<string>(
    atendimentoInicial?.medicoId ??
    medicoPreSelecionadoId ??
    (listaMedicosFinal[0]?.id || '')
  );

  const procedimentosIniciais: ProcedimentoAtendimento[] =
    atendimentoInicial?.procedimentos &&
      atendimentoInicial.procedimentos.length > 0
      ? atendimentoInicial.procedimentos.map((p, idx) => ({
        ...p,
        numeroGuia: p.numeroGuia || guiaPrincipalBase,
        numeroGuiaOperadora:
          (atendimentoInicial?.operadora ?? '') === 'Particular'
            ? undefined
            : p.numeroGuiaOperadora ||
            atendimentoInicial?.numeroGuiaOperadora ||
            p.numeroGuia ||
            guiaPrincipalBase,
        senhaAutorizacao:
          (atendimentoInicial?.operadora ?? '') === 'Particular'
            ? undefined
            : p.senhaAutorizacao || atendimentoInicial?.senhaAutorizacao,
        desconto:
          (atendimentoInicial?.operadora ?? '') === 'Particular'
            ? p.desconto ??
            (idx === 0 ? (atendimentoInicial?.desconto ?? 0) : 0)
            : 0
      }))
      : [
        {
          id: `PROC-${Date.now()}-1`,
          codigoTuss: atendimentoInicial?.codigoTuss || '',
          descricao:
            atendimentoInicial?.descricao || '',
          valor: atendimentoInicial?.valor ?? 0,
          desconto:
            operadoraInicial === 'Particular'
              ? (atendimentoInicial?.desconto ?? 0)
              : 0,
          numeroGuia: guiaPrincipalBase,
          numeroGuiaOperadora:
            operadoraInicial === 'Particular'
              ? undefined
              : atendimentoInicial?.numeroGuiaOperadora || '',
          senhaAutorizacao:
            operadoraInicial === 'Particular'
              ? undefined
              : atendimentoInicial?.senhaAutorizacao || senhaAutorizacaoPadrao
        }
      ];

  const [procedimentos, setProcedimentos] = useState<ProcedimentoAtendimento[]>(
    procedimentosIniciais
  );

  const opcoesOperadoras = Array.from(
    new Set([...operadoras.map((o) => o.nome), 'Particular'])
  );

  const medicoSelecionadoForm = medicos.find((m) => m.id === medicoId);
  const pacienteSelecionadoForm = pacientes.find((p) => p.id === pacienteId);

  const pacientesFiltradosAutocomplete = pacientes.filter((pac) => {
    const termo = termoBuscaPaciente.trim().toLocaleLowerCase();
    if (!termo) return true;
    const nomeCompleto = `${pac.nome} ${pac.sobrenome}`.toLocaleLowerCase();
    const cpfLimpo = pac.cpf.replace(/\D/g, '');
    const termoNumeros = termo.replace(/\D/g, '');
    return (
      nomeCompleto.includes(termo) ||
      pac.id.toLocaleLowerCase().includes(termo) ||
      pac.cpf.toLocaleLowerCase().includes(termo) ||
      (termoNumeros.length > 0 && cpfLimpo.includes(termoNumeros))
    );
  });

  function selecionarPacienteAutocomplete(pac: Paciente) {
    setPacienteId(pac.id);
    setTermoBuscaPaciente(`${pac.nome} ${pac.sobrenome}`.trim());
    setDropdownPacienteAberto(false);

    if (!modoEdicao) {
      if (pac.convenioPadrao && opcoesOperadoras.includes(pac.convenioPadrao)) {
        const novaOp = pac.convenioPadrao;
        setOperadora(novaOp);
        const planosOp = obterPlanosPorOperadora(novaOp, operadoras);
        if (pac.planoConvenio && planosOp.includes(pac.planoConvenio)) {
          setPlano(pac.planoConvenio);
        } else {
          setPlano(planosOp[0] || '');
        }
        setMatricula(
          novaOp === 'Particular' ? '' : pac.numeroCarteirinha || ''
        );
      } else if (operadora !== 'Particular' && pac.numeroCarteirinha) {
        setMatricula(pac.numeroCarteirinha);
      }
    }
  }

  function sincronizarGuiasPorSenha(
    lista: ProcedimentoAtendimento[],
    opAtual: string
  ): ProcedimentoAtendimento[] {
    if (opAtual === 'Particular') {
      return lista.map((p) => ({
        ...p,
        senhaAutorizacao: undefined,
        numeroGuia: guiaPrincipalBase,
        numeroGuiaOperadora: guiaPrincipalBase,
        desconto: Math.max(0, Number(p.desconto) || 0)
      }));
    }

    const mapaSenhaParaGuia = new Map<string, string>();
    const guiasJaAlocadas: string[] = [guiaPrincipalBase];

    lista.forEach((p, idx) => {
      const chaveSenha = (
        p.senhaAutorizacao?.trim() || `SEM-SENHA-${idx + 1}`
      ).toUpperCase();
      if (!mapaSenhaParaGuia.has(chaveSenha) && p.numeroGuia?.startsWith('G-')) {
        const guiaCandidata = p.numeroGuia.toUpperCase();
        if (!Array.from(mapaSenhaParaGuia.values()).includes(guiaCandidata)) {
          mapaSenhaParaGuia.set(chaveSenha, guiaCandidata);
          guiasJaAlocadas.push(guiaCandidata);
        }
      }
    });

    return lista.map((p, idx) => {
      const senhaLimpa = p.senhaAutorizacao?.trim() || '';
      const chaveSenha = (senhaLimpa || `SEM-SENHA-${idx + 1}`).toUpperCase();

      let guiaDaSenha = mapaSenhaParaGuia.get(chaveSenha);
      if (!guiaDaSenha) {
        if (mapaSenhaParaGuia.size === 0) {
          guiaDaSenha = guiaPrincipalBase;
        } else {
          guiaDaSenha = gerarNovoCodigoGuiaUnico(guiasJaAlocadas);
        }
        mapaSenhaParaGuia.set(chaveSenha, guiaDaSenha);
        guiasJaAlocadas.push(guiaDaSenha);
      }

      return {
        ...p,
        senhaAutorizacao: p.senhaAutorizacao ?? '',
        numeroGuia: guiaDaSenha,
        desconto: 0
      };
    });
  }

  const procedimentosSincronizados = sincronizarGuiasPorSenha(
    procedimentos,
    operadora
  );

  const valorBrutoPreview = procedimentosSincronizados.reduce(
    (acc, item) => acc + (Number(item.valor) || 0),
    0
  );
  const descontoPreview =
    operadora === 'Particular'
      ? procedimentosSincronizados.reduce(
        (acc, item) => acc + Math.max(0, Number(item.desconto) || 0),
        0
      )
      : 0;
  const valorLiquidoPreview = Math.max(0, valorBrutoPreview - descontoPreview);

  const consultaPreview: Atendimento = {
    id: codigoConsultaGerado,
    numeroGuia: procedimentosSincronizados[0]?.numeroGuia || guiaPrincipalBase,
    numeroGuiaOperadora:
      operadora === 'Particular'
        ? guiaPrincipalBase
        : procedimentosSincronizados[0]?.numeroGuiaOperadora?.trim() ||
        procedimentosSincronizados[0]?.numeroGuia ||
        guiaPrincipalBase,
    senhaAutorizacao:
      operadora === 'Particular'
        ? undefined
        : procedimentosSincronizados[0]?.senhaAutorizacao ||
        senhaAutorizacaoPadrao,
    codigoTuss: procedimentosSincronizados[0]?.codigoTuss || '10101012',
    procedimentos: procedimentosSincronizados,
    pacienteId: modoNovoPaciente
      ? codigoNovoPacientePreview
      : pacienteSelecionadoForm?.id ||
      (modoEdicao ? atendimentoInicial?.pacienteId || '-' : '-'),
    pacienteNome: modoNovoPaciente
      ? `${novoPacNome} ${novoPacSobrenome}`.trim() || 'Novo Paciente'
      : pacienteSelecionadoForm
        ? `${pacienteSelecionadoForm.nome} ${pacienteSelecionadoForm.sobrenome}`
        : modoEdicao
          ? atendimentoInicial?.pacienteNome || '-'
          : 'Não selecionado',
    medicoId: medicoSelecionadoForm?.id || medicoId,
    medicoNome:
      medicoSelecionadoForm?.nome || atendimentoInicial?.medicoNome || 'Médico',
    especialidade:
      medicoSelecionadoForm?.especialidade ||
      medicoSelecionadoForm?.cargo ||
      atendimentoInicial?.especialidade ||
      'Clínica Médica',
    descricao:
      procedimentosSincronizados
        .map((p) => p.descricao.trim())
        .filter(Boolean)
        .join(' + ') || 'Consulta Médica',
    data: dataAtd,
    hora: horaAtd,
    operadora,
    plano,
    matricula: operadora === 'Particular' ? undefined : matricula,
    status: atendimentoInicial?.status || 'Realizado',
    valor: valorBrutoPreview,
    desconto: operadora === 'Particular' ? descontoPreview : undefined
  };

  const guiasDerivadasPreview = extrairGuiasDaConsulta(consultaPreview);

  function adicionarProcedimento() {
    if (procedimentosBloqueados) return;
    const senhaBase =
      operadora === 'Particular'
        ? undefined
        : '';

    const novoItem: ProcedimentoAtendimento = {
      id: `PROC-${Date.now()}-${procedimentos.length + 1}`,
      codigoTuss: '',
      descricao: '',
      valor: 0,
      desconto: 0,
      numeroGuiaOperadora: '',
      senhaAutorizacao: senhaBase
    };
    const novaLista = sincronizarGuiasPorSenha(
      [...procedimentos, novoItem],
      operadora
    );
    setProcedimentos(novaLista);
  }

  function removerProcedimento(idProc: string) {
    if (procedimentos.length <= 1 || procedimentosBloqueados) {
      return;
    }
    const novaLista = sincronizarGuiasPorSenha(
      procedimentos.filter((p) => p.id !== idProc),
      operadora
    );
    setProcedimentos(novaLista);
  }

  function atualizarProcedimento(
    idProc: string,
    campo: keyof Omit<ProcedimentoAtendimento, 'id'>,
    novoValorCampo: string | number
  ) {
    if (procedimentosBloqueados) return;
    const novaListaBruta = procedimentos.map((p) =>
      p.id === idProc ? { ...p, [campo]: novoValorCampo } : p
    );
    const novaLista = sincronizarGuiasPorSenha(novaListaBruta, operadora);
    setProcedimentos(novaLista);
  }

  function aplicarMesmaSenhaDoPrimeiro(idProc: string) {
    if (procedimentosBloqueados || operadora === 'Particular') return;
    const primeiroProc = procedimentosSincronizados[0];
    const senhaPrimeiro =
      primeiroProc?.senhaAutorizacao || senhaAutorizacaoPadrao;
    const guiaOpePrimeiro = primeiroProc?.numeroGuiaOperadora || '';
    const novaListaBruta = procedimentos.map((p) =>
      p.id === idProc
        ? {
          ...p,
          senhaAutorizacao: senhaPrimeiro,
          numeroGuiaOperadora: p.numeroGuiaOperadora?.trim()
            ? p.numeroGuiaOperadora
            : guiaOpePrimeiro
        }
        : p
    );
    setProcedimentos(sincronizarGuiasPorSenha(novaListaBruta, operadora));
  }

  function alternarSalvarProcedimentos() {
    if (camposDesabilitados) return;

    if (procedimentosSalvos) {
      setProcedimentosSalvos(false);
      return;
    }

    const algumSemDescricao = procedimentosSincronizados.some(
      (p) => !p.descricao.trim() || !p.codigoTuss.trim()
    );
    if (algumSemDescricao) {
      alert(
        'Preencha o Código TUSS e a Descrição de todos os procedimentos antes de salvar.'
      );
      return;
    }

    if (operadora !== 'Particular') {
      const algumSemSenha = procedimentosSincronizados.some(
        (p) => !p.senhaAutorizacao || !p.senhaAutorizacao.trim()
      );
      if (algumSemSenha) {
        alert(
          'Todo procedimento de operadora exige uma Senha de Autorização antes de salvar.'
        );
        return;
      }
    }

    // Se Guia Ope não for preenchido ao salvar, preenche automaticamente com a Guia da Empresa (numeroGuia)
    const procedimentosNormalizados = procedimentosSincronizados.map((p) => ({
      ...p,
      codigoTuss: p.codigoTuss.trim(),
      descricao: p.descricao.trim(),
      numeroGuiaOperadora:
        operadora === 'Particular'
          ? p.numeroGuia || guiaPrincipalBase
          : p.numeroGuiaOperadora?.trim() || p.numeroGuia || guiaPrincipalBase
    }));

    setProcedimentos(procedimentosNormalizados);
    setProcedimentosSalvos(true);
  }

  function submeterFormulario(evento: FormEvent) {
    evento.preventDefault();
    if (camposDesabilitados) return;

    const idMedFinal =
      modoEdicao && atendimentoInicial ? atendimentoInicial.medicoId : medicoId;
    const medObj =
      medicos.find((m) => m.id === idMedFinal) ?? listaMedicosFinal[0];

    if (operadora !== 'Particular') {
      const algumSemSenha = procedimentosSincronizados.some(
        (p) => !p.senhaAutorizacao || !p.senhaAutorizacao.trim()
      );
      if (algumSemSenha) {
        setAbaAtiva('dados');
        alert(
          'Todo procedimento de operadora exige uma Senha de Autorização emitida pela operadora!'
        );
        return;
      }
    }

    const procedimentosValidos = sincronizarGuiasPorSenha(
      procedimentosSincronizados
        .map((p) => {
          const guiaEmp = p.numeroGuia || guiaPrincipalBase;
          return {
            ...p,
            codigoTuss: p.codigoTuss.trim() || '10101012',
            descricao: p.descricao.trim(),
            valor: Number(p.valor) || 0,
            desconto:
              operadora === 'Particular'
                ? Math.max(0, Number(p.desconto) || 0)
                : 0,
            numeroGuia: guiaEmp,
            numeroGuiaOperadora:
              operadora === 'Particular'
                ? guiaEmp
                : p.numeroGuiaOperadora?.trim() || guiaEmp,
            senhaAutorizacao:
              operadora === 'Particular'
                ? undefined
                : p.senhaAutorizacao?.trim()
          };
        })
        .filter((p) => p.descricao.length > 0),
      operadora
    ).map((p) => ({
      ...p,
      numeroGuiaOperadora:
        operadora === 'Particular'
          ? p.numeroGuia || guiaPrincipalBase
          : p.numeroGuiaOperadora?.trim() || p.numeroGuia || guiaPrincipalBase
    }));

    const valorNum = procedimentosValidos.reduce(
      (acc, p) => acc + (Number(p.valor) || 0),
      0
    );
    const descNum =
      operadora === 'Particular'
        ? procedimentosValidos.reduce(
          (acc, p) => acc + Math.max(0, Number(p.desconto) || 0),
          0
        )
        : 0;

    const descricaoFinal = procedimentosValidos
      .map((p) => p.descricao)
      .join(' + ');
    const codigoTussPrincipal =
      procedimentosValidos[0]?.codigoTuss || '10101012';

    if (!medObj || !descricaoFinal || isNaN(valorNum) || valorNum <= 0) {
      setAbaAtiva('dados');
      alert(
        'Preencha todos os procedimentos e valores da consulta corretamente!'
      );
      return;
    }

    let pacFinal: Paciente | undefined;

    if (modoEdicao && atendimentoInicial) {
      pacFinal = pacientes.find((p) => p.id === atendimentoInicial.pacienteId);
    } else if (modoNovoPaciente && aoCadastrarPacienteRapido) {
      if (
        !novoPacNome.trim() ||
        !novoPacSobrenome.trim() ||
        !novoPacCpf.trim()
      ) {
        setAbaAtiva('dados');
        alert('Informe Nome, Sobrenome e CPF para cadastrar o novo paciente!');
        return;
      }
      pacFinal = aoCadastrarPacienteRapido({
        foto: AVATAR_PADRAO_PACIENTE,
        nome: novoPacNome.trim(),
        sobrenome: novoPacSobrenome.trim(),
        cpf: novoPacCpf.trim(),
        telefone: novoPacTelefone.trim() || '(11) 99999-0000',
        email: novoPacEmail.trim() || 'paciente@email.com.br',
        dataNascimento: '1990-01-01',
        endereco: 'Cadastro via Registro de Consulta',
        cidade: novoPacCidade.trim() || 'São Paulo - SP',
        convenioPadrao: operadora,
        planoConvenio: plano,
        numeroCarteirinha: operadora === 'Particular' ? undefined : matricula,
        observacoesClinicas:
          'Paciente cadastrado diretamente no registro de Consulta.'
      });
    } else {
      pacFinal = pacientes.find((p) => p.id === pacienteId);
    }

    const pacienteIdFinal =
      pacFinal?.id ?? (modoEdicao ? atendimentoInicial?.pacienteId ?? '' : '');
    const pacienteNomeFinal = pacFinal
      ? `${pacFinal.nome} ${pacFinal.sobrenome}`.trim()
      : modoEdicao
        ? (atendimentoInicial?.pacienteNome ?? '')
        : '';

    if (!pacienteIdFinal || !pacienteNomeFinal) {
      setAbaAtiva('dados');
      alert('Selecione um paciente na pesquisa ou cadastre um novo paciente!');
      return;
    }

    const historicoAtual: HistoricoValorAtendimento[] = [
      ...(atendimentoInicial?.historicoAlteracoes ?? [])
    ];

    if (atendimentoInicial) {
      const agora = new Date();
      const dataFormatada = agora.toLocaleDateString('pt-BR');
      const horaFormatada = agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const carimbo = `${dataFormatada} às ${horaFormatada}`;

      const procsAntigos = atendimentoInicial.procedimentos ?? [];
      const idsAntigos = new Set(procsAntigos.map((p) => p.id));
      const idsNovos = new Set(procedimentosValidos.map((p) => p.id));

      procedimentosValidos.forEach((procNovo) => {
        if (!idsAntigos.has(procNovo.id)) {
          historicoAtual.unshift({
            id: `HIST-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            dataHora: carimbo,
            descricaoAcao: `Inclusão do Procedimento TUSS ${procNovo.codigoTuss} (${procNovo.descricao}) — Guia Empresa ${procNovo.numeroGuia}${procNovo.numeroGuiaOperadora ? ` / Guia Operadora ${procNovo.numeroGuiaOperadora}` : ''}`,
            valorAnterior: atendimentoInicial.valor,
            valorNovo: valorNum,
            descontoAnterior: atendimentoInicial.desconto ?? 0,
            descontoNovo: descNum
          });
        } else {
          const antigo = procsAntigos.find((pa) => pa.id === procNovo.id);
          if (
            antigo &&
            (antigo.codigoTuss !== procNovo.codigoTuss ||
              antigo.descricao !== procNovo.descricao ||
              (antigo.senhaAutorizacao || '') !==
              (procNovo.senhaAutorizacao || '') ||
              (antigo.numeroGuiaOperadora || '') !==
              (procNovo.numeroGuiaOperadora || '') ||
              Math.abs((antigo.desconto ?? 0) - (procNovo.desconto ?? 0)) >
              0.009 ||
              Math.abs(antigo.valor - procNovo.valor) > 0.009)
          ) {
            historicoAtual.unshift({
              id: `HIST-${Date.now()}-${Math.floor(Math.random() * 999)}`,
              dataHora: carimbo,
              descricaoAcao: `Atualização do Procedimento TUSS ${procNovo.codigoTuss} (${procNovo.descricao}) — Guia Empresa ${procNovo.numeroGuia}`,
              valorAnterior: atendimentoInicial.valor,
              valorNovo: valorNum,
              descontoAnterior: atendimentoInicial.desconto ?? 0,
              descontoNovo: descNum
            });
          }
        }
      });

      procsAntigos.forEach((procAntigo) => {
        if (!idsNovos.has(procAntigo.id)) {
          historicoAtual.unshift({
            id: `HIST-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            dataHora: carimbo,
            descricaoAcao: `Exclusão do Procedimento TUSS ${procAntigo.codigoTuss} (${procAntigo.descricao})`,
            valorAnterior: atendimentoInicial.valor,
            valorNovo: valorNum,
            descontoAnterior: atendimentoInicial.desconto ?? 0,
            descontoNovo: descNum
          });
        }
      });

      const descAntigo = atendimentoInicial.desconto ?? 0;
      const mudouValor = Math.abs(atendimentoInicial.valor - valorNum) > 0.009;
      const mudouDesconto = Math.abs(descAntigo - descNum) > 0.009;

      if (
        (mudouValor || mudouDesconto) &&
        historicoAtual.length ===
        (atendimentoInicial.historicoAlteracoes?.length ?? 0)
      ) {
        historicoAtual.unshift({
          id: `HIST-${Date.now().toString().slice(-5)}`,
          dataHora: carimbo,
          descricaoAcao: 'Revisão Financeira da Conta do Paciente',
          valorAnterior: atendimentoInicial.valor,
          valorNovo: valorNum,
          descontoAnterior: descAntigo,
          descontoNovo: descNum
        });
      }
    }

    const guiaPrincipalSalva =
      procedimentosValidos[0]?.numeroGuia || guiaPrincipalBase;
    const guiaOperadoraPrincipalSalva =
      procedimentosValidos[0]?.numeroGuiaOperadora || guiaPrincipalSalva;
    const senhaPrincipalSalva =
      operadora === 'Particular'
        ? undefined
        : procedimentosValidos[0]?.senhaAutorizacao;

    aoSalvarAtendimento({
      id: codigoConsultaGerado,
      numeroGuia: guiaPrincipalSalva,
      numeroGuiaOperadora: guiaOperadoraPrincipalSalva,
      senhaAutorizacao: senhaPrincipalSalva,
      tipoAtendimento: atendimentoInicial?.tipoAtendimento,
      codigoTuss: codigoTussPrincipal,
      procedimentos: procedimentosValidos,
      pacienteId: pacienteIdFinal,
      pacienteNome: pacienteNomeFinal,
      medicoId: medObj.id,
      medicoNome: medObj.nome,
      especialidade: medObj.especialidade || medObj.cargo,
      descricao: descricaoFinal,
      data: dataAtd,
      hora: horaAtd || '09:00',
      operadora,
      plano,
      matricula: operadora === 'Particular' ? undefined : matricula.trim(),
      status: atendimentoInicial?.status || 'Realizado',
      valor: valorNum,
      desconto: operadora === 'Particular' ? descNum : undefined,
      historicoAlteracoes: historicoAtual
    });

    aoFechar();
  }

  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div
        className="modal-content modal-content-90"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>
              {atendimentoInicial
                ? `Gestão de Consulta e Faturamento`
                : 'Cadastrar Consulta'}
            </h3>
            <p
              style={{
                fontSize: '0.84rem',
                color: 'var(--text-secondary)',
                marginTop: '0.2rem'
              }}
            >
              {bloqueadoPorLoteFechadoOuEnviado
                ? `Registro bloqueado para edição pois possui guia vinculada ao lote ${loteBloqueante?.id} (${loteBloqueante?.status}).`
                : modoEdicao && !fichaAbertaParaEdicao
                  ? 'Registro fechado! Para realizar alterações, clique em "Abrir Registro".'
                  : 'Registrar a consulta, procedimentos realizados e emissão de guias para o faturamento.'}
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
            {modoEdicao &&
              !bloqueadoPorLoteFechadoOuEnviado &&
              !fichaAbertaParaEdicao && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setFichaAbertaParaEdicao(true)}
                  title="Habilitar edição dos dados e procedimentos desta consulta"
                >
                  <FolderOpen size={15} />
                  <span>Abrir Registro</span>
                </button>
              )}

            <button
              type="button"
              className="btn-icon-square"
              onClick={aoFechar}
              title="Fechar janela"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="lote-summary-strip">
          <div>
            <span className="strip-label">Código da Consulta</span>
            <strong style={{ color: '#778873' }}>{codigoConsultaGerado}</strong>
          </div>
          <div>
            <span className="strip-label">Código Paciente</span>
            <strong style={{ color: '#778873' }}>
              {modoNovoPaciente
                ? codigoNovoPacientePreview
                : pacienteSelecionadoForm?.id ||
                (modoEdicao ? atendimentoInicial?.pacienteId || '-' : '-')}
            </strong>
          </div>
          <div>
            <span className="strip-label">Nome do Paciente</span>
            <strong>
              {modoNovoPaciente
                ? `${novoPacNome} ${novoPacSobrenome}`.trim() || 'Novo Paciente'
                : pacienteSelecionadoForm
                  ? `${pacienteSelecionadoForm.nome} ${pacienteSelecionadoForm.sobrenome}`
                  : modoEdicao
                    ? (atendimentoInicial?.pacienteNome ?? '-')
                    : 'Não selecionado'}
            </strong>
          </div>
          <div>
            <span className="strip-label">Operadora</span>
            <strong>{operadora}</strong>
          </div>
          <div>
            <span className="strip-label">Nº Guias</span>
            <strong style={{ color: '#778873' }}>
              {guiasDerivadasPreview.length}
            </strong>
          </div>
          <div>
            <span className="strip-label">Valor Líquido</span>
            <strong style={{ color: 'var(--accent-color)' }}>
              {formatarMoeda(valorLiquidoPreview)}
            </strong>
          </div>
        </div>

        <div className="modal-abas">
          <button
            type="button"
            className={`modal-aba-btn ${abaAtiva === 'dados' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('dados')}
          >
            <FileText size={15} />
            <span>
              Dados da Consulta & Procedimentos (
              {procedimentosSincronizados.length})
            </span>
          </button>

          <button
            type="button"
            className={`modal-aba-btn ${abaAtiva === 'guias' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('guias')}
          >
            <KeyRound size={15} />
            <span>
              Guias de Consulta Geradas ({guiasDerivadasPreview.length})
            </span>
          </button>

          {modoEdicao && (
            <button
              type="button"
              className={`modal-aba-btn ${abaAtiva === 'historico' ? 'active' : ''}`}
              onClick={() => setAbaAtiva('historico')}
            >
              <History size={15} />
              <span>
                Valores & Histórico (
                {atendimentoInicial?.historicoAlteracoes?.length ?? 0})
              </span>
            </button>
          )}
        </div>

        <form
          onSubmit={submeterFormulario}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.05rem',
            flex: 1
          }}
        >
          {bloqueadoPorLoteFechadoOuEnviado && (
            <div className="alert-box alert-enviado">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600
                }}
              >
                <Lock size={15} />
                <span>
                  Consulta Vinculada ao Lote Corporativo {loteBloqueante?.id} (
                  {loteBloqueante?.status})
                </span>
              </div>
              <p style={{ fontSize: '0.83rem', marginTop: '0.2rem' }}>
                Esta consulta possui guia alocada em lote {loteBloqueante?.status}{' '}
                e encontra-se bloqueada para modificações financeiras.
              </p>
            </div>
          )}

          {abaAtiva === 'dados' && (
            <>
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
                  <strong>Dados do Paciente</strong>

                  {!modoEdicao && aoCadastrarPacienteRapido && (
                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                      <button
                        type="button"
                        className={`btn-realtime ${!modoNovoPaciente ? 'active' : ''}`}
                        onClick={() => setModoNovoPaciente(false)}
                      >
                        <Users size={14} />
                        <span>Paciente Cadastrado</span>
                      </button>

                      <button
                        type="button"
                        className={`btn-realtime ${modoNovoPaciente ? 'active' : ''}`}
                        onClick={() => setModoNovoPaciente(true)}
                      >
                        <UserPlus size={14} />
                        <span>Cadastrar Novo Paciente</span>
                      </button>
                    </div>
                  )}
                </div>

                {!modoNovoPaciente ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '0.5fr 0.5fr 2.15fr 1fr',
                      gap: '0.75rem',
                      alignItems: 'end'
                    }}
                  >
                    <div className="form-group">
                      <label>Registro</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="PAC-0000"
                        value={
                          pacienteSelecionadoForm?.id ||
                          (modoEdicao
                            ? atendimentoInicial?.pacienteId || ''
                            : '')
                        }
                        disabled
                      />
                    </div>
                    <div className="form-group">
                      <label>CPF</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="000.000.000-00"
                        value={pacienteSelecionadoForm?.cpf || ''}
                        disabled
                      />
                    </div>

                    <div className="form-group" ref={autocompleteRef}>
                      <label>Pesquisar Paciente (Nome, CPF ou Código)</label>
                      <div className="autocomplete-wrapper">
                        <div style={{ position: 'relative' }}>
                          <Search
                            size={15}
                            style={{
                              position: 'absolute',
                              left: '0.75rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--text-secondary)',
                              pointerEvents: 'none'
                            }}
                          />
                          <input
                            type="text"
                            className="form-input"
                            style={{
                              width: '100%',
                              paddingLeft: '2.25rem',
                              paddingRight:
                                termoBuscaPaciente &&
                                  !modoEdicao &&
                                  !pacientePreSelecionadoId
                                  ? '2rem'
                                  : '0.75rem'
                            }}
                            placeholder="Digite o nome, CPF ou código (ex: PAC-2001)..."
                            value={termoBuscaPaciente}
                            onFocus={() => {
                              if (!modoEdicao && !pacientePreSelecionadoId) {
                                setDropdownPacienteAberto(true);
                              }
                            }}
                            onChange={(e) => {
                              setTermoBuscaPaciente(e.target.value);
                              setDropdownPacienteAberto(true);
                              if (!e.target.value.trim()) {
                                setPacienteId('');
                              }
                            }}
                            disabled={
                              modoEdicao ||
                              Boolean(pacientePreSelecionadoId && !modoEdicao)
                            }
                            required={!modoNovoPaciente}
                          />
                          {termoBuscaPaciente &&
                            !modoEdicao &&
                            !pacientePreSelecionadoId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTermoBuscaPaciente('');
                                  setPacienteId('');
                                  setDropdownPacienteAberto(true);
                                }}
                                title="Limpar pesquisa de paciente"
                                style={{
                                  position: 'absolute',
                                  right: '0.5rem',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '0.15rem'
                                }}
                              >
                                <X size={14} />
                              </button>
                            )}
                        </div>

                        {dropdownPacienteAberto &&
                          !modoEdicao &&
                          !pacientePreSelecionadoId && (
                            <div className="autocomplete-dropdown">
                              {pacientesFiltradosAutocomplete.length === 0 ? (
                                <div className="autocomplete-empty">
                                  Nenhum paciente encontrado para &ldquo;
                                  {termoBuscaPaciente}&rdquo;.
                                </div>
                              ) : (
                                pacientesFiltradosAutocomplete.map((pac) => (
                                  <div
                                    key={pac.id}
                                    className="autocomplete-item"
                                    onClick={() =>
                                      selecionarPacienteAutocomplete(pac)
                                    }
                                  >
                                    <div>
                                      <strong>
                                        {pac.nome} {pac.sobrenome}
                                      </strong>
                                      <small style={{ display: 'block' }}>
                                        CPF: {pac.cpf} • Tel: {pac.telefone}
                                      </small>
                                    </div>
                                    <span className="badge badge-aberto">
                                      {pac.id}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Telefone Paciente</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="(00) 00000-0000"
                        value={pacienteSelecionadoForm?.telefone || ''}
                        disabled
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '0.8fr 1.2fr 1.2fr 1fr 1fr 1.2fr',
                      gap: '0.65rem'
                    }}
                  >
                    <div className="form-group">
                      <label>Registro</label>
                      <input
                        type="text"
                        className="form-input"
                        value={codigoNovoPacientePreview}
                        disabled
                      />
                    </div>

                    <div className="form-group">
                      <label>Nome do Paciente</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Lucas"
                        value={novoPacNome}
                        onChange={(e) => setNovoPacNome(e.target.value)}
                        required={modoNovoPaciente}
                      />
                    </div>

                    <div className="form-group">
                      <label>Sobrenome</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Mendonça"
                        value={novoPacSobrenome}
                        onChange={(e) => setNovoPacSobrenome(e.target.value)}
                        required={modoNovoPaciente}
                      />
                    </div>

                    <div className="form-group">
                      <label>CPF</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="000.000.000-00"
                        value={novoPacCpf}
                        onChange={(e) =>
                          setNovoPacCpf(formatarCPF(e.target.value))
                        }
                        required={modoNovoPaciente}
                      />
                    </div>

                    <div className="form-group">
                      <label>Telefone Paciente</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="(11) 99999-0000"
                        value={novoPacTelefone}
                        onChange={(e) =>
                          setNovoPacTelefone(formatarTelefone(e.target.value))
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>E-mail Corporativo / Pessoal</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="paciente@email.com"
                        value={novoPacEmail}
                        onChange={(e) => setNovoPacEmail(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Dados da Consulta (Fundo verde escuro nos campos para eficiência visual) */}
              <div className="consulta-dark-green-box">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.65rem'
                  }}
                >
                  <strong style={{ color: '#f0f6f0', fontSize: '0.92rem' }}>
                    Dados da Consulta
                  </strong>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      color: 'rgba(226, 238, 224, 0.8)'
                    }}
                  >
                    Integração de Agenda e Execução Clínica
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 0.85fr 1.6fr 1fr',
                    gap: '0.75rem'
                  }}
                >
                  <div className="form-group">
                    <label>Data da Consulta</label>
                    <input
                      type="date"
                      className="form-input"
                      value={dataAtd}
                      onChange={(e) => setDataAtd(e.target.value)}
                      disabled={camposDesabilitados}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Horário</label>
                    <input
                      type="time"
                      className="form-input"
                      value={horaAtd}
                      onChange={(e) => setHoraAtd(e.target.value)}
                      disabled={camposDesabilitados}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Médico Executante</label>
                    <select
                      className="form-input"
                      value={medicoId}
                      onChange={(e) => setMedicoId(e.target.value)}
                      disabled={modoEdicao || camposDesabilitados}
                      required
                    >
                      {listaMedicosFinal.map((med) => (
                        <option key={med.id} value={med.id}>
                          {med.nome} — {med.especialidade || med.cargo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    className="form-group"
                    title="Utilize Gwaan-Health para alterar o status de uma consulta"
                    style={{ cursor: 'help' }}
                  >
                    <label title="Utilize Gwaan-Health para alterar o status de uma consulta">
                      Status da Consulta
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={atendimentoInicial?.status || 'Realizado'}
                      disabled
                      readOnly
                      title="Utilize Gwaan-Health para alterar o status de uma consulta"
                      style={{ cursor: 'help' }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Dados da Operadora */}
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
                  <strong>Dados da Operadora e Elegibilidade</strong>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1.2fr 1fr',
                    gap: '0.75rem'
                  }}
                >
                  <div className="form-group">
                    <label>Operadora</label>
                    <select
                      className="form-input"
                      value={operadora}
                      onChange={(e) => {
                        const novaOp = e.target.value;
                        setOperadora(novaOp);
                        const novosPlanos = obterPlanosPorOperadora(
                          novaOp,
                          operadoras
                        );
                        setPlano(novosPlanos[0] || '');

                        if (novaOp === 'Particular') {
                          setMatricula('');
                          setSenhaAutorizacaoPadrao('');
                          setProcedimentos((ant) =>
                            sincronizarGuiasPorSenha(ant, 'Particular')
                          );
                        } else {
                          if (
                            !matricula &&
                            pacienteSelecionadoForm?.numeroCarteirinha
                          ) {
                            setMatricula(
                              pacienteSelecionadoForm.numeroCarteirinha
                            );
                          }
                          const novaSenha =
                            senhaAutorizacaoPadrao ||
                            `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
                          setSenhaAutorizacaoPadrao(novaSenha);
                          setProcedimentos((ant) =>
                            sincronizarGuiasPorSenha(
                              ant.map((p) => ({
                                ...p,
                                senhaAutorizacao:
                                  p.senhaAutorizacao || novaSenha
                              })),
                              novaOp
                            )
                          );
                        }
                      }}
                      disabled={camposDesabilitados}
                    >
                      {opcoesOperadoras.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Plano</label>
                    <select
                      className="form-input"
                      value={plano}
                      onChange={(e) => setPlano(e.target.value)}
                      disabled={camposDesabilitados}
                    >
                      {planosDisponiveis.map((pl) => (
                        <option key={pl} value={pl}>
                          {pl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Matrícula</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={
                        operadora === 'Particular'
                          ? 'Desabilitado para Particular'
                          : 'Nº da matrícula na operadora'
                      }
                      value={operadora === 'Particular' ? '' : matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      disabled={
                        operadora === 'Particular' || camposDesabilitados
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 4. Procedimentos */}
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
                  <div>
                    <strong>
                      Procedimentos e Codificação TUSS (
                      {procedimentosSincronizados.length})
                    </strong>
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.15rem'
                      }}
                    >
                      {operadora === 'Particular'
                        ? 'Atendimento Particular: consolidação automática em guia única com opção de desconto por procedimento.'
                        : 'Caso o campo Guia Ope não seja preenchido, o sistema assumirá automaticamente o código da Guia Empresa ao salvar.'}
                    </p>
                  </div>

                  {!camposDesabilitados && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                      }}
                    >
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={adicionarProcedimento}
                        disabled={procedimentosSalvos}
                        title={
                          procedimentosSalvos
                            ? 'Clique em "Editar Procedimentos" para adicionar novos itens'
                            : 'Adicionar procedimento à consulta'
                        }
                      >
                        <Plus size={15} />
                        <span>Procedimento</span>
                      </button>

                      <button
                        type="button"
                        className={
                          procedimentosSalvos ? 'btn-secondary' : 'btn-primary'
                        }
                        onClick={alternarSalvarProcedimentos}
                      >
                        {procedimentosSalvos ? (
                          <>
                            <Edit3 size={15} />
                            <span>Editar Procedimentos</span>
                          </>
                        ) : (
                          <>
                            <Check size={15} />
                            <span>Salvar Procedimentos</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  {procedimentosSincronizados.map((proc, index) => (
                    <div
                      key={proc.id}
                      className="procedimento-row-box"
                      style={{
                        gridTemplateColumns:
                          operadora === 'Particular'
                            ? '0.75fr 0.85fr 1.85fr 0.85fr 0.85fr auto'
                            : '0.7fr 0.85fr 0.8fr 1.45fr 1.2fr 0.8fr auto'
                      }}
                    >
                      {/* 1º Campo: Registro (coluna guia empresa) */}
                      <div className="form-group">
                        <label>Registro</label>
                        <input
                          type="text"
                          className="form-input"
                          value={proc.numeroGuia || guiaPrincipalBase}
                          disabled
                          style={{
                            fontWeight: 700,
                            color: '#778873'
                          }}
                        />
                      </div>

                      {/* 2º Campo (quando Operadora !== Particular): Guia Ope */}
                      {operadora !== 'Particular' && (
                        <div className="form-group">
                          <label>Guia Ope</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder={proc.numeroGuia || guiaPrincipalBase}
                            value={proc.numeroGuiaOperadora ?? ''}
                            onChange={(e) =>
                              atualizarProcedimento(
                                proc.id,
                                'numeroGuiaOperadora',
                                e.target.value
                              )
                            }
                            disabled={procedimentosBloqueados}
                            title="Código da guia fornecido pela operadora. Se deixado em branco ao salvar, será preenchido com a Guia Empresa."
                          />
                        </div>
                      )}

                      {/* 3º Campo: Código TUSS */}
                      <div className="form-group">
                        <label>Código TUSS</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="10101012"
                          value={proc.codigoTuss}
                          onChange={(e) =>
                            atualizarProcedimento(
                              proc.id,
                              'codigoTuss',
                              e.target.value
                            )
                          }
                          disabled={procedimentosBloqueados}
                          required
                        />
                      </div>

                      {/* Descrição do Procedimento */}
                      <div className="form-group">
                        <label>Procedimento #{index + 1}</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Descrição clínica do procedimento"
                          value={proc.descricao}
                          onChange={(e) =>
                            atualizarProcedimento(
                              proc.id,
                              'descricao',
                              e.target.value
                            )
                          }
                          disabled={procedimentosBloqueados}
                          required
                        />
                      </div>

                      {/* 4º Campo (quando Operadora !== Particular): Senha (somente botão "Mesma senha") */}
                      {operadora !== 'Particular' && (
                        <div className="form-group">
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <label>Senha</label>
                            {!procedimentosBloqueados && index > 0 && (
                              <button
                                type="button"
                                className="btn-realtime"
                                style={{
                                  padding: '0.1rem 0.35rem',
                                  fontSize: '0.7rem'
                                }}
                                onClick={() =>
                                  aplicarMesmaSenhaDoPrimeiro(proc.id)
                                }
                                title="Replicar a mesma senha do 1º procedimento"
                              >
                                <Copy size={11} />
                                <span>Mesma senha</span>
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ex: AUTH-884120"
                            value={proc.senhaAutorizacao ?? ''}
                            onChange={(e) =>
                              atualizarProcedimento(
                                proc.id,
                                'senhaAutorizacao',
                                e.target.value
                              )
                            }
                            disabled={procedimentosBloqueados}
                            required
                          />
                        </div>
                      )}

                      {/* 5º Campo: Valor */}
                      <div className="form-group">
                        <label>Valor (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input"
                          value={proc.valor}
                          onChange={(e) =>
                            atualizarProcedimento(
                              proc.id,
                              'valor',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={procedimentosBloqueados}
                          required
                        />
                      </div>

                      {/* 6º Campo (quando Particular): Desconto ao lado direito do campo valor */}
                      {operadora === 'Particular' && (
                        <div className="form-group">
                          <label>Desconto (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-input"
                            placeholder="0.00"
                            value={proc.desconto ?? 0}
                            onChange={(e) =>
                              atualizarProcedimento(
                                proc.id,
                                'desconto',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={procedimentosBloqueados}
                          />
                        </div>
                      )}

                      <div>
                        {procedimentosSincronizados.length > 1 &&
                          !procedimentosBloqueados && (
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => removerProcedimento(proc.id)}
                              title="Remover Procedimento"
                              style={{ height: '2.35rem', padding: '0 0.65rem' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {abaAtiva === 'guias' && (
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
                    Guias de Consulta Geradas ({guiasDerivadasPreview.length})
                  </strong>
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.15rem'
                    }}
                  >
                    Relação de guias consolidadas para faturamento hospitalar e
                    ambulatorial.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  disabled={!procedimentosSalvos}
                  onClick={() =>
                    imprimirTodasGuiasTussAtendimento(
                      guiasDerivadasPreview,
                      pacienteSelecionadoForm,
                      medicoSelecionadoForm
                    )
                  }
                  title={
                    procedimentosSalvos
                      ? 'Imprimir todas as guias geradas desta consulta de uma só vez'
                      : 'Salve os procedimentos na aba anterior para liberar a impressão das guias'
                  }
                >
                  <Printer size={15} />
                  <span>Imprimir todas</span>
                </button>
              </div>

              {!procedimentosSalvos && (
                <div className="alert-box alert-glosa">
                  <strong>Impressão Aguardando Confirmação:</strong> As guias só
                  podem ser impressas quando os procedimentos estiverem salvos.
                  Acesse a aba &ldquo;Dados da Consulta &amp; Procedimentos&rdquo;
                  e clique em <strong>Salvar Procedimentos</strong>.
                </div>
              )}

              <div className="table-container" style={{ marginTop: '0.35rem' }}>
                <table className="demandas-table">
                  <thead>
                    <tr>
                      <th>Código Guia Empresa</th>
                      <th>Código Guia Operadora</th>
                      <th>Senha</th>
                      <th>Valor</th>
                      <th style={{ textAlign: 'right' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guiasDerivadasPreview.map((guia) => {
                      const codigoGuiaOperadoraExibido =
                        operadora === 'Particular'
                          ? guia.numeroGuia
                          : guia.numeroGuiaOperadora || guia.numeroGuia;

                      const consultaDestaGuia: Atendimento = {
                        ...consultaPreview,
                        numeroGuia: guia.numeroGuia,
                        numeroGuiaOperadora: codigoGuiaOperadoraExibido,
                        senhaAutorizacao: guia.senhaAutorizacao,
                        codigoTuss: guia.codigoTussPrincipal,
                        descricao: guia.descricao,
                        valor: guia.valorTotal,
                        desconto: guia.desconto,
                        procedimentos: guia.procedimentos
                      };

                      return (
                        <tr key={guia.numeroGuia}>
                          <td>
                            <strong style={{ color: '#778873' }}>
                              {guia.numeroGuia}
                            </strong>
                            <small
                              style={{
                                display: 'block',
                                color: 'var(--text-secondary)',
                                fontSize: '0.75rem',
                                marginTop: '0.15rem'
                              }}
                            >
                              {guia.procedimentos.length} procedimento(s) •
                              Códigos TUSS:{' '}
                              <strong>
                                {guia.procedimentos
                                  .map((p) => p.codigoTuss)
                                  .join(', ')}
                              </strong>
                            </small>
                          </td>
                          <td>
                            <strong>{codigoGuiaOperadoraExibido}</strong>
                          </td>
                          <td>
                            {operadora === 'Particular' ? (
                              <span className="badge badge-pago">
                                Particular (Sem Senha)
                              </span>
                            ) : (
                              <span className="badge badge-enviado">
                                {guia.senhaAutorizacao || '-'}
                              </span>
                            )}
                          </td>
                          <td>
                            <strong style={{ color: 'var(--accent-color)' }}>
                              {formatarMoeda(guia.valorLiquido)}
                            </strong>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-outline"
                              disabled={!procedimentosSalvos}
                              onClick={() => {
                                if (aoImprimirGuiaTuss) {
                                  aoImprimirGuiaTuss(consultaDestaGuia);
                                } else {
                                  imprimirGuiaTussAtendimento(
                                    consultaDestaGuia,
                                    pacienteSelecionadoForm,
                                    medicoSelecionadoForm
                                  );
                                }
                              }}
                              title={
                                procedimentosSalvos
                                  ? `Imprimir guia ${guia.numeroGuia}`
                                  : 'Salve os procedimentos para habilitar a impressão'
                              }
                            >
                              <Printer size={14} />
                              <span>Imprimir</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legenda corporativa com quantidade de procedimentos e códigos */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <span>
                  <strong>Legenda de Procedimentos:</strong>{' '}
                  {procedimentosSincronizados.length} procedimento(s)
                  vinculado(s) em {guiasDerivadasPreview.length} guia(s)
                </span>
                <span>
                  <strong>Códigos TUSS:</strong>{' '}
                  {procedimentosSincronizados
                    .map((p) => p.codigoTuss)
                    .filter(Boolean)
                    .join(', ') || '-'}
                </span>
              </div>
            </div>
          )}

          {abaAtiva === 'historico' && modoEdicao && (
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
                <div>
                  <strong
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    <History size={16} color="#778873" />
                    <span>
                      Histórico de Alterações da Conta do Paciente (
                      {atendimentoInicial?.historicoAlteracoes?.length ?? 0})
                    </span>
                  </strong>
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.15rem'
                    }}
                  >
                    Rastreabilidade corporativa de auditoria e movimentações
                    realizadas na conta desta consulta.
                  </p>
                </div>
              </div>

              <div className="table-container" style={{ marginTop: '0.35rem' }}>
                <table className="demandas-table">
                  <thead>
                    <tr>
                      <th>Data e Hora</th>
                      <th>Registro de Alteração na Conta</th>
                      <th>Valor Anterior</th>
                      <th>Desconto Aplicado</th>
                      <th>Valor Atualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!atendimentoInicial?.historicoAlteracoes ||
                      atendimentoInicial.historicoAlteracoes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                            padding: '2rem'
                          }}
                        >
                          Nenhuma alteração registrada na conta desta consulta
                          até o momento.
                        </td>
                      </tr>
                    ) : (
                      atendimentoInicial.historicoAlteracoes.map((reg) => (
                        <tr key={reg.id}>
                          <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                            {reg.dataHora}
                          </td>
                          <td>
                            {reg.descricaoAcao ||
                              'Atualização financeira na conta da consulta'}
                          </td>
                          <td>{formatarMoeda(reg.valorAnterior)}</td>
                          <td>
                            {reg.descontoNovo > 0
                              ? formatarMoeda(reg.descontoNovo)
                              : '-'}
                          </td>
                          <td>
                            <strong style={{ color: 'var(--accent-color)' }}>
                              {formatarMoeda(
                                Math.max(0, reg.valorNovo - reg.descontoNovo)
                              )}
                            </strong>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: 'auto' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={aoFechar}
            >
              Fechar
            </button>

            {modoEdicao &&
              !bloqueadoPorLoteFechadoOuEnviado &&
              !fichaAbertaParaEdicao && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setFichaAbertaParaEdicao(true)}
                >
                  <FolderOpen size={16} />
                  <span>Abrir Ficha para Alterações</span>
                </button>
              )}

            {!camposDesabilitados && (
              <button type="submit" className="btn-primary">
                <Check size={16} />
                <span>
                  {atendimentoInicial
                    ? 'Salvar Alterações'
                    : 'Registrar Consulta'}
                </span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
