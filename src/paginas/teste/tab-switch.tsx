import React from "react";
import showModal from "../../componentes/modal/hook";
import Switch from "../../componentes/switch";
import useForm from "../../hooks/use-form";

const DADOS_API = {
  modo_escuro: true,
  notificacoes: true,
  email_extra: "dev@empresa.com",
  termos: true, // Campo obrigatório
  newsletter: false,
};

const TabSwitchExample = () => {
  // Estado de UI (Ilha de Reatividade)
  const [showEmail, setShowEmail] = React.useState(false);
  const [_, setMode] = React.useState<"novo" | "editando">("novo");

  // --- HANDLERS DE CICLO DE VIDA ---

  const handleLoadData = () => {
    console.log("Carregando dados...");
    setMode("editando");

    // 1. Sincronia Explícita da UI
    setShowEmail(DADOS_API.notificacoes);

    // 2. Sincronia do DOM (Inputs)
    setTimeout(() => {
      resetSection("", DADOS_API);
    }, 50);
  };

  const handleReset = () => {
    setMode("novo");
    setShowEmail(false);
    setTimeout(() => {
      resetSection("", null);
    }, 50);
  };

  // --- HANDLER HÍBRIDO ---
  const handleNotifChange = (checked: boolean) => {
    setShowEmail(checked);
  };

  const onSubmit = (data: any) => {
    showModal({
      title: "Preferências Salvas",
      content: () => (
        <pre className="text-xs bg-black p-4 text-green-400">
          {JSON.stringify(data, null, 2)}
        </pre>
      ),
    });
  };
  const { formProps, resetSection } = useForm({id: "switch-form", onSubmit: onSubmit });

  return (<div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-cyan-400">
          Switch / Toggle v1.0
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleLoadData}
            type="button"
            className="px-3 py-1 text-xs bg-blue-900 text-blue-200 rounded hover:bg-blue-800 border border-blue-700"
          >
            Simular Edição
          </button>
          <button
            onClick={handleReset}
            type="button"
            className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 border border-gray-600"
          >
            Resetar
          </button>
        </div>
      </div>

      <form {...formProps}>
        {/* BLOCO 1: CONFIGURAÇÃO SIMPLES */}
        <div className="bg-gray-900/50 p-4 rounded border border-gray-700 mb-4">
          <h3 className="text-xs text-gray-500 uppercase mb-3 font-bold">
            Interface
          </h3>

          <Switch
            name="modo_escuro"
            label="Ativar Modo Escuro"
            defaultValue={false}
          />

          <Switch name="compacto" label="Modo Compacto (Small)" size="sm" />
        </div>

        {/* BLOCO 2: REATIVIDADE (CONDICIONAL) */}
        <div
          className={`p-4 rounded border transition-all duration-300 ${showEmail ? "bg-blue-900/10 border-blue-500/30" : "bg-gray-900/50 border-gray-700"}`}
        >
          <h3 className="text-xs text-gray-500 uppercase mb-3 font-bold">
            Comunicação
          </h3>

          <Switch
            name="notificacoes"
            label="Receber alertas por e-mail"
            onChange={handleNotifChange}
          />

          {/* Campo Condicional */}
          {showEmail && (
            <div className="mt-2 pl-14 animate-in fade-in slide-in-from-top-2">
              <input
                name="email_extra"
                type="email"
                required={showEmail} // Torna obrigatório se visível
                placeholder="Digite seu e-mail principal..."
                className="form-input w-full bg-gray-800 border-gray-600 text-white p-2 rounded text-sm focus:border-cyan-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* BLOCO 3: VALIDAÇÃO (REQUIRED) */}
        <div className="mt-4 bg-gray-900/50 p-4 rounded border border-gray-700">
          <h3 className="text-xs text-gray-500 uppercase mb-3 font-bold">
            Legal
          </h3>

          <Switch
            name="termos"
            label="Li e aceito os termos de serviço"
            required
            className="mb-1"
          />
          <p className="text-[10px] text-gray-500 pl-14">
            * Tente salvar sem marcar para ver o balão de erro no switch.
          </p>
        </div>

        <div className="flex justify-end border-t border-gray-700 pt-4 mt-6">
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-lg transition-transform active:scale-95"
          >
            Salvar Preferências
          </button>
        </div>
      </form>
    </div>);
};

export default TabSwitchExample;
