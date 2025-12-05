import React, { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<any>;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const Popover: React.FC<PopoverProps> = ({
  isOpen,
  onClose,
  triggerRef,
  children,
  className = "",
  fullWidth = false
}) => {
  const [coords, setCoords] = useState<{ top: number; left: number; minWidth: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      setCoords({
        // Cálculo correto para Absolute: Viewport (rect) + Scroll da Página
        top: rect.bottom + scrollY + 4,
        left: rect.left + scrollX,
        minWidth: fullWidth ? rect.width : 0
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, { capture: true });
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, { capture: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current?.contains(e.target as Node) || triggerRef.current?.contains(e.target as Node)) {
        return;
      }
      onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !coords) return null;

  return createPortal(
    <div
      ref={popoverRef}
      // CORREÇÃO: Usar 'absolute' em vez de 'fixed'.
      // Como estamos somando o scrollY no 'top', 'absolute' garante que ele fique na posição correta
      // relativa ao documento inteiro. 'fixed' somaria o scroll duas vezes visualmente.
      className={`
        absolute z-[9999] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl 
        animate-in fade-in zoom-in-95 duration-200
        ${className}
      `}
      style={{
        top: coords.top,
        left: coords.left,
        minWidth: coords.minWidth > 0 ? coords.minWidth : undefined
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export default Popover;