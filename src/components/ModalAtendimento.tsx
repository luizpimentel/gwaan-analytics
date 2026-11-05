import { useState, type FormEvent } from 'react';
import {
  Check,
  X,
  UserPlus,
  Users,
  Lock,
  History,
  Eye,
  Printer,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import {
  ehProfissionalMedico,
  type Atendimento,
  type HistoricoValorAtendimento,
  type Operadora,
  type Paciente,
  type ProcedimentoAtendimento,
  type Profissional,
  type StatusAtendimento
} from '../data/dadosFaturamento';
import {
  formatarCPF,
  formatarDataBR,
  formatarMoeda,
  formatarTelefone
} from '../utils/formatadores';

interface ModalAtendimentoProps {
  atendimentoInicial: Atendimento | null;
  pacientes: Paciente[];
  medicos: Profissional[];
  operadoras: Operadora[];
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

export function ModalAtendimento({
  atendimentoInicial,
  pacientes,
  medicos,
  operadoras,
  pacientePreSelecionadoId,
  medicoPreSelecionadoId,
  aoFechar,
  aoSalvarAtendimento,
  aoCadastrarPacienteRapido,
  aoVisualizarGuiaTuss,
  aoImprimirGuiaTuss
}: ModalAtendimentoProps) {
  const apenasMedicos = medicos.filter(
    (m) =>
      ehProfissionalMedico(m.cargo) || m.id === atendimentoInicial?.medicoId
  );
  const listaMedicosFinal = apenasMedicos.length > 0 ? apenasMedicos : medicos;

  const modoEdicao = Boolean(atendimentoInicial);
  const statusOriginal = atendimentoInicial?.status ?? null;

  const ehConfirmadoOuRealizado =
    statusOriginal === 'Confirmado' || statusOriginal === 'Realizado';
  const ehRealizado = statusOriginal === 'Realizado';
  const ehCancelado = statusOriginal === 'Cancelado';

  const bloqueiaPacienteEMedico = ehConfirmadoOuRealizado || ehCancelado;
  const bloqueiaValorEDesconto = ehRealizado || ehCancelado;
  const bloqueiaCamposGeraisPorCancelado = ehCancelado;

  const [modoNovoPaciente, setModoNovoPaciente] = useState<boolean>(false);
  const [pacienteId, setPacienteId] = useState<string>(
    atendimentoInicial?.pacienteId ??
      pacientePreSelecionadoId ??
      (pacientes[0]?.id || '')
  );

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
  const [operadora, setOperadora] = useState<string>(
    atendimentoInicial?.operadora ?? (operadoras[0]?.nome || 'Particular')
  );
  const [status, setStatus] = useState<StatusAtendimento>(
    atendimentoInicial?.status ?? 'Agendado'
  );
  const [medicoId, setMedicoId] = useState<string>(
    atendimentoInicial?.medicoId ??
      medicoPreSelecionadoId ??
      (listaMedicosFinal[0]?.id || '')
  );

  const procedimentosIniciais: ProcedimentoAtendimento[] =
    atendimentoInicial?.procedimentos && atendimentoInicial.procedimentos.length > 0
      ? atendimentoInicial.procedimentos
      : [
          {
            id: `PROC-${Date.now()}-1`,
            codigoTuss: atendimentoInicial?.codigoTuss || '10101012',
            descricao: atendimentoInicial?.descricao || '',
            valor: atendimentoInicial?.valor ?? 650
          }
        ];

  const [procedimentos, setProcedimentos] = useState<ProcedimentoAtendimento[]>(
    procedimentosIniciais
  );
  const [valor, setValor] = useState<string>(
    atendimentoInicial ? String(atendimentoInicial.valor) : '650'
  );
  const [desconto, setDesconto] = useState<string>(
    atendimentoInicial ? String(atendimentoInicial.desconto ?? 0) : '0'
  );

  const opcoesOperadoras = Array.from(
    new Set([...operadoras.map((o) => o.nome), 'Particular'])
  );

  const medicoSelecionadoForm = medicos.find((m) => m.id === medicoId);
  const pacienteSelecionadoForm = pacientes.find((p) => p.id === pacienteId);

  const valorBrutoPreview = parseFloat(valor) || 0;
  const descontoPreview =
    operadora === 'Particular' ? Math.max(0, parseFloat(desconto) || 0) : 0;
  const valorLiquidoPreview = Math.max(0, valorBrutoPreview - descontoPreview);

  const podeEmitirGuiaTuss =
    modoEdicao &&
    (atendimentoInicial?.status === 'Confirmado' ||
      atendimentoInicial?.status === 'Realizado' ||
      status === 'Confirmado' ||
      status === 'Realizado');

  function recalcularTotalPorProcedimentos(lista: ProcedimentoAtendimento[]) {
    if (bloqueiaValorEDesconto) return;
    const soma = lista.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
    setValor(String(soma));
  }

  function adicionarProcedimento() {
    if (bloqueiaCamposGeraisPorCancelado || ehRealizado) return;
    const novoItem: ProcedimentoAtendimento = {
      id: `PROC-${Date.now()}-${procedimentos.length + 1}`,
      codigoTuss: '10101012',
      descricao: '',
      valor: 250
    };
    const novaLista = [...procedimentos, novoItem];
    setProcedimentos(novaLista);
    recalcularTotalPorProcedimentos(novaLista);
  }

  function removerProcedimento(idProc: string) {
    if (procedimentos.length <= 1 || bloqueiaCamposGeraisPorCancelado || ehRealizado) {
      return;
    }
    const novaLista = procedimentos.filter((p) => p.id !== idProc);
    setProcedimentos(novaLista);
    recalcularTotalPorProcedimentos(novaLista);
  }

  function atualizarProcedimento(
    idProc: string,
    campo: keyof Omit<ProcedimentoAtendimento, 'id'>,
    novoValorCampo: string | number
  ) {
    const novaLista = procedimentos.map((p) =>
      p.id === idProc ? { ...p, [campo]: novoValorCampo } : p
    );
    setProcedimentos(novaLista);
    if (campo === 'valor') {
      recalcularTotalPorProcedimentos(novaLista);
    }
  }

  function submeterFormulario(evento: FormEvent) {
    evento.preventDefault();

    if (!modoEdicao && status === 'Cancelado') {
      alert('Não é permitido cadastrar um novo atendimento com o status "Cancelado"!');
      return;
    }

    if (ehCancelado) {
      if (status !== 'Agendado' && status !== 'Confirmado') {
        alert(
          'Atendimentos cancelados só podem ter data e hora reagendadas alterando obrigatoriamente o status para "Agendado" ou "Confirmado"!'
        );
        return;
      }
    }

    const idMedFinal =
      bloqueiaPacienteEMedico && atendimentoInicial
        ? atendimentoInicial.medicoId
        : medicoId;
    const medObj =
      medicos.find((m) => m.id === idMedFinal) ?? listaMedicosFinal[0];

    const valorNum =
      bloqueiaValorEDesconto && atendimentoInicial
        ? atendimentoInicial.valor
        : parseFloat(valor);
    const descNum =
      bloqueiaValorEDesconto && atendimentoInicial
        ? (atendimentoInicial.desconto ?? 0)
        : operadora === 'Particular'
          ? Math.max(0, parseFloat(desconto) || 0)
          : 0;

    const procedimentosValidos = procedimentos
      .map((p) => ({
        ...p,
        codigoTuss: p.codigoTuss.trim() || '10101012',
        descricao: p.descricao.trim(),
        valor: Number(p.valor) || 0
      }))
      .filter((p) => p.descricao.length > 0);

    const descricaoFinal =
      bloqueiaCamposGeraisPorCancelado && atendimentoInicial
        ? atendimentoInicial.descricao
        : procedimentosValidos.map((p) => p.descricao).join(' + ');

    const codigoTussPrincipal =
      bloqueiaCamposGeraisPorCancelado && atendimentoInicial
        ? atendimentoInicial.codigoTuss || '10101012'
        : procedimentosValidos[0]?.codigoTuss || '10101012';

    if (!medObj || !descricaoFinal || isNaN(valorNum) || valorNum <= 0) {
      alert('Preencha todos os procedimentos e valores do atendimento corretamente!');
      return;
    }

    let pacFinal: Paciente | undefined;

    if (bloqueiaPacienteEMedico && atendimentoInicial) {
      pacFinal = pacientes.find((p) => p.id === atendimentoInicial.pacienteId);
    } else if (modoNovoPaciente && aoCadastrarPacienteRapido) {
      if (!novoPacNome.trim() || !novoPacSobrenome.trim() || !novoPacCpf.trim()) {
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
        endereco: 'Cadastrado via Novo Atendimento',
        cidade: novoPacCidade.trim() || 'São Paulo - SP',
        observacoesClinicas: 'Paciente cadastrado diretamente na tela de Atendimentos.'
      });
    } else {
      pacFinal = pacientes.find((p) => p.id === pacienteId);
    }

    const pacienteIdFinal =
      pacFinal?.id ?? atendimentoInicial?.pacienteId ?? '';
    const pacienteNomeFinal = pacFinal
      ? `${pacFinal.nome} ${pacFinal.sobrenome}`.trim()
      : (atendimentoInicial?.pacienteNome ?? '');

    if (!pacienteIdFinal || !pacienteNomeFinal) {
      alert('Selecione ou cadastre um paciente válido!');
      return;
    }

    const historicoAtual: HistoricoValorAtendimento[] = [
      ...(atendimentoInicial?.historicoAlteracoes ?? [])
    ];

    if (atendimentoInicial) {
      const descAntigo = atendimentoInicial.desconto ?? 0;
      const mudouValor = Math.abs(atendimentoInicial.valor - valorNum) > 0.009;
      const mudouDesconto = Math.abs(descAntigo - descNum) > 0.009;

      if (mudouValor || mudouDesconto) {
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR');
        const horaFormatada = agora.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });

        historicoAtual.unshift({
          id: `HIST-${Date.now().toString().slice(-5)}`,
          dataHora: `${dataFormatada} às ${horaFormatada}`,
          valorAnterior: atendimentoInicial.valor,
          valorNovo: valorNum,
          descontoAnterior: descAntigo,
          descontoNovo: descNum
        });
      }
    }

    aoSalvarAtendimento({
      id: atendimentoInicial?.id,
      codigoTuss: codigoTussPrincipal,
      procedimentos:
        bloqueiaCamposGeraisPorCancelado && atendimentoInicial?.procedimentos
          ? atendimentoInicial.procedimentos
          : procedimentosValidos,
      pacienteId: pacienteIdFinal,
      pacienteNome: pacienteNomeFinal,
      medicoId: medObj.id,
      medicoNome: medObj.nome,
      especialidade: medObj.especialidade || medObj.cargo,
      descricao: descricaoFinal,
      data: dataAtd,
      hora: horaAtd || '09:00',
      operadora:
        bloqueiaCamposGeraisPorCancelado && atendimentoInicial
          ? atendimentoInicial.operadora
          : operadora,
      status,
      valor: valorNum,
      desconto: operadora === 'Particular' ? descNum : undefined,
      historicoAlteracoes: historicoAtual
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
              {atendimentoInicial
                ? `Ficha Completa do Atendimento (${atendimentoInicial.id})`
                : 'Registrar Novo Atendimento Clínico'}
            </h3>
            <p
              style={{
                fontSize: '0.84rem',
                color: 'var(--text-secondary)',
                marginTop: '0.2rem'
              }}
            >
              {ehCancelado
                ? 'Atendimento Cancelado: altere apenas a Data e Hora e mude o status obrigatoriamente para "Agendado" ou "Confirmado".'
                : ehRealizado
                  ? 'Atendimento Realizado: Paciente, Médico, Valor e Desconto estão bloqueados para edição.'
                  : ehConfirmadoOuRealizado
                    ? 'Atendimento Confirmado: Paciente e Médico não podem ser alterados.'
                    : 'Defina paciente, data/hora, operadora, médico responsável, procedimentos e valores.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {podeEmitirGuiaTuss && atendimentoInicial && (
              <>
                {aoVisualizarGuiaTuss && (
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => aoVisualizarGuiaTuss(atendimentoInicial)}
                    title="Visualizar Guia TUSS de Atendimento"
                  >
                    <Eye size={15} />
                    <span>Visualizar Guia TUSS</span>
                  </button>
                )}
                {aoImprimirGuiaTuss && (
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => aoImprimirGuiaTuss(atendimentoInicial)}
                    title="Imprimir Guia TUSS de Atendimento"
                  >
                    <Printer size={15} />
                    <span>Imprimir Guia TUSS</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              className="btn-realtime"
              onClick={aoFechar}
              style={{ padding: '0.3rem 0.5rem' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {ehCancelado && (
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
                Reagendamento de Atendimento Cancelado — Ação Obrigatória
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', marginTop: '0.2rem' }}>
              Para este atendimento, apenas <strong>Data</strong> e{' '}
              <strong>Hora</strong> podem ser editadas. Ao confirmar a alteração, é
              obrigatório mudar o status para <strong>Agendado</strong> ou{' '}
              <strong>Confirmado</strong>.
            </p>
          </div>
        )}

        {ehConfirmadoOuRealizado && (
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
                Proteção de Registro Clínico ({statusOriginal})
              </span>
            </div>
            <p style={{ fontSize: '0.83rem', marginTop: '0.2rem' }}>
              {ehRealizado
                ? 'Atendimentos com status "Realizado" possuem Paciente, Médico, Valor e Desconto bloqueados contra alterações.'
                : 'Atendimentos com status "Confirmado" possuem Paciente e Médico bloqueados contra alterações.'}
            </p>
          </div>
        )}

        <form
          onSubmit={submeterFormulario}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.05rem' }}
        >
          <div className="lote-summary-strip">
            <div>
              <span className="strip-label">ID do Paciente</span>
              <strong style={{ color: '#778873' }}>
                {modoNovoPaciente
                  ? 'NOVO PACIENTE (Auto)'
                  : (pacienteSelecionadoForm?.id ??
                    atendimentoInicial?.pacienteId ??
                    '-')}
              </strong>
            </div>
            <div>
              <span className="strip-label">Paciente</span>
              <strong>
                {modoNovoPaciente
                  ? `${novoPacNome} ${novoPacSobrenome}`.trim() || 'Novo Paciente'
                  : pacienteSelecionadoForm
                    ? `${pacienteSelecionadoForm.nome} ${pacienteSelecionadoForm.sobrenome}`
                    : (atendimentoInicial?.pacienteNome ?? '-')}
              </strong>
            </div>
            <div>
              <span className="strip-label">Operadora</span>
              <strong>{operadora}</strong>
            </div>
            <div>
              <span className="strip-label">Data e Hora</span>
              <strong>
                {formatarDataBR(dataAtd)} às {horaAtd}
              </strong>
            </div>
            <div>
              <span className="strip-label">Valor Líquido</span>
              <strong style={{ color: 'var(--accent-color)' }}>
                {formatarMoeda(valorLiquidoPreview)}
              </strong>
            </div>
          </div>

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

              {!bloqueiaPacienteEMedico && aoCadastrarPacienteRapido && (
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
                  gridTemplateColumns: '2fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Selecionar Paciente Cadastrado</label>
                  <select
                    className="form-input"
                    value={pacienteId}
                    onChange={(e) => setPacienteId(e.target.value)}
                    disabled={
                      bloqueiaPacienteEMedico ||
                      Boolean(pacientePreSelecionadoId && !modoEdicao)
                    }
                    required={!modoNovoPaciente}
                  >
                    {pacientes.map((pac) => (
                      <option key={pac.id} value={pac.id}>
                        {pac.nome} {pac.sobrenome} — CPF: {pac.cpf}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>ID do Paciente</label>
                  <input
                    type="text"
                    className="form-input"
                    value={
                      pacienteSelecionadoForm?.id ??
                      atendimentoInicial?.pacienteId ??
                      ''
                    }
                    disabled
                  />
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.65rem'
                }}
              >
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
                    onChange={(e) => setNovoPacCpf(formatarCPF(e.target.value))}
                    required={modoNovoPaciente}
                  />
                </div>

                <div className="form-group">
                  <label>Telefone</label>
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
                  <label>E-mail</label>
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 0.85fr 1.35fr 1.1fr',
              gap: '0.75rem'
            }}
          >
            <div className="form-group">
              <label>Data Escolhida</label>
              <input
                type="date"
                className="form-input"
                value={dataAtd}
                onChange={(e) => setDataAtd(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Hora Escolhida</label>
              <input
                type="time"
                className="form-input"
                value={horaAtd}
                onChange={(e) => setHoraAtd(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Operadora</label>
              <select
                className="form-input"
                value={operadora}
                onChange={(e) => setOperadora(e.target.value)}
                disabled={bloqueiaCamposGeraisPorCancelado || ehRealizado}
              >
                {opcoesOperadoras.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status do Atendimento</label>
              <select
                className="form-input"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as StatusAtendimento)
                }
              >
                {ehCancelado ? (
                  <>
                    <option value="Cancelado" disabled>
                      Cancelado (Altere para Agendado ou Confirmado)
                    </option>
                    <option value="Agendado">Agendado</option>
                    <option value="Confirmado">Confirmado</option>
                  </>
                ) : !modoEdicao ? (
                  <>
                    <option value="Agendado">Agendado</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Realizado">Realizado</option>
                  </>
                ) : (
                  <>
                    <option value="Agendado">Agendado</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Realizado">Realizado</option>
                    <option value="Cancelado">Cancelado</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr',
              gap: '0.75rem'
            }}
          >
            <div className="form-group">
              <label>Médico Responsável</label>
              <select
                className="form-input"
                value={medicoId}
                onChange={(e) => setMedicoId(e.target.value)}
                disabled={bloqueiaPacienteEMedico}
                required
              >
                {listaMedicosFinal.map((med) => (
                  <option key={med.id} value={med.id}>
                    {med.nome} — {med.especialidade || med.cargo}
                    {med.crm ? ` (CRM/${med.ufCrm} ${med.crm})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Especialidade Clínica</label>
              <input
                type="text"
                className="form-input"
                value={
                  medicoSelecionadoForm?.especialidade ||
                  medicoSelecionadoForm?.cargo ||
                  atendimentoInicial?.especialidade ||
                  ''
                }
                disabled
              />
            </div>
          </div>

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
              <strong>
                Procedimentos e Exames do Atendimento ({procedimentos.length})
              </strong>

              {!bloqueiaCamposGeraisPorCancelado && !ehRealizado && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={adicionarProcedimento}
                >
                  <Plus size={15} />
                  <span>Adicionar Procedimento</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {procedimentos.map((proc, index) => (
                <div key={proc.id} className="procedimento-row-box">
                  <div className="form-group">
                    <label>Descrição do Procedimento #{index + 1}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Consulta Cardiológica + Eletrocardiograma"
                      value={proc.descricao}
                      onChange={(e) =>
                        atualizarProcedimento(proc.id, 'descricao', e.target.value)
                      }
                      disabled={bloqueiaCamposGeraisPorCancelado}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Código TUSS</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="10101012"
                      value={proc.codigoTuss}
                      onChange={(e) =>
                        atualizarProcedimento(proc.id, 'codigoTuss', e.target.value)
                      }
                      disabled={bloqueiaCamposGeraisPorCancelado}
                    />
                  </div>

                  <div className="form-group">
                    <label>Valor Proc. (R$)</label>
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
                      disabled={bloqueiaValorEDesconto}
                      required
                    />
                  </div>

                  <div>
                    {procedimentos.length > 1 &&
                      !bloqueiaCamposGeraisPorCancelado &&
                      !ehRealizado && (
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => removerProcedimento(proc.id)}
                          title="Remover Procedimento"
                          style={{ height: '38px', padding: '0 0.65rem' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-secao-financeira">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <strong>Valores Financeiros, Descontos e Histórico de Alterações</strong>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Valor Líquido Calculado:{' '}
                <strong style={{ color: 'var(--accent-color)' }}>
                  {formatarMoeda(valorLiquidoPreview)}
                </strong>
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  operadora === 'Particular' ? '1fr 1fr 1fr' : '1fr 1fr',
                gap: '0.75rem'
              }}
            >
              <div className="form-group">
                <label>Valor Bruto Total do Atendimento (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-input"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  disabled={bloqueiaValorEDesconto}
                  required
                />
              </div>

              {operadora === 'Particular' && (
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
                    disabled={bloqueiaValorEDesconto}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Valor Líquido Final (R$)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formatarMoeda(valorLiquidoPreview)}
                  disabled
                />
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.88rem'
                }}
              >
                <History size={16} color="#778873" />
                <strong>
                  Histórico de Alterações de Valor e Desconto (
                  {atendimentoInicial?.historicoAlteracoes?.length ?? 0})
                </strong>
              </div>

              {!atendimentoInicial?.historicoAlteracoes ||
              atendimentoInicial.historicoAlteracoes.length === 0 ? (
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Nenhuma alteração de valor ou desconto registrada para este atendimento.
                </p>
              ) : (
                <div className="guias-lote-list" style={{ maxHeight: '140px' }}>
                  {atendimentoInicial.historicoAlteracoes.map((reg) => (
                    <div key={reg.id} className="guia-lote-item">
                      <div>
                        <strong style={{ color: '#778873' }}>{reg.dataHora}</strong>
                        <span
                          style={{
                            marginLeft: '0.75rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Valor: {formatarMoeda(reg.valorAnterior)} →{' '}
                          <strong style={{ color: 'var(--text-primary)' }}>
                            {formatarMoeda(reg.valorNovo)}
                          </strong>
                        </span>
                      </div>
                      <div style={{ fontSize: '0.83rem' }}>
                        Desc: {formatarMoeda(reg.descontoAnterior)} →{' '}
                        <strong style={{ color: '#d97706' }}>
                          {formatarMoeda(reg.descontoNovo)}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            {podeEmitirGuiaTuss && atendimentoInicial && aoVisualizarGuiaTuss && (
              <button
                type="button"
                className="btn-outline"
                onClick={() => aoVisualizarGuiaTuss(atendimentoInicial)}
              >
                <Eye size={16} />
                <span>Visualizar Guia TUSS</span>
              </button>
            )}
            {podeEmitirGuiaTuss && atendimentoInicial && aoImprimirGuiaTuss && (
              <button
                type="button"
                className="btn-outline"
                onClick={() => aoImprimirGuiaTuss(atendimentoInicial)}
              >
                <Printer size={16} />
                <span>Imprimir Guia TUSS</span>
              </button>
            )}

            <button type="button" className="btn-realtime" onClick={aoFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              <span>
                {atendimentoInicial
                  ? 'Salvar Alterações'
                  : 'Confirmar Atendimento'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
