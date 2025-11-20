// --- DEFINIÇÕES DE TIPO ---

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
   * Assinatura da função de validação (com genéricos), onde T por padrão é 'any'
   */
export type ValidateFn<FormValues> = <T = any>(
  value: T, // Mantido 'any' devido a limitações do TS em mapas
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
 
/**
   * Configura Mapa de tipos de elementos do formulário
   */
export type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
