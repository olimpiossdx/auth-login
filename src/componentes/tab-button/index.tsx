import React from 'react';

interface TabButtonProps {
  tabId: string;
  label: string;
  isActive: boolean;      // Recebe se ele está ativo
  onClick: React.Dispatch<React.SetStateAction<string>>;    // Recebe a função para clicar/ativar a tab
}

const TabButton: React.FC<TabButtonProps> = ({
  tabId,
  label,
  isActive,
  onClick,
}) => {
  return (
    <button id={tabId}
      onClick={() => onClick(tabId)}
      className={`px-3 py-2 sm:px-4 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? "bg-cyan-600 text-white" // Estilo Ativo
          : "bg-gray-700 text-gray-300 hover:bg-gray-600" // Estilo Inativo
      }`}
    >
      {label}
    </button>
  );
};

export default TabButton;