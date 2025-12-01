import React from "react";
import showModal from "../../componentes/modal/hook";
import useForm from "../../hooks/use-form";
import type { FormField } from "../../hooks/use-form/props";

// Estrutura de dados do formulário
interface IFormValues {
  aceite: boolean;            // Unico (Boolean)
  plano: string | boolean;    // Unico (Valor)
  interesses: string[];       // Grupo Estático
  tarefas: string[];          // Grupo Dinâmico
  motivo_cancelamento?: string; // Campo Condicional
}

// MOCK: Dados que viriam de uma API para edição
const DADOS_API: IFormValues = {
  aceite: true,
  plano: 'premium',
  // IMPORTANTE: Traz 'cancelamento' para testar se a UI reage
  interesses: ['backend', 'cancelamento'],
  tarefas: ['setup'],
  motivo_cancelamento: 'Mudança de Stack Tecnológica'
};


const CheckboxGroupForm = () => {
  const { handleSubmit, setValidators, formId, resetSection } = useForm<IFormValues>("checkbox-group-form");

  // UI States
  const [mode, setMode] = React.useState<'novo' | 'editando'>('novo');
  const [tarefasExtras, setTarefasExtras] = React.useState<number[]>([]);

  // Ilha de Reatividade: Controla visibilidade do campo "Motivo"
  const [isCancelando, setIsCancelando] = React.useState(false);

  // --- VALIDAÇÕES (CORRIGIDAS) ---
  // Usamos 'any' no valor para satisfazer a interface genérica ValidateFn<T>
  // Na prática, sabemos que 'values' será string[] ou undefined vindo do checkbox group.

  const validarInteresses = React.useCallback((values: string[]) => {
    if (!values || (Array.isArray(values) && values.length === 0)) {
      return { message: "Selecione ao menos uma área.", type: "error" as const };
    }
    if (Array.isArray(values) && values.length > 3) {
      return { message: "Escolha no máximo 3 focos.", type: "error" as const };
    }
  }, []);

  // Validação Cruzada: Depende do valor de 'interesses'
  const validarMotivo = React.useCallback((valor: any, _: FormField | null, formValues: IFormValues) => {
    const temCancelamento = formValues.interesses?.includes('cancelamento');

    // Se marcou cancelar E não preencheu motivo -> Erro
    if (temCancelamento && !valor) {
      return { message: "Por favor, nos diga o motivo da saída.", type: "error" as const };
    }
  }, []);

  React.useEffect(() => {
    setValidators({ validarInteresses, validarMotivo });
  }, [setValidators, validarInteresses, validarMotivo]);

  // --- HANDLERS DE CICLO DE VIDA (CORRIGIDOS) ---

  // --- O TESTE DE FOGO (CORRIGIDO COM SETTIMEOUT) ---
  // Solução para Race Condition:
  // 1. Mandamos o React mostrar o campo (setIsCancelando).
  // 2. Usamos setTimeout para esperar o React terminar de desenhar.
  // 3. Preenchemos o valor no DOM (resetSection).

  const handleLoadData = () => {
    console.log("Simulando carga...");
    setMode('editando');

    // 1. Atualiza a UI Reativa PRIMEIRO (Faz o input aparecer)
    const deveMostrarCancelamento = DADOS_API.interesses.includes('cancelamento');
    setIsCancelando(deveMostrarCancelamento);

    // 2. Aguarda o Render e Sincroniza o DOM
    setTimeout(() => {
      resetSection("", DADOS_API);
    }, 0);
  };

  const handleCancel = () => {
    if (mode === 'novo') {
      resetSection("", null);
      setIsCancelando(false); // Reseta UI
    } else {
      // 1. Restaura UI para o estado original
      const estavaCancelando = DADOS_API.interesses.includes('cancelamento');
      setIsCancelando(estavaCancelando);

      // 2. Aguarda o Render e Restaura valores
      setTimeout(() => {
        resetSection("", DADOS_API);
      }, 0);
    }
  };

  // Este handler continua existindo para interações manuais do usuário (cliques reais)
  const handleCancelamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Interação manual ou sincronizada:", e.target.checked);
    setIsCancelando(e.target.checked);
  };

  const onSubmit = (data: IFormValues) => {
    showModal({
      title: mode === 'novo' ? "Criar Registro" : "Salvar Edição",
      content: () => (
        <pre className="text-xs bg-black p-4 rounded text-green-400 overflow-auto border border-gray-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      ),
    });
  };

  const handleClickSairEdicao = () => {
    setMode('novo');
    resetSection("", null);
    setIsCancelando(false);
  };
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 max-w-5xl mx-auto">

      <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
            {mode === 'novo' ? '✨ Novo Cadastro' : '✏️ Editando Registro'}
          </h2>
          <p className="text-xs text-gray-400">Teste de Load/Reset com Sincronia Explícita.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLoadData}
            disabled={mode === 'editando'}
            className="px-3 py-1.5 text-sm bg-blue-900 text-blue-200 rounded hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-blue-800"
          >
            📥 Simular Edição (API)
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors border border-gray-600"
          >
            ↺ {mode === 'novo' ? 'Limpar Tudo' : 'Desfazer Alterações'}
          </button>

          {/* NOVO: Botão para Sair do Modo Edição */}
          {mode === 'editando' && (
            <button
              type="button"
              onClick={handleClickSairEdicao}
              className="px-3 py-1.5 text-sm bg-red-900/50 text-red-200 rounded hover:bg-red-900 transition-colors border border-red-800"
            >
              ✕ Cancelar
            </button>
          )}
        </div>
      </div>

      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className="grid md:grid-cols-2 gap-8 animate-in fade-in zoom-in duration-300">

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-700 pb-1">1. Unitários</h3>

          <div className="bg-gray-900/50 p-4 rounded border border-gray-700 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" name="aceite" className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-offset-gray-900" />
              <span className="text-gray-300">Li e aceito os termos</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" name="plano" value="premium" className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-offset-gray-900" />
              <span className="text-gray-300">Upgrade para Premium</span>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-700 pb-1">2. Grupo & Reatividade</h3>

          <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
            <div className="mb-2">
              <span className="font-bold text-white block">Áreas de Interesse <span className="text-red-400">*</span></span>
            </div>

            {/* MESTRE: Auto-gerenciado via atributo */}
            <label className="flex items-center gap-2 text-cyan-400 font-bold mb-2 cursor-pointer w-fit select-none hover:opacity-80">
              <input type="checkbox" data-checkbox-master="interesses" className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-offset-gray-900" />
              Selecionar Todos
            </label>

            <div className="pl-4 border-l-2 border-gray-700 ml-1.5 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer">
                <input type="checkbox" name="interesses" value="frontend" data-validation="validarInteresses"
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-offset-gray-900" />
                Frontend
              </label>
              <label className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer">
                <input type="checkbox" name="interesses" value="backend"
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-offset-gray-900" />
                Backend
              </label>
              <label className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer">
                <input type="checkbox" name="interesses" value="fullstack" disabled
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-offset-gray-900" />
                full stack
              </label>

              {/* GATILHO REATIVO */}
              <label className={`flex items-center gap-2 font-medium p-1 rounded -ml-1 transition-colors cursor-pointer ${isCancelando ? 'bg-yellow-900/20 text-yellow-200' : 'text-gray-400 hover:text-yellow-200'}`}>
                <input
                  type="checkbox"
                  name="interesses"
                  value="cancelamento"
                  onChange={handleCancelamentoChange}
                  className="w-4 h-4 rounded border-yellow-600 bg-gray-700 text-yellow-500 focus:ring-offset-gray-900"
                />
                Quero Cancelar Conta
              </label>

              {/* ILHA DE REATIVIDADE: Renderizado pelo React State */}
              {isCancelando && (
                <div className="mt-2 animate-in slide-in-from-top-2 fade-in duration-300 pl-6 border-l-2 border-yellow-900/50 ml-1">
                  <label className="text-xs text-yellow-500 block mb-1 font-bold">Motivo Obrigatório:</label>
                  <input
                    type="text"
                    name="motivo_cancelamento"
                    data-validation="validarMotivo"
                    placeholder="Por que você está saindo?"
                    className="w-full bg-gray-800 border border-yellow-700/50 rounded px-2 py-1 text-sm text-white focus:border-yellow-500 outline-none placeholder-gray-600"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BLOCO 3: Dinâmico (Mantido igual) */}
        <div className="space-y-4 md:col-span-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-700 pb-1 flex justify-between items-center">
            3. Lista Dinâmica (Observer)
            <button type="button" onClick={() => setTarefasExtras(p => [...p, Date.now()])} className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-0.5 rounded text-xs lowercase border border-gray-600 transition-colors">
              + add item
            </button>
          </h3>
          <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
            <label className="flex items-center gap-2 text-purple-400 font-bold mb-2 cursor-pointer w-fit hover:opacity-80">
              <input type="checkbox" data-checkbox-master="tarefas" className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-offset-gray-900" />
              Marcar Concluídas
            </label>
            <div className="pl-4 border-l-2 border-gray-700 ml-1.5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer">
                <input type="checkbox" name="tarefas" value="setup" className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-offset-gray-900" />
                Setup Inicial
              </label>
              {tarefasExtras.map((id, idx) => (
                <label key={id} className="flex items-center gap-2 text-gray-300 animate-in zoom-in fade-in hover:text-white cursor-pointer">
                  <input type="checkbox" name="tarefas" value={`task_${id}`} className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-offset-gray-900" />
                  Extra #{idx + 1}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end pt-4 border-t border-gray-800 gap-4">
          <button type="submit" className="py-2 px-8 rounded bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg active:scale-95 transition-transform hover:shadow-green-900/20">
            {mode === 'novo' ? 'Salvar Registro' : 'Atualizar Dados'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CheckboxGroupForm;