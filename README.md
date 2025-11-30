````markdown
# 🚀 React Hybrid Form `v0.4.14`

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18%2B-cyan)
![TypeScript](https://img.shields.io/badge/typescript-5%2B-blue)
![Performance](https://img.shields.io/badge/performance-uncontrolled-green)

Uma arquitetura de formulários para React focada em **alta performance**, **acessibilidade (a11y)** e uso robusto da **API de Validação Nativa do DOM**.

> **💡 Filosofia:** O estado do formulário vive no DOM, não no React. O React entra apenas para orquestrar a validação complexa, a submissão e componentes ricos.

---

## ✨ Destaques da Versão

- **🏎️ Performance Extrema:** Componentes não controlados (*Uncontrolled*) por padrão. Digitar em um input não causa re-renderização do formulário.
- **🔄 Autocomplete Enterprise:** Suporte completo a **Busca Assíncrona (Server-Side)**, **Infinite Scroll (Paginação)** e tratamento de erros de rede, mantendo a validação nativa.
- **⭐ StarRating 2.0:** Totalmente acessível via teclado (Setas, Home, End), customizável (N estrelas) e reativo a resets externos.
- **🛡️ Validação Híbrida:** Integração perfeita entre validação customizada JS e balões de erro nativos do navegador (`reportValidity`).
- **✅ Checkbox Intelligence:** Gestão automática de grupos e estado "Indeterminado" via atributos HTML (`data-checkbox-master`).
- **🔌 Native Bypass:** Arquitetura interna robusta que permite alterar valores do DOM via código e "acordar" o React automaticamente.

---

## 📦 Estrutura do Projeto

```text
src/
├── hooks/
│   └── useForm.ts        # O Core. Gerencia validação, submit, leitura do DOM e Observer.
├── components/
│   ├── Autocomplete.tsx  # Input Async com filtro, paginação e Select Oculto (Shadow Select).
│   ├── StarRating.tsx    # Avaliação acessível com SVG + Input Âncora (Anchor Input).
│   └── TabButton.tsx     # Componente UI Stateless.
├── utils/
│   ├── props.ts          # Definições de Tipos (TypeScript).
│   └── utilities.ts      # Helpers de DOM, Parser, React Bypass e Lógica de Checkbox.
└── scenarios/
    ├── AsyncAutocompleteExample.tsx # Demo de API, Paginação e Debounce.
    ├── CheckboxGroupForm.tsx        # Demo de Grupos e Ciclo de Vida.
    ├── StarRatingExample.tsx        # Demo de Customização e Acessibilidade.
    └── ...
````

-----

## 🛠️ Hook Core: `useForm`

Conecte o formulário HTML à lógica React sem prender os valores no State.

```tsx
import useForm from './hooks/useForm';

const MyForm = () => {
  const { handleSubmit, getValue, setValidators, resetSection } = useForm("my-form-id");

  const onSubmit = (data) => {
    console.log("JSON Submetido:", data);
  };

  return (
    <form id="my-form-id" onSubmit={handleSubmit(onSubmit)}>
      <input name="user.name" required />
      <button type="submit">Enviar</button>
    </form>
  );
};
```

-----

## 🧩 Componentes Avançados

### 1\. Autocomplete (Async & Infinite Scroll)

Um componente de seleção poderoso que suporta dados locais e remotos.

**Recursos:**

  * **Shadow Select Pattern:** Mantém um `<select>` oculto para garantir que o dado exista no DOM.
  * **Async Search:** Recebe `onSearch` para delegar a busca ao pai.
  * **Infinite Scroll:** Recebe `onLoadMore` para carregar páginas sob demanda.

<!-- end list -->

```tsx
<Autocomplete
  name="usuario_id"
  label="Buscar Usuário"
  // Modo Async
  options={options} 
  onSearch={handleSearch}      // (query) => void
  onLoadMore={handleLoadMore}  // () => void
  isLoading={isLoading}        // Spinner no input
  isLoadingMore={isLoadingMore}// Spinner no rodapé da lista
  hasMore={hasMore}            // Controla se chama loadMore
  errorMessage={errorMsg}      // Exibe erro na lista
  // Config
  debounceTime={300}
  clearable
  required
/>
```

### 2\. StarRating (Acessível)

Componente de avaliação que respeita a semântica WAI-ARIA `role="slider"`.

**Recursos:**

  * **Anchor Input Pattern:** Usa um input invisível clicável para receber o foco do balão de erro nativo.
  * **Customizável:** Suporta `maxStars` e classes CSS.
  * **Teclado:** Setas ajustam valor, `Home` zera, `End` maximiza.

<!-- end list -->

```tsx
<StarRating 
  name="nps_score"
  label="Qual a probabilidade de nos recomendar?"
  maxStars={10} 
  starClassName="w-6 h-6 text-purple-500"
  onChange={(val) => console.log('Nota:', val)}
  required
/>
```

-----

## 🌳 Checkbox Groups Inteligentes

Crie grupos hierárquicos (Selecionar Todos) usando apenas atributos HTML. A biblioteca gerencia a lógica.

```tsx
{/* O Mestre: Controla inputs com name="permissoes" */}
<label>
  <input type="checkbox" data-checkbox-master="permissoes" /> 
  Selecionar Todos
</label>

{/* Os Filhos */}
<input type="checkbox" name="permissoes" value="ler" />
<input type="checkbox" name="permissoes" value="escrever" />
<input type="checkbox" name="permissoes" value="excluir" disabled /> {/* Ignorado pelo mestre */}
```

**Resultado JSON:** `{ "permissoes": ["ler", "escrever"] }`

-----

## 🔄 Ciclo de Vida: Load & Reset

Para carregar dados de uma API (Edição) ou cancelar alterações, use o `resetSection`.

> **Nota:** Graças ao mecanismo de **Native Bypass**, o `resetSection` atualiza o DOM e dispara eventos que "acordam" o React automaticamente, mantendo a UI sincronizada.

```tsx
const handleLoadData = () => {
    // Preenche o formulário e notifica componentes visuais (StarRating, Autocomplete)
    resetSection("", DADOS_API); 
};

const handleCancel = () => {
    // Reseta para o estado original
    resetSection("", null);
};
```

-----

## 🧪 Utilitários (`utilities.ts`)

Funções puras exportadas para uso geral:

  - `setNativeValue(element, value)`: Define valor e dispara eventos, burlando o bloqueio de Synthetic Events do React.
  - `getFormFields(root)`: Busca inputs válidos dentro de qualquer container.
  - `setNestedValue(obj, path, value)`: Cria objetos profundos a partir de strings de caminho.
  - `syncCheckboxGroup(target, form)`: Lógica central que sincroniza Mestres e Filhos.

### Licença

MIT