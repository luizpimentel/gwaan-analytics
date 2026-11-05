import { useState, type FormEvent } from 'react';
import {
  Sparkles,
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
  Mail,
  Eye,
  Printer,
  Briefcase,
  Share2,
  Trash2
} from 'lucide-react';
import type {
  CategoriaClienteVIP,
  ClienteVIP,
  Profissional,
  StatusVisitaMarketing,
  VisitaMarketing
} from '../data/dadosFaturamento';
import {
  formatarCPF,
  formatarDataBR,
  formatarMoeda,
  formatarTelefone
} from '../utils/formatadores';
import { ActionMenu } from '../components/ActionMenu';
import { PhotoPicker } from '../components/PhotoPicker';
import {
  ExpandableFilterPanel,
  ExpandableFilterToggle
} from '../components/ExpandableFilterBar';

interface ClientesPageProps {
  clientesVip: ClienteVIP[];
  profissionais: Profissional[];
  aoSalvarClienteVip: (dados: Omit<ClienteVIP, 'id'> & { id?: string }) => void;
  aoExcluirClienteVip: (id: string) => void;
}

const FOTO_VIP_PADRAO =
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&auto=format&fit=crop&q=80';

const CATEGORIAS_VIP: CategoriaClienteVIP[] = [
  'Influencer',
  'Cliente VIP',
  'Embaixador',
  'Parceiro Marketing'
];

export function imprimirContratoClienteVIP(cliente: ClienteVIP) {
  const nomeCompleto = `${cliente.nome} ${cliente.sobrenome}`.trim();
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Contrato ${cliente.numeroContrato} — ${nomeCompleto}</title>
  <style>
    * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; }
    body { padding: 36px; color: #1f2920; background: #fff; line-height: 1.55; }
    .header { border: 2px solid #4d5e4a; border-radius: 10px; padding: 18px 22px; background: #f5f7ed; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .title { font-size: 17px; font-weight: 700; text-transform: uppercase; color: #2c352b; }
    .subtitle { font-size: 12px; color: #5a6b57; margin-top: 4px; }
    .section { margin-top: 16px; border: 1px solid #b8c9a9; border-radius: 8px; overflow: hidden; }
    .section-head { background: #e5ecd0; padding: 8px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #2c352b; }
    .section-body { padding: 12px 14px; font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .label { font-size: 10px; text-transform: uppercase; color: #5a6b57; font-weight: 700; display: block; }
    .val { font-size: 13px; font-weight: 600; color: #1f2920; }
    .clauses { white-space: pre-line; font-size: 13px; color: #1f2920; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 56px; }
    .sig { border-top: 1px solid #2c352b; text-align: center; padding-top: 8px; font-size: 12px; color: #5a6b57; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">INSTRUMENTO PARTICULAR DE PARCERIA DE MARKETING E ATENDIMENTO VIP</div>
      <div class="subtitle">Gwaan Analytics — Gestão Clínica, Relacionamento VIP & Marketing Institucional</div>
    </div>
    <div style="text-align: right;">
      <span class="label">Nº do Contrato</span>
      <span class="val" style="font-size: 15px;">${cliente.numeroContrato}</span>
      <div class="subtitle">Categoria: ${cliente.categoriaVip}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-head">1. Identificação do Cliente VIP / Influencer</div>
    <div class="section-body grid">
      <div><span class="label">Nome Completo</span><span class="val">${nomeCompleto}</span></div>
      <div><span class="label">CPF</span><span class="val">${cliente.cpf}</span></div>
      <div><span class="label">Código VIP</span><span class="val">${cliente.id}</span></div>
      <div><span class="label">Rede Social Principal</span><span class="val">${cliente.redeSocial}</span></div>
      <div><span class="label">Alcance / Métrica</span><span class="val">${cliente.alcanceSeguidores}</span></div>
      <div><span class="label">Contato Direto</span><span class="val">${cliente.telefone} • ${cliente.email}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-head">2. Assessor / Representante Legal e Comercial</div>
    <div class="section-body grid">
      <div><span class="label">Assessor / Agência</span><span class="val">${cliente.assessorNome || '-'}</span></div>
      <div><span class="label">Telefone do Assessor</span><span class="val">${cliente.assessorTelefone || '-'}</span></div>
      <div><span class="label">E-mail do Assessor</span><span class="val">${cliente.assessorEmail || '-'}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-head">3. Vigência, Valor de Permuta / Cota e Escopo de Marketing</div>
    <div class="section-body">
      <div class="grid" style="margin-bottom: 10px;">
        <div><span class="label">Vigência Contratual</span><span class="val">${cliente.vigenciaContrato}</span></div>
        <div><span class="label">Valor Mensal / Cota Permuta</span><span class="val">${formatarMoeda(cliente.valorPermutaMensal)}</span></div>
        <div><span class="label">Visitas Programadas</span><span class="val">${cliente.datasVisitas.length} visita(s) registrada(s)</span></div>
      </div>
      <div>
        <span class="label">Escopo de Entregas e Contrapartidas de Marketing</span>
        <p class="val" style="margin-top: 3px;">${cliente.escopoMarketing}</p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-head">4. Cláusulas e Condições Especiais</div>
    <div class="section-body clauses">${cliente.clausulasContrato}</div>
  </div>

  <div class="signatures">
    <div class="sig"><strong>Gwaan Clínica & Diagnósticos</strong><br/>Diretoria de Marketing e Relacionamento VIP</div>
    <div class="sig"><strong>${nomeCompleto}</strong><br/>Representado(a) por: ${cliente.assessorNome || 'Próprio(a)'}</div>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=940,height=740');
  if (!win) {
    window.print();
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 250);
}

function obterClasseBadgeVisita(status: StatusVisitaMarketing): string {
  switch (status) {
    case 'Agendada':
      return 'badge badge-auditoria';
    case 'Confirmada':
      return 'badge badge-faturado';
    case 'Realizada':
      return 'badge badge-enviado';
    case 'Cancelada':
      return 'badge badge-glosado';
    default:
      return 'badge';
  }
}

export function ClientesPage({
  clientesVip,
  profissionais,
  aoSalvarClienteVip,
  aoExcluirClienteVip
}: ClientesPageProps) {
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(false);
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');

  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(
    null
  );

  const [foto, setFoto] = useState<string>(FOTO_VIP_PADRAO);
  const [nome, setNome] = useState<string>('');
  const [sobrenome, setSobrenome] = useState<string>('');
  const [cpf, setCpf] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [dataNascimento, setDataNascimento] = useState<string>('1995-01-01');
  const [endereco, setEndereco] = useState<string>('');
  const [cidade, setCidade] = useState<string>('São Paulo - SP');
  const [categoriaVip, setCategoriaVip] =
    useState<CategoriaClienteVIP>('Influencer');
  const [redeSocial, setRedeSocial] = useState<string>('');
  const [alcanceSeguidores, setAlcanceSeguidores] = useState<string>('');
  const [assessorNome, setAssessorNome] = useState<string>('');
  const [assessorTelefone, setAssessorTelefone] = useState<string>('');
  const [assessorEmail, setAssessorEmail] = useState<string>('');
  const [numeroContrato, setNumeroContrato] = useState<string>('');
  const [vigenciaContrato, setVigenciaContrato] = useState<string>('');
  const [valorPermutaMensal, setValorPermutaMensal] = useState<string>('5000');
  const [escopoMarketing, setEscopoMarketing] = useState<string>('');
  const [clausulasContrato, setClausulasContrato] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [datasVisitas, setDatasVisitas] = useState<VisitaMarketing[]>([]);
  const [feedbackSalvo, setFeedbackSalvo] = useState<boolean>(false);

  const [modalNovoAberto, setModalNovoAberto] = useState<boolean>(false);
  const [contratoParaVisualizar, setContratoParaVisualizar] =
    useState<ClienteVIP | null>(null);

  const [modalVisitaAberto, setModalVisitaAberto] = useState<boolean>(false);
  const [visitaEditando, setVisitaEditando] = useState<VisitaMarketing | null>(
    null
  );
  const [visitaData, setVisitaData] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [visitaHora, setVisitaHora] = useState<string>('10:00');
  const [visitaObjetivo, setVisitaObjetivo] = useState<string>('');
  const [visitaResponsavel, setVisitaResponsavel] = useState<string>('');
  const [visitaStatus, setVisitaStatus] =
    useState<StatusVisitaMarketing>('Agendada');
  const [visitaObs, setVisitaObs] = useState<string>('');

  const clienteAtivo =
    clientesVip.find((c) => c.id === clienteSelecionadoId) ?? null;

  const qtdFiltrosAtivos =
    (buscaTexto.trim() ? 1 : 0) + (filtroCategoria !== 'Todas' ? 1 : 0);

  function limparFiltros() {
    setBuscaTexto('');
    setFiltroCategoria('Todas');
  }

  function carregarDadosNoEstado(cli: ClienteVIP) {
    setFoto(cli.foto || FOTO_VIP_PADRAO);
    setNome(cli.nome);
    setSobrenome(cli.sobrenome);
    setCpf(cli.cpf);
    setTelefone(cli.telefone);
    setEmail(cli.email);
    setDataNascimento(cli.dataNascimento);
    setEndereco(cli.endereco);
    setCidade(cli.cidade);
    setCategoriaVip(cli.categoriaVip);
    setRedeSocial(cli.redeSocial);
    setAlcanceSeguidores(cli.alcanceSeguidores);
    setAssessorNome(cli.assessorNome);
    setAssessorTelefone(cli.assessorTelefone);
    setAssessorEmail(cli.assessorEmail);
    setNumeroContrato(cli.numeroContrato);
    setVigenciaContrato(cli.vigenciaContrato);
    setValorPermutaMensal(String(cli.valorPermutaMensal));
    setEscopoMarketing(cli.escopoMarketing);
    setClausulasContrato(cli.clausulasContrato);
    setObservacoes(cli.observacoes ?? '');
    setDatasVisitas(cli.datasVisitas ?? []);
    setFeedbackSalvo(false);
  }

  function abrirPaginaDinamicaCliente(cli: ClienteVIP) {
    setClienteSelecionadoId(cli.id);
    carregarDadosNoEstado(cli);
  }

  function abrirModalNovoCliente() {
    setFoto(FOTO_VIP_PADRAO);
    setNome('');
    setSobrenome('');
    setCpf('');
    setTelefone('');
    setEmail('');
    setDataNascimento('1995-01-01');
    setEndereco('');
    setCidade('São Paulo - SP');
    setCategoriaVip('Influencer');
    setRedeSocial('@');
    setAlcanceSeguidores('');
    setAssessorNome('');
    setAssessorTelefone('');
    setAssessorEmail('');
    setNumeroContrato(
      `CTR-MKT-${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`
    );
    setVigenciaContrato(
      `01/01/${new Date().getFullYear()} a 31/12/${new Date().getFullYear()}`
    );
    setValorPermutaMensal('6000');
    setEscopoMarketing(
      'Visitas mensais programadas para divulgação institucional em Stories e Reels.'
    );
    setClausulasContrato(
      '1. Parceria de marketing institucional e permuta clínica VIP.\n2. Agendamento prévio das datas de visita com a assessoria.'
    );
    setObservacoes('');
    setDatasVisitas([]);
    setModalNovoAberto(true);
  }

  function salvarNovoCliente(evento: FormEvent) {
    evento.preventDefault();
    if (!nome.trim() || !sobrenome.trim() || !cpf.trim()) {
      alert('Preencha Nome, Sobrenome e CPF do Cliente VIP / Influencer!');
      return;
    }

    aoSalvarClienteVip({
      foto: foto.trim() || FOTO_VIP_PADRAO,
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      cpf: cpf.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      dataNascimento,
      endereco: endereco.trim(),
      cidade: cidade.trim(),
      categoriaVip,
      redeSocial: redeSocial.trim() || '@vip',
      alcanceSeguidores: alcanceSeguidores.trim() || 'VIP',
      assessorNome: assessorNome.trim(),
      assessorTelefone: assessorTelefone.trim(),
      assessorEmail: assessorEmail.trim(),
      numeroContrato: numeroContrato.trim() || 'CTR-VIP',
      vigenciaContrato: vigenciaContrato.trim(),
      valorPermutaMensal: Math.max(0, parseFloat(valorPermutaMensal) || 0),
      escopoMarketing: escopoMarketing.trim(),
      clausulasContrato: clausulasContrato.trim(),
      observacoes: observacoes.trim(),
      datasVisitas
    });

    setModalNovoAberto(false);
  }

  function salvarEdicaoPaginaDinamica(evento: FormEvent) {
    evento.preventDefault();
    if (!clienteAtivo) return;

    if (!nome.trim() || !sobrenome.trim() || !cpf.trim()) {
      alert('Nome, Sobrenome e CPF são obrigatórios!');
      return;
    }

    aoSalvarClienteVip({
      id: clienteAtivo.id,
      foto: foto.trim() || FOTO_VIP_PADRAO,
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      cpf: cpf.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      dataNascimento,
      endereco: endereco.trim(),
      cidade: cidade.trim(),
      categoriaVip,
      redeSocial: redeSocial.trim(),
      alcanceSeguidores: alcanceSeguidores.trim(),
      assessorNome: assessorNome.trim(),
      assessorTelefone: assessorTelefone.trim(),
      assessorEmail: assessorEmail.trim(),
      numeroContrato: numeroContrato.trim(),
      vigenciaContrato: vigenciaContrato.trim(),
      valorPermutaMensal: Math.max(0, parseFloat(valorPermutaMensal) || 0),
      escopoMarketing: escopoMarketing.trim(),
      clausulasContrato: clausulasContrato.trim(),
      observacoes: observacoes.trim(),
      datasVisitas
    });

    setFeedbackSalvo(true);
    setTimeout(() => setFeedbackSalvo(false), 3000);
  }

  function abrirModalNovaVisita() {
    setVisitaEditando(null);
    setVisitaData(new Date().toISOString().slice(0, 10));
    setVisitaHora('10:00');
    setVisitaObjetivo('');
    setVisitaResponsavel(profissionais[0]?.nome ?? 'Equipe de Marketing');
    setVisitaStatus('Agendada');
    setVisitaObs('');
    setModalVisitaAberto(true);
  }

  function abrirModalEditarVisita(visita: VisitaMarketing) {
    setVisitaEditando(visita);
    setVisitaData(visita.data);
    setVisitaHora(visita.hora);
    setVisitaObjetivo(visita.objetivo);
    setVisitaResponsavel(visita.responsavel);
    setVisitaStatus(visita.status);
    setVisitaObs(visita.observacoes ?? '');
    setModalVisitaAberto(true);
  }

  function salvarVisitaMarketing(evento: FormEvent) {
    evento.preventDefault();
    if (!clienteAtivo) return;
    if (!visitaObjetivo.trim()) {
      alert('Informe o objetivo ou pauta de marketing da visita!');
      return;
    }

    let novasVisitas: VisitaMarketing[];
    if (visitaEditando) {
      novasVisitas = datasVisitas.map((v) =>
        v.id === visitaEditando.id
          ? {
              ...v,
              data: visitaData,
              hora: visitaHora,
              objetivo: visitaObjetivo.trim(),
              responsavel: visitaResponsavel.trim(),
              status: visitaStatus,
              observacoes: visitaObs.trim()
            }
          : v
      );
    } else {
      const nova: VisitaMarketing = {
        id: `VIS-${Math.floor(100 + Math.random() * 900)}`,
        data: visitaData,
        hora: visitaHora,
        objetivo: visitaObjetivo.trim(),
        responsavel: visitaResponsavel.trim(),
        status: visitaStatus,
        observacoes: visitaObs.trim()
      };
      novasVisitas = [nova, ...datasVisitas];
    }

    setDatasVisitas(novasVisitas);
    aoSalvarClienteVip({
      ...clienteAtivo,
      id: clienteAtivo.id,
      datasVisitas: novasVisitas
    });

    setModalVisitaAberto(false);
    setVisitaEditando(null);
  }

  function excluirVisitaMarketing(idVisita: string) {
    if (!clienteAtivo) return;
    const novasVisitas = datasVisitas.filter((v) => v.id !== idVisita);
    setDatasVisitas(novasVisitas);
    aoSalvarClienteVip({
      ...clienteAtivo,
      id: clienteAtivo.id,
      datasVisitas: novasVisitas
    });
  }

  if (clienteAtivo) {
    const qtdRealizadas = datasVisitas.filter(
      (v) => v.status === 'Realizada'
    ).length;
    const clienteAtualizadoPreview: ClienteVIP = {
      id: clienteAtivo.id,
      foto,
      nome,
      sobrenome,
      cpf,
      telefone,
      email,
      dataNascimento,
      endereco,
      cidade,
      categoriaVip,
      redeSocial,
      alcanceSeguidores,
      assessorNome,
      assessorTelefone,
      assessorEmail,
      numeroContrato,
      vigenciaContrato,
      valorPermutaMensal: parseFloat(valorPermutaMensal) || 0,
      escopoMarketing,
      clausulasContrato,
      observacoes,
      datasVisitas
    };

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
              onClick={() => setClienteSelecionadoId(null)}
            >
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </button>

            <div>
              <h1 style={{ fontSize: '1.6rem' }}>
                Ficha VIP / Marketing — {clienteAtivo.nome}{' '}
                {clienteAtivo.sobrenome}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                Código: <strong>{clienteAtivo.id}</strong> • Contrato:{' '}
                <strong>{numeroContrato}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setContratoParaVisualizar(clienteAtualizadoPreview)}
            >
              <Eye size={16} />
              <span>Visualizar Contrato</span>
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => imprimirContratoClienteVIP(clienteAtualizadoPreview)}
            >
              <Printer size={16} />
              <span>Imprimir Contrato</span>
            </button>
          </div>
        </div>

        <section className="grade-painel-duplo">
          <div
            className="demandas-section"
            style={{ alignItems: 'center', textAlign: 'center' }}
          >
            <img
              src={foto || FOTO_VIP_PADRAO}
              alt={`${nome} ${sobrenome}`}
              className="cliente-profile-avatar"
            />
            <div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.4rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <span className="badge badge-enviado">{clienteAtivo.id}</span>
                <span className="badge badge-faturar">{categoriaVip}</span>
              </div>
              <h2 style={{ fontSize: '1.35rem', marginTop: '0.5rem' }}>
                {nome} {sobrenome}
              </h2>
              <p
                style={{
                  color: 'var(--accent-color)',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                {redeSocial} • {alcanceSeguidores}
              </p>
            </div>

            <div className="cliente-meta-box">
              <div className="cliente-meta-row">
                <FileText size={15} color="#778873" />
                <span>Nascimento: {formatarDataBR(dataNascimento)}</span>
              </div>
              <div className="cliente-meta-row">
                <Phone size={15} color="#778873" />
                <span>{telefone || 'Sem número'}</span>
              </div>
              <div className="cliente-meta-row">
                <Mail size={15} color="#778873" />
                <span>{email || 'Sem e-mail'}</span>
              </div>
              <div className="cliente-meta-row">
                <Briefcase size={15} color="#778873" />
                <span>
                  Assessor: <strong>{assessorNome || 'Não informado'}</strong>
                </span>
              </div>
              {assessorTelefone && (
                <div className="cliente-meta-row">
                  <Share2 size={15} color="#778873" />
                  <span>Contato Assessor: {assessorTelefone}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <button
                type="button"
                className="btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setContratoParaVisualizar(clienteAtualizadoPreview)}
              >
                <Eye size={15} />
                <span>Contrato</span>
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => imprimirContratoClienteVIP(clienteAtualizadoPreview)}
              >
                <Printer size={15} />
                <span>Imprimir</span>
              </button>
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
                <span className="strip-label">Visitas Marketing</span>
                <strong>{datasVisitas.length}</strong>
              </div>
              <div>
                <span className="strip-label">Realizadas</span>
                <strong>{qtdRealizadas}</strong>
              </div>
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.55rem'
                }}
              >
                <span className="strip-label">Cota / Permuta Mensal</span>
                <strong
                  style={{ fontSize: '1.05rem', color: 'var(--accent-color)' }}
                >
                  {formatarMoeda(parseFloat(valorPermutaMensal) || 0)}
                </strong>
              </div>
            </div>
          </div>

          <div className="demandas-section">
            <div>
              <h2 style={{ fontSize: '1.15rem' }}>
                Dados Cadastrais, Assessoria e Contrato de Marketing
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.84rem',
                  marginTop: '0.15rem'
                }}
              >
                Gerencie as informações pessoais, dados do Assessor/Representante e
                termos do contrato de parceria de{' '}
                <strong>
                  {clienteAtivo.nome} {clienteAtivo.sobrenome}
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
                rotulo="Foto do Cliente VIP / Influencer"
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.75rem'
                }}
              >
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

                <div className="form-group">
                  <label>Categoria VIP</label>
                  <select
                    className="form-input"
                    value={categoriaVip}
                    onChange={(e) =>
                      setCategoriaVip(e.target.value as CategoriaClienteVIP)
                    }
                  >
                    {CATEGORIAS_VIP.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
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
                  <label>Telefone Direto</label>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Nascimento</label>
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
                  gridTemplateColumns: '1fr 1.2fr 1.2fr 0.9fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Rede Social (@handle)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="@usuario"
                    value={redeSocial}
                    onChange={(e) => setRedeSocial(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Alcance / Seguidores</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: 1.2M seguidores"
                    value={alcanceSeguidores}
                    onChange={(e) => setAlcanceSeguidores(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Endereço</label>
                  <input
                    type="text"
                    className="form-input"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Cidade / UF</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                  />
                </div>
              </div>

              <div className="guias-lote-box">
                <strong>Dados do Assessor / Representante</strong>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.3fr 1fr 1.2fr',
                    gap: '0.75rem'
                  }}
                >
                  <div className="form-group">
                    <label>Nome do Assessor / Agência</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Rodrigo Albuquerque (Agência Lumina)"
                      value={assessorNome}
                      onChange={(e) => setAssessorNome(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Telefone do Assessor</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="(11) 99999-0000"
                      value={assessorTelefone}
                      onChange={(e) =>
                        setAssessorTelefone(formatarTelefone(e.target.value))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>E-mail do Assessor</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="assessoria@agencia.com.br"
                      value={assessorEmail}
                      onChange={(e) => setAssessorEmail(e.target.value)}
                    />
                  </div>
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
                  <strong>Contrato de Parceria / Marketing</strong>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn-action"
                      onClick={() =>
                        setContratoParaVisualizar(clienteAtualizadoPreview)
                      }
                    >
                      <Eye size={13} />
                      <span>Visualizar Contrato</span>
                    </button>
                    <button
                      type="button"
                      className="btn-action"
                      onClick={() =>
                        imprimirContratoClienteVIP(clienteAtualizadoPreview)
                      }
                    >
                      <Printer size={13} />
                      <span>Imprimir Contrato</span>
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.2fr 1fr',
                    gap: '0.75rem'
                  }}
                >
                  <div className="form-group">
                    <label>Número do Contrato</label>
                    <input
                      type="text"
                      className="form-input"
                      value={numeroContrato}
                      onChange={(e) => setNumeroContrato(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Vigência do Contrato</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="01/01/2026 a 31/12/2026"
                      value={vigenciaContrato}
                      onChange={(e) => setVigenciaContrato(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Cota / Permuta Mensal (R$)</label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      className="form-input"
                      value={valorPermutaMensal}
                      onChange={(e) => setValorPermutaMensal(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Escopo de Entregas / Divulgação</label>
                  <input
                    type="text"
                    className="form-input"
                    value={escopoMarketing}
                    onChange={(e) => setEscopoMarketing(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Cláusulas e Termos do Contrato</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={clausulasContrato}
                    onChange={(e) => setClausulasContrato(e.target.value)}
                  />
                </div>
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
                    ✓ Dados do Cliente VIP e Contrato salvos com sucesso!
                  </span>
                ) : (
                  <span />
                )}

                <button type="submit" className="btn-primary">
                  <Save size={16} />
                  <span>Salvar Alterações do Cliente VIP</span>
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
                  Cronograma de Datas de Visitas — Marketing & VIP (
                  {datasVisitas.length})
                </span>
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  marginTop: '0.2rem'
                }}
              >
                Cadastre e acompanhe as datas de visitas presenciais, gravações e
                atendimentos de parceria deste cliente VIP / influencer.
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={abrirModalNovaVisita}
            >
              <Plus size={16} />
              <span>Cadastrar Data de Visita</span>
            </button>
          </div>

          <div className="table-container">
            <table className="demandas-table">
              <thead>
                <tr>
                  <th>Cód. Visita</th>
                  <th>Data e Hora</th>
                  <th>Objetivo / Ação de Marketing</th>
                  <th>Profissional / Responsável</th>
                  <th>Observações</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {datasVisitas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        padding: '2rem'
                      }}
                    >
                      Nenhuma data de visita cadastrada para este cliente VIP.
                    </td>
                  </tr>
                ) : (
                  datasVisitas.map((vis) => (
                    <tr
                      key={vis.id}
                      className="clickable-row"
                      onClick={() => abrirModalEditarVisita(vis)}
                      title="Clique para editar esta data de visita"
                    >
                      <td style={{ fontWeight: 700, color: '#778873' }}>{vis.id}</td>
                      <td>
                        <strong>{formatarDataBR(vis.data)}</strong> às {vis.hora}
                      </td>
                      <td style={{ fontWeight: 600 }}>{vis.objetivo}</td>
                      <td>{vis.responsavel}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                        {vis.observacoes || '-'}
                      </td>
                      <td>
                        <span className={obterClasseBadgeVisita(vis.status)}>
                          {vis.status}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => abrirModalEditarVisita(vis)}
                          >
                            <Pencil size={13} />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            className="btn-danger"
                            onClick={() => excluirVisitaMarketing(vis.id)}
                            title="Remover data de visita"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {modalVisitaAberto && (
          <div
            className="modal-overlay"
            onClick={() => setModalVisitaAberto(false)}
          >
            <div
              className="modal-content modal-content-80"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 style={{ fontSize: '1.15rem' }}>
                  {visitaEditando
                    ? `Editar Data de Visita (${visitaEditando.id})`
                    : `Agendar Nova Visita de Marketing — ${clienteAtivo.nome}`}
                </h3>
                <button
                  type="button"
                  className="btn-realtime"
                  onClick={() => setModalVisitaAberto(false)}
                  style={{ padding: '0.3rem 0.5rem' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={salvarVisitaMarketing}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0.75rem'
                  }}
                >
                  <div className="form-group">
                    <label>Data da Visita</label>
                    <input
                      type="date"
                      className="form-input"
                      value={visitaData}
                      onChange={(e) => setVisitaData(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Horário</label>
                    <input
                      type="time"
                      className="form-input"
                      value={visitaHora}
                      onChange={(e) => setVisitaHora(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Status da Visita</label>
                    <select
                      className="form-input"
                      value={visitaStatus}
                      onChange={(e) =>
                        setVisitaStatus(e.target.value as StatusVisitaMarketing)
                      }
                    >
                      <option value="Agendada">Agendada</option>
                      <option value="Confirmada">Confirmada</option>
                      <option value="Realizada">Realizada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Objetivo / Pauta da Visita (Marketing / Procedimento)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Gravação de Reels Institucional + Check-up Preventivo"
                    value={visitaObjetivo}
                    onChange={(e) => setVisitaObjetivo(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Profissional ou Equipe Responsável</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Dra. Larissa Peixoto / Equipe de Marketing"
                    value={visitaResponsavel}
                    onChange={(e) => setVisitaResponsavel(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Observações da Visita</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Detalhes de recepção, equipe de filmagem ou resultados..."
                    value={visitaObs}
                    onChange={(e) => setVisitaObs(e.target.value)}
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-realtime"
                    onClick={() => setModalVisitaAberto(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    <Check size={16} />
                    <span>Salvar Data de Visita</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {contratoParaVisualizar && (
          <ModalContratoVIP
            cliente={contratoParaVisualizar}
            aoFechar={() => setContratoParaVisualizar(null)}
          />
        )}
      </main>
    );
  }

  const filtrados = clientesVip.filter((c) => {
    const termo = buscaTexto.toLocaleLowerCase();
    const nomeCompleto = `${c.nome} ${c.sobrenome}`.toLocaleLowerCase();
    const bateTexto =
      c.id.toLocaleLowerCase().includes(termo) ||
      nomeCompleto.includes(termo) ||
      c.redeSocial.toLocaleLowerCase().includes(termo) ||
      c.assessorNome.toLocaleLowerCase().includes(termo) ||
      c.numeroContrato.toLocaleLowerCase().includes(termo);
    const bateCat =
      filtroCategoria === 'Todas' || c.categoriaVip === filtroCategoria;
    return bateTexto && bateCat;
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
            Clientes VIP e Influencers (Marketing)
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Gerencie parcerias de marketing, contratos clicáveis para visualização/impressão,
            assessores/representantes e cronograma de datas de visitas.
          </p>
        </div>

        <button className="btn-primary" onClick={abrirModalNovoCliente}>
          <Plus size={18} />
          <span>Cadastrar Cliente VIP / Influencer</span>
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
              <Sparkles size={18} color="#778873" />
              <span>Carteira de Clientes VIP e Influencers ({filtrados.length})</span>
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginTop: '0.2rem'
              }}
            >
              Clique em qualquer registro para abrir a ficha completa, contrato e agenda de
              visitas.
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
              placeholder="Buscar por nome, @redeSocial, assessor ou nº de contrato..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="Todas">Categoria: Todas</option>
            {CATEGORIAS_VIP.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </ExpandableFilterPanel>

        <div className="table-container">
          <table className="demandas-table">
            <thead>
              <tr>
                <th>Cliente VIP / Influencer</th>
                <th>ID</th>
                <th>Categoria / Rede Social</th>
                <th>Assessor / Representante</th>
                <th>Telefone</th>
                <th>Contrato (Marketing)</th>
                <th>Datas de Visitas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      padding: '2rem'
                    }}
                  >
                    Nenhum cliente VIP ou influencer encontrado.
                  </td>
                </tr>
              ) : (
                filtrados.map((cli) => {
                  const proxVisita = cli.datasVisitas[0];

                  return (
                    <tr
                      key={cli.id}
                      className="clickable-row"
                      onClick={() => abrirPaginaDinamicaCliente(cli)}
                      title="Clique para abrir a ficha completa do Cliente VIP / Influencer"
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
                            src={cli.foto || FOTO_VIP_PADRAO}
                            alt={`${cli.nome} ${cli.sobrenome}`}
                            className="cliente-table-avatar"
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {cli.nome} {cli.sobrenome}
                            </div>
                            <small style={{ color: 'var(--text-secondary)' }}>
                              {cli.email}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#778873' }}>{cli.id}</td>
                      <td>
                        <span className="badge badge-faturar">{cli.categoriaVip}</span>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            marginTop: '0.2rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {cli.redeSocial} ({cli.alcanceSeguidores})
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{cli.assessorNome || '-'}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>
                          {cli.assessorTelefone}
                        </small>
                      </td>
                      <td>{cli.telefone}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontFamily: 'monospace',
                            fontSize: '0.82rem',
                            marginBottom: '0.25rem'
                          }}
                        >
                          {cli.numeroContrato}
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => setContratoParaVisualizar(cli)}
                            title="Visualizar Contrato de Marketing"
                          >
                            <Eye size={13} />
                            <span>Visualizar</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => imprimirContratoClienteVIP(cli)}
                            title="Imprimir Contrato de Marketing"
                          >
                            <Printer size={13} />
                            <span>Imprimir</span>
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-faturado">
                          {cli.datasVisitas.length}{' '}
                          {cli.datasVisitas.length === 1 ? 'visita' : 'visitas'}
                        </span>
                        {proxVisita && (
                          <div
                            style={{
                              fontSize: '0.76rem',
                              color: 'var(--text-secondary)',
                              marginTop: '0.2rem'
                            }}
                          >
                            Próx/Últ: {formatarDataBR(proxVisita.data)}
                          </div>
                        )}
                      </td>
                      <td>
                        <ActionMenu
                          opcoes={[
                            {
                              rotulo: 'Abrir Ficha VIP',
                              icone: <User size={14} />,
                              aoClicar: () => abrirPaginaDinamicaCliente(cli)
                            },
                            {
                              rotulo: 'Visualizar Contrato',
                              icone: <Eye size={14} />,
                              aoClicar: () => setContratoParaVisualizar(cli)
                            },
                            {
                              rotulo: 'Imprimir Contrato',
                              icone: <Printer size={14} />,
                              aoClicar: () => imprimirContratoClienteVIP(cli)
                            }
                          ]}
                          aoExcluir={() => aoExcluirClienteVip(cli.id)}
                          tituloExcluir="Excluir Cliente VIP"
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
              <h3 style={{ fontSize: '1.2rem' }}>
                Cadastrar Novo Cliente VIP / Influencer
              </h3>
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
              onSubmit={salvarNovoCliente}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
            >
              <PhotoPicker
                fotoAtual={foto}
                aoAlterarFoto={setFoto}
                rotulo="Foto do Cliente VIP / Influencer"
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Nome</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Carolina"
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
                    placeholder="Ex: Fontes"
                    value={sobrenome}
                    onChange={(e) => setSobrenome(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Categoria</label>
                  <select
                    className="form-input"
                    value={categoriaVip}
                    onChange={(e) =>
                      setCategoriaVip(e.target.value as CategoriaClienteVIP)
                    }
                  >
                    {CATEGORIAS_VIP.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
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
                    placeholder="influencer@email.com"
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
                  gridTemplateColumns: '1fr 1.2fr 1.2fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Rede Social (@handle)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="@influencer"
                    value={redeSocial}
                    onChange={(e) => setRedeSocial(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Alcance / Seguidores</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: 800k seguidores"
                    value={alcanceSeguidores}
                    onChange={(e) => setAlcanceSeguidores(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Cidade / UF</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.3fr 1fr 1.2fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Assessor / Representante</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nome do Assessor ou Agência"
                    value={assessorNome}
                    onChange={(e) => setAssessorNome(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Telefone do Assessor</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="(11) 99999-0000"
                    value={assessorTelefone}
                    onChange={(e) =>
                      setAssessorTelefone(formatarTelefone(e.target.value))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>E-mail do Assessor</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="contato@assessoria.com.br"
                    value={assessorEmail}
                    onChange={(e) => setAssessorEmail(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.2fr 1fr',
                  gap: '0.75rem'
                }}
              >
                <div className="form-group">
                  <label>Número do Contrato</label>
                  <input
                    type="text"
                    className="form-input"
                    value={numeroContrato}
                    onChange={(e) => setNumeroContrato(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Vigência Contratual</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vigenciaContrato}
                    onChange={(e) => setVigenciaContrato(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Valor Mensal / Permuta (R$)</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    className="form-input"
                    value={valorPermutaMensal}
                    onChange={(e) => setValorPermutaMensal(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Escopo de Marketing e Entregas</label>
                <input
                  type="text"
                  className="form-input"
                  value={escopoMarketing}
                  onChange={(e) => setEscopoMarketing(e.target.value)}
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
                  <span>Salvar Cliente VIP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {contratoParaVisualizar && (
        <ModalContratoVIP
          cliente={contratoParaVisualizar}
          aoFechar={() => setContratoParaVisualizar(null)}
        />
      )}
    </main>
  );
}

function ModalContratoVIP({
  cliente,
  aoFechar
}: {
  cliente: ClienteVIP;
  aoFechar: () => void;
}) {
  const nomeCompleto = `${cliente.nome} ${cliente.sobrenome}`.trim();

  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div
        className="modal-content modal-content-80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={22} color="#778873" />
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>
                Contrato de Marketing e Parceria VIP — {cliente.numeroContrato}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {nomeCompleto} ({cliente.categoriaVip} • {cliente.redeSocial})
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-realtime"
            onClick={aoFechar}
            style={{ padding: '0.3rem 0.5rem' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="contract-sheet">
          <div className="tuss-grid">
            <div className="tuss-field-box">
              <span className="tuss-field-label">Nº do Contrato</span>
              <span className="tuss-field-value" style={{ color: '#778873' }}>
                {cliente.numeroContrato}
              </span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">Vigência</span>
              <span className="tuss-field-value">{cliente.vigenciaContrato}</span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">Categoria VIP</span>
              <span className="tuss-field-value">{cliente.categoriaVip}</span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">Cota / Permuta Mensal</span>
              <span
                className="tuss-field-value"
                style={{ color: 'var(--accent-color)' }}
              >
                {formatarMoeda(cliente.valorPermutaMensal)}
              </span>
            </div>
          </div>

          <div className="tuss-grid">
            <div className="tuss-field-box">
              <span className="tuss-field-label">Contratado(a) / VIP</span>
              <span className="tuss-field-value">{nomeCompleto}</span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">CPF</span>
              <span className="tuss-field-value">{cliente.cpf}</span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">Rede Social & Alcance</span>
              <span className="tuss-field-value">
                {cliente.redeSocial} ({cliente.alcanceSeguidores})
              </span>
            </div>
          </div>

          <div className="tuss-grid">
            <div className="tuss-field-box">
              <span className="tuss-field-label">Assessor / Representante</span>
              <span className="tuss-field-value">
                {cliente.assessorNome || '-'}
              </span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">Telefone Assessoria</span>
              <span className="tuss-field-value">
                {cliente.assessorTelefone || '-'}
              </span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">E-mail Assessoria</span>
              <span className="tuss-field-value">
                {cliente.assessorEmail || '-'}
              </span>
            </div>
          </div>

          <div className="tuss-field-box">
            <span className="tuss-field-label">
              Escopo de Entregas e Contrapartidas de Marketing
            </span>
            <p className="tuss-field-value" style={{ marginTop: '0.25rem' }}>
              {cliente.escopoMarketing}
            </p>
          </div>

          <div className="tuss-field-box">
            <span className="tuss-field-label">
              Cláusulas e Condições Contratuais
            </span>
            <p
              style={{
                whiteSpace: 'pre-line',
                fontSize: '0.88rem',
                marginTop: '0.35rem',
                lineHeight: 1.5
              }}
            >
              {cliente.clausulasContrato}
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-realtime" onClick={aoFechar}>
            Fechar
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => imprimirContratoClienteVIP(cliente)}
          >
            <Printer size={16} />
            <span>Imprimir Contrato</span>
          </button>
        </div>
      </div>
    </div>
  );
}
