// --- DEFINIÇÕES DE TIPO GERAIS ---

/**
 * Interface genérica para objetos com chaves de string.
 * Usada como base para estruturas de dados dinâmicas.
 */
export interface IAnyObject {
  [key: string]: any;
}

/**
 * Estrutura do resultado de uma validação.
 * Pode conter mensagem e tipo de alerta (erro, aviso, etc).
 */
export interface IValidationResult {
  message: string;
  type: "error" | "warning" | "info" | "success";
};

/**
 * O tipo de retorno da função de validação.
 * Pode ser uma string simples (mensagem de erro) ou um objeto estruturado.
 */
export type ValidationResult = string | IValidationResult | undefined;

/**
 * Tipos de elementos HTML que o formulário gerencia.
 */
export type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// --- TIPAGEM DE VALIDAÇÃO ---

/**
 * Assinatura da função de validação.
 *
 * A estrutura foi ajustada para permitir tipagem forte opcional no valor.
 * Ao mover o genérico <ValueType> para a definição do tipo, permitimos que
 * implementações concretas especifiquem o tipo esperado (ex: string, number)
 * sem quebrar a compatibilidade com a interface genérica do hook.
 *
 * @template FormValues - O tipo completo dos dados do formulário.
 * @template ValueType - O tipo específico do valor deste campo (default: any).
 */
export type ValidateFn<FormValues, ValueType = any> = (
  value: ValueType, 
  field: FormField | null,
  formValues: FormValues
) => ValidationResult;

/**
 * Mapa de validadores.
 * A chave é o nome da regra (usado em data-validation="regra").
 * O valor é a função que executa a validação.
 * O segundo argumento 'any' garante flexibilidade para o mapa conter validadores de diferentes tipos.
 */
export type ValidatorMap<FV> = Record<string, ValidateFn<FV, any>>;

// --- INFRAESTRUTURA INTERNA ---

/**
 * Armazena referências aos event listeners anexados a um elemento.
 * Necessário para remover os listeners corretamente quando o elemento sai do DOM.
 */
export type ListenerRef = { blur: EventListener; change: EventListener };

/**
 * Mapa que associa elementos do DOM aos seus listeners ativos.
 */
export type FieldListenerMap = Map<HTMLElement, ListenerRef>;

// --- MAGIC TYPES (Inferência de Caminhos) ---

/**
 * Utilitário Recursivo: Extrai todas as chaves aninhadas de um objeto como strings de caminho.
 * Converte { user: { name: string } } em "user" | "user.name".
 * Suporta profundidade infinita (teoricamente).
 */
export type Path<T> = T extends object ? { [K in keyof T]: K extends string ? `${K}` | `${K}.${Path<T[K]>}` : never }[keyof T] : never;

/**
 * Utilitário Recursivo: Infere o tipo do valor dado um caminho (Path) e o objeto original.
 * Se T é { age: number } e P é "age", retorna number.
 * Essencial para que o getValue("campo.aninhado") retorne o tipo correto automaticamente.
 */
export type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T ? Rest extends Path<T[K]> ? PathValue<T[K], Rest> : never : never
  : P extends keyof T ? T[P] : never;