import React from "react";
import { createPortal } from "react-dom";

/**
 * Interface para as opções do Autocomplete.
 */
export interface IOption extends React.DetailedHTMLProps< React.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement> {
  /** O valor real que será enviado no formulário (ID) */
  value: string;
  /** O texto que será exibido para o usuário na lista */
  label: string;
}

export interface AutocompleteProps {
  // --- DADOS BÁSICOS ---
  /** O atributo 'name' do input oculto. Usado pelo useForm para extrair dados. */
  name: string;
  /** O rótulo visual do campo. */
  label: string;
  /** Array de opções para seleção. Em modo Async, este array é atualizado externamente pelo Pai. */
  options: IOption[];
  /** Valor inicial (ID) para pré-preenchimento (Ex: Modo Edição). */
  initialValue?: string;
  /** Texto placeholder do input de busca. */
  placeholder?: string;

  // --- BUSCA ASSÍNCRONA (ASYNC) ---
  /** * Função de busca remota.
   * Se fornecida, o filtro local é desativado e o controle da lista passa para o componente pai.
   * @param query O texto digitado pelo usuário.
   */
  onSearch?: (query: string) => void;
  /** Indica se a busca principal (no input) está em andamento (exibe spinner no input). */
  isLoading?: boolean;
  /** Tempo de espera (ms) antes de disparar o onSearch ao digitar. Default: 300ms. */
  debounceTime?: number;

  // --- PAGINAÇÃO (INFINITE SCROLL) ---
  /** Callback disparado quando o usuário rola até o final da lista. */
  onLoadMore?: () => void;
  /** Indica se a próxima página está sendo carregada (exibe spinner no rodapé da lista). */
  isLoadingMore?: boolean;
  /** Indica se existem mais páginas disponíveis para busca. Se false, para de chamar onLoadMore. */
  hasMore?: boolean;

  // --- FEEDBACK & COMPORTAMENTO ---
  /** Mensagem de erro customizada para exibir no rodapé da lista (ex: "Erro de Rede"). */
  errorMessage?: string;
  /** Se true, exibe um botão "X" para limpar a seleção atual. */
  clearable?: boolean;

  // --- ESTADO & VALIDAÇÃO ---
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  /** Chave para vincular a uma função de validação customizada no useForm. */
  validationKey?: string;

  // --- ESTILIZAÇÃO ---
  className?: string;

  // --- CUSTOM RENDER (Futuro) ---
  /** Função para renderizar o conteúdo de cada item da lista de forma customizada (ex: com avatar). */
  renderOption?: (option: IOption) => React.ReactNode;
}

/**
 * Componente Autocomplete Híbrido (v2.4).
 * * Arquitetura:
 * 1. **Visual:** Um input de texto para busca e uma lista suspensa renderizada via Portal (fura overflow).
 * 2. **Dados (Shadow Select):** Um `<select>` oculto mantém o valor real selecionado.
 * Isso garante que o `useForm` consiga extrair o valor nativamente via DOM.
 * 3. **Sincronia:** Ouve eventos de mudança no select oculto para atualizar o texto visível
 * automaticamente quando o formulário é resetado externamente (ex: modo Edição).
 */
const Autocomplete: React.FC<AutocompleteProps> = ({
  name,
  label,
  options = [],
  required,
  validationKey,
  initialValue = "",
  disabled,
  readOnly,
  onSearch,
  onLoadMore,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  errorMessage,
  clearable = false,
  debounceTime = 300,
  className = "",
  placeholder,
  renderOption,
}) => {
  const getOptionLabel = (opt: IOption) =>
    opt.label || (typeof opt.children === "string" ? opt.children : "");

  const findLabelByValue = (val: string) => {
    const found = options.find((s) => s.value === val);
    return found ? getOptionLabel(found) : "";
  };

  // Estados Visuais
  const [inputValue, setInputValue] = React.useState<string>("");
  const [selectedValue, setSelectedValue] = React.useState<string>(initialValue);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const [isTyping, setIsTyping] = React.useState(false);

  // Estado para posicionamento do Portal
  const [dropdownCoords, setDropdownCoords] = React.useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Refs de Infraestrutura
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const visibleInputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 1. SINCRONIA DOM BLINDADA (Edição/Reset) ---
  // Atualiza o input visual se o valor do select oculto mudar "por fora" (useForm)
  React.useEffect(() => {
    const select = selectRef.current;
    if (!select) return;

    const handleExternalChange = () => {
      // Se o usuário está digitando, não interrompemos o fluxo visual
      if (document.activeElement === visibleInputRef.current) return;

      const newValue = select.value;
      const newLabel = findLabelByValue(newValue);

      setSelectedValue(newValue);

      // Atualiza o texto se encontrou o label ou se o valor foi limpo
      // Em cenários Async, se o label não for encontrado (option não carregada), mantemos o texto anterior
      // ou limpamos, dependendo da estratégia. Aqui optamos por limpar se value for vazio.
      if (newLabel || newValue === "") {
        setInputValue(newLabel);
      }
    };

    if (!inputValue) handleExternalChange();

    select.addEventListener("change", handleExternalChange);
    return () => select.removeEventListener("change", handleExternalChange);
  }, [options, initialValue]);

  // --- 2. CÁLCULO DE POSIÇÃO (PORTAL) ---
  const updateDropdownPosition = () => {
    if (showSuggestions && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  React.useEffect(() => {
    updateDropdownPosition();
    // Recalcula ao scrollar ou redimensionar a janela para manter a lista colada no input
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, {
      capture: true,
    });

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, {
        capture: true,
      });
    };
  }, [showSuggestions]);

  // --- 3. SCROLL AUTOMÁTICO NA LISTA (Acessibilidade) ---
  React.useEffect(() => {
    if (showSuggestions && activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex, showSuggestions]);

  // --- LÓGICA DE ABERTURA ---
  const handleOpen = () => {
    if (readOnly || disabled) return;
    setShowSuggestions(true);
  };

  const updateHiddenSelect = (newSelectedValue: string) => {
    setSelectedValue(newSelectedValue);
    if (selectRef.current) {
      const nativeSelect = selectRef.current;
      nativeSelect.value = newSelectedValue;
      // Dispara evento para notificar o useForm
      nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));

      // Limpa erro visual nativo se preenchido
      if (visibleInputRef.current && newSelectedValue) {
        visibleInputRef.current.setCustomValidity("");
      }
    }
  };

  // --- FILTRO DE OPÇÕES ---
  const filteredSuggestions = React.useMemo(() => {
    // Se for busca remota, confiamos no Pai e mostramos tudo
    if (onSearch) return options;

    // Se for local, filtramos aqui
    if (!inputValue && !showSuggestions) return options;
    if (!inputValue) return options;
    return options.filter((suggestion) =>
      getOptionLabel(suggestion)
        .toLowerCase()
        .includes(inputValue.toLowerCase())
    );
  }, [options, inputValue, showSuggestions, onSearch]);

  const handleScrollList = (e: React.UIEvent<HTMLUListElement>) => {
    if (!onLoadMore || isLoadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Tolerância de 10px para disparar antes do fim absoluto
    if (scrollHeight - scrollTop <= clientHeight + 10) {
      onLoadMore();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setInputValue(text);

    if (!showSuggestions) setShowSuggestions(true);
    setActiveIndex(-1);

    // Se digitou algo novo, o ID selecionado anteriormente não é mais válido
    if (selectedValue) updateHiddenSelect("");

    if (onSearch) {
      setIsTyping(true); // Feedback visual imediato
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        onSearch(text);
        setIsTyping(false); // Passa o loading para o pai
      }, debounceTime);
    } else {
      // Modo Local: Tenta achar match exato enquanto digita
      const exactMatch = options.find(
        (s) => getOptionLabel(s).toLowerCase() === text.toLowerCase()
      );
      if (exactMatch) updateHiddenSelect(exactMatch.value);
    }
  };

  const handleSelectOption = (suggestion: IOption) => {
    if (suggestion.disabled) return;
    const displayLabel = getOptionLabel(suggestion);
    setInputValue(displayLabel);
    updateHiddenSelect(suggestion.value);
    setShowSuggestions(false);
    setActiveIndex(-1);
    visibleInputRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue("");
    updateHiddenSelect("");
    visibleInputRef.current?.focus();
    if (onSearch) onSearch(""); // Reseta a busca remota
  };

  // Intercepta validação nativa para mostrar balão no input visível
  const handleInvalid = (e: React.FormEvent<HTMLSelectElement>) => {
    e.preventDefault();
    if (visibleInputRef.current) {
      visibleInputRef.current.setCustomValidity(
        e.currentTarget.validationMessage
      );
      visibleInputRef.current.reportValidity();
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    // Timeout para verificar se o clique foi dentro do Portal
    setTimeout(() => {
      if (document.activeElement !== visibleInputRef.current) {
        setShowSuggestions(false);

        // Strict Mode (Local): Limpa se o texto não bater com nenhuma opção
        if (!onSearch && selectedValue) {
          const isValid = options.some((s) => getOptionLabel(s) === inputValue);
          if (!isValid) {
            setInputValue("");
            updateHiddenSelect("");
          }
        }
      }
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      handleOpen();
      return;
    }

    const maxIndex = filteredSuggestions.length - 1;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && filteredSuggestions[activeIndex]) {
        handleSelectOption(filteredSuggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const isBusy = isLoading || isTyping;
  const finalPlaceholder = isBusy
    ? "Buscando..."
    : placeholder || "Selecione...";

  // --- RENDERIZAÇÃO DO PORTAL ---
  const dropdownContent = (showSuggestions || isBusy || errorMessage) &&
    !disabled &&
    !readOnly && (
      <ul
        ref={listRef}
        onScroll={handleScrollList}
        className="bg-gray-800 border border-gray-600 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl z-[9999]"
        style={{
          position: "absolute",
          top: dropdownCoords.top,
          left: dropdownCoords.left,
          width: dropdownCoords.width,
        }}
        // Previne blur do input ao clicar na scrollbar ou borda da lista
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* Estado de Loading */}
        {isBusy && filteredSuggestions.length === 0 && (
          <li className="px-4 py-3 text-sm text-cyan-400 text-center flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            Buscando...
          </li>
        )}

        {/* Opções */}
        {filteredSuggestions.length > 0
          ? filteredSuggestions.map((suggestion, index) => {
              const displayLabel = getOptionLabel(suggestion);
              const isActive = index === activeIndex;
              const isSelected = selectedValue === suggestion.value;
              return (
                <li
                  key={suggestion.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`
                  cursor-pointer transition-colors border-b border-gray-600/30 last:border-0
                  ${isActive ? "bg-blue-600 text-white" : "text-gray-200 hover:bg-gray-600"}
                  ${isSelected ? "font-semibold bg-gray-600" : ""}
                  ${!renderOption ? "px-4 py-2.5 text-sm" : ""}
                `}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectOption(suggestion);
                  }}
                >
                  {renderOption ? renderOption(suggestion) : displayLabel}
                </li>
              );
            })
          : // Estado Zero
            !isBusy &&
            !errorMessage && (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">
                {onSearch && !inputValue
                  ? "Digite para pesquisar..."
                  : "Nenhum resultado encontrado."}
              </li>
            )}

        {/* Rodapé: Carregando Mais */}
        {isLoadingMore && (
          <li className="px-4 py-2 text-xs text-center text-blue-300 border-t border-gray-600/50 flex justify-center items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
            Carregando mais...
          </li>
        )}

        {/* Rodapé: Erro */}
        {errorMessage && (
          <li className="px-4 py-2 text-xs text-center text-red-300 bg-red-900/20 border-t border-red-900/30 flex justify-center items-center gap-2">
            <span>⚠️ {errorMessage}</span>
          </li>
        )}
      </ul>
    );

  return (
    <div
      className={`relative mb-4 ${className}`}
      ref={containerRef}
      onBlur={handleBlur}
    >
      <label
        className="block mb-1 text-gray-300"
        htmlFor={`autocomplete-${name}`}
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <div className="relative">
        <input
          ref={visibleInputRef}
          id={`autocomplete-${name}`}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleOpen}
          onClick={handleOpen}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          readOnly={readOnly}
          role="combobox"
          aria-expanded={showSuggestions}
          autoComplete="off"
          placeholder={finalPlaceholder}
          className={`
                form-input w-full p-2.5 bg-gray-800 text-white border border-gray-600 rounded-lg 
                focus:ring-2 focus:ring-blue-500 outline-none pr-8 transition-colors
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                ${errorMessage ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
            `}
        />

        <div className="absolute right-2 top-3 text-gray-400 flex items-center">
          {isBusy && (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-500 border-t-transparent"></div>
          )}
          {!isBusy && clearable && inputValue && !disabled && !readOnly && (
            <button
              type="button"
              onClick={handleClear}
              className="hover:text-white focus:outline-none"
              title="Limpar"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <select
        ref={selectRef}
        id={name}
        name={name}
        defaultValue={initialValue}
        onInvalid={handleInvalid}
        required={required}
        disabled={disabled}
        data-validation={validationKey}
        className="absolute w-px h-px overflow-hidden clip-[rect(0,0,0,0)] bottom-0 left-0"
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value="">Selecione...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {getOptionLabel(opt)}
          </option>
        ))}
      </select>

      {/* Renderiza via Portal no final do Body */}
      {showSuggestions && createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default Autocomplete;
