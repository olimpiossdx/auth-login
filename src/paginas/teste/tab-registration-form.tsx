import React from "react";
import showModal from "../../componentes/modal/hook";
import useForm from "../../hooks/use-form";
import type { FormField, ValidationResult } from "../../hooks/use-form/props";

// 2. Cenário: Validação Customizada (Nativo)
interface IRegFormValues {
  senha?: string;
  confirmarSenha?: string;
};

const RegistrationForm = () => {
  const onSubmit = (data: IRegFormValues) => {
    showModal({
      title: "Cadastro realizado!",
      content: () => (
        <pre className="text-xs bg-black p-4 rounded text-green-400 overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      ),
      closeOnBackdropClick: false, // Obriga interação
      props: {
        content: { className: "whitespace-pre-wrap" }
      },
      onClose: () => console.log("Fechou!"), // Callback
    });
  };
  const { handleSubmit, setValidators, formId } = useForm<IRegFormValues>({ id: "reg-form", onSubmit: onSubmit });

  const validarSenha = React.useCallback((value: any, _: FormField | null, formValues: IRegFormValues): ValidationResult =>
    value !== formValues.senha
      ? { message: "As senhas não correspondem", type: "error" }
      : undefined,
    []);

  React.useEffect(() => setValidators({ validarSenha }), [setValidators, validarSenha]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
      <h3 className="text-xl font-bold mb-4 text-cyan-400">
        2. Validação Customizada (Nativo)
      </h3>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-4">
          <label className="block mb-1 text-gray-300" htmlFor="reg_senha">
            Senha
          </label>
          <input
            id="reg_senha"
            name="senha"
            type="password"
            className="form-input"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-gray-300" htmlFor="confirmarSenha">
            Confirmar Senha
          </label>
          <input
            id="confirmarSenha"
            name="confirmarSenha"
            type="password"
            className="form-input"
            required
            data-validation="validarSenha"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded"
        >
          Cadastrar
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm