// --- DEFINIÇÕES DE TIPO GERAIS ---

export interface UseFormConfig<FV> {
  id?: string;
  onSubmit?: (data: FV) => void;
};

export interface IAnyObject {
  [key: string]: any;
}

export interface IValidationResult {
  message: string;
  type: "error" | "warning" | "info" | "success";
}

export type ValidationResult = string | IValidationResult | undefined;

export type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// --- TIPAGEM DE VALIDAÇÃO ---

export type ValidateFn<FormValues, ValueType = any> = (
  value: ValueType, 
  field: FormField | null,
  formValues: FormValues
) => ValidationResult;

export type ValidatorMap<FV> = Record<string, ValidateFn<FV, any>>;

// --- INFRAESTRUTURA INTERNA ---

export type ListenerRef = { blur: EventListener; change: EventListener };

export type FieldListenerMap = Map<HTMLElement, ListenerRef>;

// ============ TYPE SAFETY MAGIC (Inferência Profunda) ============

/**
 * Tipos que não devem ser percorridos recursivamente.
 * O sistema para de gerar caminhos quando encontra um destes.
 */
type Primitive = null | undefined | string | number | boolean | symbol | bigint;
type BrowserNativeObject = Date | FileList | File | Blob;

/**
 * Utilitário Recursivo: Gera todas as combinações de caminhos (Dot Notation) possíveis
 * baseadas na Interface T.
 *
 * Exemplo:
 * T = { user: { address: { city: string }, tags: string[] } }
 * Path<T> = "user" | "user.address" | "user.address.city" | "user.tags" | "user.tags.0"
 */
export type Path<T> = T extends Primitive | BrowserNativeObject ? never : {
  [K in keyof T]: K extends string | number
    ? T[K] extends Array<infer U>
      ? `${K}` | `${K}.${number}` | `${K}.${number}.${Path<U>}` // Suporte a Arrays (index numérico)
      : T[K] extends object
        ? `${K}` | `${K}.${Path<T[K]>}` // Suporte a Objetos Aninhados
        : `${K}`
    : never
}[keyof T];

/**
 * Utilitário Recursivo: Extrai o TIPO do valor dado um caminho (P) e o objeto original (T).
 *
 * Exemplo:
 * T = { age: number }
 * PathValue<T, "age"> = number
 */
export type PathValue<T, P extends Path<T>> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Path<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : T extends Array<infer U> // Se for array, o 'Key' é o índice numérico
      ? Rest extends Path<U>
        ? PathValue<U, Rest>
        : never
      : never
  : P extends keyof T
    ? T[P]
    : T extends Array<infer U>
      ? U
      : never;