// props.ts

export interface IAnyObject {
  [key: string]: any;
}

/**
 * Interface para o resultado da validação
 */
export interface IValidationResult {
  message: string;
  type: "error" | "warning" | "info" | "success";
}

/**
 * O tipo de retorno da função de validação
 */
export type ValidationResult = string | IValidationResult | undefined;

/**
 * Configura Mapa de tipos de elementos do formulário aceitos
 */
export type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * Assinatura da função de validação (com genéricos)
 */
export type ValidateFn<FormValues> = <T = any>(
  value: T,
  field: FormField | null,
  formValues: FormValues
) => ValidationResult;

/**
 * Configura Mapa de validadores com parametro FV (form value)
 */
export type ValidatorMap<FV> = Record<string, ValidateFn<FV>>;

/**
 * Tipo para armazenar referências aos listeners anexados
 */
export type ListenerRef = { blur: EventListener; change: EventListener };

/**
 * Mapa de ListenerRefs associados a elementos do formulário
 */
export type FieldListenerMap = Map<HTMLElement, ListenerRef>;