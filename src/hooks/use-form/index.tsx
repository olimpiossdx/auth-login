import React from "react";
import type { FieldListenerMap, ValidatorMap } from "./props";

const recursiveSet = (currentLevel: any, keyList: string[], value: any) => {
  const key = keyList[0];
  if (key === undefined) return;
  const remainingKeys = keyList.slice(1);
  const isNumericKey = /^\d+$/.test(key);
  const currentKey: string | number = isNumericKey ? Number(key) : key;
  if (remainingKeys.length === 0) {
    currentLevel[currentKey] = value;
    return;
  }
  const nextKey = remainingKeys[0];
  const nextKeyIsNumeric = /^\d+$/.test(nextKey);
  if (nextKeyIsNumeric) {
    if (!currentLevel[currentKey] || !Array.isArray(currentLevel[currentKey])) {
      currentLevel[currentKey] = [];
    }
  } else {
    if (
      !currentLevel[currentKey] ||
      typeof currentLevel[currentKey] !== "object" ||
      Array.isArray(currentLevel[currentKey])
    ) {
      currentLevel[currentKey] = {};
    }
  }
  recursiveSet(currentLevel[currentKey], remainingKeys, value);
};

// --- Função Principal de Parseamento (Inalterada) ---
const setValueByPath = (obj: any, path: string, value: any) => {
  try {
    const keys = path.split(".");
    recursiveSet(obj, keys, value);
  } catch (e) {
    console.error(
      `[useForm] Falha ao definir valor para o caminho "${path}":`,
      e
    );
  }
};

// Função auxiliar para obter valor aninhado
const getNestedValue = (obj: any, path: string | (string | number)[]): any => {
  const keys = Array.isArray(path) ? path : path.split(".");
  return keys.reduce((o, k) => {
    if (o === undefined || o === null) return undefined;
    const index = parseInt(k as string, 10);
    return isNaN(index) ? o[k] : Array.isArray(o) ? o[index] : undefined;
  }, obj);
};

// --- O HOOK `useForm` (v4.11 - Lógica de Submit Parcial) ---
const useForm = <FV extends Record<string, any>>(providedId?: string) => {
  const generatedId = React.useId();
  const formId = providedId || generatedId;
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const fieldListenerRefs = React.useRef<FieldListenerMap>(new Map());
  const validatorsRef = React.useRef<ValidatorMap<FV>>({});

  const setValidators = React.useCallback((validators: ValidatorMap<FV>) => {
    validatorsRef.current = validators;
  }, []);

  const getValue = React.useCallback(
    (namePrefix?: string): Partial<FV> | FV | any => {
      const form = formRef.current;

      if (!form) {
        return namePrefix ? {} : ({} as FV);
      }

      const formData = {};

      const selector = namePrefix
        ? `input[name^="${namePrefix}"], select[name^="${namePrefix}"], textarea[name^="${namePrefix}"]`
        : "input[name], select[name], textarea[name]";

      const fields = form.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >(selector);

      fields.forEach((element) => {
        const name = element.name;
        if (!name) {
          return;
        }

        let relativePath = name;

        if (namePrefix) {
          if (name.startsWith(namePrefix)) {
            relativePath = name.substring(namePrefix.length);
            if (relativePath.startsWith(".")) {
              relativePath = relativePath.substring(1);
            }
          } else {
            return;
          }
        }
        const finalPath = relativePath || name;
        if (!finalPath && namePrefix && name === namePrefix) {
        } else if (!finalPath) {
          return;
        }

        let value: any;
        if (element.type === "number") {
          value = element.value === "" ? "" : parseFloat(element.value);
          if (isNaN(value)) value = element.value;
        } else if (element.type === "checkbox") {
          value = (element as HTMLInputElement).checked;
        } else {
          value = element.value;
        }
        if (finalPath) {
          setValueByPath(formData, finalPath, value);
        }
      });
      if (namePrefix && Object.keys(formData).length === 0) {
        const singleField = form.querySelector<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >(`[name="${namePrefix}"]`);

        if (singleField) {
          if (singleField.type === "number")
            return singleField.value === ""
              ? ""
              : parseFloat(singleField.value);
          if (singleField.type === "checkbox")
            return (singleField as HTMLInputElement).checked;
          return singleField.value;
        }
      }
      return formData;
    },
    []
  );

  const revalidateAllCustomRules = React.useCallback(() => {
    const form = formRef.current;

    if (!form) {
      return;
    }

    const formValues = getValue() as FV;
    const validatorFns = validatorsRef.current;

    for (const validationKey in validatorFns) {
      const customValidate = validatorFns[validationKey];

      if (!customValidate) {
        continue;
      }

      // Só valida habilitados
      const fieldsToValidate = form.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >(`[name][data-validation="${validationKey}"]:not(:disabled)`);

      fieldsToValidate.forEach((field) => {
        const name = field.name;
        field.setCustomValidity("");
        const fieldValue = getNestedValue(formValues, name);

        const result = customValidate(fieldValue, field, formValues);

        if (typeof result === "string") {
          field.setCustomValidity(result);
        } else if (typeof result === "object" && result?.type === "error")
          field.setCustomValidity(result.message);
      });
    }

    
    const allFieldsNoCustomValidation = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input[name]:not([data-validation]), select[name]:not([data-validation]), textarea[name]:not([data-validation])');
    
    allFieldsNoCustomValidation.forEach((field) => {
      if (field.validity.valid) {
        field.setCustomValidity("");
      };
    });
  }, [getValue]);

  const handleInteraction = React.useCallback((event: Event) => {
      (event.currentTarget as HTMLElement).classList.add("is-touched");
      revalidateAllCustomRules();
    }, [revalidateAllCustomRules]);

  const resetSection = React.useCallback((namePrefix: string, originalValues: any) => {
      const form = formRef.current;

      if (!form || !originalValues) {
        console.warn('[resetSection] Formulário não encontrado ou valores originais nulos.');
        return;
      }
      
      const predicate =`input[name^="${namePrefix}"], select[name^="${namePrefix}"], textarea[name^="${namePrefix}"]`
      const fieldsToReset = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(predicate);
      
      fieldsToReset.forEach((field) => {
        const name = field.name;
        let relativePath = name.substring(namePrefix.length);

        if (relativePath.startsWith(".")) {
          relativePath = relativePath.substring(1);
        };

        const originalValue = relativePath
          ? getNestedValue(originalValues, relativePath)
          : originalValues[name] ?? getNestedValue(originalValues, name);

        if (originalValue !== undefined) {
          if (field.type === "checkbox") {
            (field as HTMLInputElement).checked = Boolean(originalValue);
          } else if (field.type === "radio") {
            (field as HTMLInputElement).checked =
              field.value === String(originalValue);
          } else {
            field.value = String(originalValue ?? "");
          }

          field.dispatchEvent(new Event("change", { bubbles: true }));
          field.classList.remove("is-touched");
        } else {
          if (field.type === "checkbox"){
            (field as HTMLInputElement).checked = (field as HTMLInputElement).defaultChecked;
          }else if (field.type === "radio"){ 
            (field as HTMLInputElement).checked = (field as HTMLInputElement).defaultChecked;
          }else{ 
            field.value = (field as any).defaultValue;
          }

          field.dispatchEvent(new Event("change", { bubbles: true }));
          field.classList.remove("is-touched");
        }
      });
    },[]);

  React.useLayoutEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) {
      console.warn(`[useForm] Formulário com id '${formId}' não encontrado.`);
      return;
    }

    formRef.current = form;
    const listenersMap = fieldListenerRefs.current;
    const addListeners = (field: HTMLElement) => {
      if (!(field instanceof HTMLInputElement ||
            field instanceof HTMLSelectElement ||
            field instanceof HTMLTextAreaElement) ||
        !field.name ||
        listenersMap.has(field)){
          return;
        };

      const blurListener = handleInteraction;
      const changeListener = handleInteraction;

      field.addEventListener("blur", blurListener);
      field.addEventListener("change", changeListener);
      listenersMap.set(field, { blur: blurListener, change: changeListener });
    };

    const removeListeners = (field: HTMLElement) => {
      if (!( field instanceof HTMLInputElement ||
             field instanceof HTMLSelectElement ||
            field instanceof HTMLTextAreaElement)){
        return;
      };

      const listeners = listenersMap.get(field);
      if (listeners) {
        field.removeEventListener("blur", listeners.blur);
        field.removeEventListener("change", listeners.change);
        listenersMap.delete(field);
      };
    };
  
    const preciate ="input[name], select[name], textarea[name]";
    const initialFields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(preciate);

    initialFields.forEach(addListeners);

    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if(!(mutation.type === "childList")){
          return;
        };
        
        const predicate = 'input[name], select[name], textarea[name]';
        
        mutation.addedNodes.forEach((node) => {
          if(!(node instanceof HTMLElement)){
            return;
          };

          addListeners(node);              
          node.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(predicate).forEach(addListeners);
        });

        mutation.removedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) {
            return;
          };
          
          removeListeners(node);
          node.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(predicate).forEach(removeListeners);
        });

      });
    });

    observer.observe(form, { childList: true, subtree: true });


    return () => {
      observer.disconnect();
      listenersMap.forEach((listeners, field) => {
        if (field?.removeEventListener) {
          field.removeEventListener("blur", listeners.blur);
          field.removeEventListener("change", listeners.change);
        }
      });
      listenersMap.clear();
      formRef.current = null;
    };
  }, [formId, handleInteraction]);

  // --- handleSubmit (v4.11 - Lógica de Submit Parcial) ---
  const handleSubmit = React.useCallback((onValid: (data: FV) => void) => (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = formRef.current;

      if (!form) {
        return;
      };

      // Marca todos os campos (mesmo os desabilitados) como 'touched'
      const predicate = "input[name], select[name], textarea[name]";
      const currentFields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(predicate);
      currentFields.forEach((field) => field.classList.add("is-touched"));

      // Roda validações customizadas
      revalidateAllCustomRules();

      setTimeout(() => {
        if (!formRef.current) {
          return;
        };

        const isFormValid = formRef.current.checkValidity(); // Valida apenas campos habilitados
        
        if (!isFormValid) {
          const activeFieldset = formRef.current.querySelector<HTMLElement>("fieldset:not(:disabled)") || formRef.current;
          
          const firstInvalidField = activeFieldset.querySelector<HTMLElement>(":invalid");
          const field = firstInvalidField?.closest(".relative")?.querySelector('input[type="text"].form-input');

          if (!!field) {
            (firstInvalidField.closest(".relative")!.querySelector('input[type="text"].form-input') as HTMLElement)?.focus();
          } else {
            firstInvalidField?.focus();
          }
          formRef.current.reportValidity();
        } else {
          const values = getValue() as FV;
          onValid(values);
        }
      }, 0);
    },
    [getValue, revalidateAllCustomRules]
  );

  return { handleSubmit, setValidators, formId, resetSection, getValue };
};

export default useForm;
