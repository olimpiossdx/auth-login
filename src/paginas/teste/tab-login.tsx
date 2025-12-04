
import showModal from "../../componentes/modal/hook";
import useForm from "../../hooks/use-form";

interface ILoginFormValues {
  email: string;
  senha?: string;
};

const LoginForm: React.FC = ({ }) => {
  const onSubmit = (data: ILoginFormValues) => {
    // showModal("Login bem-sucedido!", "Dados: " + JSON.stringify(data));
    showModal({
      title: "Login bem-sucedido!",
      content: () => (
        <pre className="text-xs bg-black p-4 rounded text-green-400 overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      ),
      closeOnBackdropClick: false, // Obriga interação
      onClose: () => console.log("Fechou!"), // Callback
    });
  };
  const { formProps } = useForm<ILoginFormValues>({ id: "login-form", onSubmit: onSubmit });

  return (<div className="bg-gray-800 p-6 rounded-lg shadow-xl">
    <h3 className="text-xl font-bold mb-4 text-cyan-400">
      1. Campos Nativos
    </h3>
    <form {...formProps} noValidate>
      <div className="mb-4">
        <label className="block mb-1 text-gray-300" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="form-input"
          required
          pattern="^\S+@\S+$"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 text-gray-300" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          className="form-input"
          required
          minLength={6}
        />
      </div>
      <button
        type="submit"
        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors"
      >
        Entrar
      </button>
    </form>
  </div >);
};

export default LoginForm;
