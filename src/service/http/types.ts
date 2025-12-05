export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface IApiError {
  code: string;
  message: string;
  details?: any;
};

// Envelope Padrão
export interface IApiResponse<T = any> {
  data: T | null;
  error: IApiError | null;
  isSuccess: boolean;
  status: number;
  headers: Headers;
};

// Configuração da Requisição
export interface HttpRequestConfig extends RequestInit {
  baseURL?: string;
  headers?: HeadersInit; 
  params?: Record<string, string | number | boolean | undefined>;
  
  // --- DX Features ---
  notifyOnError?: boolean; // Dispara toast automático?
  
  // --- Resilience Features ---
  retries?: number;        // Quantas vezes retentar? (Default: 0)
  retryDelay?: number;     // Delay inicial em ms (Default: 1000ms)
  retryBackoff?: boolean;  // Usar backoff exponencial? (Default: true)
};

export type RequestInterceptor = (config: HttpRequestConfig) => Promise<HttpRequestConfig> | HttpRequestConfig;
export type ResponseInterceptor = (response: IApiResponse) => Promise<IApiResponse> | IApiResponse;