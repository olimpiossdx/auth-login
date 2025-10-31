import React from 'react';

// Define a estrutura para cada sugestão, estendendo as props de <option>
export interface IOption extends React.DetailedHTMLProps<React.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement> {
  value: string;
  label: string;
};

export interface AutocompleteProps {
  name: string;
  label: string;
  // Agora espera um array da nova interface SuggestionOption
  options: IOption[];
  required?: boolean;
  validationKey?: string; // Para validação customizada via data-validation
  initialValue?: string; // Refere-se ao VALUE inicial
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  name,
  label,
  options = [], // Garante que seja um array
  required,
  validationKey,
  initialValue = "",
}) => {
  // Encontra o label inicial correspondente ao initialValue
  const findInitialLabel = (): string => {
    if (!initialValue) return "";
    // Prioriza o 'label' que definimos, mas usa 'children' como fallback se 'label' não existir
    const found = options.find(s => s.value === initialValue);
    return found ? (found.label || (typeof found.children === 'string' ? found.children : "")) : "";
  };

  const [inputValue, setInputValue] = React.useState<string>(findInitialLabel()); // Estado para o texto visível (label)
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<IOption[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState<string>(initialValue); // Estado para o valor real (value)
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const visibleInputRef = React.useRef<HTMLInputElement>(null);

  // Atualiza o select escondido e dispara eventos
  const updateHiddenSelect = (newSelectedValue: string) => {
    setSelectedValue(newSelectedValue);

    if (selectRef.current) {
      selectRef.current.value = newSelectedValue;
      selectRef.current.dispatchEvent(new Event('change', { bubbles: true }));

      // Sincroniza estado visual
      if (visibleInputRef.current) {
        if (selectRef.current.classList.contains('is-touched')) {
          visibleInputRef.current.classList.add('is-touched');
        } else {
          visibleInputRef.current.classList.remove('is-touched');
        }
        visibleInputRef.current.setCustomValidity(selectRef.current.validationMessage);
      }
    }
  };

  // Lógica para filtrar sugestões baseado no LABEL
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const typedLabel = event.target.value;
    setInputValue(typedLabel);

    let finalValue = "";
    let foundMatch = false;

    if (typedLabel && Array.isArray(options)) {
      // Filtra usando 'label' ou 'children' como fallback
      const filtered = options.filter(suggestion =>
        (suggestion.label || (typeof suggestion.children === 'string' ? suggestion.children : ""))
          .toLowerCase().includes(typedLabel.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);

      // Verifica se o texto digitado corresponde exatamente a um label
      const exactMatch = options.find(s => (s.label || (typeof s.children === 'string' ? s.children : "")).toLowerCase() === typedLabel.toLowerCase());
      if (exactMatch) {
        finalValue = exactMatch.value;
        foundMatch = true;
      }

    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
    if (!foundMatch) {
      finalValue = "";
    }
    updateHiddenSelect(finalValue);
  };

  // Seleciona uma sugestão (objeto SuggestionOption)
  const handleSuggestionClick = (suggestion: IOption) => {
    const displayLabel = suggestion.label || (typeof suggestion.children === 'string' ? suggestion.children : "");
    setInputValue(displayLabel); // Mostra o label no input visível
    updateHiddenSelect(suggestion.value); // Define o value no select escondido
    setFilteredSuggestions([]);
    setShowSuggestions(false);
    if (visibleInputRef.current) {
      visibleInputRef.current.focus();
    }
  };

  // Lida com o blur (dispara o evento para o useForm)
  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (containerRef.current && !containerRef.current.contains(event.relatedTarget as Node)) {
      if (selectRef.current) {
        selectRef.current.dispatchEvent(new Event('blur', { bubbles: true }));
        if (visibleInputRef.current) {
          if (selectRef.current.classList.contains('is-touched')) {
            visibleInputRef.current.classList.add('is-touched');
          }
          visibleInputRef.current.setCustomValidity(selectRef.current.validationMessage);
        }
      }
      setShowSuggestions(false);
      // Ao sair, verifica se o input visível corresponde a um label válido
      const isValidLabel = options.some(s => (s.label || (typeof s.children === 'string' ? s.children : "")) === inputValue);
      if (!isValidLabel) {
        setInputValue("");
        updateHiddenSelect("");
      }
    }
  };

  // Lida com o clique fora para fechar sugestões
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        // Ao clicar fora, verifica se o input visível corresponde a um label válido
        const isValidLabel = options.some(s => (s.label || (typeof s.children === 'string' ? s.children : "")) === inputValue);
        if (!isValidLabel && selectedValue !== "") {
          setInputValue("");
          updateHiddenSelect("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef, inputValue, options, selectedValue]);

  function handleFocus(inputValue: string, suggestions: IOption[], setFilteredSuggestions: React.Dispatch<React.SetStateAction<IOption[]>>, setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>): React.FocusEventHandler<HTMLInputElement> | undefined {
    return () => {
      if (inputValue || suggestions.length <= 10) {
        const filtered = suggestions.filter(suggestion => (suggestion.label || (typeof suggestion.children === 'string' ? suggestion.children : ""))
          .toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredSuggestions(filtered);
        setShowSuggestions(true);
      }
    };
  };

  return (
    <div className="relative mb-4" ref={containerRef} onBlur={handleBlur}>
      <label className="block mb-1 text-gray-300" htmlFor={`autocomplete-${name}`}>
        {label}
      </label>
      {/* Input Visível (para busca pelo LABEL) */}
      <input
        ref={visibleInputRef}
        id={`autocomplete-${name}`}
        type="text"
        value={inputValue} // Mostra o label
        onChange={handleInputChange}
        onFocus={handleFocus(inputValue, options, setFilteredSuggestions, setShowSuggestions)}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showSuggestions && filteredSuggestions.length > 0}
        aria-controls={`${name}-suggestions`}
        className="form-input"
        autoComplete="off"
      />

      {/* Select âncora escondido (usa VALUE e passa outras props do <option>) */}
      <select
        ref={selectRef}
        id={name}
        name={name}
        value={selectedValue} // Usa o value
        onChange={() => { }}
        required={required}
        data-validation={validationKey}
        className='absolute w-[1px] h-[1px] -m-[1px] p-0 overflow-hidden clip-[rect(0,0,0,0)] border-0'
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value=""></option>
        {/* Popula com value e label, e passa o resto das props para <option> */}
        {Array.isArray(options) && options.map(suggestion => {
          // Separa 'label' e 'children' das outras props de <option>
          const { label: suggestionLabel, children: suggestionChildren, ...optionProps } = suggestion;
          return (
            <option key={suggestion.value} {...optionProps} > {/* Passa as props restantes */}
              {suggestionLabel || suggestionChildren} {/* Usa label ou children para o texto interno */}
            </option>
          );
        })}
      </select>

      {/* Lista de Sugestões (mostra LABEL ou children) */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul
          id={`${name}-suggestions`}
          role="listbox"
          className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
          {filteredSuggestions.map((suggestion, index) => {
            const displayLabel = suggestion.label || (typeof suggestion.children === 'string' ? suggestion.children : "");
            return (
              <li
                key={suggestion.value}
                id={`${name}-suggestion-${index}`}
                role="option"
                aria-selected={selectedValue === suggestion.value}
                // Adiciona classe se a opção estiver desabilitada
                className={`px-4 py-2 text-gray-200 hover:bg-gray-600 ${suggestion.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                // Impede a seleção de opções desabilitadas
                onMouseDown={(e) => {
                  if (suggestion.disabled) {
                    e.preventDefault();
                    return;
                  }
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }}
              >
                {displayLabel}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;

