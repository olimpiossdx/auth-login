
import React, { useState, useRef, useEffect } from 'react';

interface SwitchProps {
  // Dados
  name: string;
  label?: string;
  defaultValue?: boolean; // Uncontrolled por padrão
  
  // Comportamento
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  
  // Reatividade (Ilhas de Reatividade)
  onChange?: (checked: boolean) => void;
  
  // Validação e Estilo
  validationKey?: string;
  className?: string;
  size?: 'sm' | 'md'; // Suporte a tamanhos (padrão md)
}

/**
 * Componente Switch (Toggle) Híbrido.
 * * Arquitetura "Overlay Input":
 * - O input nativo (checkbox) é renderizado com opacidade 0 POR CIMA do visual.
 * - Isso garante que cliques, toques e navegação por teclado funcionem nativamente.
 * - O balão de validação do navegador ancora corretamente na área do switch.
 */
const Switch: React.FC<SwitchProps> = ({
  name,
  label,
  defaultValue = false,
  required,
  disabled,
  readOnly,
  onChange,
  validationKey,
  className = "",
  size = 'md'
}) => {
  // Estado Visual (Sincronizado com o DOM)
  const [isChecked, setIsChecked] = useState(defaultValue);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronia com Prop Inicial
  useEffect(() => {
    setIsChecked(defaultValue);
  }, [defaultValue]);

  // --- REATIVIDADE AO DOM (Reset/Load Externo) ---
  // Ouve alterações programáticas no input (feitas pelo resetSection)
  useEffect(() => {
      const input = inputRef.current;
      if (!input) return;

      const handleExternalChange = () => {
          // Atualiza o visual para bater com a verdade do DOM
          setIsChecked(input.checked);
      };

      // Escuta 'change' (nativo) e 'input' (disparado pelo setNativeChecked)
      input.addEventListener('change', handleExternalChange);
      input.addEventListener('input', handleExternalChange);
      
      return () => {
          input.removeEventListener('change', handleExternalChange);
          input.removeEventListener('input', handleExternalChange);
      };
  }, []);

  // Handler de Interação do Usuário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly) {
          e.preventDefault();
          return;
      }
      
      const newValue = e.target.checked;
      setIsChecked(newValue);
      
      if (onChange) {
          onChange(newValue);
      }
      
      // O evento 'change' continua propagando para o useForm capturar
  };

  // Configuração de Tamanhos
  const sizeConfig = {
      sm: { 
          track: 'w-9 h-5', 
          thumb: 'w-3.5 h-3.5', 
          translate: 'translate-x-4',
          label: 'text-xs' 
      },
      md: { 
          track: 'w-11 h-6', 
          thumb: 'w-4 h-4', 
          translate: 'translate-x-5',
          label: 'text-sm' 
      }
  };
  
  const currentSize = sizeConfig[size];

  return (
    <div className={`flex items-center gap-3 mb-4 ${className} ${disabled ? 'opacity-50' : ''}`}>
      
      {/* Container do Switch (Relativo para posicionamento) */}
      <div className={`relative inline-flex items-center cursor-pointer group ${currentSize.track}`}>
        
        {/* 1. INPUT NATIVO (OVERLAY - Camada Z-10) 
            - w-full h-full: Cobre toda a área do switch
            - opacity-0: Invisível
            - pointer-events-auto: Captura o clique real
        */}
        <input
          ref={inputRef}
          type="checkbox"
          name={name}
          defaultChecked={defaultValue}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          readOnly={readOnly}
          data-validation={validationKey}
          className="peer absolute w-full h-full opacity-0 z-10 cursor-pointer disabled:cursor-not-allowed"
          style={readOnly ? { pointerEvents: 'none' } : {}}
        />

        {/* 2. A TRILHA (Visual Track - Camada Z-0) */}
        <div 
          className={`
            absolute top-0 left-0 w-full h-full rounded-full transition-colors duration-200 ease-in-out
            ${isChecked ? 'bg-cyan-600' : 'bg-gray-600'}
            peer-focus:ring-2 peer-focus:ring-cyan-400 peer-focus:ring-offset-2 peer-focus:ring-offset-gray-900
            peer-invalid:ring-2 peer-invalid:ring-red-500/70 /* Feedback visual de erro no próprio switch */
          `}
        ></div>

        {/* 3. A BOLINHA (Thumb) */}
        <div 
          className={`
            absolute left-1 top-1 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out pointer-events-none
            ${currentSize.thumb}
            ${isChecked ? currentSize.translate : 'translate-x-0'}
          `}
        ></div>

      </div>

      {/* Label Opcional */}
      {label && (
        <label 
            htmlFor={name} 
            className={`${currentSize.label} font-medium text-gray-300 select-none ${!disabled && !readOnly && 'cursor-pointer hover:text-white'}`}
            // O clique no label dispara o input pelo htmlFor, nativamente
        >
          {label} {required && <span className="text-red-400" title="Obrigatório">*</span>}
        </label>
      )}

    </div>
  );
};

export default Switch;