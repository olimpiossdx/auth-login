import React from 'react';
// Importar createRoot de react-dom/client (necessário para o modal)
import { createRoot, Root } from 'react-dom/client';

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
    field: HTMLFieldElements | null,
    formValues: FormValues
) => ValidationResult;

// Mapa de validadores (tipado)
type ValidatorMap<FV> = Record<string, ValidateFn<FV>>;

// Tipo para armazenar referências aos listeners anexados
type ListenerRef = { blur: EventListener; change: EventListener };
type FieldListenerMap = Map<HTMLElement, ListenerRef>;


// --- Função Auxiliar Recursiva (Inalterada) ---
const recursiveSet = (currentLevel: any, keyList: string[], value: any) => {
    const key = keyList[0]; if (key === undefined) return; const remainingKeys = keyList.slice(1); const isNumericKey = /^\d+$/.test(key); const currentKey: string | number = isNumericKey ? Number(key) : key;
    if (remainingKeys.length === 0) { currentLevel[currentKey] = value; return; }
    const nextKey = remainingKeys[0]; const nextKeyIsNumeric = /^\d+$/.test(nextKey);
    if (nextKeyIsNumeric) { if (!currentLevel[currentKey] || !Array.isArray(currentLevel[currentKey])) { currentLevel[currentKey] = []; } }
    else { if (!currentLevel[currentKey] || typeof currentLevel[currentKey] !== 'object' || Array.isArray(currentLevel[currentKey])) { currentLevel[currentKey] = {}; } }
    recursiveSet(currentLevel[currentKey], remainingKeys, value);
};

// --- Função Principal de Parseamento (Inalterada) ---
const setValueByPath = (obj: any, path: string, value: any) => { try { const keys = path.split('.'); recursiveSet(obj, keys, value); } catch (e) { console.error(`[useForm] Falha ao definir valor para o caminho "${path}":`, e); } };
// Função auxiliar para obter valor aninhado
const getNestedValue = (obj: any, path: string | (string | number)[]): any => { const keys = Array.isArray(path) ? path : path.split('.'); return keys.reduce((o, k) => { if (o === undefined || o === null) return undefined; const index = parseInt(k as string, 10); return isNaN(index) ? o[k] : (Array.isArray(o) ? o[index] : undefined); }, obj); };


// --- O HOOK `useForm` (v4.11 - Lógica de Submit Parcial) ---
function useForm<FV extends Record<string, any>>(providedId?: string) {
  const generatedId = React.useId();
  const formId = providedId || generatedId;
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const fieldListenerRefs = React.useRef<FieldListenerMap>(new Map());
  const validatorsRef = React.useRef<ValidatorMap<FV>>({});

  const setValidators = React.useCallback((validators: ValidatorMap<FV>) => { validatorsRef.current = validators; }, []);

  const getValue = React.useCallback((namePrefix?: string): Partial<FV> | FV | any => {
    const form = formRef.current; if (!form) return (namePrefix ? {} : {} as FV);
    const formData = {};
    const selector = namePrefix ? `input[name^="${namePrefix}"], select[name^="${namePrefix}"], textarea[name^="${namePrefix}"]` : 'input[name], select[name], textarea[name]';
    const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector);
    fields.forEach(element => {
        const name = element.name; if (!name) return;
        let relativePath = name;
        if (namePrefix) {
            if (name.startsWith(namePrefix)) { relativePath = name.substring(namePrefix.length); if (relativePath.startsWith('.')) { relativePath = relativePath.substring(1); } }
            else { return; }
        }
        const finalPath = relativePath || name; if (!finalPath && namePrefix && name === namePrefix) {} else if (!finalPath) { return; }
        let value: any;
        if (element.type === 'number') { value = element.value === "" ? "" : parseFloat(element.value); if (isNaN(value)) value = element.value; }
        else if (element.type === 'checkbox') { value = (element as HTMLInputElement).checked; }
        else { value = element.value; }
        if (finalPath) { setValueByPath(formData, finalPath, value); }
    });
    if (namePrefix && Object.keys(formData).length === 0) {
       const singleField = form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${namePrefix}"]`);
       if (singleField) { if (singleField.type === 'number') return singleField.value === "" ? "" : parseFloat(singleField.value); if (singleField.type === 'checkbox') return (singleField as HTMLInputElement).checked; return singleField.value; }
    }
    return formData;
  }, []);

   const revalidateAllCustomRules = React.useCallback(() => {
    const form = formRef.current; if (!form) return;
    const formValues = getValue() as FV; const validatorFns = validatorsRef.current;
    for (const validationKey in validatorFns) {
      const customValidate = validatorFns[validationKey]; if (!customValidate) continue;
      const fieldsToValidate = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name][data-validation="${validationKey}"]:not(:disabled)`); // Só valida habilitados
      fieldsToValidate.forEach(field => {
        const name = field.name; field.setCustomValidity('');
        const fieldValue = getNestedValue(formValues, name);
        const result = customValidate(fieldValue, field, formValues);
        if (typeof result === 'string') field.setCustomValidity(result);
        else if (typeof result === 'object' && result?.type === 'error') field.setCustomValidity(result.message);
      });
    }
    const allFieldsNoCustomValidation = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input[name]:not([data-validation]), select[name]:not([data-validation]), textarea[name]:not([data-validation])');
    allFieldsNoCustomValidation.forEach(field => { if (field.validity.valid) field.setCustomValidity(''); });
  }, [getValue]);

  const handleInteraction = React.useCallback((e: Event) => {
    (e.currentTarget as HTMLElement).classList.add('is-touched');
    revalidateAllCustomRules();
  }, [revalidateAllCustomRules]);

  const resetSection = React.useCallback((namePrefix: string, originalValues: any) => {
      const form = formRef.current; if (!form || !originalValues) { console.warn("[resetSection] Formulário não encontrado ou valores originais nulos."); return; }
      const fieldsToReset = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`input[name^="${namePrefix}"], select[name^="${namePrefix}"], textarea[name^="${namePrefix}"]`);
      fieldsToReset.forEach(field => {
          const name = field.name;
          let relativePath = name.substring(namePrefix.length); if (relativePath.startsWith('.')) { relativePath = relativePath.substring(1); }
          const originalValue = relativePath ? getNestedValue(originalValues, relativePath) : (originalValues[name] ?? getNestedValue(originalValues, name));
          if (originalValue !== undefined) {
               if (field.type === 'checkbox') { (field as HTMLInputElement).checked = Boolean(originalValue); }
               else if (field.type === 'radio') { (field as HTMLInputElement).checked = (field.value === String(originalValue)); }
               else { field.value = String(originalValue ?? ''); }
              field.dispatchEvent(new Event('change', { bubbles: true }));
              field.classList.remove('is-touched'); 
          } else {
               if (field.type === 'checkbox') (field as HTMLInputElement).checked = (field as HTMLInputElement).defaultChecked;
               else if (field.type === 'radio') (field as HTMLInputElement).checked = (field as HTMLInputElement).defaultChecked;
               else field.value = (field as any).defaultValue;
               field.dispatchEvent(new Event('change', { bubbles: true }));
               field.classList.remove('is-touched');
          }
      });
  }, []); 

  React.useLayoutEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null; if (!form) { console.warn(`[useForm] Formulário com id '${formId}' não encontrado.`); return; }
    formRef.current = form; const listenersMap = fieldListenerRefs.current;
    const addListeners = (field: HTMLElement) => { if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) || !field.name || listenersMap.has(field)) return; const blurListener = handleInteraction; const changeListener = handleInteraction; field.addEventListener('blur', blurListener); field.addEventListener('change', changeListener); listenersMap.set(field, { blur: blurListener, change: changeListener }); };
    const removeListeners = (field: HTMLElement) => { if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return; const listeners = listenersMap.get(field); if (listeners) { field.removeEventListener('blur', listeners.blur); field.removeEventListener('change', listeners.change); listenersMap.delete(field); } };
    const initialFields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input[name], select[name], textarea[name]');
    initialFields.forEach(addListeners);
    const observer = new MutationObserver((mutationsList) => { mutationsList.forEach(mutation => { if (mutation.type === 'childList') { mutation.addedNodes.forEach(node => { if (node instanceof HTMLElement) { addListeners(node); node.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input[name], select[name], textarea[name]').forEach(addListeners); } }); mutation.removedNodes.forEach(node => { if (node instanceof HTMLElement) { removeListeners(node); node.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input[name], select[name], textarea[name]').forEach(removeListeners); } }); } }); });
    observer.observe(form, { childList: true, subtree: true });
    return () => { observer.disconnect(); listenersMap.forEach((listeners, field) => { if (field?.removeEventListener) { field.removeEventListener('blur', listeners.blur); field.removeEventListener('change', listeners.change); } }); listenersMap.clear(); formRef.current = null; };
  }, [formId, handleInteraction]);

  // --- handleSubmit (v4.11 - Lógica de Submit Parcial) ---
  const handleSubmit = React.useCallback((onValid: (data: FV) => void) =>
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault(); const form = formRef.current; if (!form) return;
      
      // Marca todos os campos (mesmo os desabilitados) como 'touched'
      const currentFields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input[name], select[name], textarea[name]');
      currentFields.forEach(field => field.classList.add('is-touched'));
      
      // Roda validações customizadas
      revalidateAllCustomRules();
      
      setTimeout(() => {
          if (!formRef.current) return;
          
          const isFormValid = formRef.current.checkValidity(); // Valida apenas campos habilitados
          if (!isFormValid) {
            const activeFieldset = formRef.current.querySelector<HTMLElement>('fieldset:not(:disabled)') || formRef.current;
            const firstInvalidField = activeFieldset.querySelector<HTMLElement>(':invalid');
            if (firstInvalidField?.closest('.relative')?.querySelector('input[type="text"].form-input')) { (firstInvalidField.closest('.relative')!.querySelector('input[type="text"].form-input') as HTMLElement)?.focus(); }
            else { firstInvalidField?.focus(); }
            formRef.current.reportValidity();
          } else {
            const values = getValue() as FV;
            onValid(values);
          }
      }, 0);
    }, [getValue, revalidateAllCustomRules]);

  return { handleSubmit, setValidators, formId, resetSection, getValue };
}

// --- HOOK useList (Minimalista - Inalterado) ---
function useList<T = any>(initialState: T[] = []) { /* ... (código inalterado) ... */
    const generateId = () => `field-id-${crypto.randomUUID()}`;
    const [fields, setFields] = React.useState(() => initialState.map((value) => ({ id: generateId(), value })));
    const append = React.useCallback((value: T) => { const newId = generateId(); setFields((p) => [...p, { id: newId, value }]); }, []);
    const remove = React.useCallback((index: number) => { setFields((p) => p.filter((_, i) => i !== index)); }, []);
    return { fields, append, remove };
 }

// --- COMPONENTE AUTOCOMPLETE (Definido ANTES de ser usado) ---
interface AutocompleteProps { name: string; label: string; suggestions: SuggestionOption[]; required?: boolean; validationKey?: string; initialValue?: string; readOnly?: boolean; disabled?: boolean;}
const Autocomplete: React.FC<AutocompleteProps> = ({ name, label, suggestions = [], required, validationKey, initialValue = "", readOnly, disabled }) => {
  const findInitialLabel = (): string => { if (!initialValue || !Array.isArray(suggestions)) return ""; const found = suggestions.find(s => s.value === initialValue); return found ? (found.label || "") : ""; }; 
  const [inputValue, setInputValue] = React.useState<string>(findInitialLabel()); 
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<SuggestionOption[]>([]); 
  const [showSuggestions, setShowSuggestions] = React.useState(false); 
  const [selectedValue, setSelectedValue] = React.useState<string>(initialValue); 
  const selectRef = React.useRef<HTMLSelectElement>(null); 
  const containerRef = React.useRef<HTMLDivElement>(null); 
  const visibleInputRef = React.useRef<HTMLInputElement>(null); 
  
  React.useEffect(() => { setInputValue(findInitialLabel()); setSelectedValue(initialValue); }, [initialValue, suggestions]);
  
  const updateHiddenSelect = (newSelectedValue: string) => { 
      setSelectedValue(newSelectedValue); 
      if (selectRef.current) { 
          selectRef.current.value = newSelectedValue; 
          selectRef.current.dispatchEvent(new Event('change', { bubbles: true })); 
          if (visibleInputRef.current) { 
              selectRef.current.classList.contains('is-touched') ? visibleInputRef.current.classList.add('is-touched') : visibleInputRef.current.classList.remove('is-touched'); 
              visibleInputRef.current.setCustomValidity(selectRef.current.validationMessage); 
          } 
      } 
  }; 
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => { 
      const typedLabel = event.target.value; 
      setInputValue(typedLabel); 
      let finalValue = ""; 
      let foundMatch = false; 
      if (typedLabel && Array.isArray(suggestions)) { 
          const filtered = suggestions.filter(s => (s.label || "").toLowerCase().includes(typedLabel.toLowerCase())); 
          setFilteredSuggestions(filtered); 
          setShowSuggestions(filtered.length > 0); 
          const exactMatch = suggestions.find(s => (s.label || "").toLowerCase() === typedLabel.toLowerCase()); 
          if (exactMatch) { finalValue = exactMatch.value; foundMatch = true; } 
      } else { 
          setFilteredSuggestions([]); 
          setShowSuggestions(false); 
      } 
      if (!foundMatch) finalValue = ""; 
      updateHiddenSelect(finalValue); 
  }; 
  
  const handleSuggestionClick = (suggestion: SuggestionOption) => { 
      const displayLabel = suggestion.label || ""; 
      setInputValue(displayLabel); 
      updateHiddenSelect(suggestion.value); 
      setFilteredSuggestions([]); 
      setShowSuggestions(false); 
      visibleInputRef.current?.focus(); 
  }; 
  
  const handleContainerBlur = (event: React.FocusEvent<HTMLDivElement>) => { 
      if (containerRef.current && !containerRef.current.contains(event.relatedTarget as Node)) { 
          if (selectRef.current) { 
              selectRef.current.dispatchEvent(new Event('blur', { bubbles: true })); 
              if (visibleInputRef.current) { 
                  selectRef.current.classList.contains('is-touched') ? visibleInputRef.current.classList.add('is-touched') : visibleInputRef.current.classList.remove('is-touched'); 
                  visibleInputRef.current.setCustomValidity(selectRef.current.validationMessage); 
              } 
          } 
          setShowSuggestions(false); 
          const isValidLabel = Array.isArray(suggestions) && suggestions.some(s => (s.label || "") === inputValue); 
          if (!isValidLabel) { 
              setInputValue(findInitialLabel());
              updateHiddenSelect(initialValue);
          } 
      } 
  }; 
  
  React.useEffect(() => { 
      const handleClickOutside = (event: MouseEvent) => { 
          if (containerRef.current && !containerRef.current.contains(event.target as Node)) { 
              setShowSuggestions(false); 
              const isValidLabel = Array.isArray(suggestions) && suggestions.some(s => (s.label || "") === inputValue); 
              if (!isValidLabel && selectedValue !== initialValue) { 
                  setInputValue(findInitialLabel()); 
                  updateHiddenSelect(initialValue);
              } 
          } 
      }; 
      document.addEventListener("mousedown", handleClickOutside); 
      return () => document.removeEventListener("mousedown", handleClickOutside); 
  }, [containerRef, inputValue, suggestions, selectedValue, initialValue, findInitialLabel]);
  
  const effectiveReadOnly = readOnly && !disabled; 
  const effectiveDisabled = disabled;

  return ( <div className={`relative mb-4 ${effectiveDisabled ? 'opacity-50' : ''}`} ref={containerRef} onBlur={handleContainerBlur}> <label className="block mb-1 text-gray-300" htmlFor={`autocomplete-${name}`}>{label}</label> <input ref={visibleInputRef} id={`autocomplete-${name}`} type="text" value={inputValue} onChange={handleInputChange} onFocus={() => { if (!effectiveReadOnly && !effectiveDisabled && Array.isArray(suggestions)) { const filtered = suggestions.filter(s => (s.label || "").toLowerCase().includes(inputValue.toLowerCase())); setFilteredSuggestions(filtered); setShowSuggestions(true); } }} role="combobox" aria-autocomplete="list" aria-expanded={showSuggestions && filteredSuggestions.length > 0} aria-controls={`${name}-suggestions`} className="form-input" autoComplete="off" readOnly={effectiveReadOnly} disabled={effectiveDisabled} /> <select ref={selectRef} id={name} name={name} value={selectedValue} onChange={() => {}} required={required} data-validation={validationKey} className='absolute w-[1px] h-[1px] -m-[1px] p-0 overflow-hidden clip-[rect(0,0,0,0)] border-0' tabIndex={-1} aria-hidden="true" disabled={effectiveDisabled}> <option value=""></option> {Array.isArray(suggestions) && suggestions.map(suggestion => { const { label: sLabel, children: sChild, ...sProps } = suggestion; return <option key={suggestion.value} value={suggestion.value} {...sProps} >{sLabel || sChild}</option>; })} </select> {showSuggestions && filteredSuggestions.length > 0 && !effectiveReadOnly && !effectiveDisabled && ( <ul id={`${name}-suggestions`} role="listbox" className="autocomplete-suggestions"> {filteredSuggestions.map((suggestion, index) => { const displayLabel = suggestion.label || ""; return ( <li key={suggestion.value} id={`${name}-suggestion-${index}`} role="option" aria-selected={selectedValue === suggestion.value} aria-disabled={suggestion.disabled} className={`autocomplete-suggestion-item ${suggestion.disabled ? 'opacity-50 cursor-not-allowed' : ''}`} onMouseDown={(e) => { if (suggestion.disabled) { e.preventDefault(); return; } e.preventDefault(); handleSuggestionClick(suggestion); }}>{displayLabel}</li> ); })} </ul> )} </div> );
};

// --- Componente StarRating ---
const StarRating = ({ name, label, required, readOnly, disabled }: { name: string, label: string, required?: boolean, readOnly?: boolean, disabled?: boolean }) => {
  const [currentValue, setCurrentValue] = React.useState<number | string>(""); 
  const [hoverValue, setHoverValue] = React.useState(0); 
  const inputRef = React.useRef<HTMLInputElement>(null);
  const effectiveDisabled = disabled || readOnly;
  const handleClick = (value: number) => { 
      if (effectiveDisabled) return; 
      const newValue = value === currentValue ? "" : value; 
      setCurrentValue(newValue); 
      if (inputRef.current) { 
          inputRef.current.value = String(newValue); 
          inputRef.current.dispatchEvent(new Event('change', { bubbles: true })); 
      } 
  };
  const handleBlur = () => { 
      if (effectiveDisabled) return; 
      inputRef.current?.dispatchEvent(new Event('blur', { bubbles: true })); 
  }; 
  const displayValue = Number(currentValue) || 0;
  return ( 
      <div className={`relative mb-4 ${effectiveDisabled ? 'opacity-50' : ''}`}> 
          <label className='block mb-1 text-gray-300' htmlFor={name}>{label}</label> 
          <div className={`star-display flex focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-md ${effectiveDisabled ? 'pointer-events-none' : ''}`} onBlur={handleBlur} tabIndex={effectiveDisabled ? -1 : 0}> 
              {[1, 2, 3, 4, 5].map((value) => ( 
                  <svg key={value} onClick={() => handleClick(value)} onMouseOver={() => setHoverValue(effectiveDisabled ? 0 : value)} onMouseOut={() => setHoverValue(0)} 
                       className={`w-8 h-8 ${effectiveDisabled ? '' : 'cursor-pointer'} transition-colors ${(hoverValue || displayValue) >= value ? 'text-yellow-400' : 'text-gray-600'}`} 
                       fill='currentColor' viewBox='0 0 20 20'> 
                      <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' /> 
                  </svg> 
              ))} 
          </div> 
          <input ref={inputRef} id={name} name={name} type='number' value={currentValue} onChange={() => { }} required={required} min={required ? 1 : 0} 
                 style={{ appearance: 'none' }} className='absolute opacity-0 w-[250px] h-[1px] m-0 p-0 border-0' max={5} tabIndex={-1} 
                 disabled={disabled}
          /> 
      </div> 
  );
};

// --- Componente AddressItem ---
interface Address { rua: string; cidade: string; }
interface AddressListProps { 
    contactIndex: number; 
    initialAddresses: Address[]; 
    isEditing: boolean; 
    isDisabled: boolean; 
}
const AddressList: React.FC<AddressListProps> = ({ contactIndex, initialAddresses, isEditing, isDisabled }) => {
    const { fields: addressFields, append: appendAddress, remove: removeAddress } = useList<Address>(initialAddresses.length > 0 ? initialAddresses : [{ rua: '', cidade: '' }]);
    return (
        <div className="ml-4 pl-4 border-l border-gray-600 mt-3 pt-3">
             <h5 className="text-sm font-semibold mb-2 text-gray-400 flex justify-between items-center"> 
                 <span>Endereços</span> 
                 {/* FIX: Botão Adicionar Endereço agora é desabilitado corretamente */}
                 <button type="button" onClick={() => appendAddress({ rua: '', cidade: '' })} 
                         className='text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded' 
                         disabled={!isEditing || isDisabled}> 
                     + Adicionar Endereço 
                 </button> 
             </h5>
            {addressFields.map((addressField, addressIndex) => (
                 <div key={addressField.id} className='grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 relative pr-8'>
                     <input name={`contatos.${contactIndex}.enderecos.${addressIndex}.rua`} type='text' placeholder='Rua, Nº' className='form-input text-sm' 
                            defaultValue={addressField.value.rua} readOnly={!isEditing} disabled={isDisabled} />
                     <input name={`contatos.${contactIndex}.enderecos.${addressIndex}.cidade`} type='text' placeholder='Cidade' className='form-input text-sm' 
                            defaultValue={addressField.value.cidade} data-validation='validarCidade' readOnly={!isEditing} disabled={isDisabled} />
                     {addressFields.length > 1 && ( 
                         <button type="button" onClick={() => removeAddress(addressIndex)} 
                                 className='absolute top-1/2 right-0 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-0.5 px-1.5 rounded-full text-xs leading-none' 
                                 title="Remover Endereço" style={{ width: '20px', height: '20px' }} 
                                 disabled={!isEditing || isDisabled}> X </button> 
                     )}
                </div>
            ))}
        </div>
    );
}

// --- Componente ContactItem ---
interface Contato { numero: string; tipo: string; enderecos?: Address[]; }
interface ContactItemProps { 
    contactIndex: number; 
    initialData: Contato; 
    onRemoveContact: () => void; 
    isEditing: boolean; 
    isDisabled: boolean; 
}
const ContactItem: React.FC<ContactItemProps> = ({ contactIndex, initialData, onRemoveContact, isEditing, isDisabled }) => {
    const fieldsetDisabled = isDisabled;
    const fieldsReadOnly = !isEditing;

    return (
        <fieldset className='mb-4 p-4 border border-gray-700 rounded' disabled={fieldsetDisabled}>
            <div className='flex items-end gap-2 mb-3'>
                <div className="flex-grow">
                    <label className='block text-sm mb-1 text-gray-400' htmlFor={`contatos.${contactIndex}.numero`}>Número</label>
                    <input id={`contatos.${contactIndex}.numero`} name={`contatos.${contactIndex}.numero`} type='tel' placeholder='(XX)...' 
                           className='form-input' required defaultValue={initialData.numero} readOnly={fieldsReadOnly} />
                </div>
                <div className="w-auto">
                    <label className='block text-sm mb-1 text-gray-400' htmlFor={`contatos.${contactIndex}.tipo`}>Tipo</label>
                    <select id={`contatos.${contactIndex}.tipo`} name={`contatos.${contactIndex}.tipo`} className='form-input bg-gray-600' 
                            defaultValue={initialData.tipo} disabled={fieldsReadOnly}>
                        <option value="celular">Celular</option><option value="casa">Casa</option><option value="trabalho">Trabalho</option>
                    </select>
                </div>
                {/* FIX: Botão remover Contato agora é desabilitado se *este* item estiver em edição, ou se outro estiver */}
                <button type="button" onClick={onRemoveContact} 
                        className='bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm flex-shrink-0 self-end h-[42px]' 
                        title="Remover Contato" disabled={isDisabled || isEditing}> X </button>
            </div>
            <AddressList 
                contactIndex={contactIndex} 
                initialAddresses={initialData.enderecos || []} 
                isEditing={isEditing} 
                isDisabled={isDisabled} 
            />
        </fieldset>
    );
}


// --- COMPONENTES DE EXEMPLO ---

// 1. Cenário: Formulário de Login (Nativo)
const LoginForm = ({ showModal }: { showModal: (title: string, message: string) => void }) => {
  interface LoginFormValues { email: string; senha?: string; }
  const { handleSubmit, formId } = useForm<LoginFormValues>('login-form');
  const onSubmit = (data: LoginFormValues) => showModal('Login bem-sucedido!', 'Dados: ' + JSON.stringify(data));
  return ( <div className='bg-gray-800 p-6 rounded-lg shadow-xl'> <h3 className='text-xl font-bold mb-4 text-cyan-400'>1. Campos Nativos</h3> <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate> <div className='mb-4'><label className='block mb-1 text-gray-300' htmlFor='email'>Email</label><input id='email' name='email' type='email' className='form-input' required pattern='^\S+@\S+$' /></div> <div className='mb-4'><label className='block mb-1 text-gray-300' htmlFor='senha'>Senha</label><input id='senha' name='senha' type='password' className='form-input' required minLength={6} /></div> <button type='submit' className='w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors'>Entrar</button> </form> </div> );
 }

// 2. Cenário: Validação Customizada (Nativo)
const RegistrationForm = ({ showModal }: { showModal: (title: string, message: string) => void }) => {
  interface RegFormValues { senha?: string; confirmarSenha?: string; }
  const { handleSubmit, setValidators, formId } = useForm<RegFormValues>('reg-form');
  const validarSenha = React.useCallback((value: any, field: HTMLFieldElements, formValues: RegFormValues): ValidationResult => (value !== formValues.senha) ? { message: 'As senhas não correspondem', type: 'error' } : true, []);
  React.useEffect(() => setValidators({ validarSenha }), [setValidators, validarSenha]);
  const onSubmit = (data: RegFormValues) => showModal('Cadastro realizado!', 'Dados: ' + JSON.stringify(data));
  return ( <div className='bg-gray-800 p-6 rounded-lg shadow-xl'> <h3 className='text-xl font-bold mb-4 text-cyan-400'>2. Validação Customizada (Nativo)</h3> <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate> <div className='mb-4'><label className='block mb-1 text-gray-300' htmlFor='reg_senha'>Senha</label><input id='reg_senha' name='senha' type='password' className='form-input' required /></div> <div className='mb-4'><label className='block mb-1 text-gray-300' htmlFor='confirmarSenha'>Confirmar Senha</label><input id='confirmarSenha' name='confirmarSenha' type='password' className='form-input' required data-validation='validarSenha' /></div> <button type='submit' className='w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded'>Cadastrar</button> </form> </div> );
 }

// 3. Cenário: Híbrido Simples (Atualizado com resetSection e Submit Parcial)
const HybridFormSimple = ({ showModal }: { showModal: (title: string, message: string) => void }) => {
  interface MyHybridForm { rating: number | ""; comentario: string; corFavorita: string; }
  const { handleSubmit, setValidators, formId, getValue, resetSection } = useForm<MyHybridForm>('hybrid-form-simple');
  const [editingId, setEditingId] = React.useState<string | null>(null); const isEditingAny = editingId !== null;
  const originalEditDataRef = React.useRef<any>(null);
  const validarComentario = React.useCallback((value: any, field: HTMLFieldElements, formValues: MyHybridForm): ValidationResult => { const r = Number(formValues.rating); if (r > 0 && r <= 3 && !value) return { message: 'O comentário é obrigatório...', type: 'error' }; if (value && value.length > 0 && value.length < 5) return { message: 'Comentário curto.', type: 'warning' }; return true; }, []);
  const validarCor = React.useCallback((value: any, field: HTMLFieldElements, formValues: MyHybridForm): ValidationResult => { if (value === 'verde') return { message: 'Verde é uma ótima cor!', type: 'success' }; return true; }, []);
  React.useEffect(() => setValidators({ validarComentario, validarCor }), [setValidators, validarComentario, validarCor]);
  
  const onSubmit = (data: MyHybridForm) => { 
      showModal('Form Híbrido Salvo!', 'Dados: ' + JSON.stringify(data)); 
      setEditingId(null); 
      originalEditDataRef.current = null; 
  };
  
  const cores: SuggestionOption[] = [ { value: "vermelho", label: "Vermelho" }, { value: "azul", label: "Azul" }, { value: "verde", label: "Verde" }, { value: "amarelo", label: "Amarelo", disabled: true }, { value: "preto", label: "Preto" }, { value: "branco", label: "Branco" } ];
  
  const handleEdit = (id: string, prefix: string) => { originalEditDataRef.current = getValue(prefix); setEditingId(id); };
  const handleCancel = (id: string, prefix: string) => { resetSection(prefix, originalEditDataRef.current); originalEditDataRef.current = null; setEditingId(null); };

  const isEditingThis = editingId === 'hybridSimple'; const isEditingOther = isEditingAny && !isEditingThis;
  const prefix = "";
  
  return (
    <div className='bg-gray-800 p-6 rounded-lg shadow-xl'>
       <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
            <fieldset disabled={isEditingOther}>
                <legend className="text-xl font-bold mb-4 text-cyan-400 flex justify-between items-center w-full"> 3. Híbrido (Rating + Autocomplete)
                    <div>
                        {!isEditingThis && <button type="button" onClick={() => handleEdit('hybridSimple', prefix)} disabled={isEditingAny} className={`py-1 px-3 rounded text-sm ${isEditingAny ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'}`}>Editar</button>}
                        {isEditingThis && ( <div className="flex gap-2"> 
                            <button type="button" onClick={() => handleCancel('hybridSimple', prefix)} className="py-1 px-3 rounded text-sm bg-gray-600 hover:bg-gray-700">Cancelar</button> 
                            <button type="submit" className="py-1 px-3 rounded text-sm bg-green-600 hover:bg-green-700">Salvar</button> 
                        </div> )}
                    </div>
                </legend>
                
                <StarRating name='rating' label='Avaliação (obrigatório)' required readOnly={!isEditingThis} disabled={isEditingOther} />
                <Autocomplete name="corFavorita" label="Cor Favorita (obrigatório)" suggestions={cores} required validationKey="validarCor" readOnly={!isEditingThis} disabled={isEditingOther} initialValue={""} />
                <div className='mb-4'><label className='block mb-1 text-gray-300' htmlFor='comentario'>Comentário</label><input id='comentario' name='comentario' type='text' className='form-input' data-validation='validarComentario' readOnly={!isEditingThis} /></div>
                
                {/* Botão de submit geral REMOVIDO */}
            </fieldset>
       </form>
    </div>
  );
}

// 4. Cenário: Lista Aninhada (Atualizado com Submit Parcial)
const NestedListForm = ({ showModal }: { showModal: (title: string, message: string) => void }) => {
    interface MyNestedListForm { contatos?: Contato[]; }
    const { handleSubmit, setValidators, formId, getValue, resetSection } = useForm<MyNestedListForm>('nested-list-form');
    const { fields: contactFields, append: appendContact, remove: removeContact } = useList<Contato>([{ numero: '', tipo: 'celular', enderecos: [{ rua: '', cidade: '' }] }]);
    const [editingId, setEditingId] = React.useState<string | null>(null); const isEditingAny = editingId !== null;
    const originalEditDataRef = React.useRef<any>(null); 

    const validarCidade = React.useCallback((value: any, field: HTMLFieldElements, formValues: MyNestedListForm): ValidationResult => { const m = field.name.match(/contatos\.(\d+)\.enderecos\.(\d+)\.cidade/); if (m) { const cI = parseInt(m[1], 10); const aI = parseInt(m[2], 10); const rua = formValues.contatos?.[cI]?.enderecos?.[aI]?.rua; if (rua && !value) return { message: 'Cidade obrigatória se rua preenchida.', type: 'error'}; } return true; }, []);
    React.useEffect(() => { setValidators({ validarCidade }); }, [setValidators, validarCidade]);
    
    const onSubmit = (data: MyNestedListForm) => { 
        const cleanData = { contatos: data.contatos?.map(c => ({ ...c, enderecos: c.enderecos?.filter(e => e && (e.rua || e.cidade)) || [] })).filter(c => c && (c.numero || c.tipo || (c.enderecos && c.enderecos.length > 0))) || [] }; 
        showModal('Item Salvo!', 'Dados: ' + JSON.stringify(cleanData, null, 2)); 
        setEditingId(null); 
        originalEditDataRef.current = null; 
    };

    const handleEdit = (id: string, prefix: string) => { originalEditDataRef.current = getValue(prefix); setEditingId(id); };
    const handleCancel = (id: string, prefix: string) => { resetSection(prefix, originalEditDataRef.current); originalEditDataRef.current = null; setEditingId(null); };
    
    return (
        <div className='bg-gray-800 p-6 rounded-lg shadow-xl'>
            <h3 className='text-xl font-bold mb-4 text-cyan-400'>4. Lista Aninhada (Contatos + Endereços)</h3>
            <p className='text-gray-400 mb-4'>Validação por item (Submit Parcial).</p>
            <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
                 <h4 className="text-lg font-semibold mt-6 mb-2 text-cyan-500 flex justify-between items-center"> Contatos
                    <button type="button" onClick={() => appendContact({ numero: '', tipo: 'celular', enderecos: [{ rua: '', cidade: '' }] })}
                            className='text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded' disabled={isEditingAny}> Adicionar Contato </button>
                 </h4>
                 {contactFields.map((contactField, contactIndex) => {
                     const sectionId = `contatos.${contactIndex}`; 
                     const prefix = `${sectionId}.`;
                     const isEditingThis = editingId === sectionId;
                     const isEditingOther = isEditingAny && !isEditingThis;
                     return (
                         <div key={contactField.id} className="relative">
                            <div className="absolute top-6 right-2 z-10 flex gap-1">
                                {!isEditingThis && <button type="button" onClick={() => handleEdit(sectionId, prefix)} disabled={isEditingOther} className={`py-0.5 px-2 rounded text-xs ${isEditingOther ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'}`}>Editar</button>}
                                {isEditingThis && ( <> 
                                    <button type="button" onClick={() => handleCancel(sectionId, prefix)} className="py-0.5 px-2 rounded text-xs bg-gray-600 hover:bg-gray-700">Can</button> 
                                    <button type="submit" className="py-0.5 px-2 rounded text-xs bg-green-600 hover:bg-green-700">Sal</button> 
                                </> )}
                            </div>
                            <ContactItem 
                                contactIndex={contactIndex} 
                                initialData={contactField.value} 
                                onRemoveContact={() => removeContact(contactIndex)}
                                isEditing={isEditingThis} 
                                isDisabled={isEditingOther}
                            />
                         </div>
                     );
                 })}
            </form>
        </div>
    );
}

// --- NOVO CENÁRIO 5: Currículo Completo (com Edição Contextual e Submit Parcial) ---
const CurriculumForm = ({ showModal }: { showModal: (title: string, message: string) => void }) => {
    // --- Tipos para o Currículo ---
    interface Escolaridade { nivel: string; curso: string; situacao: string; }
    interface Experiencia { nomeEmpresa: string; cargo: string; inicio: string; finalizacao: string; atual: boolean; atividades: string;}
    interface Conhecimento { nivel: string; descricao: string; }
    interface DadosAdicionais { rg: string; orgaoEmissor: string; pis: string; filiacao1: string; filiacao2: string; nacionalidade: string; naturalidade: string; raca: string; tipoResidencia: string; parenteEmpresa: string; situacao: string; ultimaConsulta: string; retorno: string; exFuncionario: string; pcdFisico: boolean; pcdIntelectual: boolean; pcdVisual: boolean; pcdAuditivo: boolean; pcdOutra: boolean; pcdDetalhe: string; altura: string; tamanhoUniforme: string; tamanhoCalcado: string;}
    interface CurriculumFormValues { dadosAdicionais?: DadosAdicionais; escolaridades?: Escolaridade[]; experiencias?: Experiencia[]; conhecimentos?: Conhecimento[]; }

    // --- Dados Iniciais ---
    const [initialEscolaridade] = React.useState<Escolaridade[]>([ { nivel: 'Ensino Técnico - Superior', curso: 'Engenharia de Computação', situacao: 'Completo' } ]);
    const [initialExperiencias] = React.useState<Experiencia[]>([ { nomeEmpresa: 'Teste de empresa', cargo: 'Cargo de empresa', inicio: '2025-02', finalizacao: '2024-01', atual: false, atividades: 'Profissão de empresa' }, { nomeEmpresa: 'Supermercados BH', cargo: 'Desenvolvedor', inicio: '2019-04', finalizacao: '', atual: true, atividades: 'Desenvolvendo soluções para o supermercado BH.' } ]);
    const [initialConhecimentos] = React.useState<Conhecimento[]>([ { nivel: 'Intermediário', descricao: 'asdasd' } ]);
    const [initialDadosAdicionais] = React.useState<DadosAdicionais>({ rg: 'mg 888888', orgaoEmissor: 'ssp', pis: '000.00000.00-0', filiacao1: 'MINHA MÃE', filiacao2: 'MEU PAI', nacionalidade: 'Brasileira', naturalidade: 'BETIM - MG', raca: 'Branca', tipoResidencia: 'Própria', parenteEmpresa: "false", situacao: 'Trabalhando', ultimaConsulta: '2025-10-13', retorno: '(13454) OLIMPIO...', exFuncionario: "false", pcdFisico: false, pcdIntelectual: false, pcdVisual: false, pcdAuditivo: false, pcdOutra: false, pcdDetalhe: 'um teste', altura: '0,00', tamanhoUniforme: 'Não', tamanhoCalcado: '0' });

    const { handleSubmit, setValidators, formId, getValue, resetSection } = useForm<CurriculumFormValues>('curriculum-form');
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const originalEditDataRef = React.useRef<any>(null); // Ref para snapshot

    const { fields: escolaridadeFields, append: appendEscolaridade, remove: removeEscolaridade } = useList<Escolaridade>(initialEscolaridade);
    const { fields: experienciaFields, append: appendExperiencia, remove: removeExperiencia } = useList<Experiencia>(initialExperiencias);
    const { fields: conhecimentoFields, append: appendConhecimento, remove: removeConhecimento } = useList<Conhecimento>(initialConhecimentos);

    const handleEdit = (id: string, prefix: string) => { originalEditDataRef.current = getValue(prefix); setEditingId(id); };
    const handleCancel = (id: string, prefix: string) => { resetSection(prefix, originalEditDataRef.current); originalEditDataRef.current = null; setEditingId(null); };
    
    const onSubmit = (data: CurriculumFormValues) => { 
        const cleanData = { ...data, /* ... limpeza ... */ }; 
        showModal('Seção Salva!', 'Dados do Formulário Inteiro: ' + JSON.stringify(cleanData, null, 2)); 
        setEditingId(null); 
        originalEditDataRef.current = null; 
    };

    const ActionButtons: React.FC<{ sectionId: string; prefix: string; onCancel: () => void; onEdit: () => void; isOtherEditing: boolean; isEditingThis: boolean; }> = 
        ({ sectionId, prefix, onCancel, onEdit, isOtherEditing, isEditingThis }) => (
            <div className="flex justify-end gap-2 mt-2 flex-shrink-0">
                {!isEditingThis && ( <button type="button" onClick={onEdit} disabled={isOtherEditing} className={`py-1 px-3 rounded text-sm font-medium ${isOtherEditing ? 'bg-gray-500 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}> Editar </button> )}
                {isEditingThis && ( <> 
                    <button type="button" onClick={onCancel} className="py-1 px-3 rounded text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white"> Cancelar </button> 
                    <button type="submit" className="py-1 px-3 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white"> Salvar </button> 
                </> )}
            </div>
         );
    
    const isEditingAny = editingId !== null;
    
    return (
        <div className='bg-gray-800 p-6 rounded-lg shadow-xl'>
            <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* --- SEÇÃO DADOS ADICIONAIS --- */}
                <fieldset className="mb-6 p-4 border rounded border-gray-700" disabled={isEditingAny && editingId !== 'dadosAdicionais'}>
                   <legend className="text-lg font-semibold text-cyan-400 px-2 flex justify-between items-center w-full"> Dados Adicionais
                       <ActionButtons 
                           sectionId="dadosAdicionais" 
                           prefix="dadosAdicionais." 
                           isEditingThis={editingId === 'dadosAdicionais'} 
                           isOtherEditing={isEditingAny && editingId !== 'dadosAdicionais'} 
                           onEdit={() => handleEdit('dadosAdicionais', 'dadosAdicionais.')} 
                           onCancel={() => handleCancel('dadosAdicionais', 'dadosAdicionais.')}
                         
                       />
                   </legend>
                   <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2`}>
                       <div><label className="block text-sm mb-1">RG</label><input name="dadosAdicionais.rg" className="form-input" defaultValue={initialDadosAdicionais.rg} readOnly={editingId !== 'dadosAdicionais'}/></div>
                       <div><label className="block text-sm mb-1">Órgão Emissor</label><input name="dadosAdicionais.orgaoEmissor" className="form-input" defaultValue={initialDadosAdicionais.orgaoEmissor} readOnly={editingId !== 'dadosAdicionais'}/></div>
                       <div><label className="block text-sm mb-1">PIS</label><input name="dadosAdicionais.pis" className="form-input" defaultValue={initialDadosAdicionais.pis} readOnly={editingId !== 'dadosAdicionais'}/></div>
                       <div><label className="block text-sm mb-1">Filiação 1</label><input name="dadosAdicionais.filiacao1" className="form-input" defaultValue={initialDadosAdicionais.filiacao1} readOnly={editingId !== 'dadosAdicionais'}/></div>
                       <div><label className="block text-sm mb-1">Filiação 2</label><input name="dadosAdicionais.filiacao2" className="form-input" defaultValue={initialDadosAdicionais.filiacao2} readOnly={editingId !== 'dadosAdicionais'}/></div>
                       <div><label className="block text-sm mb-1">Nacionalidade *</label><input name="dadosAdicionais.nacionalidade" className="form-input" required defaultValue={initialDadosAdicionais.nacionalidade} readOnly={editingId !== 'dadosAdicionais'}/></div>
                       <div><label className="block text-sm mb-1">Naturalidade *</label><input name="dadosAdicionais.naturalidade" className="form-input" required defaultValue={initialDadosAdicionais.naturalidade} readOnly={editingId !== 'dadosAdicionais'}/></div>
                       <div><label className="block text-sm mb-1">Raça *</label><select name="dadosAdicionais.raca" className="form-input bg-gray-600" required defaultValue={initialDadosAdicionais.raca} disabled={editingId !== 'dadosAdicionais'}><option>Branca</option><option>Parda</option><option>Preta</option></select></div>
                       <div><label className="block text-sm mb-1">Tipo Residência *</label><select name="dadosAdicionais.tipoResidencia" className="form-input bg-gray-600" required defaultValue={initialDadosAdicionais.tipoResidencia} disabled={editingId !== 'dadosAdicionais'}><option>Própria</option><option>Alugada</option></select></div>
                        <div className="col-span-full"><label className="block text-sm mb-1">Possui parente na empresa?</label><div className="flex gap-4"><label><input type="radio" name="dadosAdicionais.parenteEmpresa" value="true" defaultChecked={initialDadosAdicionais.parenteEmpresa === "true"} disabled={editingId !== 'dadosAdicionais'}/> Sim</label><label><input type="radio" name="dadosAdicionais.parenteEmpresa" value="false" defaultChecked={initialDadosAdicionais.parenteEmpresa === "false"} disabled={editingId !== 'dadosAdicionais'}/> Não</label></div></div>
                        {/* ... (outros campos) ... */}
                   </div>
                </fieldset>

                {/* --- SEÇÃO ESCOLARIDADES (LISTA) --- */}
                 <fieldset className="mb-6 border rounded border-gray-700" disabled={isEditingAny && editingId !== 'escolaridades'}>
                    <legend className="text-lg font-semibold text-cyan-400 px-2 w-full flex justify-between items-center"> 
                        Escolaridades
                        <ActionButtons 
                           sectionId="escolaridades" 
                           prefix="escolaridades." 
                           isEditingThis={editingId === 'escolaridades'} 
                           isOtherEditing={isEditingAny && editingId !== 'escolaridades'} 
                           onEdit={() => handleEdit('escolaridades', 'escolaridades.')} 
                           onCancel={() => handleCancel('escolaridades', 'escolaridades.')}
                           onSave={() => {}} // O submit faz o save
                       />
                    </legend>
                    <div className="p-4 space-y-4">
                        {escolaridadeFields.map((field, index) => {
                             const isEditingThisSection = editingId === 'escolaridades';
                            return (
                                <fieldset key={field.id} className={`p-3 border rounded relative border-gray-600`}>
                                     {/* Botão de remover SÓ aparece no modo de edição da seção */}
                                     {isEditingThisSection && (
                                         <button type="button" onClick={() => removeEscolaridade(index)}
                                                 className={`absolute top-2 right-2 py-0.5 px-2 rounded text-xs bg-red-600 hover:bg-red-700 text-white`}
                                                 title="Remover"> X </button>
                                     )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                                         <div><label className="block text-sm mb-1">Escolaridade *</label><select name={`escolaridades.${index}.nivel`} className="form-input bg-gray-600" required defaultValue={field.value.nivel} disabled={!isEditingThisSection}><option>Ensino Médio</option><option>Ensino Técnico - Superior</option><option>Pós-graduação</option></select></div>
                                         <div><label className="block text-sm mb-1">Curso *</label><input name={`escolaridades.${index}.curso`} className="form-input" required defaultValue={field.value.curso} readOnly={!isEditingThisSection}/></div>
                                         <div><label className="block text-sm mb-1">Situação *</label><select name={`escolaridades.${index}.situacao`} className="form-input bg-gray-600" required defaultValue={field.value.situacao} disabled={!isEditingThisSection}><option>Completo</option><option>Cursando</option><option>Incompleto</option></select></div>
                                    </div>
                                </fieldset>
                            );
                        })}
                         {/* Botão Adicionar SÓ é habilitado/visível quando a seção está em edição */}
                        {editingId === 'escolaridades' && (
                            <button type="button" onClick={() => appendEscolaridade({ nivel: 'Ensino Médio', curso: '', situacao: 'Cursando' })}
                                    className={`text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded w-full`}>
                                + Adicionar Escolaridade
                            </button>
                        )}
                    </div>
                </fieldset>

                {/* --- SEÇÃO EXPERIÊNCIAS (LISTA) --- */}
                 <fieldset className="mb-6 border rounded border-gray-700" disabled={isEditingAny && editingId !== 'experiencias'}>
                    <legend className="text-lg font-semibold text-cyan-400 px-2 w-full flex justify-between items-center"> 
                       Experiências 
                        <ActionButtons 
                           sectionId="experiencias" 
                           prefix="experiencias." 
                           isEditingThis={editingId === 'experiencias'} 
                           isOtherEditing={isEditingAny && editingId !== 'experiencias'} 
                           onEdit={() => handleEdit('experiencias', 'experiencias.')} 
                           onCancel={() => handleCancel('experiencias', 'experiencias.')}
                           onSave={() => {}} // O submit faz o save
                       />
                    </legend>
                    <div className="p-4 space-y-4">
                        {experienciaFields.map((field, index) => {
                             const isEditingThisSection = editingId === 'experiencias';
                            return (
                                <fieldset key={field.id} className={`p-3 border rounded relative border-gray-600`}>
                                     {isEditingThisSection && (
                                        <button type="button" onClick={() => removeExperiencia(index)} 
                                                className={`absolute top-2 right-2 py-0.5 px-2 rounded text-xs bg-red-600 hover:bg-red-700 text-white`} 
                                                title="Remover"> X </button> 
                                     )}
                                     <div className="space-y-2 mt-1">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><label className="block text-sm mb-1">Nome Empresa *</label><input name={`experiencias.${index}.nomeEmpresa`} className="form-input" required defaultValue={field.value.nomeEmpresa} readOnly={!isEditingThisSection}/></div>
                                            <div><label className="block text-sm mb-1">Cargo *</label><input name={`experiencias.${index}.cargo`} className="form-input" required defaultValue={field.value.cargo} readOnly={!isEditingThisSection}/></div>
                                        </div>
                                         <div className="grid grid-cols-3 gap-2 items-end">
                                            <div><label className="block text-sm mb-1">Início *</label><input name={`experiencias.${index}.inicio`} type="month" className="form-input" required defaultValue={field.value.inicio ? field.value.inicio.substring(0, 7) : ''} readOnly={!isEditingThisSection}/></div>
                                            <div><label className="block text-sm mb-1">Finalização</label><input name={`experiencias.${index}.finalizacao`} type="month" className="form-input" defaultValue={field.value.finalizacao ? field.value.finalizacao.substring(0, 7) : ''} readOnly={!isEditingThisSection || field.value.atual} disabled={field.value.atual || !isEditingThisSection}/></div>
                                            <div className="flex items-center pb-2"><label><input type="checkbox" name={`experiencias.${index}.atual`} defaultChecked={field.value.atual} disabled={!isEditingThisSection} className="mr-1"/> Emprego Atual</label></div>
                                        </div>
                                         <div><label className="block text-sm mb-1">Atividades Exercidas</label><textarea name={`experiencias.${index}.atividades`} className="form-input h-16 resize-none" defaultValue={field.value.atividades} readOnly={!isEditingThisSection}></textarea></div>
                                    </div>
                                </fieldset>
                            );
                        })}
                         {editingId === 'experiencias' && (
                            <button type="button" onClick={() => appendExperiencia({ nomeEmpresa: '', cargo: '', inicio: '', finalizacao: '', atual: false, atividades: '' })}
                                    className={`text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded w-full`}>
                                + Adicionar Experiência
                            </button>
                        )}
                    </div>
                </fieldset>

                {/* --- SEÇÃO CONHECIMENTOS (LISTA) --- */}
                 <fieldset className="mb-6 border rounded border-gray-700" disabled={isEditingAny && editingId !== 'conhecimentos'}>
                    <legend className="text-lg font-semibold text-cyan-400 px-2 w-full flex justify-between items-center"> 
                        Conhecimentos 
                        <ActionButtons 
                           sectionId="conhecimentos" 
                           prefix="conhecimentos." 
                           isEditingThis={editingId === 'conhecimentos'} 
                           isOtherEditing={isEditingAny && editingId !== 'conhecimentos'} 
                           onEdit={() => handleEdit('conhecimentos', 'conhecimentos.')} 
                           onCancel={() => handleCancel('conhecimentos', 'conhecimentos.')}
                           onSave={() => {}} // O submit faz o save
                       />
                    </legend>
                    <div className="p-4 space-y-4">
                        {conhecimentoFields.map((field, index) => {
                            const isEditingThisSection = editingId === 'conhecimentos';
                            return(
                                <fieldset key={field.id} className={`p-3 border rounded relative border-gray-600`}>
                                    {isEditingThisSection && ( 
                                        <button type="button" onClick={() => removeConhecimento(index)} 
                                                className={`absolute top-2 right-2 py-0.5 px-2 rounded text-xs bg-red-600 hover:bg-red-700 text-white`} 
                                                title="Remover"> X </button> 
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                                        <div><label className="block text-sm mb-1">Nível *</label><select name={`conhecimentos.${index}.nivel`} className="form-input bg-gray-600" required defaultValue={field.value.nivel} disabled={!isEditingThisSection}><option>Básico</option><option>Intermediário</option><option>Avançado</option></select></div>
                                        <div className="md:col-span-2"><label className="block text-sm mb-1">Descrição *</label><input name={`conhecimentos.${index}.descricao`} className="form-input" required defaultValue={field.value.descricao} readOnly={!isEditingThisSection}/></div>
                                    </div>
                                </fieldset>
                            );
                        })}
                         {editingId === 'conhecimentos' && (
                            <button type="button" onClick={() => appendConhecimento({ nivel: 'Básico', descricao: '' })}
                                    className={`text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded w-full`}>
                                + Adicionar Conhecimento
                            </button>
                        )}
                    </div>
                </fieldset>

                {/* O submit geral agora está dentro dos botões "Salvar Seção" */}
            </form>
        </div>
    );
}


// --- Funções e Componentes Utilitários ---

// Armazena a instância da root do React 18 e o elemento root
let modalRootInstance: Root | null = null;
let modalRootEl: HTMLElement | null = null;

// Modal customizado para substituir o alert()
const CustomModal: React.FC<{ title: string; message: string; onClose: () => void }> = ({ title, message, onClose }) => { /* ... (JSX do modal inalterado com scroll) ... */
  return ( <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75' onClick={onClose}> <div className='bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col' style={{ maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}> <div className="p-4 border-b border-gray-700 flex-shrink-0"> <h2 className='text-xl font-bold text-cyan-400'>{title}</h2> </div> <div className="p-6 overflow-y-auto flex-grow"> <p className='text-gray-300 whitespace-pre-wrap break-words'>{message}</p> </div> <div className="p-4 border-t border-gray-700 flex-shrink-0"> <button onClick={onClose} className='w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors'> Fechar </button> </div> </div> </div> );
 };

// Função para renderizar/remover o modal (Revertida para window.ReactDOM)
const showModal = (title: string, message: string) => { /* ... (inalterado) ... */
  if (!modalRootEl) { modalRootEl = document.getElementById('modal-root'); if (!modalRootEl) { modalRootEl = document.createElement('div'); modalRootEl.id = 'modal-root'; document.body.appendChild(modalRootEl); } }
  const reactDOM = (window as any).ReactDOM; if (!reactDOM || typeof reactDOM.createRoot !== 'function') { console.error("ReactDOM.createRoot não está disponível globalmente."); alert(`${title}\n\n${message}`); return; }
  const { createRoot } = reactDOM; if (!modalRootInstance) modalRootInstance = createRoot(modalRootEl);
  const closeModal = () => { if (modalRootInstance) { modalRootInstance.unmount(); modalRootInstance = null; } };
  modalRootInstance!.render(<CustomModal title={title} message={message} onClose={closeModal} />);
 };


// --- Componente Principal e Estilos ---

const Teste: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('curriculum'); // Foca no novo formulário
  // Passa showModal (a função global) para os componentes de cenário
  const scenarios = {
    login: <LoginForm showModal={showModal} />,
    registration: <RegistrationForm showModal={showModal} />,
    hybrid: <HybridFormSimple showModal={showModal} />,
    nestedList: <NestedListForm showModal={showModal} />,
    curriculum: <CurriculumForm showModal={showModal} />, // Nova tab Currículo
  };

  const TabButton: React.FC<{ tabId: string, label: string }> = ({ tabId, label }) => ( <button onClick={() => setActiveTab(tabId)} className={`px-3 py-2 sm:px-4 text-sm font-medium rounded-md transition-colors ${activeTab === tabId ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}> {label} </button> );

  return (
    <>
      <style>{`
        /* Estilos gerais */
        .form-input { width: 100%; background-color: #374151; border: 1px solid #4B5563; border-radius: 0.375rem; padding: 0.5rem 0.75rem; color: white; transition: background-color .2s, border-color .2s, color .2s; position: relative; z-index: 1; }
        .form-input:focus { outline: none; border-color: #06b6d4; box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.5); z-index: 2; background-color: #4B5563; /* Escurece um pouco no foco para edição */ }
        .form-input.is-touched:valid { border-color: #10B981; }
        .form-input.is-touched:invalid { border-color: #EF4444; }
        select.form-input { appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem; }
        
        /* --- ESTILOS PARA readOnly/disabled (MODO VISUALIZAÇÃO) --- */
        .form-input[readOnly],
        textarea.form-input[readOnly] {
            background-color: transparent !important; border-color: transparent !important;
            padding-left: 0.1rem !important; padding-right: 0.1rem !important; /* Menor padding */
            color: #D1D5DB !important; cursor: default; box-shadow: none !important; resize: none;
             min-height: 24px; height: auto; line-height: 1.5;
        }
        /* Estilo para select desabilitado (agora o fieldset pai o desabilita) */
        select.form-input:disabled {
             background-color: transparent !important; border-color: transparent !important;
             padding-left: 0.1rem !important; padding-right: 0.1rem !important;
             color: #D1D5DB !important; cursor: default; box-shadow: none !important;
             background-image: none !important; opacity: 1 !important;
             -webkit-appearance: none; -moz-appearance: none; appearance: none;
             min-height: 24px; height: auto; line-height: 1.5;
        }
         input[type="checkbox"]:disabled, input[type="radio"]:disabled {
             opacity: 1; /* Opacidade controlada pelo fieldset */
         }
         label:has(input[type="checkbox"]:disabled), label:has(input[type="radio"]:disabled) {
             cursor: default;
         }
         input[type="month"][readOnly], input[type="date"][readOnly] {
             color: #D1D5DB !important; background-color: transparent !Mimportant;
             border-color: transparent !important; padding-left: 0.1rem !important; box-shadow: none !important;
             min-height: 24px; height: auto; line-height: 1.5;
         }
         input[type="month"][readOnly]::-webkit-calendar-picker-indicator,
         input[type="date"][readOnly]::-webkit-calendar-picker-indicator { display: none; }

        
        /* StarRating */
        input[name^="rating"]:invalid.is-touched ~ .star-display { outline: 2px solid #EF4444; border-radius: 0.375rem; }
        .star-display:focus, .star-display:focus-within { outline: 2px solid #06b6d4; border-radius: 0.375rem; }
        /* Autocomplete */
        .autocomplete-suggestions { position: absolute; z-index: 10; width: 100%; background-color: #374151; border: 1px solid #4B5563; border-top: none; border-radius: 0 0 0.375rem 0.375rem; margin-top: -1px; max-height: 10rem; overflow-y: auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .autocomplete-suggestion-item { padding: 0.5rem 1rem; color: #D1D5DB; cursor: pointer; }
        .autocomplete-suggestion-item:hover { background-color: #4B5563; }
        .autocomplete-suggestion-item[aria-disabled="true"] { opacity: 0.5; cursor: not-allowed; background-color: transparent !important; }
        
        /* Estilos para estado desabilitado (edição contextual) */
        fieldset:disabled { 
            opacity: 0.6; /* Controla toda a opacidade da seção */
            pointer-events: none; /* Desabilita cliques em tudo dentro */
        }
        /* Re-habilita ponteiros em botões para mostrar 'not-allowed' */
        fieldset:disabled button { 
            pointer-events: auto; 
        }

      `}</style>
      <div className='bg-gray-800 text-white min-h-screen p-4 sm:p-8 font-sans'>
        <div className='max-w-2xl mx-auto'>
          <header className='text-center mb-8'>
            <h1 className='text-xl sm:text-4xl font-extrabold text-cyan-400'>`useForm` - v4.12</h1>
            <p className='text-gray-400 mt-2'>Edição Contextual por Seção</p>
          </header>
          <div className='flex justify-center flex-wrap gap-2 mb-6'>
            <TabButton tabId='login' label='Nativo' />
            <TabButton tabId='registration' label='Nativo (Custom)' />
            <TabButton tabId='hybrid' label='Híbrido Simples' />
            <TabButton tabId='nestedList' label='Lista Aninhada' />
            <TabButton tabId='curriculum' label='Currículo (Edição)' />
          </div>
          <main>
            {scenarios[activeTab as keyof typeof scenarios]}
          </main>
        </div>
      </div>
    </>
  );
};

export default Teste;
