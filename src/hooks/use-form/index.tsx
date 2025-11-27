import React from "react";
import { syncCheckboxGroup, initializeCheckboxMasters } from "../../utils/utilities";
import type { FieldListenerMap, ValidatorMap, FormField } from "./props";
import { getFormFields, parseFieldValue, getRelativePath, setNestedValue, getNestedValue } from "./utilities";

/**
 * Hook principal para gerenciamento de formulários híbridos (Uncontrolled + React).
 * * Filosofia:
 * 1. O DOM é a fonte da verdade para valores (Performance).
 * 2. O React orquestra validação complexa e submissão.
 * 3. Arrays e Grupos são inferidos automaticamente pela estrutura do HTML.
 */
const useForm = <FV extends Record<string, any>>(providedId?: string) => {
  // --- ESTADO & REFS ---
  const formId = providedId || React.useId();
  const formRef = React.useRef<HTMLFormElement>(null);
  const fieldListeners = React.useRef<FieldListenerMap>(new Map());
  const validators = React.useRef<ValidatorMap<FV>>({});

  // --- HELPER: Detecção de Grupos ---
  // Conta quantos campos compartilham o mesmo 'name' para decidir entre Valor Único ou Array.
  const countFieldsByName = (form: HTMLElement, name: string): number => {
    return form.querySelectorAll(`[name="${name}"]`).length;
  };

  const setValidators = React.useCallback((newValidators: ValidatorMap<FV>) => {
    validators.current = newValidators;
  }, []);

  // =========================================================================
  // 1. LEITURA DE DADOS (DOM -> JSON)
  // =========================================================================

  const getValue = React.useCallback((namePrefix?: string): Partial<FV> | FV | any => {
    const form = formRef.current;
    if (!form) return namePrefix ? undefined : ({} as FV);

    const fields = getFormFields(form, namePrefix);
    const formData = {};
    const processedNames = new Set<string>(); // Evita processar o mesmo grupo múltiplas vezes (Performance)

    // Otimização: Se pedirem um campo específico exato (ex: getValue('user.email'))
    if (namePrefix) {
      const exactMatch = fields.find(f => f.name === namePrefix);
      if (exactMatch) {
        // Lógica especial para Checkbox Único vs Grupo quando pedem valor direto
        if (exactMatch instanceof HTMLInputElement && exactMatch.type === 'checkbox') {
          if (countFieldsByName(form, exactMatch.name) === 1) {
            const hasValue = exactMatch.hasAttribute('value') && exactMatch.value !== 'on';
            // Retorna valor explícito ("pro") ou booleano (true)
            return exactMatch.checked ? (hasValue ? exactMatch.value : true) : false;
          }
        }
        return parseFieldValue(exactMatch);
      }
    }

    // Loop Principal de Extração e Construção do Objeto
    fields.forEach(field => {
      const relativePath = getRelativePath(field.name, namePrefix);

      // Ignora campos fora do escopo (prefixo) ou já processados (grupos)
      if (!relativePath || processedNames.has(field.name)) return;

      // --- LÓGICA INTELIGENTE DE CHECKBOX ---
      if (field instanceof HTMLInputElement && field.type === 'checkbox') {
        const count = countFieldsByName(form, field.name);

        if (count > 1) {
          // MODO GRUPO (Array): Coleta todos os inputs marcados com esse nome
          const allChecked = form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${field.name}"]:checked`);
          const values = Array.from(allChecked).map(cb => cb.value);

          setNestedValue(formData, relativePath, values);
          processedNames.add(field.name); // Marca nome como processado para pular irmãos
        } else {
          // MODO ÚNICO (Single): Retorna Valor ou Booleano
          if (field.checked) {
            const hasExplicitValue = field.hasAttribute('value') && field.value !== 'on';
            setNestedValue(formData, relativePath, hasExplicitValue ? field.value : true);
          } else {
            setNestedValue(formData, relativePath, false);
          }
        }
        return;
      }

      // Outros Inputs (Text, Radio, Select, etc.)
      const value = parseFieldValue(field);
      setNestedValue(formData, relativePath, value);
    });

    return formData;
  }, []);

  // =========================================================================
  // 2. VALIDAÇÃO (Regras Customizadas JS)
  // =========================================================================

  const revalidateAllCustomRules = React.useCallback(() => {
    const form = formRef.current;
    if (!form) return;

    const formValues = getValue() as FV;
    const validatorFunctions = validators.current;

    // 1. Aplica validadores customizados registrados
    Object.keys(validatorFunctions).forEach(validationKey => {
      const validate = validatorFunctions[validationKey];
      if (!validate) return;

      const fieldsToValidate = form.querySelectorAll<FormField>(`[name][data-validation="${validationKey}"]:not(:disabled)`);

      fieldsToValidate.forEach(field => {
        field.setCustomValidity(''); // Reseta estado nativo

        // Pega o valor atualizado (pode ser Array se for grupo)
        const fieldValue = getNestedValue(formValues, field.name);
        const result = validate(fieldValue, field, formValues);

        if (typeof result === 'string') {
          field.setCustomValidity(result);
        } else if (result?.type === 'error') {
          field.setCustomValidity(result.message);
        }
      });
    });

    // 2. Limpa validadores de campos que não têm regras (Fallback de segurança)
    const fieldsWithoutCustomValidation = form.querySelectorAll<FormField>(
      'input[name]:not([data-validation]), select[name]:not([data-validation]), textarea[name]:not([data-validation])'
    );
    fieldsWithoutCustomValidation.forEach(field => {
      if (field.validity.valid) field.setCustomValidity('');
    });
  }, [getValue]);

  // =========================================================================
  // 3. INTERAÇÃO & EVENTOS
  // =========================================================================

  const handleFieldInteraction = React.useCallback((event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;

    // A. Feedback Visual (CSS .is-touched)
    target.classList.add('is-touched');

    // B. Sincronia Automática de Checkbox Group (Mestre/Detalhe)
    // BLINDAGEM: Só executa no evento 'change' real. Ignora 'blur' para evitar resets acidentais.
    if (event.type === 'change' && target instanceof HTMLInputElement && target.type === 'checkbox') {
      if (formRef.current) {
        syncCheckboxGroup(target, formRef.current);
      }
    }

    // C. Revalidação em tempo real (para feedback imediato)
    revalidateAllCustomRules();
  }, [revalidateAllCustomRules]);

  // =========================================================================
  // 4. ESCRITA DE DADOS (Reset / Load Data)
  // =========================================================================

  const resetSection = React.useCallback((namePrefix: string, originalValues: any) => {
    const form = formRef.current;
    if (!form) return;

    const fields = getFormFields(form, namePrefix);

    fields.forEach(field => {
      const relativePath = getRelativePath(field.name, namePrefix);

      let valueToApply = undefined;

      // Estratégia de Lookup: Tenta achar o valor no objeto original
      if (originalValues) {
        valueToApply = relativePath ? getNestedValue(originalValues, relativePath) : undefined;
        // Fallback para estruturas planas
        if (valueToApply === undefined && !relativePath) {
          valueToApply = getNestedValue(originalValues, field.name);
        }
      }

      // APLICAÇÃO DE VALOR NO DOM
      if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) {
        // Reset Inteligente de Checkbox/Radio
        if (valueToApply !== undefined) {
          if (field.type === 'checkbox' && Array.isArray(valueToApply)) {
            // Grupo: Marca se valor existe no array
            field.checked = valueToApply.includes(field.value);
          } else if (field.type === 'checkbox' && typeof valueToApply === 'boolean') {
            // Flag: Marca booleano
            field.checked = valueToApply;
          } else {
            // Radio/Valor Específico: Marca se coincidir
            field.checked = field.value === String(valueToApply);
          }
        } else {
          // Limpeza: Volta ao padrão do HTML
          field.checked = field.defaultChecked;
        }
      } else {
        // Reset Padrão (Texto)
        field.value = String(valueToApply ?? (field as any).defaultValue ?? '');
      }

      // PROPAGAÇÃO DE EVENTOS
      // Disparamos 'change' para que listeners (como validação e Ilhas de Reatividade) saibam da mudança.
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));

      field.classList.remove('is-touched');
    });

    // Sincronia Visual Pós-Carga (Garante que os Mestres fiquem com traço/check corretos)
    initializeCheckboxMasters(form);
  }, []);

  // =========================================================================
  // 5. OBSERVERS & LISTENERS (Infraestrutura)
  // =========================================================================

  const addFieldInteractionListeners = (field: HTMLElement): void => {
    // Aceita inputs "Mestres" (sem name, mas com data-checkbox-master)
    const isMaster = field.hasAttribute('data-checkbox-master');
    const allowedTypes = [HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement];

    if (!allowedTypes.some(type => field instanceof type)) return;

    if (((field as any).name || isMaster) && !fieldListeners.current.has(field)) {
      const listeners = { blur: handleFieldInteraction, change: handleFieldInteraction };
      field.addEventListener('blur', listeners.blur);
      field.addEventListener('change', listeners.change);
      fieldListeners.current.set(field, listeners);
    }
  };

  const removeFieldInteractionListeners = (field: HTMLElement): void => {
    const listeners = fieldListeners.current.get(field);
    if (listeners) {
      field.removeEventListener('blur', listeners.blur);
      field.removeEventListener('change', listeners.change);
      fieldListeners.current.delete(field);
    }
  };

  const setupDOMMutationObserver = (form: HTMLFormElement): () => void => {
    // Inicialização Inicial
    const initialFields = getFormFields(form);
    initialFields.forEach(addFieldInteractionListeners);

    // Captura Mestres isolados
    form.querySelectorAll('input[type="checkbox"][data-checkbox-master]').forEach(cb => {
      if (cb instanceof HTMLElement) addFieldInteractionListeners(cb);
    });

    // Ajuste visual inicial
    initializeCheckboxMasters(form);

    // Monitoramento de DOM Dinâmico (Performance Otimizada)
    const observer = new MutationObserver((mutations) => {
      let needsReinitMasters = false;

      mutations.forEach((mutation) => {
        if (mutation.type !== 'childList') return;

        // Processa apenas nós adicionados/removidos (evita scan total)
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return;

          addFieldInteractionListeners(node);
          getFormFields(node as any).forEach(addFieldInteractionListeners);

          // Se novos checkboxes entraram, marca flag para recalcular mestres
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

      if (needsReinitMasters) {
        initializeCheckboxMasters(form);
      }
    });

    observer.observe(form, { childList: true, subtree: true });

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

  // =========================================================================
  // 6. SUBMIT
  // =========================================================================

  const handleSubmit = React.useCallback((onValid: (data: FV) => void) =>
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = formRef.current;
      if (!form) return;

      const allFields = getFormFields(form);
      allFields.forEach(field => field.classList.add('is-touched'));

      revalidateAllCustomRules();

      // Timeout(0) garante que o DOM processou as custom validities antes do check nativo
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

  // Foca no primeiro erro, com suporte a componentes custom (StarRating/Autocomplete)
  const focusFirstInvalidField = (form: HTMLFormElement): void => {
    const activeSection = form.querySelector('fieldset:not(:disabled)') || form;
    const firstInvalid = activeSection.querySelector<HTMLElement>(':invalid');
    if (!firstInvalid) return;

    // Tenta achar elemento visual "proxy" (ex: div tabindex=0) se o input for hidden
    const focusableSibling = firstInvalid.parentElement?.querySelector<HTMLElement>(
      'input:not([type="hidden"]), select, textarea, [tabindex="0"]'
    );

    if (focusableSibling) {
      focusableSibling.focus();
    } else {
      firstInvalid.focus();
    }
  };

  React.useLayoutEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (!form) return;
    formRef.current = form;
    const cleanup = setupDOMMutationObserver(form);
    return cleanup;
  }, [formId]);

  return {
    handleSubmit,
    setValidators,
    formId,
    resetSection,
    getValue
  };
};

export default useForm;