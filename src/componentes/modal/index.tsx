import React from 'react';
import type { IModalOptions } from './types';

interface IInternalModalProps extends IModalOptions {
  closeModalInternal: () => void;
}

const Modal: React.FC<IInternalModalProps> = ({ 
  title, 
  content, 
  footer, 
  size = 'standard', 
  styleConfig, 
  closeOnBackdropClick = true,
  closeModalInternal,
  contentProps = {}
}) => {

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnBackdropClick) {
      closeModalInternal();
    }
  };

  // --- NOVO HELPER: Renderiza o Título ---
  const renderTitle = () => {
    if (!title){
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
  // ---------------------------------------

  const renderContent = () => {
    if (typeof content === 'function') {
      const Component = content as React.ComponentType<any>;
      return <Component {...contentProps} closeModal={closeModalInternal} />;
    };

    return content;
  };

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
  if (size === 'full'){ 
    widthClass = 'max-w-[98vw] h-[95vh]';
  };
  if (styleConfig?.width){
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
              ✕
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