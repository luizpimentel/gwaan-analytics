import type { ReactNode } from 'react';
import { Filter, RotateCcw } from 'lucide-react';

interface ExpandableFilterBarProps {
  aberto: boolean;
  aoAlternar: () => void;
  qtdAtivos: number;
  aoLimpar: () => void;
  children: ReactNode;
  acoesExtras?: ReactNode;
}

export function ExpandableFilterToggle({
  aberto,
  aoAlternar,
  qtdAtivos,
  aoLimpar,
  acoesExtras
}: Omit<ExpandableFilterBarProps, 'children'>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
      {acoesExtras}

      {qtdAtivos > 0 && (
        <button
          type="button"
          className="btn-realtime"
          onClick={aoLimpar}
          title="Limpar todos os filtros aplicados"
        >
          <RotateCcw size={14} />
          <span>Limpar ({qtdAtivos})</span>
        </button>
      )}

      <button
        type="button"
        className={`btn-outline ${aberto ? 'active' : ''}`}
        onClick={aoAlternar}
      >
        <Filter size={16} />
        <span>Filtrar</span>
        {qtdAtivos > 0 && <span className="filter-count-pill">{qtdAtivos}</span>}
      </button>
    </div>
  );
}

export function ExpandableFilterPanel({
  aberto,
  aoLimpar,
  children
}: Pick<ExpandableFilterBarProps, 'aberto' | 'aoLimpar' | 'children'>) {
  if (!aberto) return null;

  return (
    <div className="expandable-filter-panel">
      {children}
      <button type="button" className="btn-realtime" onClick={aoLimpar}>
        <RotateCcw size={14} />
        <span>Limpar Filtros</span>
      </button>
    </div>
  );
}

