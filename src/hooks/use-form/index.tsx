import React from "react";
import type { FieldListenerMap, FormField, ValidatorMap } from "./props";
import { getFormFields, parseFieldValue, getRelativePath, setNestedValue, getNestedValue } from "./utilities";

// ============ HOOK PRINCIPAL ============

const useForm = <FV extends Record<string, any>>(providedId?: string) => {
  const formId = providedId || React.useId();
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const fieldListeners = React.useRef<FieldListenerMap>(new Map());
  const validators = React.useRef<ValidatorMap<FV>>({});

  // ============ GERENCIAMENTO DE VALIDAÇÃO ============

  const setValidators = React.useCallback((newValidators: ValidatorMap<FV>) => {
    validators.current = newValidators;
  }, []);

  // ============ LEITURA DE VALORES ============

  /**
   * Lê valores do formulário diretamente do DOM
   */
  const getValue = React.useCallback((namePrefix?: string): Partial<FV> | FV | any => {
    const form = formRef.current;
    if (!form) return namePrefix ? {} : ({} as FV);

    const formData = {};
    const fields = getFormFields(form, namePrefix);

    // Caso especial: campo único com nome exato do prefixo
    if (namePrefix && fields.length === 0) {
      const singleField = form.querySelector<FormField>(`[name="${namePrefix}"]`);
      if (singleField) {
        return parseFieldValue(singleField);
      }
    }

    // Processa múltiplos campos
    fields.forEach(field => {
      const relativePath = getRelativePath(field.name, namePrefix);
      if (!relativePath) return;

      const value = parseFieldValue(field);
      setNestedValue(formData, relativePath, value);
    });

    return formData;
  }, []);

  // ============ VALIDAÇÃO ============

  /**
   * Executa todas as validações customizadas
   */
  const revalidateAllCustomRules = React.useCallback(() => {
    const form = formRef.current;
    if (!form) return;

    const formValues = getValue() as FV;
    const validatorFunctions = validators.current;

    Object.keys(validatorFunctions).forEach(validationKey => {
      const validate = validatorFunctions[validationKey];
      if (!validate) return;

      // Valida apenas campos habilitados
      const fieldsToValidate = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        `[name][data-validation="${validationKey}"]:not(:disabled)`
      );

      fieldsToValidate.forEach(field => {
        field.setCustomValidity('');
        const fieldValue = getNestedValue(formValues, field.name);
        const result = validate(fieldValue, field, formValues);

        if (typeof result === 'string') {
          field.setCustomValidity(result);
        } else if (result?.type === 'error') {
          field.setCustomValidity(result.message);
        }
      });
    });

    // Limpa validações customizadas de campos sem regras específicas
    const fieldsWithoutCustomValidation = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input[name]:not([data-validation]), select[name]:not([data-validation]), textarea[name]:not([data-validation])'
    );

    fieldsWithoutCustomValidation.forEach(field => {
      if (field.validity.valid) {
        field.setCustomValidity('');
      }
    });
  }, [getValue]);

  // ============ INTERAÇÃO DO USUÁRIO ============

  const handleFieldInteraction = React.useCallback((event: Event) => {
    (event.currentTarget as HTMLElement).classList.add('is-touched');
    revalidateAllCustomRules();
  }, [revalidateAllCustomRules]);

  // ============ RESET DE SEÇÕES ============

  const resetSection = React.useCallback((namePrefix: string, originalValues: any) => {
    const form = formRef.current;
    if (!form || !originalValues) {
      console.warn('[resetSection] Formulário ou valores originais não encontrados');
      return;
    };

    const fields = getFormFields(form, namePrefix);

    fields.forEach(field => {
      const relativePath = getRelativePath(field.name, namePrefix);
      let originalValue;

      if (relativePath) {
        originalValue = getNestedValue(originalValues, relativePath);
      } else {
        originalValue = originalValues[field.name] ?? getNestedValue(originalValues, field.name);
      }

      // Aplica valor original ou valor padrão do HTML
      if (originalValue !== undefined) {
        applyValueToField(field, originalValue);
      } else {
        resetFieldToDefault(field);
      };

      // Notifica mudança e limpa estado visual
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.classList.remove('is-touched');
    });
  }, []);

  /**
   * Aplica valor específico ao campo
   */
  const applyValueToField = (field: FormField, value: any): void => {
    if (field.type === 'checkbox' && field instanceof HTMLInputElement) {
      field.checked = Boolean(value);
    } else if (field.type === 'radio' && field instanceof HTMLInputElement) {
      field.checked = field.value === String(value);
    } else {
      field.value = String(value ?? '');
    }
  };

  /**
   * Reseta campo para seu valor padrão HTML
   */
  const resetFieldToDefault = (field: FormField): void => {
    if ((field.type === 'checkbox' || field.type === 'radio') && field instanceof HTMLInputElement) {
      field.checked = field.defaultChecked;
    } else {
      field.value = (field as any).defaultValue;
    }
  };

  // ============ GERENCIAMENTO DE EVENTOS ============

  /**
   * Adiciona listeners a um campo
   */
  const addFieldListeners = (field: HTMLElement): void => {
    if (!isValidFormField(field)) {
      return;
    };

    if (!field.name || fieldListeners.current.has(field)) {
      return;
    };

    const listeners = {
      blur: handleFieldInteraction,
      change: handleFieldInteraction
    };

    field.addEventListener('blur', listeners.blur);
    field.addEventListener('change', listeners.change);
    fieldListeners.current.set(field, listeners);
  };

  const isValidFormField = (element: HTMLElement): element is FormField => {
   const allowedTypes = [HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement];
   return allowedTypes.some(type => element instanceof type);
  };

  /**
   * Remove listeners de um campo
   */
  const removeFieldListeners = (field: HTMLElement): void => {
    if (!isValidFormField(field)) {
      return;
    }

    const listeners = fieldListeners.current.get(field);
    if (listeners) {
      field.removeEventListener('blur', listeners.blur);
      field.removeEventListener('change', listeners.change);
      fieldListeners.current.delete(field);
    }
  };

  /**
   * Configura observação de mudanças no DOM
   */
  const setupDOMMutationObserver = (form: HTMLFormElement): () => void => {
    // Adiciona listeners aos campos iniciais
    const initialFields = getFormFields(form);
    initialFields.forEach(addFieldListeners);

    // Configura observer para campos dinâmicos
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type !== 'childList') return;

        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            addFieldListeners(node);
            getFormFields(form).forEach(addFieldListeners);
          }
        });

        mutation.removedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            removeFieldListeners(node);
            getFormFields(form).forEach(removeFieldListeners);
          }
        });
      });
    });

    observer.observe(form, { childList: true, subtree: true });

    // Função de limpeza
    return () => {
      observer.disconnect();
      fieldListeners.current.forEach((listeners, field) => {
        if (field?.removeEventListener) {
          field.removeEventListener('blur', listeners.blur);
          field.removeEventListener('change', listeners.change);
        }
      });
      fieldListeners.current.clear();
    };
  };

  // ============ SUBMIT DO FORMULÁRIO ============

  const handleSubmit = React.useCallback((onValid: (data: FV) => void) => 
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = formRef.current;
      if (!form) {
        return;
      };

      // Marca todos os campos como "tocados"
      const allFields = getFormFields(form);
      allFields.forEach(field => field.classList.add('is-touched'));

      // Executa validações
      revalidateAllCustomRules();

      // Processa resultado após validação
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
    },
    [getValue, revalidateAllCustomRules]
  );

  /**
   * Foca no primeiro campo inválido
   */
  const focusFirstInvalidField = (form: HTMLFormElement): void => {
    const activeSection = form.querySelector('fieldset:not(:disabled)') || form;
    const firstInvalid = activeSection.querySelector<HTMLElement>(':invalid');
    
    if (!firstInvalid) {
      return;
    };

    // Tenta focar em input dentro de container específico
    const textInput = firstInvalid.closest('.relative')?.querySelector<HTMLElement>('input[type="text"].form-input');
    textInput?.focus() || firstInvalid.focus();
  };

  // ============ EFFECT PRINCIPAL ============

  React.useLayoutEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (!form) {
      console.warn(`[useForm] Formulário com ID '${formId}' não encontrado`);
      return;
    }

    formRef.current = form;
    const cleanup = setupDOMMutationObserver(form);

    return cleanup;
  }, [formId]);

  // ============ RETORNO DO HOOK ============

  return {
    handleSubmit,    // Função para lidar com submit
    setValidators,   // Define validadores customizados
    formId,          // ID para usar no form HTML
    resetSection,    // Reseta seção específica
    getValue         // Lê valores atuais do DOM
  };
};

export default useForm;