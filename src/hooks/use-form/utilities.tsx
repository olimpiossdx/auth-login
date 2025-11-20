// ============ FUNÇÕES UTILITÁRIAS ============
import type { FormField } from "./props";

/**
 * Define um valor em um objeto/array usando caminho (path)
 * Ex: 'user.address.street' → obj.user.address.street = value
 */
export const setNestedValue = (obj: any, path: string, value: any): void => {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const isLastKey = i === keys.length - 1;
    
    if (isLastKey) {
      current[key] = value;
      return;
    }
    
    // Prepara próxima chave
    const nextKey = keys[i + 1];
    const nextIsNumber = /^\d+$/.test(nextKey);
    
    if (nextIsNumber) {
      if (!current[key] || !Array.isArray(current[key])) {
        current[key] = [];
      }
    } else {
      if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) {
        current[key] = {};
      }
    }
    
    current = current[key];
  }
};

/**
 * Obtém valor de objeto aninhado usando caminho
 */
export const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    if (current === undefined || current === null) {
      return undefined;
    };

    const numKey = parseInt(key, 10);
    return isNaN(numKey) ? current[key] : Array.isArray(current) ? current[numKey] : undefined;
  }, obj);
};

/**
 * Seleciona campos do formulário baseado no prefixo
 */
export const getFormFields = (form: HTMLFormElement, namePrefix?: string): NodeListOf<FormField> => {
  const selector = namePrefix
    ? `input[name^="${namePrefix}"], select[name^="${namePrefix}"], textarea[name^="${namePrefix}"]`
    : "input[name], select[name], textarea[name]";
  
  return form.querySelectorAll(selector);
};

/**
 * Extrai caminho relativo do nome do campo baseado no prefixo
 */
export const getRelativePath = (fieldName: string, namePrefix?: string): string | null => {
  if (!namePrefix) return fieldName;
  
  if (fieldName.startsWith(namePrefix)) {
    const relativePath = fieldName.substring(namePrefix.length);
    return relativePath.startsWith('.') ? relativePath.substring(1) : relativePath;
  }
  
  return null;
};

/**
 * Converte valor do campo DOM para tipo JavaScript apropriado
 */
export const parseFieldValue = (field: FormField): any => {
  if (field.type === 'number') {
    return field.value === '' ? '' : parseFloat(field.value);
  };
  
  if (field.type === 'checkbox' && field instanceof HTMLInputElement) {
    return field.checked;
  };
  
  return field.value;
};
