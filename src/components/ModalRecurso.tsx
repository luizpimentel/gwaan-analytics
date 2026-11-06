import { useState, type FormEvent } from 'react';
import { X, MessageSquareWarning, FileText } from 'lucide-react';
import type { DemandaFinanceira, TipoGlosaLote } from '../data/dadosFaturamento';
import { formatarMoeda, obterClasseBadge } from '../utils/formatadores';

interface ModalRecursoProps {
  lote: DemandaFinanceira;
  aoFechar: () => void;
  aoSalvarRecurso: (
    idLote: string,
    dadosGlosa: {
      tipoGlosa: TipoGlosaLote;
      motivo: string;
      justificativaRecurso: string;
    }
  ) => void;
}

const TIPOS_GLOSA: TipoGlosaLote[] = [
  'Administrativa',
  'Técnica / Médica',
  'Divergência de Valor / Tabela TUSS',
  'Elegibilidade / Carteirinha',
  'Ausência de Senha / Autorização'
];

export function ModalRecurso({
  lote,
  aoFechar,
  aoSalvarRecurso
}: ModalRecursoProps) {
  const [abaAtiva, setAbaAtiva] = useState<'tratamento' | 'guias'>(
    'tratamento'
  );
  const [tipoGlosa, setTipoGlosa] = useState<TipoGlosaLote>(
    lote.recurso?.tipoGlosa ?? 'Administrativa'
  );
  const [motivo, setMotivo] = useState<string>(lote.recurso?.motivo ?? '');
  const [justificativaRecurso, setJustificativaRecurso] = useState<string>(
    lote.recurso?.justificativaRecurso ?? ''
  );

  function submeterRecurso(evento: FormEvent) {
    evento.preventDefault();
    if (!motivo.trim()) {
      setAbaAtiva('tratamento');
      alert('Descreva o motivo apontado pela operadora na glosa!');
      return;
    }
    aoSalvarRecurso(lote.id, {
      tipoGlosa,
      motivo: motivo.trim(),
      justificativaRecurso: justificativaRecurso.trim()
    });
  }

  return (
    <div className="modal-overlay" onClick={aoFechar} style={{ zIndex: 1300 }}>
      <div
        className="modal-content modal-content-90"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquareWarning size={20} color="#dc2626" />
            <h3 style={{ fontSize: '1.15rem' }}>
              Gestão de Glosa e Recurso do Lote — {lote.id}
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon-square"
            onClick={aoFechar}
            title="Fechar janela"
          >
            <X size={18} />
          </button>
        </div>

        <div className="lote-summary-strip">
          <div>
            <span className="strip-label">Código do Lote</span>
            <strong style={{ color: '#778873' }}>{lote.id}</strong>
          </div>
          <div>
            <span className="strip-label">Operadora</span>
            <strong>{lote.operadora}</strong>
          </div>
          <div>
            <span className="strip-label">Protocolo de Envio</span>
            <strong>{lote.codigoEnvioOperadora || '-'}</strong>
          </div>
          <div>
            <span className="strip-label">Valor do Lote</span>
            <strong>{formatarMoeda(lote.valor)}</strong>
          </div>
          <div>
            <span className="strip-label">Status</span>
            <span className={obterClasseBadge(lote.status)}>
              {lote.status}
            </span>
          </div>
        </div>

        {/* Menu de abas posicionado abaixo do sumário */}
        <div className="modal-abas">
          <button
            type="button"
            className={`modal-aba-btn ${abaAtiva === 'tratamento' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('tratamento')}
          >
            <MessageSquareWarning size={15} />
            <span>Classificação &amp; Justificativa de Recurso</span>
          </button>
          <button
            type="button"
            className={`modal-aba-btn ${abaAtiva === 'guias' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('guias')}
          >
            <FileText size={15} />
            <span>Guias, Senhas e Faturas ({lote.guias.length})</span>
          </button>
        </div>

        <form
          onSubmit={submeterRecurso}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', flex: 1 }}
        >

          {abaAtiva === 'tratamento' ? (
            <>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Classifique a glosa informada pela operadora e registre a
                justificativa técnica/administrativa para tratamento e posterior
                reenvio do lote.
              </p>

              <div className="form-group">
                <label>Classificação / Tipo da Glosa</label>
                <select
                  className="form-input"
                  value={tipoGlosa}
                  onChange={(e) => setTipoGlosa(e.target.value as TipoGlosaLote)}
                >
                  {TIPOS_GLOSA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Motivo da Glosa Apontado pela Operadora</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Ex: Código de glosa ANS 1804 — Ausência de laudo de exame ou divergência de senha de autorização..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Justificativa de Recurso / Providência Adotada para Reenvio
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Ex: Corrigida senha de autorização na guia G-nº e anexado relatório médico assinado..."
                  value={justificativaRecurso}
                  onChange={(e) => setJustificativaRecurso(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="guias-lote-box">
              <strong>
                Guias de Consulta (G-nº) e Faturas (FAT-nº) neste Lote
              </strong>
              <div className="guias-lote-list">
                {lote.guias.map((g) => (
                  <div key={g.id} className="guia-lote-item">
                    <div>
                      <strong style={{ color: '#778873' }}>{g.id}</strong>
                      {g.faturaId ? (
                        <span
                          className="badge badge-enviado"
                          style={{ marginLeft: '0.45rem' }}
                        >
                          {g.faturaId}
                        </span>
                      ) : null}
                      <span
                        className="badge badge-faturado"
                        style={{ marginLeft: '0.45rem' }}
                      >
                        Senha: {g.senhaAutorizacao || '-'}
                      </span>
                      <div style={{ fontSize: '0.84rem', marginTop: '0.2rem' }}>
                        {g.pacienteNome} ({g.pacienteId || '-'}) • Consulta:{' '}
                        <strong>{g.atendimentoId || '-'}</strong>
                      </div>
                      <small style={{ color: 'var(--text-secondary)' }}>
                        {g.procedimento}
                      </small>
                    </div>
                    <strong>{formatarMoeda(g.valor)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: 'auto' }}>
            <button type="button" className="btn-secondary" onClick={aoFechar}>
              Fechar
            </button>
            <button type="submit" className="btn-recurso">
              <MessageSquareWarning size={16} />
              <span>Salvar Tratamento de Glosa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
