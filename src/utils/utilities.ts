import type { IAnyObject, FormField } from "../hooks/use-form/props";

const splitPath = (path: string) => path.replace(/\]/g, '').split(/[.\[]/);


/**
 * Define valor em objeto aninhado (Mutável)
 * Ex: obj={}, path="a.b", value=1 -> obj={a:{b:1}}
 */
export const setNestedValue = (obj: IAnyObject, path: string, value: any): void => {
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
    
    const nextKey = keys[i + 1];
    const nextIsNumber = !isNaN(Number(nextKey));
    if (!current[key]) {
      current[key] = nextIsNumber ? [] : {};
    }
    current = current[key];
  }
};

/**
 * Lê valor de objeto aninhado
 */
export const getNestedValue = (obj: IAnyObject, path: string): any => {
  if (!path || !obj) return undefined;
  const keys = splitPath(path);
  return keys.reduce((current, key) => {
    return (current && current[key] !== undefined) ? current[key] : undefined;
  }, obj);
};

/**
 * Busca campos válidos dentro de um container.
 * Filtra botões e inputs de controle que não guardam dados de negócio.
 */
export const getFormFields = (root: HTMLElement, namePrefix?: string): FormField[] => {
  const selector = namePrefix
    ? `input[name^="${namePrefix}"], select[name^="${namePrefix}"], textarea[name^="${namePrefix}"]`
    : "input[name], select[name], textarea[name]";
  
  const nodeList = root.querySelectorAll(selector);
  return Array.from(nodeList).filter((el): el is FormField => {
    return (
      (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) &&
      el.type !== 'submit' && el.type !== 'button' && el.type !== 'reset' && el.type !== 'image'
    );
  });
};

/**
 * Extrai caminho relativo do nome do campo.
 * Ex: name="user.address.city", prefix="user" -> "address.city"
 */
export const getRelativePath = (fieldName: string, namePrefix?: string): string | null => {
  if (!namePrefix) return fieldName;
  if (fieldName === namePrefix) return null;
  if (fieldName.startsWith(namePrefix)) {
    let relative = fieldName.slice(namePrefix.length);
    if (relative.startsWith('.')) relative = relative.slice(1);
    return relative;
  }
  return null;
};

/**
 * Normaliza o valor do campo DOM para tipos JS primitivos.
 */
export const parseFieldValue = (field: FormField): any => {
  if (field instanceof HTMLInputElement) {
    if (field.type === 'number') return field.value === '' ? '' : parseFloat(field.value);
    if (field.type === 'checkbox') return field.checked;
    if (field.type === 'radio') return field.checked ? field.value : undefined;
  }
  return field.value;
};

// ============ REATIVIDADE FORÇADA (REACT BYPASS) ============

/**
 * Altera o valor de um input furando o bloqueio do React (Synthetic Events).
 * * MOTIVAÇÃO: O React sobrescreve os setters de 'value' e 'checked'. Alterações via JS 
 * não disparam 'onChange' automaticamente. Esta função acessa o protótipo nativo 
 * para injetar o valor e disparar o evento manualmente.
 * * CORREÇÃO BUG: Usamos protótipos explícitos (HTMLInputElement.prototype) em vez de 
 * dinâmicos (Object.getPrototypeOf) para evitar "TypeError: Illegal invocation".
 */
export const setNativeValue = (element: HTMLElement, value: any) => {
  // 1. Guarda de Proteção: Não força edição em campos bloqueados
  if ((element as any).disabled || (element as any).readOnly) return;

  // 2. Busca o descritor no protótipo CORRETO para evitar Illegal Invocation
  let descriptor: PropertyDescriptor | undefined;

  if (element instanceof HTMLInputElement) {
      descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  } else if (element instanceof HTMLSelectElement) {
      descriptor = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value');
  } else if (element instanceof HTMLTextAreaElement) {
      descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
  }

  // 3. Aplica o valor usando o setter nativo (se existir) ou direto
  if (descriptor && descriptor.set) {
      descriptor.set.call(element, value);
  } else {
      (element as any).value = value;
  }

  // 4. Dispara eventos para acordar o React e Validadores
  element.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Selects geralmente precisam de 'change' para o React perceber a opção
  if (element instanceof HTMLSelectElement) {
      element.dispatchEvent(new Event('change', { bubbles: true }));
  }
};

/**
 * Especialização para Checkboxes: Usa clique nativo para máxima compatibilidade.
 */
export const setNativeChecked = (element: HTMLInputElement, checked: boolean) => {
  // Se já estiver no estado desejado ou for disabled, ignora
  if (element.checked === checked) return;
  if (element.disabled || element.readOnly) return;

  // O clique nativo inverte o estado e dispara todos os eventos corretos (change, input, click)
  // que o React escuta nativamente sem precisar de hacks de protótipo complexos.
  element.click();
};

// ============ LÓGICA DE CHECKBOX GROUP ============

/**
 * Helper interno: Recalcula o estado visual (Checked/Indeterminate) de um Mestre
 * baseado nos seus filhos. O estado 'indeterminate' é puramente visual.
 */
const updateMasterState = (master: HTMLInputElement, form: HTMLElement) => {
  const groupName = master.dataset.checkboxMaster;
  if (!groupName) return;

  const children = Array.from(form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${groupName}"]`));
  if (children.length === 0) return;

  const checkedCount = children.filter(c => c.checked).length;

  if (checkedCount === 0) {
    master.checked = false;
    master.indeterminate = false;
  } else if (checkedCount === children.length) {
    master.checked = true;
    master.indeterminate = false;
  } else {
    master.checked = false;
    master.indeterminate = true; // Visualmente vira um traço (-)
  }
};

/**
 * Inicializa o estado visual de todos os Mestres dentro de um container.
 * Deve ser chamado ao montar o form ou após resetar dados.
 */
export const initializeCheckboxMasters = (root: HTMLElement) => {
  const masters = root.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-checkbox-master]');
  masters.forEach(master => {
    const context = master.form || root;
    updateMasterState(master, context as HTMLElement);
  });
};

/**
 * Sincroniza interação (Clique Mestre -> Filhos OU Clique Filho -> Mestre).
 * Chamado automaticamente pelo useForm no evento 'change'.
 */
export const syncCheckboxGroup = (target: HTMLInputElement, form: HTMLElement) => {
  // CASO A: Mestre Clicado (Controle Downstream)
  if (target.dataset.checkboxMaster) {
    const groupName = target.dataset.checkboxMaster;
    const children = form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${groupName}"]`);
    
    // O target.checked já reflete o estado desejado pós-clique
    const desiredState = target.checked;
    
    children.forEach(child => {
      // Usa setNativeChecked para garantir disparo de eventos e respeito ao disabled
      setNativeChecked(child, desiredState);
    });
    
    // Recalcula o mestre no final (para lidar com casos onde filhos disabled impediram seleção total)
    updateMasterState(target, form);
    return;
  }

  // CASO B: Filho Clicado (Controle Upstream)
  if (target.name) {
    const master = form.querySelector<HTMLInputElement>(`input[type="checkbox"][data-checkbox-master="${target.name}"]`);
    if (master) {
      updateMasterState(master, form);
    }
  }
};