````markdown
# 🚀 React Hybrid Form v0.4.13

Uma arquitetura de formulários para React focada em **alta performance**, **acessibilidade (a11y)** e uso robusto da **API de Validação Nativa do DOM**.

> **Filosofia:** O estado do formulário vive no DOM, não no React. O React entra apenas para orquestrar a validação complexa e a submissão. Zero re-renders ao digitar.

## ✨ Destaques

* **🏎️ Performance Extrema:** Componentes não controlados (Uncontrolled) por padrão. Digitar em um input não causa re-renderização do formulário.

* **🛡️ Validação Híbrida:** Combina `required`, `pattern` e `type` nativos do HTML com funções de validação customizadas (JS) que se integram à UI nativa do navegador (`setCustomValidity`).

* **🧩 Componentes Customizados Acessíveis:** Padrões claros para criar componentes ricos (`Autocomplete`, `StarRating`, `Switch`) que funcionam com a validação nativa (`reportValidity`).

* **👀 Observer Pattern Otimizado:** Detecta campos adicionados dinamicamente (ex: listas infinitas) sem escanear o formulário inteiro, garantindo escalabilidade.

* **✅ Checkbox Intelligence:** Distinção automática entre Booleanos (Flag) e Arrays (Grupos) baseada na estrutura do DOM.

## 📦 Estrutura do Projeto

```bash
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
└── scenarios/            # Exemplos de implementação (Login, Híbrido, Checkbox Groups).
````

## 🛠️ Como Usar

### 1\. O Hook `useForm`

O hook conecta o formulário HTML à lógica React sem prender os valores no State.

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
  if (value < 18) return { message: "Você precisa ser maior de idade.", type: "error" };
};

// No componente:
useEffect(() => {
  setValidators({ validarIdade });
}, [setValidators]);

// No HTML:
<input name="idade" type="number" data-validation="validarIdade" />
```

## 🧠 Lógica Inteligente de Dados (`getValue`)

O sistema lê o DOM e converte para JSON estruturado automaticamente.

| Cenário HTML | Comportamento `getValue` | Resultado JSON |
| :--- | :--- | :--- |
| **Campos Simples** | `name="user.email"` | `{ "user": { "email": "..." } }` |
| **Arrays** | `name="tags[0]"` | `{ "tags": ["..."] }` |
| **Checkbox (Único)** | `name="terms"` | `{ "terms": true }` (ou valor se definido) |
| **Checkbox (Grupo)** | Múltiplos inputs com `name="roles"` | `{ "roles": ["admin", "editor"] }` |

> **Nota:** A detecção de Grupo vs Único é automática baseada na contagem de elementos com o mesmo `name` no formulário.

## 🎨 Padrões para Componentes Customizados

Para criar componentes visuais (como Ratings ou Selects customizados) que suportam validação nativa, siga estes padrões arquiteturais incluídos no projeto:

### Pattern 1: Shadow Select (`Autocomplete`)

Usado quando o valor é selecionado de uma lista.

1.  Mantenha um `<select>` oculto (`clip: rect(0,0,0,0)`) sincronizado com o estado visual.

2.  Use `defaultValue` no select para manter o componente **Uncontrolled**.

3.  No evento `onInvalid` do select oculto, transfira a mensagem de erro para o input de texto visível (`reportValidity`).

### Pattern 2: Anchor Input (`StarRating`)

Usado quando não há input de texto nativo (ex: SVGs, Canvas).

1.  Renderize um `<input>` invisível (`opacity: 0`) posicionado sobre ou abaixo do componente visual.

2.  Garanta que ele seja "clicável" (`pointer-events-auto`) para o navegador aceitar exibir o balão, mas com `z-index` inferior à UI.

3.  A validação nativa apontará para este input âncora, criando a ilusão de que as estrelas/ícones foram validados.

## 🌳 Checkbox Groups & Hierarquia

Para criar grupos hierárquicos (Pai seleciona Filhos) com validação "Pelo menos um":

1.  **HTML:** Use checkboxes normais com o mesmo `name`.

2.  **Validação:** Adicione `data-validation` **apenas no primeiro checkbox** do grupo.

3.  **Visual:** O "Pai" (Selecionar Todos) deve ser apenas controle de UI (sem `name` de dados).

<!-- end list -->

```tsx
// Exemplo visual no arquivo scenarios/CheckboxGroupForm.tsx
<label><input type="checkbox" ref={paiRef} onChange={toggleAll} /> Todos</label>
<div class="children">
   <input name="permissoes" value="ler" data-validation="validarPeloMenosUm" />
   <input name="permissoes" value="escrever" />
</div>
```

## 🧪 Utilitários (`utilities.ts`)

Funções puras exportadas para uso geral:

  * `getFormFields(root)`: Busca inputs válidos dentro de qualquer container.

  * `setNestedValue(obj, path, value)`: Cria objetos profundos a partir de strings de caminho.

  * `parseFieldValue(field)`: Normaliza valores (converte strings numéricas, trata checkboxes e radios).

### Licença

MIT

```
```