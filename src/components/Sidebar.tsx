import { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Building2,
  UserCheck,
  FileBarChart2,
  Settings,
  CalendarCheck,
  Stethoscope,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Receipt,
  FileText,
  Briefcase,
  Sparkles
} from 'lucide-react';

export type AbaSistema =
  | 'dashboard'
  | 'atendimentos'
  | 'pacientes'
  | 'guias'
  | 'particulares'
  | 'lotes'
  | 'profissionais'
  | 'operadoras'
  | 'clientes'
  | 'relatorios'
  | 'configuracoes';

interface SidebarProps {
  abaAtiva: AbaSistema;
  expandida: boolean;
  aoAlternarExpansao: () => void;
  aoSelecionarAba: (aba: AbaSistema) => void;
}

export function Sidebar({
  abaAtiva,
  expandida,
  aoAlternarExpansao,
  aoSelecionarAba
}: SidebarProps) {
  const [faturamentoAberto, setFaturamentoAberto] = useState<boolean>(true);
  const [equipeAberta, setEquipeAberta] = useState<boolean>(true);

  const faturamentoAtivo =
    abaAtiva === 'guias' || abaAtiva === 'particulares' || abaAtiva === 'lotes';
  const equipeAtiva =
    abaAtiva === 'profissionais' ||
    abaAtiva === 'operadoras' ||
    abaAtiva === 'clientes';

  return (
    <aside className="sidebar">
      <button
        type="button"
        className="sidebar-toggle-btn"
        onClick={aoAlternarExpansao}
        title={expandida ? 'Recolher menu lateral' : 'Expandir menu lateral'}
        aria-label={expandida ? 'Recolher menu lateral' : 'Expandir menu lateral'}
      >
        {expandida ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
      </button>

      <div className="sidebar-top-row">
        <div className="brand-title" title="Gwaan Analytics">
          <img
            src="/favicon.svg"
            alt="Logo Gwaan Analytics"
            className="brand-logo"
          />
          {expandida && <span>Gwaan Analytics</span>}
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li
            className={`nav-item ${abaAtiva === 'dashboard' ? 'active' : ''}`}
            onClick={() => aoSelecionarAba('dashboard')}
            title="Visão Geral"
          >
            <LayoutDashboard size={20} style={{ flexShrink: 0 }} />
            <span>Visão Geral</span>
          </li>

          <li
            className={`nav-item ${abaAtiva === 'atendimentos' ? 'active' : ''}`}
            onClick={() => aoSelecionarAba('atendimentos')}
            title="Atendimentos"
          >
            <CalendarCheck size={20} style={{ flexShrink: 0 }} />
            <span>Atendimentos</span>
          </li>

          <li
            className={`nav-item ${abaAtiva === 'pacientes' ? 'active' : ''}`}
            onClick={() => aoSelecionarAba('pacientes')}
            title="Pacientes"
          >
            <Users size={20} style={{ flexShrink: 0 }} />
            <span>Pacientes</span>
          </li>

          <li className="nav-group">
            <div
              className={`nav-item nav-group-trigger ${
                faturamentoAtivo && !faturamentoAberto ? 'active' : ''
              }`}
              onClick={() => setFaturamentoAberto((ant) => !ant)}
              title="Faturamento (Guias, Particulares e Lotes)"
            >
              <Receipt size={20} style={{ flexShrink: 0 }} />
              <span>Faturamento</span>
              {expandida && (
                <span className="nav-group-chevron">
                  {faturamentoAberto ? (
                    <ChevronUp size={15} />
                  ) : (
                    <ChevronDown size={15} />
                  )}
                </span>
              )}
            </div>

            {faturamentoAberto && (
              <ul className="nav-sublist">
                <li
                  className={`nav-item nav-subitem ${
                    abaAtiva === 'guias' ? 'active' : ''
                  }`}
                  onClick={() => aoSelecionarAba('guias')}
                  title="Guias TUSS / Faturamento"
                >
                  <FileText size={17} style={{ flexShrink: 0 }} />
                  <span>Guias</span>
                </li>

                <li
                  className={`nav-item nav-subitem ${
                    abaAtiva === 'particulares' ? 'active' : ''
                  }`}
                  onClick={() => aoSelecionarAba('particulares')}
                  title="Particulares"
                >
                  <UserCheck size={17} style={{ flexShrink: 0 }} />
                  <span>Particulares</span>
                </li>

                <li
                  className={`nav-item nav-subitem ${
                    abaAtiva === 'lotes' ? 'active' : ''
                  }`}
                  onClick={() => aoSelecionarAba('lotes')}
                  title="Lotes"
                >
                  <Layers size={17} style={{ flexShrink: 0 }} />
                  <span>Lotes</span>
                </li>
              </ul>
            )}
          </li>

          <li className="nav-group">
            <div
              className={`nav-item nav-group-trigger ${
                equipeAtiva && !equipeAberta ? 'active' : ''
              }`}
              onClick={() => setEquipeAberta((ant) => !ant)}
              title="Equipe (Profissionais, Operadoras e Clientes VIP)"
            >
              <Briefcase size={20} style={{ flexShrink: 0 }} />
              <span>Equipe</span>
              {expandida && (
                <span className="nav-group-chevron">
                  {equipeAberta ? (
                    <ChevronUp size={15} />
                  ) : (
                    <ChevronDown size={15} />
                  )}
                </span>
              )}
            </div>

            {equipeAberta && (
              <ul className="nav-sublist">
                <li
                  className={`nav-item nav-subitem ${
                    abaAtiva === 'profissionais' ? 'active' : ''
                  }`}
                  onClick={() => aoSelecionarAba('profissionais')}
                  title="Profissionais da Empresa"
                >
                  <Stethoscope size={17} style={{ flexShrink: 0 }} />
                  <span>Profissionais</span>
                </li>

                <li
                  className={`nav-item nav-subitem ${
                    abaAtiva === 'operadoras' ? 'active' : ''
                  }`}
                  onClick={() => aoSelecionarAba('operadoras')}
                  title="Operadoras"
                >
                  <Building2 size={17} style={{ flexShrink: 0 }} />
                  <span>Operadoras</span>
                </li>

                <li
                  className={`nav-item nav-subitem ${
                    abaAtiva === 'clientes' ? 'active' : ''
                  }`}
                  onClick={() => aoSelecionarAba('clientes')}
                  title="Clientes VIP e Influencers (Marketing)"
                >
                  <Sparkles size={17} style={{ flexShrink: 0 }} />
                  <span>Clientes</span>
                </li>
              </ul>
            )}
          </li>

          <li
            className={`nav-item ${abaAtiva === 'relatorios' ? 'active' : ''}`}
            onClick={() => aoSelecionarAba('relatorios')}
            title="Relatórios e Avaliação de Desempenho"
          >
            <FileBarChart2 size={20} style={{ flexShrink: 0 }} />
            <span>Relatórios</span>
          </li>
        </ul>

        <div className="sidebar-bottom">
          <li
            className={`nav-item ${abaAtiva === 'configuracoes' ? 'active' : ''}`}
            onClick={() => aoSelecionarAba('configuracoes')}
            title="Configurações"
            style={{ listStyle: 'none' }}
          >
            <Settings size={20} style={{ flexShrink: 0 }} />
            <span>Configurações</span>
          </li>
        </div>
      </nav>
    </aside>
  );
}
