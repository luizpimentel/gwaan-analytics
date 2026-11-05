import { useState, type FormEvent } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  Pencil,
  Check,
  X,
  UserCheck,
  ArrowLeft,
  Save,
  Phone,
  Mail,
  Briefcase,
  CalendarCheck,
  User,
  Award
} from 'lucide-react';
import {
  UFS_BRASIL,
  ehProfissionalMedico,
  type Atendimento,
  type Operadora,
  type Paciente,
  type Profissional
} from '../data/dadosFaturamento';
import {
  formatarCPF,
  formatarDataBR,
  formatarMoeda,
  formatarTelefone,
  obterClasseBadgeAtendimento
} from '../utils/formatadores';
import { ActionMenu } from '../components/ActionMenu';
import { PhotoPicker } from '../components/PhotoPicker';
import {
  ExpandableFilterPanel,
  ExpandableFilterToggle
} from '../components/ExpandableFilterBar';
import { ModalAtendimento } from '../components/ModalAtendimento';
import {
  ModalGuiaTuss,
  imprimirGuiaTussAtendimento
} from '../components/ModalGuiaTuss';

interface ProfissionaisProps {
  profissionais: Profissional[];
  atendimentos: Atendimento[];
  pacientes: Paciente[];
  operadoras: Operadora[];
  aoSalvarProfissional: (dados: Omit<Profissional, 'id'> & { id?: string }) => void;
  aoExcluirProfissional: (id: string) => void;
  aoSalvarAtendimento: (dados: Omit<Atendimento, 'id'> & { id?: string }) => void;
}

const FOTO_PROFISSIONAL_PADRAO =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=160&auto=format&fit=crop&q=80';

export function Profissionais({
  profissionais,
  atendimentos,
  pacientes,
  operadoras,
  aoSalvarProfissional,
  aoExcluirProfissional,
  aoSalvarAtendimento
}: ProfissionaisProps) {
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(false);
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroTipoCargo, setFiltroTipoCargo] = useState<string>('Todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');

  const [profissionalSelecionadoId, setProfissionalSelecionadoId] = useState<
    string | null
  >(null);

  const [modalNovoAberto, setModalNovoAberto] = useState<boolean>(false);

  const [foto, setFoto] = useState<string>(FOTO_PROFISSIONAL_PADRAO);
  const [nome, setNome] = useState<string>('');
  const [cpf, setCpf] = useState<string>('');
  const [cargo, setCargo] = useState<string>('');
  const [especialidade, setEspecialidade] = useState<string>('');
  const [crm, setCrm] = useState<string>('');
  const [ufCrm, setUfCrm] = useState<string>('SP');
  const [telefone, setTelefone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [endereco, setEndereco] = useState<string>('');
  const [ativo, setAtivo] = useState<boolean>(true);
  const [feedbackSalvo, setFeedbackSalvo] = useState<boolean>(false);

  const [modalAtdMedicoAberto, setModalAtdMedicoAberto] = useState<boolean>(false);
  const [atendimentoEmFoco, setAtendimentoEmFoco] = useState<Atendimento | null>(null);
  const [guiaTussParaVisualizar, setGuiaTussParaVisualizar] =
    useState<Atendimento | null>(null);

  const profissionalAtivo =
    profissionais.find((m) => m.id === profissionalSelecionadoId) ?? null;

  const exibeEspecialidadeNoForm = ehProfissionalMedico(cargo);

  const qtdFiltrosAtivos =
    (buscaTexto.trim() ? 1 : 0) +
    (filtroTipoCargo !== 'Todos' ? 1 : 0) +
    (filtroStatus !== 'Todos' ? 1 : 0);

  function limparFiltros() {
    setBuscaTexto('');
    setFiltroTipoCargo('Todos');
    setFiltroStatus('Todos');
  }

  function carregarDadosNoEstado(prof: Profissional) {
    setFoto(prof.foto || FOTO_PROFISSIONAL_PADRAO);
    setNome(prof.nome);
    setCpf(prof.cpf || '');
    setCargo(prof.cargo || '');
    setEspecialidade(prof.especialidade || '');
    setCrm(prof.crm || '');
    setUfCrm(prof.ufCrm || 'SP');
    setTelefone(prof.telefone || '');
    setEmail(prof.email || '');
    setEndereco(prof.endereco || '');
    setAtivo(prof.ativo);
    setFeedbackSalvo(false);
  }

  function abrirPaginaDinamicaProfissional(prof: Profissional) {
    setProfissionalSelecionadoId(prof.id);
    carregarDadosNoEstado(prof);
  }

  function abrirModalNovo() {
    setFoto(FOTO_PROFISSIONAL_PADRAO);
    setNome('');
    setCpf('');
    setCargo('Médico Especialista');
    setEspecialidade('');
    setCrm('');
    setUfCrm('SP');
    setTelefone('');
    setEmail('');
    setEndereco('');
    setAtivo(true);
    setModalNovoAberto(true);
  }

  function salvarNovoProfissional(evento: FormEvent) {
    evento.preventDefault();
    const ehMed = ehProfissionalMedico(cargo);

    if (!nome.trim() || !cpf.trim() || !cargo.trim()) {
      alert('Preencha Nome, CPF e Função/Cargo do profissional!');
      return;
    }

    if (ehMed && !especialidade.trim()) {
      alert('Informe a Especialidade para profissionais com cargo de Médico!');
      return;
    }

    aoSalvarProfissional({
      foto: foto.trim() || FOTO_PROFISSIONAL_PADRAO,
      nome: nome.trim(),
      cpf: cpf.trim(),
      cargo: cargo.trim(),
      especialidade: ehMed ? especialidade.trim() : '',
      crm: ehMed ? crm.trim() : '',
      ufCrm: ehMed ? ufCrm.trim().toUpperCase() : 'SP',
      telefone: telefone.trim(),
      email: email.trim(),
      endereco: endereco.trim(),
      ativo
    });

    setModalNovoAberto(false);
  }

  function salvarEdicaoPaginaDinamica(evento: FormEvent) {
    evento.preventDefault();
    if (!profissionalAtivo) return;

    const ehMed = ehProfissionalMedico(cargo);

    if (!nome.trim() || !cpf.trim() || !cargo.trim()) {
      alert('Nome, CPF e Função/Cargo são obrigatórios!');
      return;
    }

    if (ehMed && !especialidade.trim()) {
      alert('Informe a Especialidade para profissionais com cargo de Médico!');
      return;
    }

    aoSalvarProfissional({
      id: profissionalAtivo.id,
      foto: foto.trim() || FOTO_PROFISSIONAL_PADRAO,
      nome: nome.trim(),
      cpf: cpf.trim(),
      cargo: cargo.trim(),
      especialidade: ehMed ? especialidade.trim() : '',
      crm: ehMed ? crm.trim() : '',
      ufCrm: ehMed ? ufCrm.trim().toUpperCase() : 'SP',
      telefone: telefone.trim(),
      email: email.trim(),
      endereco: endereco.trim(),
      ativo
    });

    setFeedbackSalvo(true);
    setTimeout(() => setFeedbackSalvo(false), 3000);
  }

  if (profissionalAtivo) {
    const ehMedicoAtivo = ehProfissionalMedico(cargo || profissionalAtivo.cargo);
    const atendimentosDoMedico = atendimentos.filter(
      (a) => a.medicoId === profissionalAtivo.id
    );
    const volumeGeradoMedico = atendimentosDoMedico
      .filter((a) => a.status !== 'Cancelado')
      .reduce((acc, a) => acc + Math.max(0, a.valor - (a.desconto ?? 0)), 0);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              type="button"
              className="btn-realtime"
              onClick={() => setProfissionalSelecionadoId(null)}
            >
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </button>

            <div>
              <h1 style={{ fontSize: '1.6rem' }}>
                Ficha do Profissional — {profissionalAtivo.nome}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                ID do Profissional: <strong>{profissionalAtivo.id}</strong> • Função/Cargo:{' '}
                <strong>{cargo || profissionalAtivo.cargo}</strong>
              </p>
            </div>
          </div>
        </div>

        <section className="grade-painel-duplo">
          <div
            className="demandas-section"
            style={{ alignItems: 'center', textAlign: 'center' }}
          >
            <img
              src={foto || FOTO_PROFISSIONAL_PADRAO}
              alt={profissionalAtivo.nome}
              className="profissional-profile-avatar"
            />
            <div>
              <span
                className={`badge ${ativo ? 'badge-enviado' : 'badge-pendente'}`}
              >
                {profissionalAtivo.id} • {ativo ? 'Ativo' : 'Inativo'}
              </span>
              <h2 style={{ fontSize: '1.35rem', marginTop: '0.5rem' }}>{nome}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                CPF: <strong>{cpf || '-'}</strong>
              </p>
              <div
                style={{
                  marginTop: '0.45rem',
                  display: 'flex',
                  gap: '0.4rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <span className="badge badge-faturar">{cargo}</span>
                {ehMedicoAtivo && especialidade && (
                  <span className="badge badge-faturado">{especialidade}</span>
                )}
              </div>
            </div>

            <div className="profissional-meta-box">
              <div className="profissional-meta-row">
                <Briefcase size={15} color="#778873" />
                <span>
                  Cargo: <strong>{cargo}</strong>
                </span>
              </div>
              {ehMedicoAtivo && (
                <div className="profissional-meta-row">
                  <Award size={15} color="#778873" />
                  <span>
                    CRM: <strong>{crm ? `CRM/${ufCrm || 'SP'} ${crm}` : 'Não informado'}</strong>
                  </span>
                </div>
              )}
              <div className="profissional-meta-row">
                <Phone size={15} color="#778873" />
                <span>{telefone || 'Sem telefone'}</span>
              </div>
              <div className="profissional-meta-row">
                <Mail size={15} color="#778873" />
                <span>{email || 'Sem e-mail'}</span>
              </div>
            </div>

            {ehMedicoAtivo && (
              <div
                className="lote-summary-strip"
                style={{
                  width: '100%',
                  gridTemplateColumns: '1fr 1fr',
                  textAlign: 'center'
                }}
              >
                <div>
                  <span className="strip-label">Atendimentos</span>
                  <strong>{atendimentosDoMedico.length}</strong>
                </div>
                <div>
                  <span className="strip-label">Realizados</span>
                  <strong>
                    {
                      atendimentosDoMedico.filter((a) => a.status === 'Realizado')
                        .length
                    }
                  </strong>
                </div>
                <div
                  style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.55rem'
                  }}
                >
                  <span className="strip-label">Volume Total</span>
                  <strong
                    style={{ fontSize: '1.05rem', color: 'var(--accent-color)' }}
                  >
                    {formatarMoeda(volumeGeradoMedico)}
                  </strong>
                </div>
              </div>
            )}
          </div>

          <div className="demandas-section">
            <div>
              <h2 style={{ fontSize: '1.15rem' }}>
                Dados Cadastrais e Função do Profissional
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.84rem',
                  marginTop: '0.15rem'
                }}
              >
                Edite foto, CPF, função/cargo, especialidade (quando médico), telefone,
                e-mail e endereço de <strong>{profissionalAtivo.nome}</strong>.
              </p>
            </div>

            <form
              onSubmit={salvarEdicaoPaginaDinamica}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
            >
              <PhotoPicker
                fotoAtual={foto}
                aoAlterarFoto={setFoto}
                rotulo="Foto do Profissional (Upload ou Tirar na Hora)"
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '0.8fr 1.6fr 1.1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>ID do Profissional</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profissionalAtivo.id}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Nome Completo</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>CPF</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatarCPF(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: exibeEspecialidadeNoForm
                    ? '1.2fr 1.1fr 0.8fr 0.6fr'
                    : '1.5fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Função / Cargo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Médico Cardiologista, Recepcionista, Analista..."
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    required
                  />
                </div>

                {exibeEspecialidadeNoForm && (
                  <>
                    <div className="form-group">
                      <label>Especialidade Médica</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Cardiologia"
                        value={especialidade}
                        onChange={(e) => setEspecialidade(e.target.value)}
                        required={exibeEspecialidadeNoForm}
                      />
                    </div>

                    <div className="form-group">
                      <label>CRM</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: 142.890"
                        value={crm}
                        onChange={(e) => setCrm(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>UF CRM</label>
                      <select
                        className="form-input"
                        value={ufCrm}
                        onChange={(e) => setUfCrm(e.target.value)}
                      >
                        {UFS_BRASIL.map((uf) => (
                          <option key={uf} value={uf}>
                            {uf}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {!exibeEspecialidadeNoForm && (
                  <div className="form-group">
                    <label>Status Cadastral</label>
                    <select
                      className="form-input"
                      value={ativo ? 'Ativo' : 'Inativo'}
                      onChange={(e) => setAtivo(e.target.value === 'Ativo')}
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: exibeEspecialidadeNoForm
                    ? '1fr 1.3fr 0.8fr'
                    : '1fr 1.4fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="(11) 99999-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>E-mail</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="profissional@gwaan.med.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {exibeEspecialidadeNoForm && (
                  <div className="form-group">
                    <label>Status Cadastral</label>
                    <select
                      className="form-input"
                      value={ativo ? 'Ativo' : 'Inativo'}
                      onChange={(e) => setAtivo(e.target.value === 'Ativo')}
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Endereço Completo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  required
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                {feedbackSalvo ? (
                  <span
                    style={{
                      color: 'var(--accent-color)',
                      fontWeight: 600,
                      fontSize: '0.88rem'
                    }}
                  >
                    ✓ Dados do profissional salvos com sucesso!
                  </span>
                ) : (
                  <span />
                )}

                <button type="submit" className="btn-primary">
                  <Save size={16} />
                  <span>Salvar Informações do Profissional</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {ehMedicoAtivo && (
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
                  <CalendarCheck size={18} color="#778873" />
                  <span>
                    Atendimentos Clínicos de {profissionalAtivo.nome} (
                    {atendimentosDoMedico.length})
                  </span>
                </h2>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    marginTop: '0.2rem'
                  }}
                >
                  Clique em qualquer atendimento da lista para abrir o modal e visualizar ou
                  imprimir a Guia TUSS.
                </p>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setAtendimentoEmFoco(null);
                  setModalAtdMedicoAberto(true);
                }}
              >
                <Plus size={16} />
                <span>Novo Atendimento para este Médico</span>
              </button>
            </div>

            <div className="table-container">
              <table className="demandas-table">
                <thead>
                  <tr>
                    <th>Código Atd.</th>
                    <th>Paciente</th>
                    <th>Descrição do Procedimento</th>
                    <th>Data e Hora</th>
                    <th>Operadora</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {atendimentosDoMedico.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: 'center',
                          color: 'var(--text-secondary)',
                          padding: '2rem'
                        }}
                      >
                        Nenhum atendimento registrado para este médico até o momento.
                      </td>
                    </tr>
                  ) : (
                    atendimentosDoMedico.map((atd) => {
                      const temDesc =
                        atd.operadora === 'Particular' && (atd.desconto ?? 0) > 0;

                      return (
                        <tr
                          key={atd.id}
                          className="clickable-row"
                          onClick={() => {
                            setAtendimentoEmFoco(atd);
                            setModalAtdMedicoAberto(true);
                          }}
                          title="Clique para abrir o atendimento no modal"
                        >
                          <td style={{ fontWeight: 700, color: '#778873' }}>{atd.id}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{atd.pacienteNome}</div>
                            <small style={{ color: 'var(--text-secondary)' }}>
                              ID Paciente: {atd.pacienteId}
                            </small>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {atd.descricao}
                          </td>
                          <td>
                            {formatarDataBR(atd.data)} às{' '}
                            <strong>{atd.hora || '09:00'}</strong>
                          </td>
                          <td>
                            <span className="badge badge-faturado">{atd.operadora}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              {formatarMoeda(Math.max(0, atd.valor - (atd.desconto ?? 0)))}
                            </div>
                            {temDesc && (
                              <small style={{ color: '#d97706', fontSize: '0.75rem' }}>
                                Desc: {formatarMoeda(atd.desconto ?? 0)}
                              </small>
                            )}
                          </td>
                          <td>
                            <span className={obterClasseBadgeAtendimento(atd.status)}>
                              {atd.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {modalAtdMedicoAberto && (
          <ModalAtendimento
            atendimentoInicial={atendimentoEmFoco}
            pacientes={pacientes}
            medicos={profissionais}
            operadoras={operadoras}
            medicoPreSelecionadoId={profissionalAtivo.id}
            aoFechar={() => {
              setModalAtdMedicoAberto(false);
              setAtendimentoEmFoco(null);
            }}
            aoSalvarAtendimento={aoSalvarAtendimento}
            aoVisualizarGuiaTuss={(atd) => setGuiaTussParaVisualizar(atd)}
            aoImprimirGuiaTuss={(atd) =>
              imprimirGuiaTussAtendimento(
                atd,
                pacientes.find((p) => p.id === atd.pacienteId),
                profissionalAtivo
              )
            }
          />
        )}

        {guiaTussParaVisualizar && (
          <ModalGuiaTuss
            atendimento={guiaTussParaVisualizar}
            paciente={pacientes.find(
              (p) => p.id === guiaTussParaVisualizar.pacienteId
            )}
            medico={profissionalAtivo}
            aoFechar={() => setGuiaTussParaVisualizar(null)}
          />
        )}
      </main>
    );
  }

  const filtrados = profissionais.filter((m) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const ehMed = ehProfissionalMedico(m.cargo);
    const bateTexto =
      m.id.toLocaleLowerCase().includes(termo) ||
      m.nome.toLocaleLowerCase().includes(termo) ||
      (m.cpf || '').toLocaleLowerCase().includes(termo) ||
      (m.cargo || '').toLocaleLowerCase().includes(termo) ||
      (m.especialidade || '').toLocaleLowerCase().includes(termo) ||
      (m.email || '').toLocaleLowerCase().includes(termo);
    const bateTipo =
      filtroTipoCargo === 'Todos' ||
      (filtroTipoCargo === 'Medicos' ? ehMed : !ehMed);
    const bateStatus =
      filtroStatus === 'Todos' ||
      (filtroStatus === 'Ativo' ? m.ativo : !m.ativo);

    return bateTexto && bateTipo && bateStatus;
  });

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
            Profissionais e Quadro de Funcionários
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Gerencie todos os colaboradores e médicos da empresa. Clique em qualquer
            profissional para abrir sua ficha individual e histórico.
          </p>
        </div>

        <button className="btn-primary" onClick={abrirModalNovo}>
          <Plus size={18} />
          <span>Cadastrar Profissional</span>
        </button>
      </div>

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
              <Stethoscope size={18} color="#778873" />
              <span>Profissionais Cadastrados ({filtrados.length})</span>
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginTop: '0.2rem'
              }}
            >
              Clique na linha do profissional para visualizar e editar todos os dados
              cadastrais.
            </p>
          </div>

          <ExpandableFilterToggle
            aberto={painelFiltrosAberto}
            aoAlternar={() => setPainelFiltrosAberto((ant) => !ant)}
            qtdAtivos={qtdFiltrosAtivos}
            aoLimpar={limparFiltros}
          />
        </div>

        <ExpandableFilterPanel aberto={painelFiltrosAberto} aoLimpar={limparFiltros}>
          <div className="search-box" style={{ flex: 1, minWidth: '240px' }}>
            <Search size={16} color="#5A6B57" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF, cargo/função ou especialidade..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filtroTipoCargo}
            onChange={(e) => setFiltroTipoCargo(e.target.value)}
          >
            <option value="Todos">Função: Todos os Profissionais</option>
            <option value="Medicos">Corpo Clínico</option>
            <option value="Administrativo">Equipe Administrativa / Gestão</option>
          </select>

          <select
            className="filter-select"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="Todos">Status: Todos</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </ExpandableFilterPanel>

        <div className="table-container">
          <table className="demandas-table">
            <thead>
              <tr>
                <th>Profissional</th>
                <th>ID</th>
                <th>CPF</th>
                <th>Função / Cargo</th>
                <th>Especialidade</th>
                <th>Contato</th>
                <th>Endereço</th>
                <th>Atendimentos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      padding: '2rem'
                    }}
                  >
                    Nenhum profissional encontrado para a busca informada.
                  </td>
                </tr>
              ) : (
                filtrados.map((prof) => {
                  const ehMed = ehProfissionalMedico(prof.cargo);
                  const atds = atendimentos.filter((a) => a.medicoId === prof.id);

                  return (
                    <tr
                      key={prof.id}
                      className="clickable-row"
                      onClick={() => abrirPaginaDinamicaProfissional(prof)}
                      title="Clique para abrir a ficha dinâmica deste profissional"
                    >
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}
                        >
                          <img
                            src={prof.foto || FOTO_PROFISSIONAL_PADRAO}
                            alt={prof.nome}
                            className="profissional-table-avatar"
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>{prof.nome}</div>
                            <small style={{ color: 'var(--text-secondary)' }}>
                              Ver ficha completa →
                            </small>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#778873' }}>{prof.id}</td>
                      <td style={{ fontFamily: 'monospace' }}>{prof.cpf || '-'}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{prof.cargo}</div>
                        {ehMed && prof.crm && (
                          <small style={{ color: 'var(--text-secondary)' }}>
                            CRM/{prof.ufCrm || 'SP'} {prof.crm}
                          </small>
                        )}
                      </td>
                      <td>
                        {ehMed && prof.especialidade ? (
                          <span className="badge badge-faturar">
                            {prof.especialidade}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            Não se aplica
                          </span>
                        )}
                      </td>
                      <td>
                        <div>{prof.telefone}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>
                          {prof.email}
                        </small>
                      </td>
                      <td style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        {prof.endereco || '-'}
                      </td>
                      <td>
                        {ehMed ? (
                          <span className="badge badge-faturado">
                            {atds.length} {atds.length === 1 ? 'atendimento' : 'atendimentos'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            -
                          </span>
                        )}
                      </td>
                      <td>
                        <ActionMenu
                          opcoes={[
                            {
                              rotulo: 'Abrir Ficha do Profissional',
                              icone: <User size={14} />,
                              aoClicar: () => abrirPaginaDinamicaProfissional(prof)
                            },
                            {
                              rotulo: 'Editar Informações',
                              icone: <Pencil size={14} />,
                              aoClicar: () => abrirPaginaDinamicaProfissional(prof)
                            },
                            {
                              rotulo: prof.ativo ? 'Marcar Inativo' : 'Marcar Ativo',
                              icone: <UserCheck size={14} />,
                              aoClicar: () =>
                                aoSalvarProfissional({
                                  ...prof,
                                  ativo: !prof.ativo
                                })
                            }
                          ]}
                          aoExcluir={() => aoExcluirProfissional(prof.id)}
                          tituloExcluir="Excluir Profissional"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalNovoAberto && (
        <div className="modal-overlay" onClick={() => setModalNovoAberto(false)}>
          <div
            className="modal-content modal-content-80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>Cadastrar Novo Profissional</h3>
              <button
                type="button"
                className="btn-realtime"
                onClick={() => setModalNovoAberto(false)}
                style={{ padding: '0.3rem 0.5rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={salvarNovoProfissional}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
            >
              <PhotoPicker
                fotoAtual={foto}
                aoAlterarFoto={setFoto}
                rotulo="Foto do Profissional (Upload ou Tirar na Hora)"
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Nome Completo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Dr. Eduardo Cavalcanti ou Ana Beatriz"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>CPF</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatarCPF(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: exibeEspecialidadeNoForm
                    ? '1.2fr 1.1fr 0.8fr 0.6fr'
                    : '1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Função / Cargo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Médico Clínico, Analista Financeiro, Recepcionista..."
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    required
                  />
                </div>

                {exibeEspecialidadeNoForm && (
                  <>
                    <div className="form-group">
                      <label>Especialidade</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Cardiologia"
                        value={especialidade}
                        onChange={(e) => setEspecialidade(e.target.value)}
                        required={exibeEspecialidadeNoForm}
                      />
                    </div>

                    <div className="form-group">
                      <label>CRM (Opcional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: 142.890"
                        value={crm}
                        onChange={(e) => setCrm(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>UF</label>
                      <select
                        className="form-input"
                        value={ufCrm}
                        onChange={(e) => setUfCrm(e.target.value)}
                      >
                        {UFS_BRASIL.map((uf) => (
                          <option key={uf} value={uf}>
                            {uf}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.3fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="(11) 99999-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>E-mail</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="profissional@gwaan.med.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Endereço Completo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-realtime"
                  onClick={() => setModalNovoAberto(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} />
                  <span>Cadastrar Profissional</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

