import { useState, type FormEvent } from 'react';
import { X, MessageSquareWarning } from 'lucide-react';
import type { DemandaFinanceira } from '../data/dadosFaturamento';
import { formatarMoeda } from '../utils/formatadores';

interface ModalRecursoProps {
  lote: DemandaFinanceira;
  aoFechar: () => void;
  aoSalvarRecurso: (idLote: string, motivo: string) => void;
}

export function ModalRecurso({
  lote,
  aoFechar,
  aoSalvarRecurso
}: ModalRecursoProps) {
  const [motivo, setMotivo] = useState<string>(lote.recurso?.motivo ?? '');

  function submeterRecurso(evento: FormEvent) {
    evento.preventDefault();
    if (!motivo.trim()) {
      alert('Descreva a anormalidade ou motivo do recurso!');
      return;
    }
    aoSalvarRecurso(lote.id, motivo.trim());
  }

  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquareWarning size={20} color="#b45309" />
            <h3 style={{ fontSize: '1.15rem' }}>Recurso de Lote Enviado ({lote.id})</h3>
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

        <div className="lote-summary-strip">
          <div>
            <span className="strip-label">Operadora</span>
            <strong>{lote.operadora}</strong>
          </div>
          <div>
            <span className="strip-label">Valor</span>
            <strong>{formatarMoeda(lote.valor)}</strong>
          </div>
          <div>
            <span className="strip-label">Status</span>
            <span className="badge badge-enviado">{lote.status}</span>
          </div>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Lote: <strong>{lote.descricao}</strong>. Utilize este formulário para registrar anormalidades, divergências de valores, glosas pós-envio ou contestação junto à operadora.
        </p>

        <form onSubmit={submeterRecurso} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Descrição da Anormalidade / Justificativa do Recurso</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Ex: Divergência apontada no protocolo de recebimento do lote referente a 3 guias SADT..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-realtime" onClick={aoFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn-recurso">
              <MessageSquareWarning size={16} />
              <span>Registrar Recurso</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

