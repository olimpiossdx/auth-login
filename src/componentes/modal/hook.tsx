import { type Root, createRoot } from "react-dom/client";
import type { IModalOptions, IModalHandle } from "./types";
import Modal from ".";

/**
 * Exibe um modal imperativo no topo da aplicação.
 * Suporta múltiplos modais (stacking).
 */
const showModal = (options: IModalOptions): IModalHandle => {
  // 1. Cria um container HTML novo para este modal específico
  const modalContainer = document.createElement("div");
  document.body.appendChild(modalContainer);

  // 2. Inicializa a raiz do React neste container
  const root: Root = createRoot(modalContainer);

  // 3. Define a função de limpeza (Close)
  const cleanup = () => {
    // Verifica se ainda existe para evitar erros de remoção duplicada
    if (document.body.contains(modalContainer)) {
      root.unmount(); // Desmonta os componentes React
      document.body.removeChild(modalContainer); // Remove a DIV do HTML
      
      // Aciona o callback de fechamento do usuário, se houver
      if (options.onClose) {
        options.onClose();
      }
    }
  };

  // 4. Renderiza o Modal
  root.render(<Modal 
      {...options} 
      closeModalInternal={cleanup} 
    />);

  // 5. Retorna o objeto de controle (para fechar externamente se necessário)
  return {
    close: cleanup
  };
};

export default showModal;