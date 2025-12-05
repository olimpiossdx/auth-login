import React from 'react';
import { createPortal } from 'react-dom';

export interface IOption extends React.DetailedHTMLProps<React.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement> {
  value: string;
  label: string;
}

export interface AutocompleteProps {
  name: string;
  label: string;
  options: IOption[];
  initialValue?: string;
  placeholder?: string;

  // Async
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  debounceTime?: number;

  // Paginação
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;

  errorMessage?: string;
  clearable?: boolean;

  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  validationKey?: string;
  className?: string;

  // Custom Render
  renderOption?: (option: IOption) => React.ReactNode;
}

const Autocomplete: React.FC<AutocompleteProps> = (props) => {
  const { name, label, options = [], required, validationKey, initialValue = "", disabled, readOnly, onSearch, onLoadMore,
    isLoading = false, isLoadingMore = false, hasMore = false, errorMessage, clearable = false, debounceTime = 300,
    className = "", placeholder, renderOption } = props;

  const getOptionLabel = (opt: IOption) => opt.label || (typeof opt.children === 'string' ? opt.children : "");

  const findLabelByValue = (val: string) => {
    const found = options.find(s => s.value === val);
    return found ? getOptionLabel(found) : "";
  };

  const [inputValue, setInputValue] = React.useState<string>("");
  const [selectedValue, setSelectedValue] = React.useState<string>(initialValue);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const [isTyping, setIsTyping] = React.useState(false);

  const [dropdownCoords, setDropdownCoords] = React.useState({ top: 0, left: 0, width: 0 });

  const selectRef = React.useRef<HTMLSelectElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const visibleInputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- SINCRONIA DOM BLINDADA (Edição/Reset) ---
  React.useEffect(() => {
    const select = selectRef.current;
    if (!select) return;

    const handleExternalChange = () => {
      if (document.activeElement === visibleInputRef.current) return;

      const newValue = select.value;

      // Lógica Híbrida: Dataset Label (Prioridade) ou Lista (Fallback)
      const labelFromDataset = select.dataset.label;
      const labelFromList = findLabelByValue(newValue);
      const finalLabel = labelFromDataset || labelFromList;

      setSelectedValue(newValue);

      if (finalLabel || newValue === "") {
        setInputValue(finalLabel || "");
      }

      // --- CORREÇÃO DO BUG ---
      // Se o valor mudou externamente (Reset/Edição), limpamos qualquer erro
      // que tenha ficado "preso" no input visível.
      if (visibleInputRef.current) {
        visibleInputRef.current.setCustomValidity("");
      }
    };

    if (!inputValue) handleExternalChange();

    select.addEventListener('change', handleExternalChange);
    select.addEventListener('input', handleExternalChange);

    return () => {
      select.removeEventListener('change', handleExternalChange);
      select.removeEventListener('input', handleExternalChange);
    };
  }, [options, initialValue]);

  // --- POSITIONING ---
  const updateDropdownPosition = () => {
    if (showSuggestions && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  React.useEffect(() => {
    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, { capture: true });
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, { capture: true });
    };
  }, [showSuggestions]);

  React.useEffect(() => {
    if (showSuggestions && activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement;
      if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, showSuggestions]);

  const handleOpen = () => {
    if (readOnly || disabled) return;
    setShowSuggestions(true);
  };

  // --- ATUALIZAÇÃO DE VALOR ---
  const updateHiddenSelect = (newSelectedValue: string, newLabel?: string) => {
    setSelectedValue(newSelectedValue);

    // Limpa erro visual imediatamente (Reward Early)
    if (visibleInputRef.current) {
      visibleInputRef.current.setCustomValidity("");
    }

    if (selectRef.current) {
      const nativeSelect = selectRef.current;
      nativeSelect.value = newSelectedValue;

      if (newLabel) nativeSelect.dataset.label = newLabel;
      else if (newSelectedValue === "") delete nativeSelect.dataset.label;

      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const filteredSuggestions = React.useMemo(() => {
    if (onSearch) return options;
    if (!inputValue && !showSuggestions) return options;
    if (!inputValue) return options;
    return options.filter(suggestion =>
      getOptionLabel(suggestion).toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue, showSuggestions, onSearch]);

  const handleScrollList = (e: React.UIEvent<HTMLUListElement>) => {
    if (!onLoadMore || isLoadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 10) onLoadMore();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setInputValue(text);
    if (!showSuggestions) setShowSuggestions(true);
    setActiveIndex(-1);

    // Limpa erro visual ao começar a digitar
    event.target.setCustomValidity("");

    if (selectedValue) updateHiddenSelect("");

    if (onSearch) {
      setIsTyping(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => { onSearch(text); setIsTyping(false); }, debounceTime);
    } else {
      const exactMatch = options.find(s => getOptionLabel(s).toLowerCase() === text.toLowerCase());
      if (exactMatch) updateHiddenSelect(exactMatch.value, getOptionLabel(exactMatch));
    }
  };

  const handleSelectOption = (suggestion: IOption) => {
    if (suggestion.disabled) return;
    const displayLabel = getOptionLabel(suggestion);

    setInputValue(displayLabel);
    updateHiddenSelect(suggestion.value, displayLabel);

    setShowSuggestions(false);
    setActiveIndex(-1);
    visibleInputRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue("");
    updateHiddenSelect("");
    visibleInputRef.current?.focus();
    if (onSearch) onSearch("");
  };

  // --- PROXY DE VALIDAÇÃO ---
  const handleInvalidSelect = (e: React.FormEvent<HTMLSelectElement>) => {
    e.preventDefault();

    if (visibleInputRef.current) {
      const msg = e.currentTarget.validationMessage;
      visibleInputRef.current.setCustomValidity(msg);
      visibleInputRef.current.reportValidity();
    }
  };

  const handleBlur = (_: React.FocusEvent<HTMLDivElement>) => {
    setTimeout(() => {
      if (document.activeElement !== visibleInputRef.current) {
        setShowSuggestions(false);
        if (!onSearch && selectedValue) {
          const isValid = options.some(s => getOptionLabel(s) === inputValue);
          if (!isValid) { setInputValue(""); updateHiddenSelect(""); }
        }
      }
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault(); handleOpen(); return;
    }
    const maxIndex = filteredSuggestions.length - 1;
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setActiveIndex(prev => (prev < maxIndex ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filteredSuggestions[activeIndex]) handleSelectOption(filteredSuggestions[activeIndex]);
    } else if (e.key === 'Escape') setShowSuggestions(false);
  };

  const isBusy = isLoading || isTyping;
  const finalPlaceholder = isBusy ? "Buscando..." : (placeholder || "Selecione...");

  const dropdownContent = (showSuggestions || isBusy || errorMessage) && !disabled && !readOnly && (
    <ul ref={listRef} onScroll={handleScrollList} className="bg-gray-800 border border-gray-600 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl z-[9999]"
      style={{ position: 'absolute', top: dropdownCoords.top, left: dropdownCoords.left, width: dropdownCoords.width }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {isBusy && filteredSuggestions.length === 0 && (
        <li className="px-4 py-3 text-sm text-cyan-400 text-center flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          Buscando...
        </li>
      )}
      {filteredSuggestions.length > 0 ? (
        filteredSuggestions.map((suggestion, index) => (
          <li key={suggestion.value} role="option" aria-selected={selectedValue === suggestion.value}
            className={`cursor-pointer transition-colors border-b border-gray-600/30 last:border-0 ${index === activeIndex ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-gray-600'} ${selectedValue === suggestion.value ? 'font-semibold bg-gray-600' : ''} ${!renderOption ? 'px-4 py-2.5 text-sm' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleSelectOption(suggestion); }}
          >
            {renderOption ? renderOption(suggestion) : getOptionLabel(suggestion)}
          </li>
        ))
      ) : (
        !isBusy && !errorMessage && <li className="px-4 py-3 text-sm text-gray-400 text-center">{onSearch && !inputValue ? "Digite para pesquisar..." : "Nenhum resultado encontrado."}</li>
      )}
      {isLoadingMore && <li className="px-4 py-2 text-xs text-center text-blue-300 border-t border-gray-600/50 flex justify-center items-center gap-2">
        <div className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
        Carregando mais...
      </li>}
      {errorMessage && <li className="px-4 py-2 text-xs text-center text-red-300 bg-red-900/20 border-t border-red-900/30 flex justify-center items-center gap-2"><span>⚠️ {errorMessage}</span></li>}
    </ul>
  );

  return (
    <div className={`relative ${className}`} ref={containerRef} onBlur={handleBlur}>
      <label className="block mb-1 text-gray-300" htmlFor={`autocomplete-${name}`}>{label} {required && <span className="text-red-400">*</span>}</label>
      <div className="relative">
        <input ref={visibleInputRef} id={`autocomplete-${name}`} type="text" value={inputValue} onChange={handleInputChange}
          onFocus={handleOpen} onClick={handleOpen} onKeyDown={handleKeyDown} disabled={disabled} readOnly={readOnly}
          role="combobox" aria-expanded={showSuggestions} autoComplete="off" placeholder={finalPlaceholder}
          className={`form-input w-full p-2.5 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-8 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${errorMessage ? 'border-red-500' : ''}`}
        />
        <div className="absolute right-2 top-3 text-gray-400 flex items-center">
          {isBusy ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-500 border-t-transparent"></div> :
            clearable && inputValue && !disabled && !readOnly && <button type="button" onClick={handleClear} className="hover:text-white">✕</button>}
        </div>
      </div>

      <select ref={selectRef} id={name} name={name} defaultValue={initialValue} onInvalid={handleInvalidSelect} required={required} disabled={disabled} data-validation={validationKey}
        className='absolute w-px h-px overflow-hidden clip-[rect(0,0,0,0)] bottom-0 left-0' tabIndex={-1} aria-hidden="true"
      >
        <option value="">Selecione...</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{getOptionLabel(opt)}</option>)}
      </select>
      {showSuggestions && createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default Autocomplete;