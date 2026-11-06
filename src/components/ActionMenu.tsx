import { useState, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Trash2 } from 'lucide-react';

export interface OpcaoActionMenu {
  rotulo: string;
  icone?: ReactNode;
  destaque?: 'padrao' | 'recurso';
  aoClicar: () => void;
}

interface ActionMenuProps {
  opcoes: OpcaoActionMenu[];
  aoExcluir?: () => void;
  tituloExcluir?: string;
}

export function ActionMenu({
  opcoes,
  aoExcluir,
  tituloExcluir = 'Excluir Registro'
}: ActionMenuProps) {
  const [aberto, setAberto] = useState<boolean>(false);
  const [posicaoMenu, setPosicaoMenu] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0
  });
  const botaoRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function calcularPosicao() {
    if (!botaoRef.current) return;
    const rect = botaoRef.current.getBoundingClientRect();
    const larguraMenu = 172;
    const alturaEstimada = Math.max(72, opcoes.length * 30 + 13);

    const espacoAbaixo = window.innerHeight - rect.bottom;
    const abrirParaCima = espacoAbaixo < alturaEstimada + 14 && rect.top > alturaEstimada;

    const top = abrirParaCima
      ? Math.max(8, rect.top - alturaEstimada - 5)
      : rect.bottom + 4;

    const left = Math.max(
      8,
      Math.min(rect.right - larguraMenu, window.innerWidth - larguraMenu - 10)
    );

    setPosicaoMenu({ top, left });
  }

  useEffect(() => {
    if (!aberto) return;

    calcularPosicao();

    function fecharAoClicarFora(evento: MouseEvent) {
      const alvo = evento.target as Node;
      if (
        botaoRef.current &&
        !botaoRef.current.contains(alvo) &&
        menuRef.current &&
        !menuRef.current.contains(alvo)
      ) {
        setAberto(false);
      }
    }

    function fecharOuRecalcularScroll() {
      setAberto(false);
    }

    document.addEventListener('mousedown', fecharAoClicarFora);
    window.addEventListener('scroll', fecharOuRecalcularScroll, true);
    window.addEventListener('resize', fecharOuRecalcularScroll);

    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora);
      window.removeEventListener('scroll', fecharOuRecalcularScroll, true);
      window.removeEventListener('resize', fecharOuRecalcularScroll);
    };
  }, [aberto, opcoes.length]);

  return (
    <div
      className="action-menu-wrapper"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="action-dropdown-holder">
        <button
          ref={botaoRef}
          type="button"
          className={`btn-action btn-action-trigger ${aberto ? 'active' : ''}`}
          onClick={() => {
            if (!aberto) calcularPosicao();
            setAberto((ant) => !ant);
          }}
          title="Abrir opções de ação"
        >
          <span>Ações</span>
          <ChevronDown size={13} />
        </button>

        {aberto &&
          createPortal(
            <div
              ref={menuRef}
              className="action-dropdown-menu"
              style={{
                top: `${posicaoMenu.top}px`,
                left: `${posicaoMenu.left}px`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {opcoes.map((opcao, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`action-dropdown-item ${
                    opcao.destaque === 'recurso' ? 'item-recurso' : ''
                  }`}
                  onClick={() => {
                    setAberto(false);
                    opcao.aoClicar();
                  }}
                >
                  {opcao.icone && <span className="dropdown-icon">{opcao.icone}</span>}
                  <span>{opcao.rotulo}</span>
                </button>
              ))}
            </div>,
            document.body
          )}
      </div>

      {aoExcluir && (
        <button
          type="button"
          className="btn-danger"
          title={tituloExcluir}
          onClick={aoExcluir}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
