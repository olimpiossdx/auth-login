import { toast } from "../../componentes/toast";
import type { RequestInterceptor, ResponseInterceptor, HttpRequestConfig, IApiResponse } from "./types";

export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Headers;
  private defaultRetries = 0;
  private defaultRetryDelay = 1000;
  private defaultRetryBackoff = true;

  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseURL: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...defaultHeaders
    });
  }

  useRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  useResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isRetryable(error: any, response?: Response): boolean {
      if (error && error.name !== 'AbortError') return true;
      if (response) {
          return response.status >= 500 || response.status === 429;
      }
      return false;
  }

  async request<T>(endpoint: string, config: Partial<HttpRequestConfig> = {}): Promise<IApiResponse<T>> {
    let url = `${this.baseURL}${endpoint}`;

    if (config.params) {
      const query = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query.append(key, String(value));
      });
      url += `?${query.toString()}`;
    }

    let finalConfig: HttpRequestConfig = {
      retries: this.defaultRetries,
      retryDelay: this.defaultRetryDelay,
      retryBackoff: this.defaultRetryBackoff,
      ...config,
      headers: new Headers(config.headers || this.defaultHeaders),
      method: config.method || 'GET'
    };

    if (config.body instanceof FormData) {
       (finalConfig.headers as Headers).delete('Content-Type');
    }

    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    // CORREÇÃO: Inicialização padrão para evitar erro "used before assigned"
    let apiResponse: IApiResponse<T> = {
        data: null,
        error: { code: 'INIT_ERROR', message: 'Falha na inicialização da requisição' },
        isSuccess: false,
        status: 0,
        headers: new Headers()
    };

    let attempt = 0;
    const totalAttempts = (finalConfig.retries || 0) + 1;

    for (attempt = 1; attempt <= totalAttempts; attempt++) {
        try {
            const fetchResponse = await fetch(url, finalConfig);
            
            // Retry lógico (Status 5xx/429)
            if (attempt < totalAttempts && this.isRetryable(null, fetchResponse)) {
                const delay = finalConfig.retryBackoff 
                    ? (finalConfig.retryDelay || 1000) * Math.pow(2, attempt - 1)
                    : (finalConfig.retryDelay || 1000);
                
                console.warn(`[API] Retry attempt ${attempt} for ${url}. Waiting ${delay}ms.`);
                await this.sleep(delay);
                continue;
            }

            // Processamento de Resposta
            let data: any = null;
            const contentType = fetchResponse.headers.get('content-type');
            
            if (fetchResponse.status !== 204) {
                if (contentType && contentType.includes('application/json')) {
                    data = await fetchResponse.json().catch(() => null);
                } else {
                    data = await fetchResponse.text();
                }
            }

            if (fetchResponse.ok) {
                apiResponse = {
                    data: data as T,
                    error: null,
                    isSuccess: true,
                    status: fetchResponse.status,
                    headers: fetchResponse.headers
                };
            } else {
                const errorMsg = data?.message || data?.error_description || fetchResponse.statusText || 'Erro na requisição';
                const errorCode = data?.code || data?.error || String(fetchResponse.status);
                
                apiResponse = {
                    data: null,
                    error: { code: errorCode, message: errorMsg, details: data },
                    isSuccess: false,
                    status: fetchResponse.status,
                    headers: fetchResponse.headers
                };
            }
            break; // Sucesso ou Erro final (não retryable)

        } catch (error) {
            // Erro de Rede / Abort
            const isAbort = error instanceof Error && error.name === 'AbortError';

            if (!isAbort && attempt < totalAttempts && this.isRetryable(error)) {
                const delay = finalConfig.retryBackoff 
                    ? (finalConfig.retryDelay || 1000) * Math.pow(2, attempt - 1)
                    : (finalConfig.retryDelay || 1000);

                console.warn(`[API] Network error on attempt ${attempt}. Waiting ${delay}ms.`);
                await this.sleep(delay);
                continue;
            }

            apiResponse = {
                data: null,
                error: { 
                    code: isAbort ? 'REQUEST_ABORTED' : 'NETWORK_ERROR', 
                    message: isAbort ? 'Requisição cancelada.' : (error instanceof Error ? error.message : 'Falha de conexão.') 
                },
                isSuccess: false,
                status: 0,
                headers: new Headers()
            };
            break;
        }
    }

    // 7. Response Interceptors (Agora seguro, pois apiResponse está inicializada)
    for (const interceptor of this.responseInterceptors) {
        apiResponse = await interceptor(apiResponse);
    }

    // 8. Feature DX: Notify on Error
    if (!apiResponse.isSuccess && finalConfig.notifyOnError && apiResponse.error?.code !== 'REQUEST_ABORTED') {
        toast.error(apiResponse.error?.message || "Ocorreu um erro");
    }

    return apiResponse;
  }

  get<T>(url: string, config?: Omit<HttpRequestConfig, 'method'>) {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  post<T>(url: string, body: any, config?: Omit<HttpRequestConfig, 'method' | 'body'>) {
    return this.request<T>(url, { ...config, method: 'POST', body: JSON.stringify(body) });
  }
  
  put<T>(url: string, body: any, config?: Omit<HttpRequestConfig, 'method' | 'body'>) {
    return this.request<T>(url, { ...config, method: 'PUT', body: JSON.stringify(body) });
  }

  delete<T>(url: string, config?: Omit<HttpRequestConfig, 'method'>) {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }
}