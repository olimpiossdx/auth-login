// utilities.ts

import type { IAnyObject, FormField } from './props';

/**
 * Helper para quebrar caminhos como "user.address" ou "users[0].name" em chaves
 */
const splitPath = (path: string) => path.replace(/\]/g, '').split(/[.\[]/);

/**
 * Define um valor em um objeto/array usando caminho (path)
 * Suporta: 'user.address.street' ou 'users[0].name'
 */
export const setNestedValue = (obj: IAnyObject, path: string, value: any): void => {
  // Ignora undefined (comum em radios não checados)
  if (value === undefined) return;

  const keys = splitPath(path);
  let current = obj;
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const isLastKey = i === keys.length - 1;
    
    if (isLastKey) {
      current[key] = value;
      return;
    }
    
    // Prepara próxima chave (cria objeto ou array se não existir)
    const nextKey = keys[i + 1];
    // Se a próxima chave for numérica, criamos um array, senão um objeto
    const nextIsNumber = !isNaN(Number(nextKey));
    
    if (!current[key]) {
      current[key] = nextIsNumber ? [] : {};
    }
    
    current = current[key];
  }
};

/**
 * Obtém valor de objeto aninhado usando caminho
 */
export const getNestedValue = (obj: IAnyObject, path: string): any => {
  if (!path || !obj) return undefined;
  
  const keys = splitPath(path);
  
  return keys.reduce((current, key) => {
    return (current && current[key] !== undefined) ? current[key] : undefined;
  }, obj);
};

/**
 * Seleciona campos do formulário baseado no prefixo
 * AJUSTE: Aceita HTMLElement genérico para funcionar com o MutationObserver
 */
export const getFormFields = (root: HTMLElement, namePrefix?: string): FormField[] => {
  const selector = namePrefix
    ? `input[name^="${namePrefix}"], select[name^="${namePrefix}"], textarea[name^="${namePrefix}"]`
    : "input[name], select[name], textarea[name]";
  
  const nodeList = root.querySelectorAll(selector);
  
  // Filtra botões que podem ter sido selecionados pelo seletor genérico input[name]
  // e garante tipagem correta
  return Array.from(nodeList).filter((el): el is FormField => {
    return (
      (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) &&
      el.type !== 'submit' && 
      el.type !== 'button' && 
      el.type !== 'reset' &&
      el.type !== 'image'
    );
  });
};

/**
 * Extrai caminho relativo do nome do campo baseado no prefixo
 */
export const getRelativePath = (fieldName: string, namePrefix?: string): string | null => {
  if (!namePrefix) return fieldName;
  if (fieldName === namePrefix) return null; // É o próprio campo raiz (objeto simples)
  
  if (fieldName.startsWith(namePrefix)) {
    // Remove o prefixo
    let relative = fieldName.slice(namePrefix.length);
    
    // Remove ponto inicial se houver (ex: prefixo "user", campo "user.name" -> ".name")
    if (relative.startsWith('.')) relative = relative.slice(1);
    // Remove colchete inicial se houver (ex: prefixo "users", campo "users[0]" -> "[0]")
    // Nota: Geralmente mantemos o colchete se for array, mas aqui ajustamos conforme necessidade.
    
    return relative;
  }
  
  return null;
};

/**
 * Converte valor do campo DOM para tipo JavaScript apropriado
 */
export const parseFieldValue = (field: FormField): any => {
  if (field instanceof HTMLInputElement) {
    if (field.type === 'number') {
      return field.value === '' ? '' : parseFloat(field.value);
    }
    
    if (field.type === 'checkbox') {
      return field.checked;
    }

    if (field.type === 'radio') {
      // AJUSTE: Radios só retornam valor se estiverem marcados
      return field.checked ? field.value : undefined;
    }
  }
  
  return field.value;
};