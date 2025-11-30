import React, { useState, useRef, useEffect, useMemo } from 'react';

interface StarRatingProps {
  // --- DADOS ---
  name: string;
  label?: string;
  initialValue?: number;
  
  /** Número máximo de estrelas. Default: 5 */
  maxStars?: number; 
  
  // --- COMPORTAMENTO ---
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  
  /** Callback opcional para "Ilhas de Reatividade" (disparado ao clicar/navegar) */
  onChange?: (value: number) => void; 
  
  // --- VALIDAÇÃO ---
  validationKey?: string;
  
  // --- ESTILO ---
  /** Classes CSS para o container principal */
  className?: string;      
  /** Classes CSS para o ícone SVG (ex: cores, tamanho). Default: 'w-8 h-8' */
  starClassName?: string;  
}

/**
 * Componente de Avaliação Híbrido (v2.0).
 * * Funcionalidades:
 * - Arquitetura "Anchor Input": Usa input oculto para dados e validação nativa.
 * - Sincronia Bidirecional: Ouve alterações do DOM (resetSection) e atualiza visual.
 * - Acessibilidade: Suporte a teclado (Setas, Home, End).
 * - Customizável: Suporta N estrelas e estilos via Tailwind.
 */
const StarRating: React.FC<StarRatingProps> = ({ 
  name, 
  label, 
  required, 
  readOnly, 
  disabled,
  initialValue = 0,
  maxStars = 5,
  onChange,
  validationKey,
  className = "",
  starClassName = "w-8 h-8" // Tamanho padrão
}) => {
  // Estado Visual
  const [currentValue, setCurrentValue] = useState<number>(Number(initialValue) || 0);
  const [hoverValue, setHoverValue] = useState<number>(0);

  // Refs de Infraestrutura
  const logicInputRef = useRef<HTMLInputElement>(null);  // Fonte da Verdade (DOM)
  const anchorInputRef = useRef<HTMLInputElement>(null); // Âncora do Tooltip de Erro
  const containerRef = useRef<HTMLDivElement>(null);     // Foco de Acessibilidade

  const effectiveDisabled = disabled || readOnly;

  // Memoização do array de estrelas para performance em re-renders
  const starsArray = useMemo(() => Array.from({ length: maxStars }, (_, i) => i + 1), [maxStars]);

  // Sincronia com Prop Inicial
  useEffect(() => {
    setCurrentValue(Number(initialValue) || 0);
  }, [initialValue]);

  // --- REATIVIDADE AO DOM (Reset & Load Data) ---
  // Ouve eventos 'input'/'change' no input oculto para atualizar o visual 
  // caso o valor mude "por fora" (ex: via resetSection ou setNativeValue).
  useEffect(() => {
      const input = logicInputRef.current;
      if (!input) return;

      const handleExternalUpdate = () => {
          const numericVal = Number(input.value);
          const safeVal = isNaN(numericVal) ? 0 : numericVal;
          
          // Otimização: Só atualiza State se houver divergência real
          setCurrentValue(prev => (prev !== safeVal ? safeVal : prev));
      };

      input.addEventListener('input', handleExternalUpdate);
      input.addEventListener('change', handleExternalUpdate);
      
      return () => {
          input.removeEventListener('input', handleExternalUpdate);
          input.removeEventListener('change', handleExternalUpdate);
      };
  }, []);

  /**
   * Atualiza o valor, notifica o DOM e dispara callbacks.
   */
  const updateValue = (newValue: number) => {
    // 1. Atualiza Visual (React)
    if (newValue !== currentValue) {
        setCurrentValue(newValue);
    }

    // 2. Notifica Parente (React - Opcional)
    if (onChange) {
        onChange(newValue);
    }

    // 3. Atualiza DOM (Input Oculto)
    // Isso é crucial para o useForm capturar o dado no submit
    if (logicInputRef.current) {
      // Evita loop infinito se o valor já for igual
      if (logicInputRef.current.value !== String(newValue || '')) {
          logicInputRef.current.value = newValue === 0 ? '' : String(newValue);
          // Dispara 'change' para marcar como 'touched' e revalidar
          logicInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // 4. Limpa Erro Visual (Anchor)
    if (anchorInputRef.current) {
      anchorInputRef.current.setCustomValidity("");
    }
  };

  const handleClick = (value: number) => {
    if (effectiveDisabled) return;
    // Toggle: Clicar na estrela atual zera a avaliação
    const newValue = value === currentValue ? 0 : value;
    updateValue(newValue);
    containerRef.current?.focus();
  };

  // --- ACESSIBILIDADE (WAI-ARIA Slider Pattern) ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (effectiveDisabled) return;

    switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
            e.preventDefault();
            updateValue(Math.min(maxStars, currentValue + 1));
            break;
        case 'ArrowLeft':
        case 'ArrowDown':
            e.preventDefault();
            updateValue(Math.max(0, currentValue - 1));
            break;
        case 'Home': // Zera
            e.preventDefault();
            updateValue(0);
            break;
        case 'End': // Máximo
            e.preventDefault();
            updateValue(maxStars);
            break;
    }
  };

  const handleInvalid = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault(); 
    if (anchorInputRef.current) {
      // Transfere a mensagem de erro para o input visível (âncora)
      anchorInputRef.current.setCustomValidity(e.currentTarget.validationMessage);
      anchorInputRef.current.reportValidity(); 
    }
  };

  const handleBlur = () => {
    if (effectiveDisabled) return;
    logicInputRef.current?.dispatchEvent(new Event('blur', { bubbles: true }));
  };

  const displayValue = hoverValue || currentValue;

  return (
    <div className={`relative mb-4 ${effectiveDisabled ? 'opacity-50' : ''} ${className}`}>
      {label && (
        <label className='block mb-1 text-gray-300' htmlFor={name}>
            {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      <div className="relative w-fit">
        {/* Container Visual (Focável) */}
        <div
          ref={containerRef}
          className={`
              flex items-center gap-1 p-1 rounded-md outline-none
              ${effectiveDisabled ? 'pointer-events-none' : ''}
              focus:ring-2 focus:ring-yellow-400 focus:bg-gray-800
          `}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onMouseLeave={() => setHoverValue(0)}
          tabIndex={effectiveDisabled ? -1 : 0}
          role="slider"
          aria-valuenow={currentValue}
          aria-label={label || name}
          aria-valuemin={0}
          aria-valuemax={maxStars}
        >
          {starsArray.map((starIndex) => (
            <svg
              key={starIndex}
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => !effectiveDisabled && setHoverValue(starIndex)}
              className={`
                  transition-transform duration-100 z-10 relative
                  ${starClassName}
                  ${effectiveDisabled ? '' : 'cursor-pointer hover:scale-110'} 
                  ${displayValue >= starIndex ? 'text-yellow-400' : 'text-gray-600'}
              `}
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
            </svg>
          ))}
        </div>

        {/* Anchor Input (Visual Proxy para Erro) */}
        <input
          ref={anchorInputRef}
          type="text"
          readOnly
          tabIndex={-1}
          style={{ height: '1px', opacity: 0 }} 
          className="absolute bottom-0 left-0 w-full pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Logic Input (Data Source) */}
      <input
        ref={logicInputRef}
        id={name}
        name={name}
        type='number'
        value={currentValue === 0 ? '' : currentValue}
        onChange={() => {}} // Controlado via updateValue
        onInvalid={handleInvalid}
        required={required}
        min={required ? 1 : 0}
        max={maxStars}
        disabled={disabled}
        data-validation={validationKey}
        tabIndex={-1}
        className='absolute w-full h-px opacity-0 bottom-0 left-0 m-0 p-0 border-0 pointer-events-auto z-0'
        aria-hidden="true"
      />
    </div>
  );
};

export default StarRating;