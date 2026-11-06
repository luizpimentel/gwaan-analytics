import {
  Moon,
  Sun,
  Sliders,
  ShieldAlert,
  LayoutList,
  Download
} from 'lucide-react';
import type { PreferenciasSistema } from '../data/dadosFaturamento';

interface ConfiguracoesPageProps {
  preferencias: PreferenciasSistema;
  aoAtualizarPreferencias: (novas: PreferenciasSistema) => void;
  aoExportarBackupJSON: () => void;
}

export function ConfiguracoesPage({
  preferencias,
  aoAtualizarPreferencias,
  aoExportarBackupJSON
}: ConfiguracoesPageProps) {
  function alternarCampo<K extends keyof PreferenciasSistema>(
    chave: K,
    valor: PreferenciasSistema[K]
  ) {
    aoAtualizarPreferencias({
      ...preferencias,
      [chave]: valor
    });
  }

  return (
    <main className="dashboard-body">
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>
          Configurações do Sistema
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Personalize a aparência (Modo Escuro na paleta Sage & Olive), comportamento
          operacional e segurança de dados.
        </p>
      </div>

      <section className="settings-grid">
        <div className="demandas-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {preferencias.modoEscuro ? (
              <Moon size={20} color="var(--accent-color)" />
            ) : (
              <Sun size={20} color="var(--accent-color)" />
            )}
            <h2 style={{ fontSize: '1.15rem' }}>Aparência e Tema Visual</h2>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <strong>Modo Escuro (Dark Mode — Paleta Sage & Olive)</strong>
              <p>
                Adapta todas as superfícies para tons verde-oliva profundos mantendo o
                contraste suave e a identidade visual do sistema.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={preferencias.modoEscuro}
              className={`toggle-switch ${preferencias.modoEscuro ? 'active' : ''}`}
              onClick={() => alternarCampo('modoEscuro', !preferencias.modoEscuro)}
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          <hr className="divisor-modal" />

          <div className="setting-row">
            <div className="setting-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LayoutList size={16} color="var(--accent-color)" />
                <strong>Densidade Compacta nas Tabelas</strong>
              </div>
              <p>
                Reduz o espaçamento vertical das linhas nas tabelas de Lotes, Atendimentos e
                Relatórios para exibir mais registros simultaneamente.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={preferencias.tabelaCompacta}
              className={`toggle-switch ${preferencias.tabelaCompacta ? 'active' : ''}`}
              onClick={() =>
                alternarCampo('tabelaCompacta', !preferencias.tabelaCompacta)
              }
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>

        <div className="demandas-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sliders size={20} color="var(--accent-color)" />
            <h2 style={{ fontSize: '1.15rem' }}>Comportamento e Segurança</h2>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldAlert size={16} color="var(--accent-color)" />
                <strong>Confirmação de Segurança ao Excluir</strong>
              </div>
              <p>
                Exibe uma caixa de confirmação antes de excluir permanentemente lotes,
                guias particulares, beneficiários, corpo clínico, produção assistencial ou
                operadoras ANS.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={preferencias.confirmarExclusao}
              className={`toggle-switch ${preferencias.confirmarExclusao ? 'active' : ''}`}
              onClick={() =>
                alternarCampo('confirmarExclusao', !preferencias.confirmarExclusao)
              }
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>
      </section>

      <section className="demandas-section">
        <div>
          <h2 style={{ fontSize: '1.15rem' }}>
            Armazenamento Local e Backup do Sistema
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              marginTop: '0.2rem'
            }}
          >
            Exporte uma cópia integral de segurança de todos os módulos (Lotes, Particulares,
            Operadoras ANS, Beneficiários, Corpo Clínico, Produção Assistencial e Relatórios).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={aoExportarBackupJSON}
          >
            <Download size={16} />
            <span>Exportar Backup Completo (.JSON)</span>
          </button>
        </div>
      </section>
    </main>
  );
}
