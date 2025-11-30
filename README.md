Entendido. O Canvas às vezes remove a formatação ao copiar.

Aqui está o conteúdo **bruto** do `README.md` para você copiar. Basta clicar no ícone de copiar no canto superior direito do bloco abaixo:

````markdown
# 🚀 React Hybrid Form `v0.4.14`

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18%2B-cyan)
![TypeScript](https://img.shields.io/badge/typescript-5%2B-blue)
![Performance](https://img.shields.io/badge/performance-uncontrolled-green)

Uma arquitetura de formulários para React focada em **alta performance**, **acessibilidade (a11y)** e uso robusto da **API de Validação Nativa do DOM**.

> **💡 Filosofia:** O estado do formulário vive no DOM, não no React. O React entra apenas para orquestrar a validação complexa, componentes ricos e a submissão. Zero re-renders ao digitar.

---

## ✨ Destaques da Versão

- **🏎️ Performance Extrema:** Componentes não controlados (*Uncontrolled*) por padrão. Digitar em um input não causa re-renderização do formulário.
- **🔄 Autocomplete Enterprise:** Suporte completo a **Busca Assíncrona**, **Infinite Scroll** e tratamento de erros, mantendo a validação nativa.
- **⭐ StarRating 2.0:** Totalmente acessível via teclado, customizável e reativo a resets externos.
- **🛡️ Validação Híbrida:** Integração perfeita entre validação customizada JS e balões de erro nativos (`reportValidity`).
- **✅ Checkbox Intelligence:** Gestão automática de grupos e estado "Indeterminado" via atributos HTML (`data-checkbox-master`).
- **🔌 Native Bypass:** Arquitetura interna robusta que permite alterar valores do DOM via código e "acordar" o React automaticamente.

---

## 📦 Estrutura do Projeto

```text
src/
├── hooks/
│   └── useForm.ts        # O Core. Gerencia validação, submit, leitura do DOM e Observer.
├── components/
│   ├── Autocomplete.tsx  # Input Async com filtro, paginação e Select Oculto.
│   ├── StarRating.tsx    # Avaliação acessível com SVG + Input Âncora.
│   └── TabButton.tsx     # Componente UI Stateless.
├── utils/
│   ├── props.ts          # Definições de Tipos.
│   └── utilities.ts      # Helpers de DOM, Parser, React Bypass e Lógica de Checkbox.
└── scenarios/
    ├── AsyncAutocompleteExample.tsx # Demo de API, Paginação e Edição.
    ├── CheckboxGroupForm.tsx        # Demo de Grupos e Ciclo de Vida.
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
Possui **Shadow Select Pattern**: Mantém um `<select>` oculto para garantir a integridade dos dados no DOM.

```tsx
<Autocomplete
  name="usuario_id"
  label="Buscar Usuário"
  options={options} 
  onSearch={handleSearch}      // (query) => void
  onLoadMore={handleLoadMore}  // () => void
  isLoading={isLoading}
  hasMore={hasMore}
  errorMessage={errorMsg}
  clearable
  required
/>
```

### 2\. StarRating (Acessível)

Componente de avaliação que respeita a semântica WAI-ARIA `role="slider"`.
Possui **Anchor Input Pattern**: Usa um input invisível para receber o foco do balão de erro nativo.

```tsx
<StarRating 
  name="nps_score"
  label="Nota"
  maxStars={10} 
  starClassName="w-6 h-6 text-purple-500"
  required
/>
```

-----

## 🌳 Checkbox Groups Inteligentes

Crie grupos hierárquicos (Selecionar Todos) usando apenas atributos HTML.

```tsx
{/* O Mestre: Controla inputs com name="permissoes" */}
<label>
  <input type="checkbox" data-checkbox-master="permissoes" /> 
  Selecionar Todos
</label>

{/* Os Filhos */}
<input type="checkbox" name="permissoes" value="ler" />
<input type="checkbox" name="permissoes" value="escrever" />
<input type="checkbox" name="permissoes" value="excluir" disabled /> {/* Ignorado */}
```

**Resultado JSON:** `{ "permissoes": ["ler", "escrever"] }`

-----

## 🔄 Ciclo de Vida: Load & Reset

Para carregar dados de uma API (Edição) ou cancelar alterações, use o `resetSection`.

> **Nota:** Graças ao mecanismo de **Native Bypass**, o `resetSection` atualiza o DOM e dispara eventos que "acordam" o React automaticamente, mantendo a UI sincronizada.

```tsx
const handleLoadData = () => {
    // Preenche o formulário e notifica componentes visuais
    resetSection("", DADOS_API); 
};
```

-----

## ⚠️ Observações & Melhores Práticas

### Edição com Autocomplete Async

Ao carregar dados para edição em um Autocomplete Assíncrono, o componente pode receber o **ID** (Value) corretamente, mas não saber qual **Texto** (Label) exibir se a lista de opções estiver vazia no momento do load.

**Recomendação:**
Sempre faça o "Pre-fetch" da opção específica antes de rodar o `resetSection`.

```tsx
const handleEdit = async (id, dadosCompletos) => {
  // 1. Busque o dado do item para popular as options
  await fetchItemEspecifico(id); 
  
  // 2. Agora o componente sabe que ID 55 = "Rick Sanchez"
  resetSection("", dadosCompletos);
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

```
```