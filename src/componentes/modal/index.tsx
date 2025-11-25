import React from 'react';
import type { IModalOptions } from './types';

interface IInternalModalProps extends IModalOptions {
  closeModalInternal: () => void;
};

const Modal: React.FC<IInternalModalProps> = ({
  title, content, footer, size = 'standard', styleConfig, closeOnBackdropClick = true, closeModalInternal, contentProps = {}
}) => {

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnBackdropClick) {
      closeModalInternal();
    }
  };

  // --- Renderiza o Título ---
  const renderTitle = () => {
    if (!title) {
      return null;
    }

    // Caso 1: Componente (Função) - Injeta props e closeModal
    if (typeof title === 'function') {
      const TitleComp = title as React.ComponentType<any>;
      return <TitleComp {...contentProps} closeModal={closeModalInternal} />;
    }

    // Caso 2: String - Usa o estilo padrão do sistema
    if (typeof title === 'string') {
      return <h2 className="text-xl font-bold text-cyan-400">{title}</h2>;
    }

    // Caso 3: JSX/Node - Renderiza como está
    return title;
  };

  // --- Renderiza o content ---
  const renderContent = () => {
    if (typeof content === 'function') {
      const Component = content as React.ComponentType<any>;
      return <Component {...contentProps} closeModal={closeModalInternal} />;
    };

    return content;
  };

  // --- Renderiza o footer ---
  const renderFooter = () => {
    if (!footer) {
      return null;
    };

    if (typeof footer === 'function') {
      const FooterComp = footer as React.ComponentType<any>;
      return <FooterComp closeModal={closeModalInternal} />;
    };

    return footer;
  };

  let widthClass = 'max-w-2xl';
  if (size === 'full') {
    widthClass = 'max-w-[98vw] h-[95vh]';
  };
  if (styleConfig?.width) {
    widthClass = styleConfig.width;
  };

  const paddingClass = styleConfig?.padding || 'p-6';

  return (<div
    className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    onClick={handleBackdropClick}
  >
    <div
      className={`bg-gray-800 rounded-lg shadow-2xl flex flex-col w-full ${widthClass} ${styleConfig?.className || ''}`}
      style={{ maxHeight: "95vh" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Cabeçalho */}
      {title && (
        <div className="p-4 border-b border-gray-700 shrink-0 flex justify-between items-center">
          {/* Container flexível para o título customizado */}
          <div className="grow mr-4">
            {renderTitle()}
          </div>

          {/* O botão de fechar mantém-se sempre fixo à direita */}
          <button
            onClick={closeModalInternal}
            className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-2 transition-colors shrink-0"
            aria-label="Fechar modal"
          >

            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z" fill="#99a1af" />
            </svg>
          </button>
        </div>
      )}

      {/* Corpo */}
      <div className={`overflow-y-auto grow text-gray-300 ${paddingClass}`}>
        {renderContent()}
      </div>

      {/* Rodapé */}
      {footer && (
        <div className="p-4 border-t border-gray-700 shrink-0 flex justify-end gap-2">
          {renderFooter()}
        </div>
      )}
    </div>
  </div>);
};

export default Modal;