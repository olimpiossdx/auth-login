
````markdown
# 🚀 React Hybrid Form `v0.4.13.2`

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18%2B-cyan)
![TypeScript](https://img.shields.io/badge/typescript-5%2B-blue)
![Performance](https://img.shields.io/badge/performance-uncontrolled-green)

Uma arquitetura de formulários para React focada em **alta performance**, **acessibilidade (a11y)** e uso robusto da **API de Validação Nativa do DOM**.

> **💡 Filosofia:** O estado do formulário vive no DOM, não no React. O React entra apenas para orquestrar a validação complexa e a submissão. Zero re-renders ao digitar.

---

## ✨ Destaques

- **🏎️ Performance Extrema:** Componentes não controlados (*Uncontrolled*) por padrão. Digitar em um input não causa re-renderização do formulário.
- **🛡️ Validação Híbrida:** Combina `required`, `pattern` e `type` nativos do HTML com funções de validação customizadas (JS) integradas à UI nativa (`setCustomValidity`).
- **✅ Checkbox Intelligence:** Distinção automática entre Booleanos (Flag) e Arrays (Grupos) baseada na estrutura do DOM.
- **👑 Master/Detail Checkboxes:** Funcionalidade "Selecionar Todos" declarativa via atributo HTML (`data-checkbox-master`), sem necessidade de hooks manuais.
- **🔄 Sincronia Explícita:** Padrões claros para carregar dados (Load/Edit) garantindo que a UI do React e o DOM estejam sempre em sintonia.
- **🧩 Componentes Ricos:** Padrões para `Autocomplete` (Shadow Select) e `StarRating` (Anchor Input).

---

## 📦 Estrutura do Projeto

```text
src/
├── hooks/
│   └── useForm.ts        # O Core. Gerencia validação, submit, leitura do DOM e Observer.
├── components/
│   ├── Autocomplete.tsx  # Input com filtro + Select Oculto.
│   ├── StarRating.tsx    # Avaliação com SVG + Input Âncora.
│   └── CheckboxTree.tsx  # (Opcional) Wrapper visual para grupos.
├── utils/
│   ├── props.ts          # Definições de Tipos.
│   └── utilities.ts      # Helpers de DOM, Parser de valores e Lógica de Checkbox.
└── scenarios/
    ├── CheckboxGroupForm.tsx # Exemplo de Grupos, Reatividade e Ciclo de Vida.
    └── ...
````

-----

## 🛠️ Como Usar

### 1\. O Hook `useForm`

Conecte o formulário HTML à lógica React sem prender os valores no State.

```tsx
import useForm from './hooks/useForm';

const MyForm = () => {
  const { handleSubmit, getValue, setValidators } = useForm("my-form-id");

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

## 🧠 Lógica de Dados (`getValue`)

O sistema lê o DOM e converte para JSON estruturado automaticamente, inferindo tipos.

| Cenário HTML | Comportamento Interno | Resultado JSON |
| :--- | :--- | :--- |
| **Campos Simples** | `name="email"` | `{ "email": "..." }` |
| **Aninhado** | `name="user.city"` | `{ "user": { "city": "..." } }` |
| **Checkbox (Único)** | `name="terms"` (1 elemento no DOM) | `{ "terms": true }` (ou valor se definido) |
| **Checkbox (Grupo)** | `name="roles"` (2+ elementos no DOM) | `{ "roles": ["admin", "editor"] }` |

-----

## 🌳 Checkbox Groups (Novo na v0.4.13)

A biblioteca gerencia grupos de checkboxes e o estado "Indeterminado" (traço) automaticamente.

### 1\. Declaração do Grupo (HTML Puro)

Para criar um grupo onde múltiplos checkboxes formam um Array:

```tsx
<div>
   <label>Permissões:</label>
   {/* Validação ancorada no primeiro item */}
   <input type="checkbox" name="permissoes" value="ler" data-validation="validarArray" /> 
   <input type="checkbox" name="permissoes" value="escrever" />
</div>
```

**JSON:** `{ "permissoes": ["ler", "escrever"] }`

### 2\. O Atributo "Mestre" (Select All)

Para adicionar um botão "Selecionar Todos", basta usar o atributo `data-checkbox-master`. Não é necessário JavaScript extra.

```tsx
{/* O Mestre: Controla quem tiver name="permissoes" */}
<input type="checkbox" data-checkbox-master="permissoes" /> Selecionar Todos

{/* Os Filhos */}
<input type="checkbox" name="permissoes" value="A" />
<input type="checkbox" name="permissoes" value="B" disabled /> {/* Ignorado pelo Mestre */}
```

-----

## 🔄 Ciclo de Vida: Edição e Cancelamento

Para carregar dados de uma API ou resetar o formulário, usamos o padrão de **Sincronia Explícita**.

Como o React controla a exibição de campos condicionais (Ilhas de Reatividade) e o DOM controla os valores, devemos atualizar ambos ao carregar dados.

```tsx
// Exemplo de Handler de Edição
const handleLoadData = () => {
    // 1. Atualiza o DOM (Preenche inputs, marca checkboxes)
    // O resetSection dispara eventos nativos para acordar validadores e handlers híbridos
    resetSection("", DADOS_API); 
    
    // 2. Atualiza a UI Reativa (React State)
    // Baseado nos DADOS, decidimos o que mostrar/esconder
    const deveMostrarMotivo = DADOS_API.interesses.includes('cancelamento');
    setShowMotivoInput(deveMostrarMotivo);
};
```

-----

## 🎨 Design Patterns para Componentes

### Pattern 1: Shadow Select (`Autocomplete`)

1.  Mantenha um `<select>` oculto (`clip: rect(0,0,0,0)`) sincronizado.
2.  Use `defaultValue` no select para manter o componente **Uncontrolled**.
3.  No evento `onInvalid` do select, transfira a mensagem para o input visível (`reportValidity`).

### Pattern 2: Anchor Input (`StarRating`)

1.  Renderize um `<input>` invisível (`opacity: 0`, `w-full`, `bottom-0`).
2.  Garanta que ele seja "clicável" (`pointer-events-auto`) para o navegador aceitar exibir o balão.
3.  A validação nativa apontará para este input âncora.

-----

## 🧪 Utilitários (`utilities.ts`)

Funções puras exportadas para uso geral:

  - `getFormFields(root)`: Busca inputs válidos dentro de qualquer container.
  - `setNestedValue(obj, path, value)`: Cria objetos profundos a partir de strings de caminho.
  - `syncCheckboxGroup(target, form)`: Lógica central que sincroniza Mestres e Filhos.
  - `initializeCheckboxMasters(root)`: Recalcula estado visual dos Mestres ao carregar a página.

### Licença

MIT

```
```