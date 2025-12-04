import React from 'react';
import useList from '../../hooks/list';
import useForm from '../../hooks/use-form';
import type { FormField } from '../../hooks/use-form/props';
import showModal from '../../componentes/modal/hook';

// --- DEFINIÇÃO DE TIPOS ---
interface IDespesa {
  descricao: string;
  valor: number;
  data: string;
}

interface IProjetoForm {
  projeto: {
    nome: string;
    orcamento_total: number;
    data_inicio: string;
    despesas: IDespesa[];
  };
}

// --- ESTADOS INICIAIS (CONSTANTES) ---
// Importante: Objetos estáveis para evitar loops infinitos no useEffect do useList
const EMPTY_PROJECT: IProjetoForm = {
  projeto: {
    nome: "",
    orcamento_total: 0,
    data_inicio: "",
    despesas: [] // Começa vazio ou com 1 item se quiser
  }
};

const MOCK_API_DATA: IProjetoForm = {
  projeto: {
    nome: "Reforma do Escritório Central",
    orcamento_total: 50000,
    data_inicio: "2024-01-15",
    despesas: [
      { descricao: "Cadeiras Ergonômicas (x10)", valor: 12000, data: "2024-01-20" },
      { descricao: "Monitores 4K (x5)", valor: 8500, data: "2024-01-22" },
      { descricao: "Pintura e Acabamento", valor: 4000, data: "2024-02-01" }
    ]
  }
};

const BudgetProjectForm = () => {

  const onSubmit = (data: IProjetoForm) => {
    // Cálculo para o modal
    const total = Number(data.projeto.orcamento_total);
    const despesas = data.projeto?.despesas || [];
    const gasto = despesas.reduce((acc, item) => acc + Number(item.valor), 0);

    showModal({
      title: "Orçamento Processado",
      content: () => (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4 bg-gray-900 p-3 rounded border border-gray-700">
            <div>
              <span className="block text-gray-500 text-xs">Status</span>
              <strong className="text-white">
                {total - gasto >= 0 ? "✅ Dentro do Orçamento" : "⛔ Estouro de Verba"}
              </strong>
            </div>
            <div className="text-right">
              <span className="block text-gray-500 text-xs">Saldo</span>
              <strong className={total - gasto >= 0 ? "text-green-400" : "text-red-400"}>
                R$ {(total - gasto).toFixed(2)}
              </strong>
            </div>
          </div>
          <pre className="text-xs bg-black p-3 rounded text-gray-300 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )
    });
  };


  const { formProps, setValidators, resetSection } = useForm<IProjetoForm>({
    id: "budget-form", onSubmit: onSubmit
  });

  // ESTADO DE DADOS (Data-Driven UI)
  const [formData, setFormData] = React.useState<IProjetoForm>(EMPTY_PROJECT);
  const [mode, setMode] = React.useState<'novo' | 'editando'>('novo');

  // HOOK DE LISTA (Conectado aos Dados)
  // O useList monitora formData.projeto.despesas. 
  // Se mudar, ele recria os itens com os dados corretos em 'item.data'.
  const { items, add, remove } = useList<IDespesa>(formData.projeto.despesas);

  // --- REGRAS DE VALIDAÇÃO ---
  React.useEffect(() => {
    setValidators({
      required: (val: any) => !val ? { message: "Obrigatório.", type: "error" } : undefined,

      validarOrcamento: (val: number) => {
        if (Number(val) <= 0) return { message: "Deve ser positivo.", type: "error" };
      },

      // Validação Cruzada: Soma vs Total
      validarValorDespesa: (_: number, _field: FormField | null, formValues: IProjetoForm) => {
        const totalDisponivel = Number(formValues.projeto?.orcamento_total || 0);
        if (totalDisponivel === 0) return { message: "Defina o orçamento.", type: "warning" };

        const despesas = formValues.projeto?.despesas || [];
        const totalGasto = despesas.reduce((acc, item) => acc + Number(item.valor || 0), 0);

        if (totalGasto > totalDisponivel) {
          const excesso = totalGasto - totalDisponivel;
          return { message: `Estouro de R$ ${excesso}!`, type: "error" };
        }
      },

      // Validação Cruzada: Datas
      validarDataDespesa: (val: string, _field: FormField | null, formValues: IProjetoForm) => {
        const inicioProjeto = formValues.projeto?.data_inicio;
        if (!inicioProjeto || !val) return;
        if (new Date(val) < new Date(inicioProjeto)) {
          return { message: `Anterior ao início (${inicioProjeto}).`, type: "error" };
        }
      }
    });
  }, [setValidators]);

  // --- HANDLERS (Ciclo de Vida) ---

  const handleLoadData = () => {
    setMode('editando');
    // 1. Atualiza o Estado React (Isso vai remontar o form devido à key)
    setFormData(MOCK_API_DATA);

    // 2. Garante sincronia fina do DOM (Opcional com key-remount, mas boa prática)
    setTimeout(() => {
      resetSection("", MOCK_API_DATA);
    }, 50);
  };

  const handleReset = () => {
    setMode('novo');
    setFormData(EMPTY_PROJECT);
    setTimeout(() => {
      resetSection("", null);
    }, 50);
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* BARRA DE FERRAMENTAS */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-cyan-400 font-bold">Orçamento Dinâmico</h2>
          <p className="text-xs text-gray-400">Lista aninhada com validação matemática.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLoadData}
            className="px-3 py-1 text-sm bg-blue-900 text-blue-200 rounded border border-blue-700 hover:bg-blue-800"
          >
            📥 Carregar API
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded border border-gray-600 hover:bg-gray-600"
          >
            ↺ Novo
          </button>
        </div>
      </div>

      {/* KEY: Força remontagem ao trocar de Novo <-> Editando para resetar defaultValues */}
      <form {...formProps} noValidate key={mode === 'editando' ? 'loaded' : 'empty'}>

        {/* --- PAI: CARD DO PROJETO --- */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            📁 Configuração
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome do Projeto</label>
              <input
                name="projeto.nome"
                defaultValue={formData.projeto.nome}
                className="form-input w-full bg-gray-900 border-gray-600 rounded p-2 text-white focus:border-cyan-500 outline-none"
                placeholder="Ex: Reforma"
                required
                data-validation="required"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Orçamento Total (R$)</label>
              <input
                type="number"
                name="projeto.orcamento_total"
                defaultValue={formData.projeto.orcamento_total || ""}
                className="form-input w-full bg-gray-900 border-gray-600 rounded p-2 text-green-400 font-mono focus:border-green-500 outline-none"
                placeholder="0.00"
                required
                data-validation="validarOrcamento"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Data Início</label>
              <input
                type="date"
                name="projeto.data_inicio"
                defaultValue={formData.projeto.data_inicio}
                className="form-input w-full bg-gray-900 border-gray-600 rounded p-2 text-white focus:border-cyan-500 outline-none"
                required
                data-validation="required"
              />
            </div>
          </div>
        </div>

        {/* --- FILHOS: LISTA DE DESPESAS --- */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-300 flex items-center gap-2">
              💸 Despesas Detalhadas
              <span className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-400">{items.length}</span>
            </h3>
            <button
              type="button"
              onClick={() => add()}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg"
            >
              <span>+</span> Adicionar
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {items.map((item, index) => (
              <div key={item.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors group animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="flex flex-col md:flex-row gap-4 items-start">

                  <div className="text-gray-600 font-mono text-xs pt-3 w-6">#{index + 1}</div>

                  {/* Descrição */}
                  <div className="flex-grow w-full">
                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Descrição</label>
                    <input
                      name={`projeto.despesas[${index}].descricao`}
                      // INJEÇÃO DIRETA (Data-Driven)
                      defaultValue={item.data.descricao}
                      className="form-input w-full bg-gray-900 border-gray-600 rounded p-2 text-sm text-white focus:border-purple-500 outline-none"
                      placeholder="Descrição do item..."
                      required
                      data-validation="required"
                    />
                    {/* Slot de Erro Automático (se usar o novo sistema de validação) */}
                    <div id={`error-projeto.despesas[${index}].descricao`} className="text-red-400 text-[10px] mt-1 hidden"></div>
                  </div>

                  {/* Valor */}
                  <div className="w-full md:w-32">
                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      name={`projeto.despesas[${index}].valor`}
                      defaultValue={item.data.valor || ""}
                      className="form-input w-full bg-gray-900 border-gray-600 rounded p-2 text-sm text-white font-mono focus:border-purple-500 outline-none"
                      placeholder="0.00"
                      required
                      data-validation="validarValorDespesa"
                    />
                  </div>

                  {/* Data */}
                  <div className="w-full md:w-40">
                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Data</label>
                    <input
                      type="date"
                      name={`projeto.despesas[${index}].data`}
                      defaultValue={item.data.data}
                      className="form-input w-full bg-gray-900 border-gray-600 rounded p-2 text-sm text-white focus:border-purple-500 outline-none"
                      required
                      data-validation="validarDataDespesa"
                    />
                  </div>

                  {/* Remover */}
                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-gray-500 hover:text-red-400 transition-colors p-2"
                      title="Remover"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-lg text-gray-500">
                Nenhuma despesa lançada.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-700 mt-6">
          <button
            type="submit"
            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg hover:shadow-green-900/30 transition-all transform hover:-translate-y-1 active:translate-y-0"
          >
            {mode === 'novo' ? 'Criar Orçamento' : 'Salvar Alterações'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default BudgetProjectForm;