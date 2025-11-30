import React from "react";

export interface IOption
  extends React.DetailedHTMLProps<
    React.OptionHTMLAttributes<HTMLOptionElement>,
    HTMLOptionElement
  > {
  value: string;
  label: string;
}

export interface AutocompleteProps {
  name: string;
  label: string;
  options: IOption[];
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  validationKey?: string;
  initialValue?: string;
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  name,
  label,
  options = [],
  required,
  validationKey,
  initialValue = "",
  disabled,
  readOnly,
}) => {
  // --- HELPERS ---
  const useGetOptionLabel = React.useCallback((option: IOption) => option.label || (typeof option.children === "string" ? option.children : ""), []);

  const useFindInitialLabel = React.useCallback((): string => {
    if (!initialValue) return "";
    const found = options.find((s) => s.value === initialValue);
    return found ? useGetOptionLabel(found) : "";
  }, [initialValue, options, useGetOptionLabel]);

  // --- ESTADOS ---
  const [inputValue, setInputValue] = React.useState<string>(useFindInitialLabel());
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState<string>(initialValue);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);

  // --- REFS ---
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const visibleInputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  // NOVA REF: Controla se o blur deve ser ignorado
  const ignoreBlurRef = React.useRef(false);

  // --- SINCRONIA INICIAL ---
  React.useEffect(() => {
    setSelectedValue(initialValue);
    setInputValue(useFindInitialLabel());
  }, [initialValue, useFindInitialLabel]);

  // Limpeza de erro baseada em estado
  React.useEffect(() => {
    if (visibleInputRef.current && selectedValue) {
      visibleInputRef.current.setCustomValidity("");
    }
  }, [selectedValue]);

    React.useEffect(() => {
      const select = selectRef.current;
      if (!select) return;

      const handleExternalChange = () => {
          // O DOM mudou (resetSection). Precisamos atualizar o visual.
          const newValue = select.value;
          
          // Encontra o label correspondente ao novo valor (ID)
          const found = options.find(opt => opt.value === newValue);
          const newLabel = found ? (found.label || String(found.children)) : "";
          
          // Atualiza estados visuais
          setSelectedValue(newValue);
          setInputValue(newLabel);
      };

      select.addEventListener('change', handleExternalChange);
      
      return () => {
          select.removeEventListener('change', handleExternalChange);
      };
  }, [options]);
  
  // --- ATUALIZAÇÃO DO SELECT OCULTO ---
  const updateHiddenSelect = (newSelectedValue: string) => {
    setSelectedValue(newSelectedValue);

    if (selectRef.current) {
      const nativeSelect = selectRef.current;
      nativeSelect.value = newSelectedValue;
      nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));

      if (
        visibleInputRef.current &&
        nativeSelect.classList.contains("is-touched")
      ) {
        visibleInputRef.current.classList.add("is-touched");
      }
    }
  };

  // --- FILTRO ---
  const useFilteredSuggestions = React.useMemo(() => {
    if (!inputValue && !showSuggestions) {
      return options;
    };

    return options.filter((suggestion) =>
      useGetOptionLabel(suggestion)
        .toLowerCase()
        .includes(inputValue.toLowerCase())
    );
  }, [options, inputValue, showSuggestions, useGetOptionLabel]);

  // --- HANDLER DE INPUT ---
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setInputValue(value);
    setShowSuggestions(true);
    setActiveIndex(-1);

    if (visibleInputRef.current) {
      visibleInputRef.current.setCustomValidity("");
    }
    if (selectedValue !== "") {
      updateHiddenSelect("");
    }
  };

  // --- SELEÇÃO (Ajustado com ignoreBlurRef) ---
  const handleSelectOption = (suggestion: IOption) => {
    if (suggestion.disabled) {
      return;
    };

    const displayLabel = useGetOptionLabel(suggestion);

    // Atualiza estados
    setInputValue(displayLabel);
    setShowSuggestions(false);
    setActiveIndex(-1);

    updateHiddenSelect(suggestion.value);

    if (visibleInputRef.current) {
      // Atualiza visualmente agora (para garantir que o usuário veja o texto)
      visibleInputRef.current.value = displayLabel;
      visibleInputRef.current.setCustomValidity("");

      // TRUQUE DO BLUR:
      // 1. Levantamos a bandeira para o handleBlur não rodar a limpeza
      ignoreBlurRef.current = true;

      // 2. Disparamos o blur (remove o balão de erro) e voltamos o foco
      visibleInputRef.current.blur();
      visibleInputRef.current.focus();

      // 3. Baixamos a bandeira logo depois que o ciclo de eventos passar
      setTimeout(() => {
        ignoreBlurRef.current = false;
      }, 50);
    }
  };

  // --- INTERCEPTADOR DE ERRO ---
  const handleInvalid = (e: React.FormEvent<HTMLSelectElement>) => {
    e.preventDefault(); // 1. Impede o balão no select oculto (que o navegador bloquearia anyway)

    if (visibleInputRef.current) {
      // 2. Copia a mensagem de erro nativa do select para o input visível
      visibleInputRef.current.setCustomValidity(e.currentTarget.validationMessage);

      // 3. Força o navegador a mostrar o balão no INPUT VISÍVEL
      visibleInputRef.current.reportValidity();
    }
  };

  // --- BLUR (Ajustado com ignoreBlurRef) ---
  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    // 1. SE A BANDEIRA ESTIVER LEVANTADA, NÃO FAZ NADA.
    // Isso impede que o nosso truque de limpar o balão apague os dados.
    if (ignoreBlurRef.current) {
      return;
    }

    if (
      containerRef.current &&
      containerRef.current.contains(event.relatedTarget as Node)
    ) {
      return;
    }

    if (selectRef.current)
      selectRef.current.dispatchEvent(new Event("blur", { bubbles: true }));
    setShowSuggestions(false);

    // Validação Strict Mode
    // Nota: Usamos visibleInputRef.current.value aqui para pegar o valor mais atual do DOM
    // caso o React State ainda esteja pendente.
    const currentText = visibleInputRef.current
      ? visibleInputRef.current.value
      : inputValue;
    const optionMatch = options.find(
      (s) => useGetOptionLabel(s).toLowerCase() === currentText.toLowerCase()
    );

    if (optionMatch) {
      if (currentText !== useGetOptionLabel(optionMatch)) {
        setInputValue(useGetOptionLabel(optionMatch));
      }
      if (selectedValue !== optionMatch.value) {
        updateHiddenSelect(optionMatch.value);
        if (visibleInputRef.current) {
          visibleInputRef.current.setCustomValidity("");
        }
      }
    } else {
      setInputValue("");
      updateHiddenSelect("");
    }
  };

  // --- KEYDOWN ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setShowSuggestions(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < useFilteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (showSuggestions && useFilteredSuggestions.length > 0) {
        e.preventDefault();
        if (activeIndex >= 0) {
          handleSelectOption(useFilteredSuggestions[activeIndex]);
        } else if (useFilteredSuggestions.length === 1) {
          handleSelectOption(useFilteredSuggestions[0]);
        }
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (e.key === "Tab") {
      setShowSuggestions(false);
    }
  };

  // Scroll
  React.useEffect(() => {
    if (showSuggestions && activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [activeIndex, showSuggestions]);

  return (
    <div className="relative mb-4" ref={containerRef} onBlur={handleBlur}>
      <label
        className="block mb-1 text-gray-300 font-medium"
        htmlFor={`autocomplete-${name}`}
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <input
        ref={visibleInputRef}
        id={`autocomplete-${name}`}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => !readOnly && !disabled && setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        readOnly={readOnly}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        autoComplete="off"
        placeholder="Selecione..."
        className={`
            form-input w-full p-2.5 bg-gray-800 text-white border border-gray-600 rounded-lg 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all
            placeholder-gray-500
            ${disabled || readOnly ? "opacity-50 cursor-not-allowed bg-gray-900" : ""}
        `}
      />

      <select
        ref={selectRef}
        id={name}
        name={name}
        // MUDANÇA 1: Usamos defaultValue, não value. O React larga o controle após o mount.
        defaultValue={initialValue}
        onChange={() => { }}
        onInvalid={handleInvalid}
        required={required}
        disabled={disabled}
        data-validation={validationKey}
        className='absolute w-0.5 h-0.5 -m-0.5 p-0 overflow-hidden clip-[rect(0,0,0,0)] border-0 pointer-events-none'
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value="">Selecione...</option>
        {options.map(suggestion => {
          const { label: l, children: c, ...rest } = suggestion;
          // MUDANÇA 2: Garantimos que a prop 'selected' não interfira
          return <option key={suggestion.value} {...rest}>{l || c}</option>;
        })}
      </select>

      {showSuggestions && useFilteredSuggestions.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full bg-gray-700 border border-gray-600 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl ring-1 ring-black ring-opacity-5"
        >
          {useFilteredSuggestions.map((suggestion, index) => {
            const displayLabel = useGetOptionLabel(suggestion);
            const isActive = index === activeIndex;
            const isSelected = selectedValue === suggestion.value;

            return (
              <li
                key={suggestion.value}
                role="option"
                aria-selected={isSelected}
                className={`
                  px-4 py-2.5 text-sm text-gray-200 cursor-pointer transition-colors
                  ${isActive ? "bg-blue-600 text-white" : "hover:bg-gray-600"}
                  ${isSelected ? "font-semibold bg-gray-600 text-blue-200" : ""}
                  ${suggestion.disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectOption(suggestion);
                }}
              >
                {displayLabel}
              </li>
            );
          })}
        </ul>
      )}

      {showSuggestions && useFilteredSuggestions.length === 0 && inputValue && (
        <div className="absolute z-50 w-full bg-gray-700 border border-gray-600 rounded-lg mt-1 p-3 text-gray-400 text-sm shadow-lg text-center">
          Nenhuma opção encontrada.
        </div>
      )}
    </div>
  );
};

export default Autocomplete;
