import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  paginaAtual: number;
  totalItens: number;
  itensPorPagina: number;
  aoMudarPagina: (novaPagina: number) => void;
}

export function Pagination({
  paginaAtual,
  totalItens,
  itensPorPagina,
  aoMudarPagina
}: PaginationProps) {
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  const indiceInicial = totalItens === 0 ? 0 : (paginaSegura - 1) * itensPorPagina + 1;
  const indiceFinal = Math.min(paginaSegura * itensPorPagina, totalItens);

  const paginas: number[] = [];
  for (let i = 1; i <= totalPaginas; i++) {
    paginas.push(i);
  }

  return (
    <div className="pagination-bar">
      <span className="pagination-info">
        Exibindo <strong>{indiceInicial}</strong> a <strong>{indiceFinal}</strong> de{' '}
        <strong>{totalItens}</strong> registros (até {itensPorPagina} por página)
      </span>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          disabled={paginaSegura <= 1}
          onClick={() => aoMudarPagina(paginaSegura - 1)}
          title="Página Anterior"
        >
          <ChevronLeft size={16} />
          <span>Anterior</span>
        </button>

        <div className="pagination-pages">
          {paginas.map((num) => (
            <button
              key={num}
              type="button"
              className={`pagination-page-num ${num === paginaSegura ? 'active' : ''}`}
              onClick={() => aoMudarPagina(num)}
            >
              {num}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="pagination-btn"
          disabled={paginaSegura >= totalPaginas}
          onClick={() => aoMudarPagina(paginaSegura + 1)}
          title="Próxima Página"
        >
          <span>Próxima</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

