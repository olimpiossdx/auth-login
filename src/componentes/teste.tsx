import React from 'react';
import type { AutocompleteProps } from './autocomplete';
import { createRoot } from 'react-dom/client';
// Importa o novo componente - REMOVIDO: import Autocomplete from './Autocomplete';

// --- DEFINIÇÕES DE TIPO ---

type HTMLFieldElements = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// Interface para o resultado da validação
interface IValidationResult {
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

// O tipo de retorno da função de validação
type ValidationResult = string | IValidationResult | true | undefined;

// Define a estrutura para cada sugestão (exportada para uso externo se necessário)
export interface SuggestionOption extends React.DetailedHTMLProps<React.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement> {
  value: string;
  label: string; // Usaremos 'label' para exibição e busca
}


// Assinatura da função de validação (com genéricos)
type ValidateFn<FormValues> = (
  value: any, // Mantido 'any' devido a limitações do TS em mapas
  field: HTMLFieldElements,
  formValues: FormValues
) => ValidationResult;

// Mapa de validadores (tipado)
type ValidatorMap<FV> = Record<string, ValidateFn<FV>>;

// --- O HOOK `useForm` (v4.0 Tipado + IValidator) ---
// (O código do hook useForm permanece inalterado)
function useForm<FV extends Record<string, any>>(providedId?: string) {
  const generatedId = React.useId();
  const formId = providedId || generatedId; // Usa ID fornecido ou gera um

  const formRef = React.useRef<HTMLFormElement | null>(null);
  const fieldRefs = React.useRef<Record<string, HTMLElement>>({});
  const validationKeysRef = React.useRef<Record<string, string>>({});
  const validatorsRef = React.useRef<ValidatorMap<FV>>({}); // Tipado com FV

  // Função para o componente "registrar" suas funções de validação
  const setValidators = React.useCallback((validators: ValidatorMap<FV>) => { // Tipado com FV
    validatorsRef.current = validators;
  }, []);

  const getValues = React.useCallback((): FV => { // Retorna o tipo FV
    const values: any = {};
    for (const name in fieldRefs.current) {
      const element = fieldRefs.current[name] as HTMLInputElement | HTMLSelectElement; // Ajustado para incluir select
      if (element) {
        values[name] = element.type === 'number' ? element.valueAsNumber || (element.value === "" ? "" : 0) :
          element.type === 'checkbox' ? element.checked :
            // Garante que leia o valor corretamente de select também
            element.value;
      }
    }
    return values as FV; // Cast para FV
  }, []);

  // --- `handleInteraction` (Re-validação em tempo real com IValidator) ---
  const handleInteraction = React.useCallback((e: Event) => {
    const currentField = e.currentTarget as HTMLInputElement | HTMLSelectElement;
    currentField.classList.add('is-touched');

    const formValues = getValues();
    const validatorFns = validatorsRef.current;

    for (const name in fieldRefs.current) {
      const field = fieldRefs.current[name] as HTMLInputElement | HTMLSelectElement;
      // Adicionado null check para segurança
      if (!field) {
        continue;
      };
      const validationKey = validationKeysRef.current[name];

      // Limpa validação customizada anterior antes de revalidar
      field.setCustomValidity('');

      if (validationKey) {
        const customValidate = validatorFns[validationKey];
        if (customValidate) {
          // Passa os 3 argumentos tipados (exceto 'value')
          const result = customValidate(formValues[name], field, formValues);

          // Processa o resultado (string, IValidator, true, undefined)
          if (typeof result === 'string') {
            field.setCustomValidity(result); // Erro
          } else if (typeof result === 'object' && result?.type === 'error') {
            field.setCustomValidity(result.message); // Erro
          }
          // Outros tipos ('warning', 'info', 'success', true, undefined) não definem erro customizado
        }
      }
      // A validação nativa será reavaliada pelo navegador de qualquer forma
    }
  }, [getValues]); // Depende do getValues

  // Efeito para encontrar o formulário e registrar os campos automaticamente
  React.useLayoutEffect(() => {
    // Usa o formId (fornecido ou gerado)
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) {
      console.warn(`[useForm] Formulário com id '${formId}' não encontrado.`);
      return;
    }
    formRef.current = form;

    const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input[name], select[name], textarea[name]'
    );

    const registeredFields: HTMLElement[] = [];

    fields.forEach((field) => {
      const name = field.name;
      if (!name) return;

      fieldRefs.current[name] = field;
      validationKeysRef.current[name] = field.dataset.validation || '';
      registeredFields.push(field);

      field.addEventListener('blur', handleInteraction);
      field.addEventListener('change', handleInteraction);
    });

    return () => {
      registeredFields.forEach((field) => {
        field.removeEventListener('blur', handleInteraction);
        field.removeEventListener('change', handleInteraction);
      });
      fieldRefs.current = {};
      validationKeysRef.current = {};
      formRef.current = null;
    };
  }, [formId, handleInteraction]);

  const handleSubmit = React.useCallback((onValid: (data: FV) => void) => // Usa FV
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = formRef.current;
      if (!form) return;

      const formValues = getValues();
      const validatorFns = validatorsRef.current;

      // Fase 1: Forçar 'touched' e rodar validações customizadas (uma última vez)
      for (const name in fieldRefs.current) {
        const field = fieldRefs.current[name] as HTMLInputElement | HTMLSelectElement;
        if (!field) continue;

        field.classList.add('is-touched');
        // Limpa antes de validar no submit
        field.setCustomValidity('');

        const validationKey = validationKeysRef.current[name];
        if (validationKey) {
          const customValidate = validatorFns[validationKey];
          if (customValidate) {
            // Passa os 3 argumentos
            const result = customValidate(formValues[name], field, formValues);

            // Processa o resultado (igual ao handleInteraction)
            if (typeof result === 'string') {
              field.setCustomValidity(result); // Erro
            } else if (typeof result === 'object' && result?.type === 'error') {
              field.setCustomValidity(result.message); // Erro
            }
            // Outros tipos não definem erro para o balão
          }
        }
      }

      // Fase 2: Pedir ao navegador para checar TUDO
      const isFormValid = form.checkValidity();

      if (!isFormValid) {
        form.reportValidity(); // Mostra o balão nativo (apenas para 'error')
      } else {
        onValid(formValues); // Sucesso! (passa FV)
      }
    }, [getValues]);

  // Retorna as funções e o formId
  return { handleSubmit, setValidators, formId };
}

// --- COMPONENTE AUTOCOMPLETE (MOVIDO PARA CÁ) ---
const Autocomplete: React.FC<AutocompleteProps> = ({
  name,
  label,
  options: suggestions = [], // Garante que seja um array
  required,
  validationKey,
  initialValue = "",
}) => {
  // Encontra o label inicial correspondente ao initialValue
  const findInitialLabel = (): string => {
    if (!initialValue || !Array.isArray(suggestions)) return "";
    // Prioriza o 'label' que definimos, mas usa 'children' como fallback se 'label' não existir
    const found = suggestions.find(s => s.value === initialValue);
    return found ? (found.label || (typeof found.children === 'string' ? found.children : "")) : "";
  };

  const [inputValue, setInputValue] = React.useState<string>(findInitialLabel()); // Estado para o texto visível (label)
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<SuggestionOption[]>([]);
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

    if (typedLabel && Array.isArray(suggestions)) {
      // Filtra usando 'label' ou 'children' como fallback
      const filtered = suggestions.filter(suggestion =>
        (suggestion.label || (typeof suggestion.children === 'string' ? suggestion.children : ""))
          .toLowerCase().includes(typedLabel.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);

      // Verifica se o texto digitado corresponde exatamente a um label
      const exactMatch = suggestions.find(s => (s.label || (typeof s.children === 'string' ? s.children : "")).toLowerCase() === typedLabel.toLowerCase());
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
  const handleSuggestionClick = (suggestion: SuggestionOption) => {
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
      const isValidLabel = Array.isArray(suggestions) && suggestions.some(s => (s.label || (typeof s.children === 'string' ? s.children : "")) === inputValue);
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
        const isValidLabel = Array.isArray(suggestions) && suggestions.some(s => (s.label || (typeof s.children === 'string' ? s.children : "")) === inputValue);
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
  }, [containerRef, inputValue, suggestions, selectedValue]);


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
        onFocus={() => {
          if (Array.isArray(suggestions)) {
            const filtered = suggestions.filter(suggestion =>
              (suggestion.label || (typeof suggestion.children === 'string' ? suggestion.children : ""))
                .toLowerCase().includes(inputValue.toLowerCase())
            );
            setFilteredSuggestions(filtered);
            setShowSuggestions(true);
          }
        }}
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
        className='absolute w-1px h-1px -m-1px p-0 overflow-hidden clip-[rect(0,0,0,0)] border-0'
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value=""></option>
        {/* Popula com value e label, e passa o resto das props para <option> */}
        {Array.isArray(suggestions) && suggestions.map(suggestion => {
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


// --- COMPONENTES DE EXEMPLO ---

// 1. Cenário: Formulário de Login (Nativo)
const LoginForm = () => {
  // Define o tipo do formulário (opcional, mas bom para clareza)
  interface LoginFormValues {
    email: string;
    senha?: string; // Opcional se não for usado na validação
  }
  // Hook agora retorna formId
  const { handleSubmit, formId } = useForm<LoginFormValues>('login-form');

  const onSubmit = (data: LoginFormValues) => {
    showModal('Login bem-sucedido!', 'Dados: ' + JSON.stringify(data));
  };

  return (
    <div className='bg-gray-800 p-6 rounded-lg shadow-xl'>
      <h3 className='text-xl font-bold mb-4 text-cyan-400'>1. Campos Nativos</h3>
      <p className='text-gray-400 mb-4'>JSX 100% limpo, hook encontra por `id`.</p>
      {/* Usa o formId retornado pelo hook */}
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className='mb-4'>
          <label className='block mb-1 text-gray-300' htmlFor='email'>Email</label>
          <input id='email' name='email' type='email' className='form-input' required pattern='^\S+@\S+$' />
        </div>
        <div className='mb-4'>
          <label className='block mb-1 text-gray-300' htmlFor='senha'>Senha</label>
          <input id='senha' name='senha' type='password' className='form-input' required minLength={6} />
        </div>
        <button type='submit' className='w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors'>Entrar</button>
      </form>
    </div>
  );
}

// 2. Cenário: Validação Customizada (Nativo)
const RegistrationForm = () => {
  interface RegFormValues {
    senha?: string; // Opcional se não validado diretamente
    confirmarSenha?: string; // Opcional
  }
  const { handleSubmit, setValidators, formId } = useForm<RegFormValues>('reg-form');

  // A função agora recebe os 3 argumentos
  const validarSenha = React.useCallback((value: any, field: HTMLFieldElements, formValues: RegFormValues): ValidationResult => {
    console.log('field', field);
    if (value !== formValues.senha) {
      // Retorna o objeto IValidator
      return { message: 'As senhas não correspondem', type: 'error' };
    }
    return true; // Válido
  },
    []
  );

  React.useEffect(() => {
    setValidators({
      validarSenha: validarSenha
    });
  }, [setValidators, validarSenha]);

  const onSubmit = (data: RegFormValues) => {
    showModal('Cadastro realizado!', 'Dados: ' + JSON.stringify(data));
  };

  return (
    <div className='bg-gray-800 p-6 rounded-lg shadow-xl'>
      <h3 className='text-xl font-bold mb-4 text-cyan-400'>2. Validação Customizada (Nativo)</h3>
      <p className='text-gray-400 mb-4'>`data-validation` linka com a função JS.</p>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className='mb-4'>
          <label className='block mb-1 text-gray-300' htmlFor='reg_senha'>Senha</label>
          <input id='reg_senha' name='senha' type='password' className='form-input' required />
        </div>
        <div className='mb-4'>
          <label className='block mb-1 text-gray-300' htmlFor='confirmarSenha'>Confirmar Senha</label>
          <input id='confirmarSenha' name='confirmarSenha' type='password' className='form-input' required data-validation='validarSenha' />
        </div>
        <button type='submit' className='w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded'>Cadastrar</button>
      </form>
    </div>
  );
}

// 3. Componente Híbrido Customizado: StarRating
const StarRating = ({ name, label, required }: { name: string, label: string, required?: boolean }) => {
  const [currentValue, setCurrentValue] = React.useState<number | string>("");
  const [hoverValue, setHoverValue] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = (value: number) => {
    const newValue = value === currentValue ? "" : value;
    setCurrentValue(newValue);
    if (inputRef.current) {
      inputRef.current.value = String(newValue);
      inputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const handleBlur = () => {
    inputRef.current?.dispatchEvent(new Event('blur', { bubbles: true }));
  };

  const displayValue = Number(currentValue) || 0;

  return (
    <div className='relative mb-4'>
      <label className='block mb-1 text-gray-300' htmlFor={name}>
        {label}
      </label>

      <div
        className='star-display flex focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-md'
        onBlur={handleBlur}
        tabIndex={0}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <svg
            key={value}
            onClick={() => handleClick(value)}
            onMouseOver={() => setHoverValue(value)}
            onMouseOut={() => setHoverValue(0)}
            className={`w-8 h-8 cursor-pointer transition-colors ${(hoverValue || displayValue) >= value ? 'text-yellow-400' : 'text-gray-600'}`}
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
          </svg>
        ))}
      </div>

      <input
        ref={inputRef}
        id={name}
        name={name}
        type='number'
        value={currentValue}
        onChange={() => { }}
        required={required}
        min={required ? 1 : 0}
        style={{ appearance: 'none' }}
        className='absolute opacity-0 w-[250px] h-1px m-0 p-0 border-0 pointer-events-none' // Removido pointer-events-none, mantido w-[250px]
        max={5}
        tabIndex={-1}
      />
    </div>
  );
};

// 4. Cenário: Formulário com Componente Híbrido (StarRating + Autocomplete + Comentário)
const HybridForm = () => {
  // Define o tipo do formulário
  interface MyHybridForm {
    rating: number | "";
    comentario: string;
    corFavorita: string; // Novo campo
  }

  // Passa o tipo para o hook
  const { handleSubmit, setValidators, formId } = useForm<MyHybridForm>('hybrid-form');

  // Função de validação cruzada
  const validarComentario = React.useCallback((value: string, field: HTMLFieldElements, formValues: MyHybridForm): ValidationResult => {
    console.log('validarComentario - field', field);
    const rating = Number(formValues.rating);
    if (rating > 0 && rating <= 3 && !value) {
      return { message: 'O comentário é obrigatório para avaliações de 3 estrelas ou menos.', type: 'error' };
    }
    if (value && value.length > 0 && value.length < 5) {
      return { message: 'Seu comentário é um pouco curto.', type: 'error' };
    }
    return true;
  },
    []
  );

  // Exemplo de validação para o Autocomplete
  const validarCor = React.useCallback((value: any, field: HTMLFieldElements, formValues: MyHybridForm): ValidationResult => {
    console.log('validarCor-formValues,field', formValues, field);
    
    if (value === 'verde') {
      return { message: 'Verde é uma ótima cor!', type: 'success' };
    }
    if (!value && (field as HTMLSelectElement).required) { // Verifica o required no select
      // O required nativo do select escondido já deve tratar isso,
      // mas podemos adicionar uma mensagem customizada se quisermos.
      // return { message: 'Por favor, selecione sua cor favorita.', type: 'error'};
    }
    return true;
  },
    []
  );

  React.useEffect(() => {
    setValidators({
      validarComentario: validarComentario,
      validarCor: validarCor, // Registra o novo validador
    });
  }, [setValidators, validarComentario, validarCor]);

  const onSubmit = (data: MyHybridForm) => {
    console.log('data', data);
    showModal('Formulário Híbrido enviado!', 'Dados: ' + JSON.stringify(data));
  };

  // Lista de sugestões para o Autocomplete (formato SuggestionOption)
  const cores: SuggestionOption[] = [
    { value: "vermelho", label: "Vermelho" },
    { value: "azul", label: "Azul" },
    { value: "verde", label: "Verde" },
    { value: "amarelo", label: "Amarelo", disabled: true }, // Exemplo de opção desabilitada
    { value: "preto", label: "Preto" },
    { value: "branco", label: "Branco" },
  ];

  return (
    <div className='bg-gray-800 p-6 rounded-lg shadow-xl'>
      <h3 className='text-xl font-bold mb-4 text-cyan-400'>4. Formulário Híbrido Completo</h3>
      <p className='text-gray-400 mb-4'>Rating + Autocomplete + Validação Cruzada.</p>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>

        <StarRating
          name='rating'
          label='Avaliação (obrigatório)'
          required
        />

        {/* Novo campo Autocomplete */}
        <Autocomplete
          name="corFavorita"
          label="Cor Favorita (obrigatório)"
          options={cores}
          required
          validationKey="validarCor" // Chave para o validador customizado
        />

        <div className='mb-4'>
          <label className='block mb-1 text-gray-300' htmlFor='comentario'>Comentário</label>
          <input
            id='comentario'
            name='comentario'
            type='text'
            className='form-input'
            data-validation='validarComentario' // A chave
          />
        </div>

        <button type='submit' className='w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded'>Enviar</button>
      </form>
    </div>
  );
}


// 5. Cenário: Teste de Estresse (Nativo)
const StressTestForm = () => {
  const { handleSubmit, formId } = useForm('stress-form');
  const onSubmit = (data: any) => {
    showModal('Teste de Estresse enviado!', JSON.stringify(data));
  };

  const fieldCount = 50;
  return (
    <div className='bg-gray-800 p-6 rounded-lg shadow-xl'>
      <h3 className='text-xl font-bold mb-4 text-cyan-400'>5. Teste de Estresse (Nativo)</h3>
      <p className='text-gray-400 mb-4'>A interação continua fluida.</p>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className='max-h-96 overflow-y-auto pr-4'>
        {Array.from({ length: fieldCount }, (_, i) => (
          <div key={i} className='mb-2'>
            <input name={`campo${i}`} className='form-input text-sm py-1' placeholder={`Campo ${i + 1}`} />
          </div>
        ))}
        <button type='submit' className='w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors mt-4'>Submeter Estresse</button>
      </form>
    </div>
  )
}

// --- Funções e Componentes Utilitários ---

// Armazena a instância da root do React 18
let modalRootInstance: any = null;

// Modal customizado para substituir o alert()
const CustomModal: React.FC<{ title: string; message: string; onClose: () => void }> = ({ title, message, onClose }) => {
  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      onClick={onClose}
    >
      <div
        className='bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6'
        onClick={(e) => e.stopPropagation()} // Impede o fechamento ao clicar dentro
      >
        <h2 className='text-xl font-bold text-cyan-400 mb-4'>{title}</h2>
        <p className='text-gray-300 whitespace-pre-wrap wrap-break-words'>{message}</p>
        <button
          onClick={onClose}
          className='w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors mt-6'
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

// Função para renderizar/remover o modal (Atualizada para React 18)
const showModal = (title: string, message: string) => {
  let modalRootEl = document.getElementById('modal-root');
  if (!modalRootEl) {
    modalRootEl = document.createElement('div');
    modalRootEl.id = 'modal-root';
    document.body.appendChild(modalRootEl);
  }

  // Importa o createRoot do ReactDOM (assume que está disponível globalmente OU importado)
  // FIX: Adiciona verificação se createRoot existe antes de usar
  if (typeof createRoot === 'undefined') {
    console.error("createRoot não está disponível. Certifique-se de que react-dom/client está importado.");
    // Fallback para alert se createRoot não estiver disponível
    alert(`${title}\n\n${message}`);
    return;
  }

  // Cria a root se ela não existir
  if (!modalRootInstance) {
    modalRootInstance = createRoot(modalRootEl);
  }

  const closeModal = () => {
    if (modalRootInstance) {
      modalRootInstance.unmount(); // Usa unmount
      modalRootInstance = null; // Reseta a instância
    }
  };

  // Usa root.render()
  modalRootInstance.render(
    <CustomModal title={title} message={message} onClose={closeModal} />
  );
};

// --- Componente Principal e Estilos ---

const Teste: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('login');

  const scenarios = {
    login: <LoginForm />,
    registration: <RegistrationForm />,
    hybrid: <HybridForm />, // Renomeado para HybridForm
    stress: <StressTestForm />,
  };

  const TabButton: React.FC<{ tabId: string, label: string }> = ({ tabId, label }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-3 py-2 sm:px-4 text-sm font-medium rounded-md transition-colors ${activeTab === tabId
        ? 'bg-cyan-600 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <style>{`
        /* Estilos para o feedback de validação nativo */
        .form-input {
            width: 100%;
            background-color: #374151; /* bg-gray-700 */
            border: 1px solid #4B5563; /* border-gray-600 */
            border-radius: 0.375rem; /* rounded-md */
            padding: 0.5rem 0.75rem;
            color: white;
            transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
            position: relative; /* Necessário para z-index funcionar com sugestões */
            z-index: 1; /* Garante que o input fique acima das sugestões quando não focado */
        }
         .form-input:focus {
            outline: none;
            border-color: #06b6d4; /* border-cyan-500 */
            box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.5);
            z-index: 2; /* Garante que o input focado fique acima das sugestões */
        }
        .form-input.is-touched:valid {
            border-color: #10B981; /* border-green-500 */
        }
        .form-input.is-touched:invalid {
            border-color: #EF4444; /* border-red-500 */
        }

        /* --- Estilos para o Componente Híbrido StarRating --- */

        input[name="rating"]:invalid.is-touched
           ~ .star-display {
            outline: 2px solid #EF4444; /* Borda vermelha de erro */
            border-radius: 0.375rem;
        }

        .star-display:focus, .star-display:focus-within {
            outline: 2px solid #06b6d4; /* Borda ciano de foco */
            border-radius: 0.375rem;
        }

         /* --- Estilos para o Componente Autocomplete --- */
         /* O input visível já usa .form-input */
         /* O feedback visual de erro/sucesso virá da borda do input visível */

      `}</style>
      <div className='bg-gray-800 text-white min-h-screen p-4 sm:p-8 font-sans'>
        <div className='max-w-2xl mx-auto'>
          <header className='text-center mb-8'>
            <h1 className='text-xl sm:text-4xl font-extrabold text-cyan-400'>`useForm` - v4.0</h1>
            {/* FIX: Escaped < and > to render as text and fix DOM nesting warning */}
            <p className='text-gray-400 mt-2'>Tipado, Validação Cruzada Realtime, Híbrido.</p>
          </header>

          <div className='flex justify-center flex-wrap gap-2 mb-6'>
            <TabButton tabId='login' label='Nativo' />
            <TabButton tabId='registration' label='Nativo (Custom)' />
            <TabButton tabId='hybrid' label='Híbrido Completo' /> {/* Renomeado */}
            {/* <TabButton tabId='autocomplete' label='Autocomplete' /> */} {/* Removido tab separada */}
            <TabButton tabId='stress' label='Estresse' />
          </div>

          <main>
            {scenarios[activeTab as keyof typeof scenarios]}
          </main>
        </div>
      </div>
      {/* O container do modal será adicionado aqui */}
    </>
  );
};

// Define AutocompleteForm como um dos cenários para evitar erro de não usado
// Mudado para exportar diretamente, já que o componente está no mesmo arquivo
// const AutocompleteForm = () => <div>Formulário Autocomplete movido para Híbrido Completo.</div>;

export default Teste;