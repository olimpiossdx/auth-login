import React from 'react';
import { createPortal } from 'react-dom';
import type { IPopoverProps } from './props';

const Popover: React.FC<IPopoverProps> = ({ isOpen, onClose, triggerRef, children, className = "", fullWidth = false }) => {
  // Estado inicial null indica que ainda não calculamos a posição
  const [coords, setCoords] = React.useState<{ top: number; left: number; minWidth: number } | null>(null);
  const [isVisible, setIsVisible] = React.useState(false); // Controla a opacidade final
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current && popoverRef.current && isOpen) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      // Configurações Padrão (Baixo - Esquerda)
      let top = triggerRect.bottom + scrollY + 4; // 4px margem
      let left = triggerRect.left + scrollX;

      // 1. COLISÃO VERTICAL (Cima ou Baixo?)
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const popoverHeight = popoverRect.height;

      // Se não cabe embaixo E cabe em cima -> Joga pra Cima
      if (spaceBelow < popoverHeight && spaceAbove > popoverHeight) {
        top = triggerRect.top + scrollY - popoverHeight - 4;
      }

      // 2. COLISÃO HORIZONTAL (Esquerda ou Direita?)
      const popoverWidth = popoverRect.width;

      // Se estourar a direita da tela -> Alinha pela direita do trigger
      if (left + popoverWidth > viewportWidth) {
        // Tenta alinhar a borda direita do popover com a borda direita do trigger
        left = (triggerRect.right + scrollX) - popoverWidth;

        // Guarda de segurança: Se mesmo assim estourar a esquerda (tela muito pequena),
        // fixa uma margem mínima na esquerda
        if (left < 4) left = 4;
      }

      setCoords({
        top,
        left,
        minWidth: fullWidth ? triggerRect.width : 0
      });

      // Libera a visibilidade após o cálculo
      setIsVisible(true);
    }
  };

  // useLayoutEffect roda ANTES da pintura do browser, evitando "pulos" visuais
  React.useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    } else {
      setIsVisible(false);
      setCoords(null);
    }
  }, [isOpen]);

  // Listeners passivos para resize/scroll
  React.useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, { capture: true });
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, { capture: true });
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div ref={popoverRef}
      // Usamos 'invisible' enquanto não temos coords para medir o tamanho real sem mostrar no lugar errado
      className={`
        absolute z-[9999] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl 
        transition-opacity duration-200 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
        ${className}
      `}
      style={{
        // Se coords for null (primeiro render), renderiza fora da tela ou no 0,0 apenas para medição
        top: coords?.top ?? 0,
        left: coords?.left ?? 0,
        minWidth: coords?.minWidth && coords.minWidth > 0 ? coords.minWidth : undefined,
        // Garante que a medição funcione mas o usuário não veja glitches
        visibility: coords ? 'visible' : 'hidden'
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export default Popover;