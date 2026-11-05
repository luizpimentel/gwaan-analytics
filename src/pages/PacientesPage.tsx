import { useState, type FormEvent } from 'react';
import {
  Users,
  Plus,
  Search,
  ArrowLeft,
  Save,
  CalendarCheck,
  Phone,
  FileText,
  Pencil,
  Check,
  X,
  User,
  Mail
} from 'lucide-react';
import type {
  Atendimento,
  Operadora,
  Paciente,
  Profissional
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

interface PacientesPageProps {
  pacientes: Paciente[];
  atendimentos: Atendimento[];
  medicos: Profissional[];
  operadoras: Operadora[];
  aoSalvarPaciente: (dados: Omit<Paciente, 'id'> & { id?: string }) => void;
  aoExcluirPaciente: (id: string) => void;
  aoSalvarAtendimento: (dados: Omit<Atendimento, 'id'> & { id?: string }) => void;
}

const AVATARES_SUGERIDOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80'
];

export function PacientesPage({
  pacientes,
  atendimentos,
  medicos,
  operadoras,
  aoSalvarPaciente,
  aoExcluirPaciente,
  aoSalvarAtendimento
}: PacientesPageProps) {
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(false);
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroCidade, setFiltroCidade] = useState<string>('Todas');
  const [pacienteSelecionadoId, setPacienteSelecionadoId] = useState<string | null>(
    null
  );

  const [foto, setFoto] = useState<string>('');
  const [nome, setNome] = useState<string>('');
  const [sobrenome, setSobrenome] = useState<string>('');
  const [cpf, setCpf] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [dataNascimento, setDataNascimento] = useState<string>('');
  const [endereco, setEndereco] = useState<string>('');
  const [cidade, setCidade] = useState<string>('');
  const [observacoesClinicas, setObservacoesClinicas] = useState<string>('');
  const [feedbackSalvo, setFeedbackSalvo] = useState<boolean>(false);

  const [modalNovoAberto, setModalNovoAberto] = useState<boolean>(false);

  const [modalAtdPacienteAberto, setModalAtdPacienteAberto] = useState<boolean>(false);
  const [atendimentoEmFoco, setAtendimentoEmFoco] = useState<Atendimento | null>(null);
  const [guiaTussParaVisualizar, setGuiaTussParaVisualizar] =
    useState<Atendimento | null>(null);

  const pacienteAtivo =
    pacientes.find((p) => p.id === pacienteSelecionadoId) ?? null;

  function carregarDadosNoEstado(pac: Paciente) {
    setFoto(pac.foto);
    setNome(pac.nome);
    setSobrenome(pac.sobrenome);
    setCpf(pac.cpf);
    setTelefone(pac.telefone);
    setEmail(pac.email || '');
    setDataNascimento(pac.dataNascimento);
    setEndereco(pac.endereco);
    setCidade(pac.cidade);
    setObservacoesClinicas(pac.observacoesClinicas ?? '');
    setFeedbackSalvo(false);
  }

  function abrirPaginaDinamicaPaciente(pac: Paciente) {
    setPacienteSelecionadoId(pac.id);
    carregarDadosNoEstado(pac);
  }

  function abrirModalNovoPaciente() {
    setFoto(AVATARES_SUGERIDOS[0]);
    setNome('');
    setSobrenome('');
    setCpf('');
    setTelefone('');
    setEmail('');
    setDataNascimento('1990-01-01');
    setEndereco('');
    setCidade('');
    setObservacoesClinicas('');
    setModalNovoAberto(true);
  }

  function salvarNovoPaciente(evento: FormEvent) {
    evento.preventDefault();
    if (!nome.trim() || !sobrenome.trim() || !cpf.trim()) {
      alert('Preencha pelo menos Nome, Sobrenome e CPF do paciente!');
      return;
    }

    aoSalvarPaciente({
      foto: foto.trim() || AVATARES_SUGERIDOS[0],
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      cpf: cpf.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      dataNascimento,
      endereco: endereco.trim(),
      cidade: cidade.trim(),
      observacoesClinicas: observacoesClinicas.trim()
    });

    setModalNovoAberto(false);
  }

  function salvarEdicaoPaginaDinamica(evento: FormEvent) {
    evento.preventDefault();
    if (!pacienteAtivo) return;

    if (!nome.trim() || !sobrenome.trim() || !cpf.trim()) {
      alert('Nome, Sobrenome e CPF são obrigatórios!');
      return;
    }

    aoSalvarPaciente({
      id: pacienteAtivo.id,
      foto: foto.trim() || AVATARES_SUGERIDOS[0],
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      cpf: cpf.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      dataNascimento,
      endereco: endereco.trim(),
      cidade: cidade.trim(),
      observacoesClinicas: observacoesClinicas.trim()
    });

    setFeedbackSalvo(true);
    setTimeout(() => setFeedbackSalvo(false), 3000);
  }

  if (pacienteAtivo) {
    const atendimentosDoPaciente = atendimentos.filter(
      (a) => a.pacienteId === pacienteAtivo.id
    );
    const totalInvestidoPaciente = atendimentosDoPaciente
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
              onClick={() => setPacienteSelecionadoId(null)}
            >
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </button>

            <div>
              <h1 style={{ fontSize: '1.6rem' }}>
                Prontuário — {pacienteAtivo.nome} {pacienteAtivo.sobrenome}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                ID do Paciente: <strong>{pacienteAtivo.id}</strong>
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
              src={foto || AVATARES_SUGERIDOS[0]}
              alt={`${pacienteAtivo.nome} ${pacienteAtivo.sobrenome}`}
              className="paciente-profile-avatar"
            />
            <div>
              <span className="badge badge-enviado">{pacienteAtivo.id}</span>
              <h2 style={{ fontSize: '1.35rem', marginTop: '0.5rem' }}>
                {nome} {sobrenome}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                CPF: <strong>{cpf}</strong>
              </p>
            </div>

            <div className="paciente-meta-box">
              <div className="paciente-meta-row">
                <FileText size={15} color="#778873" />
                <span>Nascimento: {formatarDataBR(dataNascimento)}</span>
              </div>
              <div className="paciente-meta-row">
                <Phone size={15} color="#778873" />
                <span>{telefone || 'Sem número'}</span>
              </div>
              <div className="paciente-meta-row">
                <Mail size={15} color="#778873" />
                <span>{email || 'Sem e-mail'}</span>
              </div>
            </div>

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
                <strong>{atendimentosDoPaciente.length}</strong>
              </div>
              <div>
                <span className="strip-label">Realizados</span>
                <strong>
                  {
                    atendimentosDoPaciente.filter((a) => a.status === 'Realizado')
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
                <strong style={{ fontSize: '1.05rem', color: 'var(--accent-color)' }}>
                  {formatarMoeda(totalInvestidoPaciente)}
                </strong>
              </div>
            </div>
          </div>

          <div className="demandas-section">
            <div>
              <h2 style={{ fontSize: '1.15rem' }}>
                Dados Cadastrais e Foto do Paciente
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.84rem',
                  marginTop: '0.15rem'
                }}
              >
                Atualize a foto por upload ou tirando na hora, além dos dados cadastrais,
                e-mail e clínicos de{' '}
                <strong>
                  {pacienteAtivo.nome} {pacienteAtivo.sobrenome}
                </strong>
                .
              </p>
            </div>

            <form
              onSubmit={salvarEdicaoPaginaDinamica}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
            >
              <PhotoPicker
                fotoAtual={foto}
                aoAlterarFoto={setFoto}
                rotulo="Foto do Paciente (Upload ou Tirar na Hora)"
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>ID do Paciente</label>
                  <input
                    type="text"
                    className="form-input"
                    value={pacienteAtivo.id}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Nome</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Sobrenome</label>
                  <input
                    type="text"
                    className="form-input"
                    value={sobrenome}
                    onChange={(e) => setSobrenome(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1.2fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>CPF</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cpf}
                    onChange={(e) => setCpf(formatarCPF(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="text"
                    className="form-input"
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
                    placeholder="paciente@email.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Data de Nascimento</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Endereço Completo</label>
                  <input
                    type="text"
                    className="form-input"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Cidade / UF</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Informações Adicionais / Observações do Paciente</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Adicione histórico clínico, convênio preferencial, alergias ou observações gerais..."
                  value={observacoesClinicas}
                  onChange={(e) => setObservacoesClinicas(e.target.value)}
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
                    ✓ Informações do paciente salvas com sucesso!
                  </span>
                ) : (
                  <span />
                )}

                <button type="submit" className="btn-primary">
                  <Save size={16} />
                  <span>Salvar Informações do Paciente</span>
                </button>
              </div>
            </form>
          </div>
        </section>

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
                  Histórico de Atendimentos de {pacienteAtivo.nome}{' '}
                  {pacienteAtivo.sobrenome} ({atendimentosDoPaciente.length})
                </span>
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  marginTop: '0.2rem'
                }}
              >
                Clique em qualquer atendimento para abrir o modal, visualizar ou imprimir a
                Guia TUSS e editar informações.
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setAtendimentoEmFoco(null);
                setModalAtdPacienteAberto(true);
              }}
            >
              <Plus size={16} />
              <span>Adicionar Atendimento ao Paciente</span>
            </button>
          </div>

          <div className="table-container">
            <table className="demandas-table">
              <thead>
                <tr>
                  <th>Código Atd.</th>
                  <th>Médico Responsável</th>
                  <th>Especialidade</th>
                  <th>Descrição do Atendimento</th>
                  <th>Data e Hora</th>
                  <th>Operadora</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {atendimentosDoPaciente.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        padding: '2rem'
                      }}
                    >
                      Este paciente ainda não possui atendimentos registrados.
                    </td>
                  </tr>
                ) : (
                  atendimentosDoPaciente.map((atd) => {
                    const temDesc =
                      atd.operadora === 'Particular' && (atd.desconto ?? 0) > 0;

                    return (
                      <tr
                        key={atd.id}
                        className="clickable-row"
                        onClick={() => {
                          setAtendimentoEmFoco(atd);
                          setModalAtdPacienteAberto(true);
                        }}
                        title="Clique para abrir o atendimento e visualizar a Guia TUSS no modal"
                      >
                        <td style={{ fontWeight: 700, color: '#778873' }}>{atd.id}</td>
                        <td style={{ fontWeight: 600 }}>{atd.medicoNome}</td>
                        <td>{atd.especialidade}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{atd.descricao}</td>
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

        {modalAtdPacienteAberto && (
          <ModalAtendimento
            atendimentoInicial={atendimentoEmFoco}
            pacientes={pacientes}
            medicos={medicos}
            operadoras={operadoras}
            pacientePreSelecionadoId={pacienteAtivo.id}
            aoFechar={() => {
              setModalAtdPacienteAberto(false);
              setAtendimentoEmFoco(null);
            }}
            aoSalvarAtendimento={aoSalvarAtendimento}
            aoVisualizarGuiaTuss={(atd) => setGuiaTussParaVisualizar(atd)}
            aoImprimirGuiaTuss={(atd) =>
              imprimirGuiaTussAtendimento(
                atd,
                pacienteAtivo,
                medicos.find((m) => m.id === atd.medicoId)
              )
            }
          />
        )}

        {guiaTussParaVisualizar && (
          <ModalGuiaTuss
            atendimento={guiaTussParaVisualizar}
            paciente={pacienteAtivo}
            medico={medicos.find((m) => m.id === guiaTussParaVisualizar.medicoId)}
            aoFechar={() => setGuiaTussParaVisualizar(null)}
          />
        )}
      </main>
    );
  }

  const cidadesUnicas = Array.from(new Set(pacientes.map((p) => p.cidade)));

  const qtdFiltrosAtivos =
    (buscaTexto.trim() ? 1 : 0) + (filtroCidade !== 'Todas' ? 1 : 0);

  function limparFiltros() {
    setBuscaTexto('');
    setFiltroCidade('Todas');
  }

  const pacientesFiltrados = pacientes.filter((p) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const nomeCompleto = `${p.nome} ${p.sobrenome}`.toLocaleLowerCase();
    const bateTexto =
      p.id.toLocaleLowerCase().includes(termo) ||
      nomeCompleto.includes(termo) ||
      p.cpf.toLocaleLowerCase().includes(termo) ||
      (p.email || '').toLocaleLowerCase().includes(termo) ||
      p.cidade.toLocaleLowerCase().includes(termo);
    const bateCidade = filtroCidade === 'Todas' || p.cidade === filtroCidade;
    return bateTexto && bateCidade;
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
            Prontuário de Pacientes
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Clique em qualquer paciente para abrir as informações cadastrais, e-mail, foto
            e histórico de atendimentos.
          </p>
        </div>

        <button className="btn-primary" onClick={abrirModalNovoPaciente}>
          <Plus size={18} />
          <span>Cadastrar Paciente</span>
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
              <Users size={18} color="#778873" />
              <span>Pacientes Cadastrados ({pacientesFiltrados.length})</span>
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginTop: '0.2rem'
              }}
            >
              Clique na linha do paciente para acessar sua ficha individual.
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
              placeholder="Buscar por nome, e-mail, CPF, ID ou cidade..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filtroCidade}
            onChange={(e) => setFiltroCidade(e.target.value)}
          >
            <option value="Todas">Cidade / UF: Todas</option>
            {cidadesUnicas.map((cid) => (
              <option key={cid} value={cid}>
                {cid}
              </option>
            ))}
          </select>
        </ExpandableFilterPanel>

        <div className="table-container">
          <table className="demandas-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>ID</th>
                <th>Telefone</th>
                <th>Nascimento</th>
                <th>Cidade</th>
                <th>Atendimentos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pacientesFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      padding: '2rem'
                    }}
                  >
                    Nenhum paciente encontrado para os termos pesquisados.
                  </td>
                </tr>
              ) : (
                pacientesFiltrados.map((pac) => {
                  const qtdAtd = atendimentos.filter(
                    (a) => a.pacienteId === pac.id
                  ).length;

                  return (
                    <tr
                      key={pac.id}
                      className="clickable-row"
                      onClick={() => abrirPaginaDinamicaPaciente(pac)}
                      title="Clique para abrir as informações deste paciente"
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
                            src={pac.foto}
                            alt={`${pac.nome} ${pac.sobrenome}`}
                            className="paciente-table-avatar"
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {pac.nome} {pac.sobrenome}
                            </div>
                            <small style={{ color: 'var(--text-secondary)' }}>
                              {pac.email || 'Ver ficha completa →'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#778873' }}>{pac.id}</td>
                      <td>{pac.telefone}</td>
                      <td>{formatarDataBR(pac.dataNascimento)}</td>
                      <td>{pac.cidade}</td>
                      <td>
                        <span className="badge badge-faturar">
                          {qtdAtd} {qtdAtd === 1 ? 'atendimento' : 'atendimentos'}
                        </span>
                      </td>
                      <td>
                        <ActionMenu
                          opcoes={[
                            {
                              rotulo: 'Abrir Ficha do Paciente',
                              icone: <User size={14} />,
                              aoClicar: () => abrirPaginaDinamicaPaciente(pac)
                            },
                            {
                              rotulo: 'Editar Informações',
                              icone: <Pencil size={14} />,
                              aoClicar: () => abrirPaginaDinamicaPaciente(pac)
                            }
                          ]}
                          aoExcluir={() => aoExcluirPaciente(pac.id)}
                          tituloExcluir="Excluir Paciente"
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
              <h3 style={{ fontSize: '1.2rem' }}>Cadastrar Novo Paciente</h3>
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
              onSubmit={salvarNovoPaciente}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
            >
              <PhotoPicker
                fotoAtual={foto}
                aoAlterarFoto={setFoto}
                rotulo="Foto do Paciente (Upload ou Tirar na Hora)"
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Nome</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Helena"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Sobrenome</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Vasconcelos"
                    value={sobrenome}
                    onChange={(e) => setSobrenome(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1.2fr 1fr',
                  gap: '0.75rem'
                }}
              >
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
                    placeholder="paciente@email.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Data de Nascimento</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Endereço</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Rua, Número, Bairro"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Cidade / UF</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="São Paulo - SP"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observações Clínicas Iniciais</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Informações adicionais..."
                  value={observacoesClinicas}
                  onChange={(e) => setObservacoesClinicas(e.target.value)}
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
                  <span>Salvar Paciente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
