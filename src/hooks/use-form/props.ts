// --- DEFINIÇÕES DE TIPO ---

export type HTMLFieldElements =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

// Interface para o resultado da validação
export interface IValidationResult {
  message: string;
  type: "error" | "warning" | "info" | "success";
}

// O tipo de retorno da função de validação
export type ValidationResult = string | IValidationResult | true | undefined;

// Assinatura da função de validação (com genéricos)
export type ValidateFn<FormValues> = (
  value: any, // Mantido 'any' devido a limitações do TS em mapas
  field: HTMLFieldElements | null,
  formValues: FormValues
) => ValidationResult;

// Mapa de validadores (tipado)
export type ValidatorMap<FV> = Record<string, ValidateFn<FV>>;

// Tipo para armazenar referências aos listeners anexados
export type ListenerRef = { blur: EventListener; change: EventListener };
export type FieldListenerMap = Map<HTMLElement, ListenerRef>;
