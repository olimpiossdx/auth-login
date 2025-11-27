import type { IAnyObject, FormField } from "../hooks/use-form/props";

const splitPath = (path: string) => path.replace(/\]/g, '').split(/[.\[]/);

/**
 * Define um valor em um objeto aninhado usando string path.
 * Suporta notação de array (ex: 'users[0].name') e cria arrays/objetos automaticamente.
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

export const getNestedValue = (obj: IAnyObject, path: string): any => {
  if (!path || !obj) return undefined;
  const keys = splitPath(path);
  return keys.reduce((current, key) => {
    return (current && current[key] !== undefined) ? current[key] : undefined;
  }, obj);
};

/**
 * Busca campos válidos de formulário dentro de um container.
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
 * - Checkbox: boolean
 * - Number: number (ou string vazia)
 * - Radio: valor apenas se checked
 */
export const parseFieldValue = (field: FormField): any => {
  if (field instanceof HTMLInputElement) {
    if (field.type === 'number') return field.value === '' ? '' : parseFloat(field.value);
    if (field.type === 'checkbox') return field.checked;
    if (field.type === 'radio') return field.checked ? field.value : undefined;
  }
  return field.value;
};

// ============ LÓGICA DE CHECKBOX GROUP (CORE) ============

/**
 * Helper interno: Recalcula o estado visual (Checked/Indeterminate) de um Mestre.
 * O estado 'indeterminate' (traço) é puramente visual e não existe no HTML estático.
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
    master.indeterminate = true; // Estado visual "tracinho" (Tri-state)
  }
};

/**
 * Inicializa o estado visual de todos os Mestres dentro de um container.
 * Deve ser chamado ao montar o form ou após resetar dados (Edição),
 * para garantir que o "Selecionar Todos" reflita os dados carregados.
 */
export const initializeCheckboxMasters = (root: HTMLElement) => {
  const masters = root.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-checkbox-master]');
  
  masters.forEach(master => {
    const context = master.form || root;
    updateMasterState(master, context as HTMLElement);
  });
};

/**
 * Sincroniza a lógica de Grupo Mestre/Detalhe.
 * Lida com duas direções de interação:
 * 1. Clique no Mestre -> Marca/Desmarca filhos permitidos.
 * 2. Clique no Filho -> Recalcula estado do Mestre.
 */
export const syncCheckboxGroup = (target: HTMLInputElement, form: HTMLElement) => {
  // CASO A: Mestre Clicado (Controle Downstream)
  if (target.dataset.checkboxMaster) {
    const groupName = target.dataset.checkboxMaster;
    const children = form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${groupName}"]`);
    const isChecked = target.checked;
    
    children.forEach(child => {
      // REGRA DE OURO: O Mestre jamais deve alterar inputs desabilitados (bloqueados por regra de negócio)
      if (child.disabled) return;

      if (child.checked !== isChecked) {
        child.checked = isChecked;
        // DISPARO MANUAL DE EVENTO:
        // Necessário pois alterar .checked via JS não dispara eventos nativos.
        // O useForm precisa ouvir 'change' para marcar o campo como touched e revalidar.
        child.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    // Força o estado visual final do mestre (remove indeterminate residual se houver)
    target.indeterminate = false;
    target.checked = isChecked;
    return;
  }

  // CASO B: Filho Clicado (Controle Upstream)
  // Se o filho mudou, precisamos avisar o Mestre para verificar se virou Indeterminado/Checked
  if (target.name) {
    const master = form.querySelector<HTMLInputElement>(`input[type="checkbox"][data-checkbox-master="${target.name}"]`);
    if (master) {
      updateMasterState(master, form);
    }
  }
};