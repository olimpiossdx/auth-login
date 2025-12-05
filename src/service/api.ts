
import { HttpClient } from "./http/client";

// Simulação de Cookie/Storage
const getToken = () => localStorage.getItem('access_token');

export const api = new HttpClient('https://api.dev.com/v1');

// --- INTERCEPTOR DE REQUEST ---
api.useRequestInterceptor(async (config) => {
  // CORREÇÃO DO ERRO DE TYPE:
  // 1. Se não existir headers, cria um novo.
  // 2. Se existir mas for um objeto simples, converte para a classe Headers.
  if (!config.headers) {
    config.headers = new Headers();
  } else if (!(config.headers instanceof Headers)) {
    config.headers = new Headers(config.headers);
  }

  const token = getToken();
  
  // Agora o TypeScript sabe que config.headers é do tipo Headers e possui .set()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Exemplo: Adicionar Language ou Versionamento
  config.headers.set('Accept-Language', 'pt-BR');
  
  // Log de Debug (Opcional)
  console.log(`[API] Request: ${config.method} ${config.baseURL}`);
  
  return config;
});

// --- INTERCEPTOR DE RESPONSE (Opcional: Tratamento Global) ---
api.useResponseInterceptor(async (response) => {
    // Aqui você poderia capturar 401 para refresh token ou logging global
    return response;
});