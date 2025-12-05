````markdown
# 🚀 React Hybrid Form `v0.6.0`

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18%2B-cyan)
![TypeScript](https://img.shields.io/badge/typescript-5%2B-blue)
![Performance](https://img.shields.io/badge/performance-uncontrolled-green)

Uma arquitetura de formulários para React focada em **alta performance**, **acessibilidade (a11y)**, **robustez de dados** e uso da **API de Validação Nativa do DOM**.

> **💡 Filosofia:** O estado do formulário vive no DOM, não no React. O React entra apenas para orquestrar validações complexas, componentes ricos e a submissão. Zero re-renders ao digitar.

---

## ✨ Destaques da Versão

- **🏎️ Performance Extrema:** Componentes não controlados (*Uncontrolled*) por padrão.
- **🌐 HTTP Client Enterprise:** Wrapper robusto sobre `fetch` com **Interceptors**, **Retry Policy** (Exponencial), **AbortController** e padronização de resposta (`IApiResponse`).
- **🖥️ Sistema de Modais Global:** API imperativa (`showModal`) com suporte a **Stacking**, **Portals** e Injeção de Componentes Tipados.
- **🔄 Autocomplete Avançado:** Busca Assíncrona, Paginação Infinita, Debounce e Sincronia Bidirecional com o DOM.
- **🧠 Smart Validation:** Estratégia "Reward Early, Punish Late". Feedback imediato ao corrigir, suave ao errar.
- **🔌 Native Bypass:** Arquitetura interna que permite alterar valores do DOM via código (Reset/Load) e "acordar" o React automaticamente.

---

## 📦 Estrutura do Projeto

```text
src/
├── hooks/
│   └── useForm.ts        # O Core. Gerencia validação, submit e refs.
│   └── useList.ts        # Gerenciador estrutural para listas dinâmicas.
├── services/
│   ├── api.ts            # Instância configurada do cliente HTTP.
│   └── http/             # Camada de Serviço (HttpClient, Interceptors, Types).
├── components/
│   ├── modal/            # Sistema de Modais (Manager, Portal, Hook).
│   ├── Autocomplete.tsx  # Input Async com Portal e Shadow Select.
│   ├── StarRating.tsx    # Avaliação acessível com Anchor Input.
│   ├── Switch.tsx        # Toggle com Overlay Input.
│   └── Alert.tsx         # Feedback visual contextual.
├── utils/
│   ├── props.ts          # Definições de Tipos (Path, PathValue).
│   └── utilities.ts      # Helpers de DOM, Parser, Bypass e Lógica de Checkbox.
└── scenarios/            # Exemplos de implementação e testes.
````

-----

## 🛠️ Hook Core: `useForm`

Conecte o formulário HTML à lógica React com tipagem forte e zero boilerplate.

```tsx
import useForm from './hooks/useForm';

interface FormData {
  user: { name: string; email: string };
}

const MyForm = () => {
  const onSubmit = (data: FormData) => {
    console.log("Enviando:", data);
  };

  // formProps contém: ref, id, noValidate, onSubmit
  const { formProps, getValue, resetSection } = useForm<FormData>({
      id: "my-form",
      onSubmit
  });

  return (
    <form {...formProps}>
      <input name="user.name" required />
      <button type="submit">Enviar</button>
    </form>
  );
};
```

-----

## 🌐 Camada de Serviço (`HttpClient`)

Um cliente HTTP robusto que normaliza erros e respostas.

### Funcionalidades

  * **Padronização:** Retorna sempre um envelope `IApiResponse` (nunca lança exceção, exceto erro de rede).
  * **Resiliência:** Tenta requisições falhas (5xx/Rede) automaticamente com backoff exponencial.
  * **Integração:** Conecta-se ao sistema de Toasts para feedback automático.

### Exemplo de Uso

```tsx
import { api } from './services/api';

const loadData = async () => {
  // 1. GET com Tipagem
  const res = await api.get<IUser[]>('/users');
  
  if (res.isSuccess) {
    console.log("Usuários:", res.data);
  } else {
    // Erro já tratado ou disponível em res.error
    console.error(res.error?.message);
  }

  // 2. Configuração Avançada (Retry, Abort, Toast)
  const controller = new AbortController();
  
  api.post('/data', payload, {
      retries: 3,            // Tenta 3x se falhar
      notifyOnError: true,   // Mostra Toast se der erro
      signal: controller.signal // Permite cancelamento
  });
};
```

-----

## 🖥️ Sistema de Modais (Imperativo)

Abra modais de qualquer lugar do código sem precisar renderizar componentes no JSX pai.

```tsx
import { showModal } from './components/modal';

const handleOpen = () => {
  showModal({
    title: "Confirmação",
    size: "sm",
    // Injeção de Componente ou JSX direto
    content: <p>Deseja excluir este registro?</p>,
    actions: (
        <button onClick={() => alert('Excluído!')}>Sim</button>
    )
  });
};
```

-----

## 🧩 Componentes Ricos

### Autocomplete (Async & Infinite Scroll)

  * **Shadow Select:** Mantém um `<select>` oculto para integridade dos dados.
  * **Portal:** Renderiza a lista fora de containers com `overflow: hidden`.
  * **Async:** Suporta busca remota e paginação.

### StarRating (Acessível)

  * **Anchor Input:** Renderiza um input físico (1px) no rodapé para ancorar o balão de erro nativo.
  * **Camadas:** UI em `z-10`, Input em `z-0`.

### Checkbox Groups

  * **Mestre/Detalhe:** Atributo `data-checkbox-master` controla grupos automaticamente.
  * **Smart Toggle:** Lógica inteligente para marcar/desmarcar baseada no estado dos filhos.

-----

## 🛡️ Estratégia de Validação: "Native-First"

O pipeline de validação garante performance e acessibilidade:

1.  **Nível 1 (Browser):** Verifica regras HTML (`required`, `min`, `pattern`, `type`).
      * Se falhar, para e exibe mensagem nativa.
2.  **Nível 2 (Custom):** Verifica regras JavaScript (`setValidators`).
      * Se falhar, injeta o erro no navegador via `setCustomValidity`.

<!-- end list -->

```tsx
// Exemplo de Validação Customizada
setValidators({
  email: (val) => !val.includes('@corp.com') ? { message: "Use email corporativo" } : undefined
});
```

-----

## 🧪 Utilitários (`utilities.ts`)

Funções puras exportadas para uso geral:

  - `setNativeValue(element, value)`: Define valor e dispara eventos, burlando o bloqueio de Synthetic Events do React.
  - `getFormFields(root)`: Busca inputs válidos dentro de qualquer container.
  - `syncCheckboxGroup(target, form)`: Lógica central que sincroniza Mestres e Filhos.

### Licença

MIT

```
```