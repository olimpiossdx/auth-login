import React from "react";
import { syncCheckboxGroup, initializeCheckboxMasters, setNativeValue, setNativeChecked } from "../../utils/utilities";
import type { FieldListenerMap, ValidatorMap, FormField, Path, PathValue, UseFormConfig } from "./props";
import { getFormFields, parseFieldValue, getRelativePath, setNestedValue, getNestedValue } from "./utilities";

/**
 * Hook principal para gerenciamento de formulários com arquitetura Híbrida.
 * * **Filosofia:**
 * 1. O DOM é a fonte da verdade para valores (Performance).
 * 2. O React orquestra validação complexa e submissão.
 * 3. O hook se conecta ao formulário via Ref (`registerForm`), permitindo re-montagem segura.
 * * @template FV - Tipo genérico representando a estrutura dos dados do formulário (Record<string, any>).
 * @param providedId - (Opcional) ID do formulário HTML. Se não fornecido, gera um ID único.
 */
const useForm = <FV extends Record<string, any>>(configOrId?: string | UseFormConfig<FV>) => {
  // Identidade e Referências
  const config = typeof configOrId === 'string' ? { id: configOrId } : configOrId || {};

  const formId = config.id || React.useId();
  const onSubmitCallback = config.onSubmit;

  // Armazena listeners e validadores na memória do hook
  const fieldListeners = React.useRef<FieldListenerMap>(new Map());
  const validators = React.useRef<ValidatorMap<FV>>({});
  const debounceMap = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isResetting = React.useRef(false);
  const observerRef = React.useRef<MutationObserver | null>(null);

  // Referência ativa do formulário no DOM
  const formRef = React.useRef<HTMLFormElement | null>(null);

  // --- HELPER: LIMPEZA ---
  const cleanupLogic = () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    // Remove listeners manuais para evitar vazamento de memória
    fieldListeners.current.forEach((listeners, field) => {
      field.removeEventListener('blur', listeners.blur);
      field.removeEventListener('input', listeners.change);
      field.removeEventListener('change', listeners.change);
    });
    fieldListeners.current.clear();
  };

  /**
   * **Callback Ref**: Função para conectar o hook ao elemento `<form>`.
   * Deve ser passada para a prop `ref` do formulário.
   * * *Vantagem:* O React chama essa função automaticamente sempre que o nó DOM é criado ou destruído,
   * garantindo que os listeners sejam reconectados mesmo se a `key` do formulário mudar.
   */
  const registerForm = React.useCallback((node: HTMLFormElement | null) => {
    if (formRef.current) {
      // Se já tínhamos um form antes, limpamos os listeners dele (Unmount)
      cleanupLogic();
    }

    formRef.current = node;

    if (node) {
      // Novo form montado! Iniciamos a observação imediatamente.
      setupDOMMutationObserver(node);
    }
  }, []);

  const countFieldsByName = (form: HTMLElement, name: string): number => {
    return form.querySelectorAll(`[name="${name}"]`).length;
  };

  /**
   * Registra regras de validação customizadas.
   * As regras rodam em pipeline: Nativa (HTML) -> Customizada (JS).
   */
  const setValidators = React.useCallback((newValidators: ValidatorMap<FV>) => {
    validators.current = newValidators;
  }, []);

  // =========================================================================
  // 1. LEITURA DE DADOS (DOM -> JSON)
  // =========================================================================

  const getValueImpl = React.useCallback((namePrefix?: string): any => {
    const form = formRef.current;
    if (!form) return namePrefix ? undefined : ({} as FV);

    const fields = getFormFields(form, namePrefix);

    // Otimização: Busca exata se um prefixo específico foi passado
    if (namePrefix) {
      const exactMatch = fields.find(f => f.name === namePrefix);
      if (exactMatch) {
        // Tratamento especial para Checkbox Único (Boolean) vs Grupo (Array)
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
      setNestedValue(formData, relativePath, parseFieldValue(field));
    });

    return formData;
  }, []);

  /**
   * Lê os valores do formulário com Tipagem Forte.
   */
  const getValue = getValueImpl as {
    /** Retorna o objeto completo do formulário tipado. */
    (): FV;
    /** Retorna o valor inferido de um campo específico (ex: string, number). */
    <P extends Path<FV>>(namePrefix: P): PathValue<FV, P>;
    /** Fallback para strings dinâmicas. */
    (namePrefix: string): any;
  };

  // ============ VALIDAÇÃO ============
  const validateFieldInternal = (field: FormField, formValues: FV): string => {
    const validateFn = validators.current[field.dataset.validation || ''];

    // 1. Limpeza e Validação Nativa (Prioridade Máxima)
    field.setCustomValidity('');
    if (!field.checkValidity()) return field.validationMessage;

    // 2. Validação Customizada (Regra de Negócio)
    if (validateFn) {
      const fieldValue = getNestedValue(formValues, field.name);
      const result = validateFn(fieldValue, field, formValues);
      if (result) {
        const message = typeof result === 'string' ? result : result.message;
        field.setCustomValidity(message);
        return message;
      }
    }
    return '';
  };

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

  // ============ INTERAÇÃO & DEBOUNCE ============
  const handleFieldInteraction = React.useCallback((event: Event) => {
    // BLINDAGEM: Se estamos num reset programático, ignoramos tudo.
    if (isResetting.current) return;

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;

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

    // ESTRATÉGIA: "Reward Early, Punish Late"
    if (event.type === 'blur') {
      const msg = validateFieldInternal(field, formValues);
      updateErrorUI(field, msg);
      return;
    }

    if (event.type === 'input' || event.type === 'change') {
      const wasInvalid = field.hasAttribute('aria-invalid') || !field.validity.valid;
      if (!wasInvalid) return;

      const msg = validateFieldInternal(field, formValues);
      if (!msg) {
        updateErrorUI(field, ''); // Limpa erro imediatamente
      } else {
        const timer = setTimeout(() => {
          updateErrorUI(field, msg);
          // Só mostra balão se o usuário ainda estiver focado
          if (document.activeElement === field) field.reportValidity();
        }, 600);
        debounceMap.current.set(field.name, timer);
      }
    }
  }, [getValue]);

  // ============ RESET / LOAD DATA ============

  /**
   * Preenche o formulário com dados ou reseta.
   * Usa Native Bypass para garantir que a UI do React (ex: StarRating) seja notificada.
   */
  const resetSection = React.useCallback((namePrefix: string, originalValues: any) => {
    const form = formRef.current;
    if (!form) return;
    isResetting.current = true;
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

  // ============ OBSERVER ============

  const addFieldInteractionListeners = (field: HTMLElement): void => {
    const isMaster = field.hasAttribute('data-checkbox-master');
    const allowedTypes = [HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement];
    if (!allowedTypes.some(type => field instanceof type)) return;

    if (((field as any).name || isMaster) && !fieldListeners.current.has(field)) {
      const listeners = { blur: handleFieldInteraction, change: handleFieldInteraction };
      field.addEventListener('blur', listeners.blur);
      // Ouve INPUT para texto (debounce) e CHANGE para outros
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

  const setupDOMMutationObserver = (form: HTMLFormElement): void => {
    const initialFields = getFormFields(form);
    initialFields.forEach(addFieldInteractionListeners);
    form.querySelectorAll('input[type="checkbox"][data-checkbox-master]').forEach(cb => {
      if (cb instanceof HTMLElement) addFieldInteractionListeners(cb);
    });
    initializeCheckboxMasters(form);

    observerRef.current = new MutationObserver((mutations) => {
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
    observerRef.current.observe(form, { childList: true, subtree: true });
  };

  // ============ SUBMIT ============
  const handleSubmit = React.useCallback((onValid: (data: FV) => void) =>
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = formRef.current;
      if (!form) return;

      const allFields = getFormFields(form);
      allFields.forEach(field => field.classList.add('is-touched'));
      revalidateAllCustomRules();

      // Timeout 0 garante que customValidity foi processada
      setTimeout(() => {
        if (!formRef.current) return;
        if (!formRef.current.checkValidity()) {
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
    // Procura elemento visual focado se o input for hidden (Shadow/Anchor)
    const focusable = invalid.parentElement?.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea, [tabindex="0"]');
    focusable ? focusable.focus() : invalid.focus();
  };

  // Se o usuário passou um callback de submit na config, já criamos o handler
  const submitHandler = onSubmitCallback ? handleSubmit(onSubmitCallback) : undefined;
  const formProps = {
    id: formId,
    ref: registerForm,      // A conexão segura
    onSubmit: submitHandler, // Se existir, conecta. Se undefined, o form não faz nada no enter (seguro).
  };

  // API PÚBLICA
  return {
    handleSubmit,
    setValidators,
    formId,
    resetSection,
    getValue,
    registerForm,
    formProps
  };
};

export default useForm;