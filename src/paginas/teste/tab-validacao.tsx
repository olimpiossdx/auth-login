import React from "react";
import useForm from "../../hooks/use-form";
import showModal from "../../componentes/modal/hook";

// CSS local para demonstração (idealmente estaria no global.css ou tailwind)
const STYLES = `
  /* Estado de Erro no Input */
  .form-input[aria-invalid="true"] {
    border-color: #ef4444 !important;
    animation: shake 0.3s ease-in-out;
  }
  
  /* Slot de Erro (Controlado via data-visible) */
  .error-slot {
    color: #ef4444;
    font-size: 0.75rem;
    margin-top: 0.25rem;
    font-weight: 500;
    min-height: 1.2em;
    
    /* Animação de entrada */
    opacity: 0;
    transform: translateY(-5px);
    transition: all 0.2s ease-out;
  }
  
  .error-slot[data-visible="true"] {
    opacity: 1;
    transform: translateY(0);
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
`;

const ValidationFeedbackExample = () => {

  const onSubmit = (data: any) => {
    showModal({
      title: "Sucesso!",
      content: () => (<>
        <div className="text-green-400">Login validado com sucesso.</div>
        <pre className="text-xs bg-black p-4 rounded text-green-400 overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </>),
    });
  };
  const { formProps, setValidators } = useForm({ onSubmit });

  React.useEffect(() => {
    setValidators({
      validarEmail: (val: string) => {
        if (!val) return { message: "O e-mail é obrigatório.", type: "error" };
        if (!val.includes("@"))
          return { message: "Falta o '@'.", type: "error" };
        if (val.length < 5)
          return { message: "E-mail muito curto.", type: "error" };
      },
      validarSenha: (val: string) => {
        if (!val) return { message: "Senha necessária.", type: "error" };
        if (val.length < 6)
          return { message: "Mínimo 6 caracteres.", type: "error" };
        if (!/[A-Z]/.test(val))
          return { message: "Falta uma letra maiúscula.", type: "error" };
      },
    });
  }, [setValidators]);

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700 max-w-md mx-auto">
      <style>{STYLES}</style>

      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-white mb-1">Login Inteligente</h2>
        <p className="text-xs text-gray-400">
          Teste: Digite errado, saia, depois corrija.
        </p>
      </div>

      <form  {...formProps} noValidate>
        {/* CAMPO E-MAIL */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            E-mail
          </label>
          <input
            type="email"
            name="email"
            className="form-input w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-2 text-white outline-none focus:border-cyan-500 transition-colors"
            placeholder="seu@email.com"
            data-validation="validarEmail"
          />
          {/* Slot de Erro (Convenção: id="error-{name}") */}
          <div id="error-email" className="error-slot"></div>
        </div>

        {/* CAMPO SENHA */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Senha
          </label>
          <input
            type="password"
            name="senha"
            className="form-input w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-2 text-white outline-none focus:border-cyan-500 transition-colors"
            placeholder="••••••"
            data-validation="validarSenha"
          />
          <div id="error-senha" className="error-slot"></div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-linear-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-lg hover:scale-[1.02] transition-transform active:scale-95"
        >
          Entrar
        </button>
      </form>
    </div>
  );
};

export default ValidationFeedbackExample;
