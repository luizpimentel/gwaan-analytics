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
  Briefcase
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
    abaAtiva === 'pacientes';

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
        <div className="brand-title" title="Gwaan Analytics — Faturamento Hospitalar">
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
            title="Torre de Faturamento"
          >
            <LayoutDashboard size={20} style={{ flexShrink: 0 }} />
            <span>Visão Geral</span>
          </li>

          <li
            className={`nav-item ${abaAtiva === 'atendimentos' ? 'active' : ''}`}
            onClick={() => aoSelecionarAba('atendimentos')}
            title="Consultas Realizadas (CONS-nº)"
          >
            <CalendarCheck size={20} style={{ flexShrink: 0 }} />
            <span>Consultas</span>
          </li>

          <li className="nav-group">
            <div
              className={`nav-item nav-group-trigger ${faturamentoAtivo && !faturamentoAberto ? 'active' : ''
                }`}
              onClick={() => setFaturamentoAberto((ant) => !ant)}
              title="Faturamento TISS (Guias G-nº, Faturas FAT-nº, Lotes LOTE-nº e Particulares)"
            >
              <Receipt size={20} style={{ flexShrink: 0 }} />
              <span>Faturamento TISS</span>
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
                  className={`nav-item nav-subitem ${abaAtiva === 'guias' ? 'active' : ''
                    }`}
                  onClick={() => aoSelecionarAba('guias')}
                  title="Guias de Consulta (G-nº)"
                >
                  <FileText size={17} style={{ flexShrink: 0 }} />
                  <span>Guias de Consulta</span>
                </li>

                <li
                  className={`nav-item nav-subitem ${abaAtiva === 'lotes' ? 'active' : ''
                    }`}
                  onClick={() => aoSelecionarAba('lotes')}
                  title="Lotes (LOTE-nº), Faturas (FAT-nº) e Glosas"
                >
                  <Layers size={17} style={{ flexShrink: 0 }} />
                  <span>Lotes & Faturas</span>
                </li>

                <li
                  className={`nav-item nav-subitem ${abaAtiva === 'particulares' ? 'active' : ''
                    }`}
                  onClick={() => aoSelecionarAba('particulares')}
                  title="Consultas Particulares (Cobrança na Clínica)"
                >
                  <UserCheck size={17} style={{ flexShrink: 0 }} />
                  <span>Particulares / NF</span>
                </li>
              </ul>
            )}
          </li>

          <li className="nav-group">
            <div
              className={`nav-item nav-group-trigger ${equipeAtiva && !equipeAberta ? 'active' : ''
                }`}
              onClick={() => setEquipeAberta((ant) => !ant)}
              title="Cadastros Base de Faturamento (Operadoras, Corpo Clínico e Beneficiários)"
            >
              <Briefcase size={20} style={{ flexShrink: 0 }} />
              <span>Cadastros Base</span>
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
                  className={`nav-item nav-subitem ${abaAtiva === 'operadoras' ? 'active' : ''
                    }`}
                  onClick={() => aoSelecionarAba('operadoras')}
                  title="Operadoras de Saúde (Convênios ANS)"
                >
                  <Building2 size={17} style={{ flexShrink: 0 }} />
                  <span>Operadoras ANS</span>
                </li>

                <li
                  className={`nav-item nav-subitem ${abaAtiva === 'profissionais' ? 'active' : ''
                    }`}
                  onClick={() => aoSelecionarAba('profissionais')}
                  title="Corpo Clínico Executante e Repasse Médico"
                >
                  <Stethoscope size={17} style={{ flexShrink: 0 }} />
                  <span>Corpo Clínico</span>
                </li>

                <li
                  className={`nav-item nav-subitem ${abaAtiva === 'pacientes' ? 'active' : ''
                    }`}
                  onClick={() => aoSelecionarAba('pacientes')}
                  title="Beneficiários e Elegibilidade de Carteirinhas"
                >
                  <Users size={17} style={{ flexShrink: 0 }} />
                  <span>Beneficiários</span>
                </li>
              </ul>
            )}
          </li>

          <li
            className={`nav-item ${abaAtiva === 'relatorios' ? 'active' : ''}`}
            onClick={() => aoSelecionarAba('relatorios')}
            title="Relatórios Executivos e Auditoria de Metas"
          >
            <FileBarChart2 size={20} style={{ flexShrink: 0 }} />
            <span>Relatórios & BI</span>
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
