import React from "react";
import showModal from "../../componentes/modal/hook";
import useList from "../../hooks/list";
import useForm from "../../hooks/use-form";

// --- TIPOS ---
interface IProduct {
  name: string;
  stock: number;
  price: number;
}

interface ICategory {
  name: string;
  active: boolean;
  products: IProduct[];
}

interface IInventoryForm {
  storeName: string;
  categories: ICategory[];
}

// --- MOCK DATA ---
const MOCK_INVENTORY: IInventoryForm = {
  storeName: "Supermercado Central",
  categories: [
    {
      name: "Bebidas",
      active: true,
      products: [
        { name: "Refrigerante Cola", stock: 100, price: 5.50 },
        { name: "Suco de Laranja", stock: 50, price: 8.90 }
      ]
    },
    {
      name: "Padaria",
      active: true,
      products: [
        { name: "Pão Francês", stock: 500, price: 0.80 },
        { name: "Bolo de Cenoura", stock: 10, price: 25.00 }
      ]
    }
  ]
};

const EMPTY_INVENTORY: IInventoryForm = {
  storeName: "",
  categories: []
};

// CORREÇÃO: Referência estável para evitar loop infinito no useEffect do useList
const EMPTY_PRODUCTS: IProduct[] = [];

// --- SUB-COMPONENTE: PRODUTOS (NÍVEL 2) ---
const ProductList = ({ categoryIndex, initialProducts = EMPTY_PRODUCTS }: { categoryIndex: number, initialProducts?: IProduct[] }) => {
  // Hook useList aninhado: Gerencia a lista de produtos desta categoria específica
  const { items, add, remove } = useList<IProduct>(initialProducts);

  return (
    <div className="mt-3 pl-4 border-l-2 border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs text-gray-500 uppercase font-bold">Produtos ({items.length})</h4>
        <button type="button" onClick={() => add()} className="text-[10px] bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-gray-600">
          + Add Produto
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center animate-in fade-in slide-in-from-left-1">
            <div className="col-span-5">
              <input
                name={`categories[${categoryIndex}].products[${index}].name`}
                defaultValue={item.data.name}
                placeholder="Nome do Produto"
                className="form-input w-full bg-gray-900 border-gray-600 rounded p-1.5 text-xs text-white focus:border-purple-500 outline-none"
                required
              />
            </div>
            <div className="col-span-3">
              <input
                type="number"
                name={`categories[${categoryIndex}].products[${index}].stock`}
                defaultValue={item.data.stock}
                placeholder="Qtd"
                className="form-input w-full bg-gray-900 border-gray-600 rounded p-1.5 text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>
            <div className="col-span-3">
              <input
                type="number"
                step="0.01"
                name={`categories[${categoryIndex}].products[${index}].price`}
                defaultValue={item.data.price}
                placeholder="R$"
                className="form-input w-full bg-gray-900 border-gray-600 rounded p-1.5 text-xs text-white focus:border-purple-500 outline-none"
                required
              />
            </div>
            <div className="col-span-1 text-center">
              <button type="button" onClick={() => remove(index)} className="text-gray-600 hover:text-red-400 text-xs font-bold">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- COMPONENTE PAI ---
const NestedListForm = () => {

  const onSubmit = (data: IInventoryForm) => {
    showModal({
      title: "Inventário Salvo",
      content: () => <pre className="text-xs bg-black p-4 text-green-400 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
    });
  };

  const { formProps, resetSection, setValidators } = useForm<IInventoryForm>({ id: "nested-list-form", onSubmit: onSubmit });

  // Estados Data-Driven
  const [formData, setFormData] = React.useState<IInventoryForm>(EMPTY_INVENTORY);
  const [mode, setMode] = React.useState<'novo' | 'editando'>('novo');

  // Hook useList Raiz: Gerencia as Categorias
  const { items, add, remove } = useList<ICategory>(formData.categories);

  // --- VALIDAÇÃO ---
  React.useEffect(() => {
    setValidators({
      // Validação de Estoque Mínimo (Exemplo de lógica em lista aninhada)
      validarEstoque: (val: number) => {
        if (Number(val) < 0) return { message: "Estoque inválido", type: "error" };
        if (Number(val) < 10) return { message: "Estoque baixo!", type: "warning" };
      }
    });
  }, [setValidators]);

  // --- HANDLERS ---
  const handleLoadData = () => {
    setMode('editando');
    // 1. Atualiza Estado React (Recria a estrutura de listas aninhadas via key-remount)
    setFormData(MOCK_INVENTORY);

    // 2. Sincronia DOM fina (Preenche valores que o defaultValue não cobriria se fosse controlado, mas aqui é extra safety)
    setTimeout(() => {
      resetSection("", MOCK_INVENTORY);
    }, 50);
  };

  const handleReset = () => {
    setMode('novo');
    setFormData(EMPTY_INVENTORY);
    setTimeout(() => resetSection("", null), 50);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Inventário (Nested Lists)</h2>
          <p className="text-xs text-gray-400">Demonstração de <code>useList</code> dentro de <code>useList</code>.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleLoadData} className="px-3 py-1 text-xs bg-blue-900 text-blue-200 rounded hover:bg-blue-800 border border-blue-700">
            📥 Carregar Mock
          </button>
          <button onClick={handleReset} className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 border border-gray-600">
            ↺ Limpar
          </button>
        </div>
      </div>

      {/* KEY para forçar remontagem limpa ao trocar dados base */}
      <form {...formProps} key={mode === 'editando' ? 'loaded' : 'empty'}>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-1">Nome da Loja</label>
          <input
            name="storeName"
            defaultValue={formData.storeName}
            className="form-input w-full bg-gray-900 border-gray-600 rounded p-2 text-white focus:border-cyan-500 outline-none"
            required
          />
        </div>

        {/* LISTA DE CATEGORIAS (NÍVEL 1) */}
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-gray-700 pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Categorias</h3>
            <button type="button" onClick={() => add()} className="text-xs bg-green-700 text-white px-3 py-1.5 rounded hover:bg-green-600 shadow-md">
              + Nova Categoria
            </button>
          </div>

          {items.map((categoryItem, index) => (
            <div key={categoryItem.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-600 relative group">

              {/* Cabeçalho da Categoria */}
              <div className="flex gap-4 items-center mb-2">
                <div className="flex-grow">
                  <input
                    name={`categories[${index}].name`}
                    defaultValue={categoryItem.data.name}
                    placeholder="Nome da Categoria (ex: Limpeza)"
                    className="form-input w-full bg-gray-900 border-gray-600 rounded p-2 text-sm text-white font-bold focus:border-cyan-500 outline-none"
                    required
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    name={`categories[${index}].active`}
                    defaultChecked={categoryItem.data.active !== false} // Default true
                    className="rounded border-gray-600 bg-gray-700 text-cyan-500"
                  />
                  Ativo
                </label>
                <button type="button" onClick={() => remove(index)} className="text-gray-500 hover:text-red-400 p-1 ml-2" title="Remover Categoria">
                  ✕
                </button>
              </div>

              {/* LISTA DE PRODUTOS (NÍVEL 2) */}
              {/* Passamos os produtos desta categoria específica para o sub-componente */}
              <ProductList
                categoryIndex={index}
                initialProducts={categoryItem.data.products}
              />
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-lg text-gray-600 italic">
              Nenhuma categoria cadastrada.
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 mt-6 border-t border-gray-700">
          <button type="submit" className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded shadow-lg transition-transform active:scale-95">
            Salvar Inventário
          </button>
        </div>
      </form>
    </div>
  );
};

export default NestedListForm;