import React from "react";
import { syncCheckboxGroup, initializeCheckboxMasters, setNativeValue, setNativeChecked } from "../../utils/utilities";
import type { FieldListenerMap, ValidatorMap, FormField, Path, PathValue } from "./props";
import { getFormFields, parseFieldValue, getRelativePath, setNestedValue, getNestedValue } from "./utilities";


/**
 * Hook principal para gerenciamento de formulários híbridos.
 * * Utiliza uma arquitetura **Uncontrolled** (Valores no DOM) para máxima performance,
 * enquanto oferece APIs do React para validação complexa e orquestração.
 * * @template FV - Tipo genérico representando a estrutura dos dados do formulário.
 * @param providedId - (Opcional) ID do formulário HTML. Se omitido, um ID único é gerado.
 * * @example
 * interface UserData { name: string; age: number; }
 * const { handleSubmit, getValue } = useForm<UserData>();
 */
const useForm = <FV extends Record<string, any>>(providedId?: string) => {
  const formId = providedId || React.useId();
  const formRef = React.useRef<HTMLFormElement>(null);
  const fieldListeners = React.useRef<FieldListenerMap>(new Map());
  const validators = React.useRef<ValidatorMap<FV>>({});
  const debounceMap = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // SEMÁFORO: Bloqueia validação durante reset programático
  const isResetting = React.useRef(false);

  const countFieldsByName = (form: HTMLElement, name: string): number => {
    return form.querySelectorAll(`[name="${name}"]`).length;
  };

  /**
   * Registra regras de validação customizadas que rodam em tempo real e no submit.
   * * A validação utiliza a estratégia **"Smart Debounce"**:
   * - Limpa o erro imediatamente ao digitar (Reward Early).
   * - Mostra o erro apenas após parar de digitar (Punish Late).
   * * @param newValidators - Objeto onde a chave é o nome da regra (atributo `data-validation`)
   * e o valor é a função validadora.
   * * @example
   * useEffect(() => {
   * setValidators({
   * isAdult: (val) => val < 18 ? { message: "Menor de idade", type: "error" } : undefined
   * });
   * }, []);
   * // HTML: <input type="number" data-validation="isAdult" />
   */
  const setValidators = React.useCallback((newValidators: ValidatorMap<FV>) => {
    validators.current = newValidators;
  }, []);

  // =========================================================================
  // 1. LEITURA DE DADOS
  // =========================================================================

  const getValueImpl = React.useCallback((namePrefix?: string): any => {
    const form = formRef.current;
    if (!form) return namePrefix ? undefined : ({} as FV);

    const fields = getFormFields(form, namePrefix);

    // Otimização: Busca exata se um prefixo específico foi passado
    if (namePrefix) {
      const exactMatch = fields.find(f => f.name === namePrefix);
      if (exactMatch) {
        if (exactMatch instanceof HTMLInputElement && exactMatch.type === 'checkbox') {
          if (countFieldsByName(form, exactMatch.name) === 1) {
            const hasValue = exactMatch.hasAttribute('value') && exactMatch.value !== 'on';
            return exactMatch.checked ? (hasValue ? exactMatch.value : true) : false;
          }
        }
        return parseFieldValue(exactMatch);
      }
    }

    const formData = {};
    const processedNames = new Set<string>();

    fields.forEach(field => {
      const relativePath = getRelativePath(field.name, namePrefix);
      if (!relativePath || processedNames.has(field.name)) return;

      // Lógica para Checkbox Groups (Arrays) vs Checkbox Único
      if (field instanceof HTMLInputElement && field.type === 'checkbox') {
        const count = countFieldsByName(form, field.name);

        if (count > 1) {
          const allChecked = form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${field.name}"]:checked`);
          const values = Array.from(allChecked).map(cb => cb.value);
          setNestedValue(formData, relativePath, values);
          processedNames.add(field.name);
        } else {
          if (field.checked) {
            const hasExplicitValue = field.hasAttribute('value') && field.value !== 'on';
            setNestedValue(formData, relativePath, hasExplicitValue ? field.value : true);
          } else {
            setNestedValue(formData, relativePath, false);
          }
        }
        return;
      }

      const value = parseFieldValue(field);
      setNestedValue(formData, relativePath, value);
    });

    return formData;
  }, []);

  /**
   * Lê os valores atuais dos inputs do formulário diretamente do DOM.
   * Não causa re-renderização do componente React.
   * * @param namePrefix - (Opcional) O nome do campo ou grupo que você deseja ler.
   * - Se omitido: Retorna o objeto completo do formulário.
   * - Se for um grupo (ex: "user"): Retorna o objeto aninhado `{ name: "...", age: ... }`.
   * - Se for um campo exato (ex: "user.name"): Retorna o valor primitivo.
   * * @returns O valor inferido (Objeto, Array ou Primitivo).
   * * @example
   * // 1. Pegar tudo
   * const data = getValue(); 
   * * // 2. Pegar um objeto aninhado
   * const user = getValue("user"); // { name: "Ana", address: {...} }
   * * // 3. Pegar valor direto (Type-safe)
   * const email = getValue("user.email"); // "ana@teste.com"
   */
  const getValue = getValueImpl as {
    (): FV;
    <P extends Path<FV>>(namePrefix: P): PathValue<FV, P>;
    (namePrefix: string): any;
  };

  // ============ VALIDAÇÃO UNITÁRIA ============

  const validateFieldInternal = (field: FormField, formValues: FV): string => {
    const validateFn = validators.current[field.dataset.validation || ''];

    // 1. Reseta validade customizada para permitir checagem nativa limpa
    field.setCustomValidity('');

    // 2. Checa regras nativas (required, pattern, type)
    if (!field.checkValidity()) {
      return field.validationMessage;
    }

    // 3. Checa regras customizadas (JS)
    if (validateFn) {
      const fieldValue = getNestedValue(formValues, field.name);
      const result = validateFn(fieldValue, field, formValues);

      if (result) {
        const message = typeof result === 'string' ? result : result.message;
        field.setCustomValidity(message);
        return message;
      }
    }

    return ''; // Válido
  };

  // ============ UI UPDATE ============

  const updateErrorUI = (field: FormField, message: string) => {
    const errorId = `error-${field.name}`;
    const errorSlot = document.getElementById(errorId);

    if (message) {
      field.setAttribute('aria-invalid', 'true');
      if (errorSlot) field.setAttribute('aria-describedby', errorId);
    } else {
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    }

    if (errorSlot) {
      errorSlot.textContent = message;
      errorSlot.setAttribute('data-visible', message ? 'true' : 'false');
      errorSlot.style.display = message ? 'block' : 'none';
    }
  };

  // ============ VALIDAÇÃO EM MASSA ============

  const revalidateAllCustomRules = React.useCallback(() => {
    const form = formRef.current;
    if (!form) return;
    const formValues = getValue() as FV;

    const allFields = getFormFields(form);
    allFields.forEach(field => {
      if (field.disabled) return;
      const msg = validateFieldInternal(field, formValues);
      updateErrorUI(field, msg);
    });
  }, [getValue]);

  // ============ INTERAÇÃO ============

  const handleFieldInteraction = React.useCallback((event: Event) => {
    // Se estamos num reset programático, ignoramos eventos para evitar conflitos
    if (isResetting.current) return;

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;

    // Checkbox Sync (Imediato)
    if (event.type === 'change' && target instanceof HTMLInputElement && target.type === 'checkbox') {
      if (formRef.current) syncCheckboxGroup(target, formRef.current);
    }

    const field = target as FormField;
    if (!field.name) return;

    field.classList.add('is-touched');
    const formValues = getValue() as FV;

    if (debounceMap.current.has(field.name)) {
      clearTimeout(debounceMap.current.get(field.name));
      debounceMap.current.delete(field.name);
    }

    // Blur: Valida imediatamente (Punish Late) mas sem balão intrusivo
    if (event.type === 'blur') {
      const msg = validateFieldInternal(field, formValues);
      updateErrorUI(field, msg);
      return;
    }

    // Input/Change: Validação com Debounce (Reward Early)
    if (event.type === 'input' || event.type === 'change') {
      const wasInvalid = field.hasAttribute('aria-invalid') || !field.validity.valid;
      if (!wasInvalid) return;

      const msg = validateFieldInternal(field, formValues);

      if (!msg) {
        updateErrorUI(field, ''); // Limpa erro imediatamente ao corrigir
      } else {
        const timer = setTimeout(() => {
          updateErrorUI(field, msg);
          // Só mostra balão se o usuário ainda estiver focado (ajuda contextual)
          if (document.activeElement === field) {
            field.reportValidity();
          }
        }, 600);
        debounceMap.current.set(field.name, timer);
      }
    }
  }, [getValue]);

  // ============ RESET / LOAD DATA ============

  /**
   * Preenche ou limpa campos do formulário programaticamente.
   * Utiliza "Native Bypass" para disparar eventos e atualizar UIs reativas (ex: StarRating).
   * * @param namePrefix - Prefixo do grupo a ser resetado ("" para tudo).
   * @param originalValues - Objeto de dados para preencher. 
   * - Se passar um Objeto: O formulário entra em modo de Edição/Preenchimento.
   * - Se passar `null`: O formulário reseta para o `defaultValue` do HTML (Limpeza).
   * * @example
   * // Cenário A: Carregar dados da API
   * resetSection("", { nome: "Carlos", admin: true });
   * * // Cenário B: Limpar formulário
   * resetSection("", null);
   */
  const resetSection = React.useCallback((namePrefix: string, originalValues: any) => {
    const form = formRef.current;
    if (!form) return;

    isResetting.current = true; // Bloqueia handlers de interação

    try {
      const fields = getFormFields(form, namePrefix);

      fields.forEach(field => {
        if (debounceMap.current.has(field.name)) {
          clearTimeout(debounceMap.current.get(field.name));
          debounceMap.current.delete(field.name);
        }
        updateErrorUI(field, '');

        const relativePath = getRelativePath(field.name, namePrefix);
        let valueToApply = undefined;

        if (originalValues) {
          valueToApply = relativePath ? getNestedValue(originalValues, relativePath) : undefined;
          if (valueToApply === undefined && !relativePath) valueToApply = getNestedValue(originalValues, field.name);
        }

        if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) {
          let shouldCheck = false;
          if (valueToApply !== undefined) {
            if (field.type === 'checkbox' && Array.isArray(valueToApply)) shouldCheck = valueToApply.includes(field.value);
            else if (field.type === 'checkbox' && typeof valueToApply === 'boolean') shouldCheck = valueToApply;
            else shouldCheck = field.value === String(valueToApply);
          } else {
            shouldCheck = field.defaultChecked;
          }
          setNativeChecked(field, shouldCheck);
        } else {
          const newVal = String(valueToApply ?? (field as any).defaultValue ?? '');
          setNativeValue(field, newVal);
        }

        field.classList.remove('is-touched');
        field.setCustomValidity('');
      });

      setTimeout(() => initializeCheckboxMasters(form), 0);

    } finally {
      setTimeout(() => { isResetting.current = false; }, 0);
    }
  }, []);

  // ============ INFRAESTRUTURA ============

  const addFieldInteractionListeners = (field: HTMLElement): void => {
    const isMaster = field.hasAttribute('data-checkbox-master');
    const allowedTypes = [HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement];
    if (!allowedTypes.some(type => field instanceof type)) return;

    if (((field as any).name || isMaster) && !fieldListeners.current.has(field)) {
      const listeners = { blur: handleFieldInteraction, change: handleFieldInteraction };
      field.addEventListener('blur', listeners.blur);
      const inputEvent = (field instanceof HTMLInputElement && (field.type === 'text' || field.type === 'email' || field.type === 'password' || field.type === 'search')) ? 'input' : 'change';
      if (inputEvent === 'input') field.addEventListener('input', listeners.change);
      field.addEventListener('change', listeners.change);
      fieldListeners.current.set(field, listeners);
    }
  };

  const removeFieldInteractionListeners = (field: HTMLElement): void => {
    const listeners = fieldListeners.current.get(field);
    if (listeners) {
      field.removeEventListener('blur', listeners.blur);
      field.removeEventListener('input', listeners.change);
      field.removeEventListener('change', listeners.change);
      fieldListeners.current.delete(field);
    }
  };

  const setupDOMMutationObserver = (form: HTMLFormElement): () => void => {
    const initialFields = getFormFields(form);
    initialFields.forEach(addFieldInteractionListeners);
    form.querySelectorAll('input[type="checkbox"][data-checkbox-master]').forEach(cb => {
      if (cb instanceof HTMLElement) addFieldInteractionListeners(cb);
    });
    initializeCheckboxMasters(form);

    const observer = new MutationObserver((mutations) => {
      let needsReinitMasters = false;
      mutations.forEach((mutation) => {
        if (mutation.type !== 'childList') return;
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return;
          addFieldInteractionListeners(node);
          getFormFields(node as any).forEach(addFieldInteractionListeners);
          if (node.querySelector('input[type="checkbox"]') || (node instanceof HTMLInputElement && node.type === 'checkbox')) {
            needsReinitMasters = true;
          }
        });
        mutation.removedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return;
          removeFieldInteractionListeners(node);
          getFormFields(node as any).forEach(removeFieldInteractionListeners);
        });
      });
      if (needsReinitMasters) initializeCheckboxMasters(form);
    });
    observer.observe(form, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      fieldListeners.current.forEach((l, f) => {
        f.removeEventListener('blur', l.blur);
        f.removeEventListener('input', l.change);
        f.removeEventListener('change', l.change);
      });
      fieldListeners.current.clear();
    };
  };

  // ============ SUBMIT ============

  /**
   * Wrapper para o evento onSubmit do formulário.
   * Gerencia automaticamente:
   * 1. Prevenção do default.
   * 2. Validação em massa (Nativa + Customizada).
   * 3. Foco no primeiro campo inválido.
   * * @param onValid - Função callback que recebe os dados (JSON) se a validação passar.
   */
  const handleSubmit = React.useCallback((onValid: (data: FV) => void) =>
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = formRef.current;
      if (!form) return;

      const allFields = getFormFields(form);
      allFields.forEach(field => {
        field.classList.add('is-touched');
        if (debounceMap.current.has(field.name)) {
          clearTimeout(debounceMap.current.get(field.name));
          debounceMap.current.delete(field.name);
        }
      });

      revalidateAllCustomRules();

      setTimeout(() => {
        if (!formRef.current) return;
        const isValid = formRef.current.checkValidity();
        if (!isValid) {
          focusFirstInvalidField(form);
          form.reportValidity();
        } else {
          onValid(getValue() as FV);
        }
      }, 0);
    }, [getValue, revalidateAllCustomRules]);

  const focusFirstInvalidField = (form: HTMLFormElement): void => {
    const invalid = form.querySelector<HTMLElement>(':invalid');
    if (!invalid) return;
    const focusable = invalid.parentElement?.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea, [tabindex="0"]');
    focusable ? focusable.focus() : invalid.focus();
  };

  React.useLayoutEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (form) { formRef.current = form; return setupDOMMutationObserver(form); }
  }, [formId]);

  return { handleSubmit, setValidators, formId, resetSection, getValue };
};

export default useForm;