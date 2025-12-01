import type { IAnyObject, FormField } from "../hooks/use-form/props";

/**
 * Helper interno para dividir caminhos de string em chaves.
 * Transforma "user.address[0].city" em ["user", "address", "0", "city"].
 */
const splitPath = (path: string) => path.replace(/\]/g, '').split(/[.\[]/);

/**
 * Define um valor em um objeto ou array aninhado usando um caminho de string.
 * Cria automaticamente a estrutura intermediária (objetos ou arrays) se ela não existir.
 * * @param obj - O objeto alvo (será mutado).
 * @param path - O caminho (ex: "users[0].name").
 * @param value - O valor a ser definido.
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
    
    // Prepara o próximo nível
    const nextKey = keys[i + 1];
    const nextIsNumber = !isNaN(Number(nextKey));
    
    // Se não existir, cria Array (se chave for número) ou Objeto
    if (!current[key]) {
      current[key] = nextIsNumber ? [] : {};
    }
    current = current[key];
  }
};

/**
 * Recupera um valor de um objeto aninhado de forma segura.
 * Retorna undefined se qualquer parte do caminho não existir.
 * * @param obj - O objeto fonte.
 * @param path - O caminho para buscar (ex: "config.theme.color").
 */
export const getNestedValue = (obj: IAnyObject, path: string): any => {
  if (!path || !obj) return undefined;
  const keys = splitPath(path);
  return keys.reduce((current, key) => {
    return (current && current[key] !== undefined) ? current[key] : undefined;
  }, obj);
};

/**
 * Busca e filtra campos de formulário válidos dentro de um elemento container.
 * Ignora botões e inputs irrelevantes para dados (submit, reset, image).
 * * @param root - O elemento HTML onde buscar (form, fieldset, div, etc).
 * @param namePrefix - (Opcional) Filtra campos cujo 'name' começa com este prefixo.
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
 * Calcula o caminho relativo de um campo removendo o prefixo do nome.
 * Útil para mapear campos aninhados (ex: 'address.city') para o objeto de dados local ({ city: ... }).
 */
export const getRelativePath = (fieldName: string, namePrefix?: string): string | null => {
  if (!namePrefix) return fieldName;
  if (fieldName === namePrefix) return null; // É o próprio campo raiz
  if (fieldName.startsWith(namePrefix)) {
    let relative = fieldName.slice(namePrefix.length);
    // Remove delimitadores iniciais (. ou [)
    if (relative.startsWith('.')) relative = relative.slice(1);
    return relative;
  }
  return null;
};

/**
 * Normaliza o valor bruto do DOM para tipos JavaScript primitivos.
 * - Checkbox -> boolean
 * - Radio -> valor (apenas se checked)
 * - Number -> number (ou string vazia se inválido)
 */
export const parseFieldValue = (field: FormField): any => {
  if (field instanceof HTMLInputElement) {
    if (field.type === 'number') return field.value === '' ? '' : parseFloat(field.value);
    if (field.type === 'checkbox') return field.checked;
    if (field.type === 'radio') return field.checked ? field.value : undefined;
  }
  
  // Para Selects e outros inputs, retorna o valor string padrão
  return field.value;
};

// ============ REATIVIDADE FORÇADA (REACT BYPASS) ============

/**
 * Define o valor de um input (Texto/Select) furando o bloqueio de eventos sintéticos do React.
 * * O React sobrescreve a propriedade `.value` do DOM. Se definirmos `input.value = 'x'`,
 * o React não dispara o evento `onChange`. Esta função acessa o protótipo nativo 
 * para injetar o valor e disparar o evento manualmente.
 */
export const setNativeValue = (element: HTMLElement, value: any) => {
  // Guarda de Proteção: Não força edição em campos bloqueados
  if ((element as any).disabled || (element as any).readOnly) return;

  let finalValue = value;

  // LÓGICA HÍBRIDA: Se recebeu objeto (ex: Autocomplete), separa em Value e Label
  // Isso permite que o resetSection preencha o texto visual (label) sem sujar o value (ID).
  if (typeof value === 'object' && value !== null && 'value' in value && 'label' in value) {
      finalValue = value.value;
      element.dataset.label = value.label; // Guarda o contexto no DOM para componentes ricos
  } else {
      if (value !== undefined) {
         delete element.dataset.label;
      }
  }
  
  // Garante string
  finalValue = String(finalValue ?? '');

  let descriptor: PropertyDescriptor | undefined;

  // Busca o descritor no protótipo CORRETO para evitar "Illegal Invocation"
  if (element instanceof HTMLInputElement) {
      descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  } else if (element instanceof HTMLSelectElement) {
      descriptor = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value');
  } else if (element instanceof HTMLTextAreaElement) {
      descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
  }

  // Chama o setter original do navegador
  if (descriptor && descriptor.set) {
      descriptor.set.call(element, finalValue);
  } else {
      (element as any).value = finalValue;
  }

  // Dispara eventos para acordar o React (Synthetic Events) e validadores
  element.dispatchEvent(new Event('input', { bubbles: true }));
  if (element instanceof HTMLSelectElement) {
      element.dispatchEvent(new Event('change', { bubbles: true }));
  }
};

/**
 * Define o estado 'checked' de um Checkbox/Radio de forma absoluta e segura.
 * Diferente de .click(), esta função não inverte o estado (toggle), ela define exatamente o que foi pedido.
 */
export const setNativeChecked = (element: HTMLInputElement, checked: boolean) => {
  if (element.disabled || element.readOnly) return;

  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "checked");
  if (descriptor && descriptor.set) {
      descriptor.set.call(element, checked);
  } else {
      element.checked = checked;
  }

  // Dispara 'change' para notificar a aplicação da mudança de estado
  element.dispatchEvent(new Event('change', { bubbles: true }));
};

// ============ LÓGICA DE CHECKBOX GROUP (MESTRE/DETALHE) ============

/**
 * Helper Interno: Recalcula o estado visual do Checkbox Mestre ("Selecionar Todos").
 * Define se ele deve estar Checked (Tudo), Unchecked (Nada) ou Indeterminate (Parcial).
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
    // Indeterminado: Quando nem todos estão marcados (ex: seleção parcial)
    master.checked = false;
    master.indeterminate = true; // Visualmente vira um traço (-)
  }
};

/**
 * Inicializa todos os Mestres dentro de um container.
 * Deve ser chamado no `mount` ou após carregar dados (Load Data) para corrigir o visual.
 */
export const initializeCheckboxMasters = (root: HTMLElement) => {
  const masters = root.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-checkbox-master]');
  masters.forEach(master => {
    // Prioriza o form nativo, senão usa o root como contexto
    const context = master.form || root;
    updateMasterState(master, context as HTMLElement);
  });
};

/**
 * Gerencia a interação em grupos de Checkbox.
 * Chamado automaticamente pelo useForm no evento 'change'.
 */
export const syncCheckboxGroup = (target: HTMLInputElement, form: HTMLElement) => {
  // CASO A: Mestre Clicado (Controle Downstream)
  if (target.dataset.checkboxMaster) {
    const groupName = target.dataset.checkboxMaster;
    const children = Array.from(form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${groupName}"]`));
    
    // Filtra apenas os habilitados para decisão lógica
    const enabledChildren = children.filter(child => !child.disabled && !child.readOnly);
    
    // Lógica Inteligente: Se existir UM desmarcado, a intenção é MARCAR TODOS.
    // Se TODOS os habilitados já estão marcados, a intenção é DESMARCAR TODOS.
    const shouldCheckAll = enabledChildren.some(child => !child.checked);
    
    enabledChildren.forEach(child => {
      // Aplica estado apenas se necessário
      if (child.checked !== shouldCheckAll) {
        setNativeChecked(child, shouldCheckAll);
      }
    });
    
    // Recalcula o mestre no final para refletir a realidade (ex: itens disabled que sobraram)
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