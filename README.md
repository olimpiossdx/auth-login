````markdown
# 🚀 React Hybrid Form `v0.5.1`

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18%2B-cyan)
![TypeScript](https://img.shields.io/badge/typescript-5%2B-blue)
![Performance](https://img.shields.io/badge/performance-uncontrolled-green)

Uma arquitetura de formulários para React focada em **alta performance**, **acessibilidade (a11y)** e uso robusto da **API de Validação Nativa do DOM**.

> **💡 Filosofia:** O estado do formulário vive no DOM, não no React. O React entra apenas para orquestrar validações complexas, componentes ricos e a submissão. Zero re-renders ao digitar.

---

## ✨ Destaques da Versão

- **🏎️ Performance Extrema:** Componentes não controlados (*Uncontrolled*) por padrão. Digitar em um input não causa re-renderização do formulário.
- **🎁 DX Aprimorada:** Objeto `formProps` para conexão rápida (`<form {...formProps}>`).
- **🖥️ Sistema de Modais:** Arquitetura de **Portals** com Hook Headless (`useModal`) para diálogos que furam o `overflow` e `z-index`.
- **🔄 Autocomplete Enterprise:** Busca Assíncrona, Paginação, Portals e tratamento de erros.
- **🛡️ Validação Híbrida:** Integração perfeita entre validação customizada JS e balões de erro nativos (`reportValidity`).
- **✅ Checkbox Intelligence:** Gestão automática de grupos e estado "Indeterminado" via atributos HTML (`data-checkbox-master`).
- **🔌 Native Bypass:** Arquitetura interna robusta que permite alterar valores do DOM via código e "acordar" o React automaticamente.

---

## 📦 Estrutura do Projeto

```text
src/
├── hooks/
│   └── useForm.ts        # O Core. Gerencia validação, submit, leitura do DOM e Observer.
│   └── useList.ts        # Gerenciador estrutural para listas dinâmicas.
├── components/
│   ├── modal/            # Sistema de Modais.
│   │   ├── useModal.ts   # Hook Headless.
│   │   └── Modal.tsx     # Componente Visual (Portal).
│   ├── Autocomplete.tsx  # Input Async com Portal e Shadow Select.
│   ├── StarRating.tsx    # Avaliação acessível com Input Âncora.
│   ├── Switch.tsx        # Toggle booleano.
│   └── TabButton.tsx     # Componente UI Stateless.
├── utils/
│   ├── props.ts          # Definições de Tipos (Path, PathValue).
│   └── utilities.ts      # Helpers de DOM, Parser e Lógica de Checkbox.
└── scenarios/            # Exemplos de implementação.
````

-----

## 🛠️ Hook Core: `useForm`

Conecte o formulário HTML à lógica React com apenas uma linha de props.

```tsx
import useForm from './hooks/useForm';

interface FormData {
  user: { name: string; age: number };
}

const MyForm = () => {
  const onSubmit = (data: FormData) => {
    console.log("JSON Submetido:", data);
  };

  // Configura ID e Submit Handler diretamente no hook
  const { formProps, getValue, setValidators } = useForm<FormData>({
      id: "my-form-id",
      onSubmit: onSubmit
  });

  return (
    // Conecta ID, Ref e onSubmit automaticamente
    <form {...formProps}>
      <input name="user.name" required />
      <button type="submit">Enviar</button>
    </form>
  );
};
```

-----

## 🖥️ Sistema de Modais (Portal)

Um gerenciador de diálogos robusto que utiliza **React Portals** para renderizar o modal no `body`, evitando problemas de corte (`overflow: hidden`) em containers pais.

**Como usar:**

1.  Instancie o hook `useModal`.
2.  Chame `showModal` passando as configurações (Título, Conteúdo, Ações).
3.  Renderize o componente `<Modal>` passando as props do hook.

<!-- end list -->

```tsx
import { useModal } from './components/modal/useModal';
import Modal from './components/modal/Modal';

const MyPage = () => {
  const { showModal, modalProps } = useModal();

  const handleOpen = () => {
    showModal({
      title: "Confirmação",
      size: "sm",
      content: <p>Deseja excluir este item?</p>,
      // Injeção de Componentes Tipados ou JSX
      actions: <button onClick={modalProps.onClose}>Fechar</button>
    });
  };

  return (
    <>
      <button onClick={handleOpen}>Abrir Modal</button>
      {/* O Portal vive aqui */}
      <Modal {...modalProps} />
    </>
  );
};
```

-----

## 🧠 Leitura de Dados (`getValue`)

O sistema lê o DOM e converte para JSON estruturado automaticamente, com inferência de tipos.

```tsx
const name = getValue('user.name'); // Retorna string
const age = getValue('user.age');   // Retorna number
const all = getValue();             // Retorna o objeto FormData completo
```

-----

## 📋 Listas Dinâmicas (`useList`)

Para listas (arrays de objetos), separamos a responsabilidade:

1.  **React (`useList`):** Gerencia a **Estrutura** (IDs e quantidade).
2.  **DOM (`defaultValue`):** Gerencia os **Valores**.

<!-- end list -->

```tsx
// Inicializa com dados existentes ou vazio
const { items, add, remove } = useList(initialData);

return (
  <div>
    {items.map((item, index) => (
      <div key={item.id}>
         <input 
            name={`users[${index}].name`} 
            defaultValue={item.data.name} // Injeção Direta
         />
         <button onClick={() => remove(index)}>X</button>
      </div>
    ))}
    <button onClick={() => add()}>Novo</button>
  </div>
);
```

-----

## 🛡️ Validação em Duas Etapas

A biblioteca prioriza regras nativas e usa JS apenas para lógica de negócio.

1.  **Nativo:** Verifica `required`, `min`, `pattern`. Se falhar, para e exibe mensagem do browser.
2.  **Customizado:** Se o nativo passar, executa validadores JS.

<!-- end list -->

```tsx
setValidators({
  // Validação Simples
  email: (val) => !val.includes('@empresa.com') ? { message: "Use email corporativo" } : undefined,
  
  // Validação Cruzada (Cross-Field)
  confirmSenha: (val, field, formValues) => {
      if (val !== formValues.senha) return { message: "Senhas não conferem" };
  }
});
```

-----

## 🎨 Padrões de Componentes

### Pattern 1: Shadow Select (`Autocomplete`)

  * Mantém um `<select>` oculto (`clip: rect`) sincronizado.
  * Usa **Portals** para renderizar a lista fora de containers com `overflow: hidden`.
  * Suporta **Async Search** e **Infinite Scroll**.

### Pattern 2: Anchor Input (`StarRating` / `Switch`)

  * Renderiza um `<input>` físico (`pointer-events-auto`) posicionado estrategicamente (rodapé ou overlay).
  * Isso garante que o navegador reconheça o campo como validável e exiba o balão de erro nativo na posição correta.

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