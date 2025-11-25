import React from 'react';

// Configuração fina de estilos (opcional)
export interface IModalStyleConfig {
  padding?: string;     // ex: 'p-0' para full bleed, 'p-8' para espaçado
  width?: string;       // ex: 'max-w-4xl'
  className?: string;   // classes extras arbitrárias para o container
}

// Opções passadas ao chamar a função showModal
export interface IModalOptions {
  // --- Conteúdo ---
  title?: React.ComponentType<any> | React.ReactNode | string;
  // Aceita: Texto ('Olá'), JSX (<div/>) ou Componente (MyComponent)
  content: React.ComponentType<any> | React.ReactNode | string;
  footer?: React.ComponentType<any> | React.ReactNode;
  
  // Props para passar para o componente de conteúdo (caso seja uma função)
  contentProps?: Record<string, any>;

  // --- Visual e Comportamento ---
  size?: 'standard' | 'full' | 'custom';
  styleConfig?: IModalStyleConfig;
  closeOnBackdropClick?: boolean; // Se false, obriga a clicar no X ou botão
  
  // --- Eventos ---
  onClose?: () => void; // Executado sempre que o modal fecha (cleanup)
}

// O que a função retorna para controle externo
export interface IModalHandle {
  close: () => void;
}