Com certeza. Aqui está o conteúdo do `README.md` em formato de bloco de código simples, para que você possa copiar diretamente da conversa:

````markdown
# 🚀 React Hybrid Form v0.4.13

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18%2B-cyan)
![TypeScript](https://img.shields.io/badge/typescript-5%2B-blue)
![Performance](https://img.shields.io/badge/performance-uncontrolled-green)

Uma arquitetura de formulários para React focada em **alta performance**, **acessibilidade (a11y)** e uso robusto da **API de Validação Nativa do DOM**.

> **💡 Filosofia:** O estado do formulário vive no DOM, não no React. O React entra apenas para orquestrar a validação complexa e a submissão. Zero re-renders ao digitar.

---

## ✨ Destaques

- **🏎️ Performance Extrema:** Componentes não controlados (*Uncontrolled*) por padrão. Digitar em um input não causa re-renderização do formulário.
- **🛡️ Validação Híbrida:** Combina `required`, `pattern` e `type` nativos do HTML com funções de validação customizadas (JS) que se integram à UI nativa do navegador (`setCustomValidity`).
- **🧩 Componentes Ricos & Acessíveis:** Padrões claros para criar componentes complexos (`Autocomplete`, `StarRating`, `Switch`) que funcionam com a validação nativa (`reportValidity`).
- **👀 Observer Pattern Otimizado:** Detecta campos adicionados dinamicamente (ex: listas infinitas) sem escanear o formulário inteiro.
- **✅ Checkbox Intelligence:** Distinção automática entre Booleanos (Flag) e Arrays (Grupos) baseada na estrutura do DOM.
- **🌀 Fractal / Deep Nesting:** Suporte a estruturas recursivas contendo componentes complexos em profundidade infinita.

---

## 📦 Estrutura do Projeto

```text
src/
├── hooks/
│   └── useForm.ts        # O Core. Gerencia validação, submit, leitura do DOM e Observer.
├── components/
│   ├── Autocomplete.tsx  # Input com filtro + Select Oculto (Shadow Select Pattern).
│   ├── StarRating.tsx    # Avaliação com SVG + Input Âncora (Anchor Input Pattern).
│   └── TabButton.tsx     # Navegação Stateless.
├── utils/
│   ├── props.ts          # Definições de Tipos (TypeScript).
│   └── utilities.ts      # Helpers para manipulação de objetos profundos e parsing de DOM.
└── scenarios/
    ├── NestedLevelForm.tsx   # Prova de conceito: Fractal com componentes complexos.
    ├── CheckboxGroupForm.tsx # Grupos e validação hierárquica.
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
      <input type="number" name="user.age" />
      <button type="submit">Enviar</button>
    </form>
  );
};
```

### 2\. Validação Customizada

Injete regras de negócio que o HTML não cobre. O erro aparecerá no balão nativo do navegador.

```tsx
const validarIdade = (value, field) => {
  if (value < 18) {
    return { message: "Você precisa ser maior de idade.", type: "error" };
  }
};

// No componente:
useEffect(() => {
  setValidators({ validarIdade });
}, [setValidators]);

// No HTML:
<input name="idade" type="number" data-validation="validarIdade" />
```

-----

## 🧠 Lógica de Dados (`getValue`)

O sistema lê o DOM e converte para JSON estruturado automaticamente, inferindo tipos.

| Cenário HTML | Nome do Campo | Resultado JSON |
| :--- | :--- | :--- |
| **Simples** | `name="email"` | `{ "email": "..." }` |
| **Aninhado** | `name="user.address.city"` | `{ "user": { "address": { "city": "..." } } }` |
| **Arrays** | `name="tags[0]"` | `{ "tags": ["..."] }` |
| **Checkbox** | `name="terms"` (único) | `{ "terms": true }` |
| **Checkbox Group** | `name="roles"` (múltiplos) | `{ "roles": ["admin", "editor"] }` |
| **Deep Nesting** | `name="org.filhos[0].nome"` | `{ "org": { "filhos": [{ "nome": "..." }] } }` |

-----

## 📋 Listas Dinâmicas (`useList`)

Para listas (arrays de objetos), recomendamos separar a responsabilidade:

1.  **React:** Gerencia a estrutura (IDs, ordem, quantidade).
2.  **DOM:** Gerencia os valores dos inputs.

<!-- end list -->

```tsx
const useList = (initial = 1) => {
  const [items, setItems] = useState(Array.from({ length: initial }, () => crypto.randomUUID()));
  const add = () => setItems(p => [...p, crypto.randomUUID()]);
  const remove = (i) => setItems(p => p.filter((_, idx) => idx !== i));
  return { items, add, remove };
};

// Uso:
const MyForm = () => {
  const { items, add, remove } = useList();
  
  return (
    <div>
      {items.map((key, index) => (
        <div key={key}>
          {/* O index no 'name' garante a estrutura do Array no JSON final */}
          <input name={`contatos[${index}].nome`} />
          <button type="button" onClick={() => remove(index)}>X</button>
        </div>
      ))}
      <button onClick={add}>+ Add</button>
    </div>
  );
}
```

-----

## 🌳 Checkbox Groups

Para criar grupos onde múltiplos checkboxes formam um Array `string[]`:

1.  **Mesmo Nome:** Use o atributo `name` igual para todos.
2.  **Validação:** Adicione `data-validation` **apenas no primeiro** checkbox.
3.  **Indeterminado:** O "Pai" (Selecionar Todos) deve ser apenas controle de UI.

<!-- end list -->

```tsx
<div>
   <label>Interesses:</label>
   
   {/* Validação ancorada no primeiro item */}
   <label>
     <input type="checkbox" name="interesses" value="dev" data-validation="validarArray" /> 
     Dev
   </label>
   
   <label>
     <input type="checkbox" name="interesses" value="design" /> 
     Design
   </label>
</div>
```

**Resultado JSON:** `{ "interesses": ["dev", "design"] }`

-----

## 🎨 Design Patterns para Componentes

### Pattern 1: Shadow Select (`Autocomplete`)

Usado quando o valor é selecionado de uma lista.

1.  Mantenha um `<select>` oculto (`clip: rect(0,0,0,0)`) sincronizado.
2.  Use `defaultValue` no select para manter o componente **Uncontrolled**.
3.  No evento `onInvalid` do select, transfira a mensagem para o input visível (`reportValidity`).

### Pattern 2: Anchor Input (`StarRating`)

Usado quando não há input nativo (ex: SVGs, Canvas).

1.  Renderize um `<input>` invisível (`opacity: 0`, `w-full`, `bottom-0`).
2.  Garanta que ele seja "clicável" (`pointer-events-auto`) para o navegador aceitar exibir o balão.
3.  A validação nativa apontará para este input âncora.

-----

## 🧪 Utilitários (`utilities.ts`)

Funções puras exportadas para uso geral:

  - `getFormFields(root)`: Busca inputs válidos dentro de qualquer container.
  - `setNestedValue(obj, path, value)`: Cria objetos profundos a partir de strings de caminho.
  - `parseFieldValue(field)`: Normaliza valores (converte strings numéricas, trata checkboxes e radios).

### Licença

MIT

```
```