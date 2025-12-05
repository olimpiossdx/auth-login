import React  from "react";
import { Terminal, ShieldCheck, AlertOctagon } from "lucide-react";
import Alert from "../../componentes/alert";
import useForm from "../../hooks/use-form";
const AlertExample = () => {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showInfo, setShowInfo] = React.useState(true);

  const onSubmit = (_: any) => {
    // Simula erro de servidor
    setServerError(
      "Erro 500: Não foi possível conectar ao banco de dados de CEP."
    );
  };
  const { formProps } = useForm({id:"alert-form", onSubmit:onSubmit});

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 max-w-5xl mx-auto">
      <div className="mb-8 border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-white">Alertas Contextuais</h2>
        <p className="text-gray-400 text-sm mt-1">
          Componentes de feedback estático para mensagens persistentes ou de
          sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* COLUNA 1: EXEMPLO INTERATIVO (FORMULÁRIO) */}
        <div>
          <h3 className="text-xs font-bold text-cyan-400 uppercase mb-4 tracking-wider">
            1. Feedback de Aplicação (Live)
          </h3>

          <div className="space-y-4 mb-6 min-h-20">
            {/* 1. Alerta Controlado (Fecha no X) */}
            {showInfo && (
              <Alert
                variant="info"
                title="Dica de Preenchimento"
                onClose={() => setShowInfo(false)}
              >
                Preencha os dados com atenção para evitar retrabalho no
                cadastro.
              </Alert>
            )}

            {/* 2. Alerta de Erro (Aparece no Submit) */}
            {serverError && (
              <Alert
                variant="error"
                title="Falha no Processamento"
                onClose={() => setServerError(null)}
              >
                {serverError}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setServerError(null);
                      alert("Tentando novamente...");
                    }}
                    className="text-xs font-bold bg-red-900/40 hover:bg-red-900/60 text-red-100 px-3 py-1 rounded border border-red-800/50 transition-colors"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </Alert>
            )}
          </div>

          <form {...formProps} className="space-y-4 border-t border-gray-700 pt-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">CEP</label>
              <input
                name="cep"
                className="form-input w-full bg-gray-900 border-gray-600 rounded p-2.5 text-white focus:border-cyan-500 outline-none transition-colors"
                placeholder="00000-000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Cidade
                </label>
                <input
                  name="cidade"
                  className="form-input w-full bg-gray-900 border-gray-600 rounded p-2.5 text-white focus:border-cyan-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Estado
                </label>
                <input
                  name="uf"
                  className="form-input w-full bg-gray-900 border-gray-600 rounded p-2.5 text-white focus:border-cyan-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold shadow-lg transition-transform active:scale-95"
              >
                Simular Erro
              </button>
            </div>
          </form>
        </div>

        {/* COLUNA 2: GALERIA DE VARIANTES (ESTÁTICO) */}
        <div className="space-y-6 border-l border-gray-700 pl-0 lg:pl-10">
          <h3 className="text-xs font-bold text-purple-400 uppercase mb-4 tracking-wider">
            2. Galeria de Variantes & Conteúdo Rico
          </h3>

          {/* Success */}
          <Alert variant="success" title="Pagamento Aprovado">
            Sua transação <strong>#8493</strong> foi processada com sucesso. O
            recibo foi enviado por e-mail.
          </Alert>

          {/* Warning com Link */}
          <Alert variant="warning" title="Armazenamento Cheio">
            Você está usando 95% do seu espaço disponível. <br />
            <a href="#" className="underline hover:text-white font-medium">
              Faça upgrade do seu plano
            </a>{" "}
            para continuar enviando arquivos.
          </Alert>

          {/* Neutral com Ícone Customizado e Mono-espaçado */}
          <Alert
            variant="neutral"
            title="System Log"
            icon={<Terminal size={18} />}
            className="font-mono text-xs"
          >
            <span className="opacity-70">2023-10-27 10:00:00</span> - Server
            initialized.
            <br />
            <span className="opacity-70">2023-10-27 10:00:01</span> - Database
            connected.
          </Alert>

          {/* Error com Lista */}
          <Alert
            variant="error"
            title="Não foi possível salvar"
            icon={<AlertOctagon size={20} />}
          >
            Encontramos os seguintes problemas:
            <ul className="list-disc pl-4 mt-1 space-y-1 opacity-90">
              <li>O nome de usuário já existe.</li>
              <li>A senha não atende aos requisitos de segurança.</li>
            </ul>
          </Alert>

          {/* Success com Custom Icon */}
          <Alert
            variant="success"
            icon={<ShieldCheck size={20} className="text-green-400" />}
          >
            <div>
              <h4 className="font-bold text-green-300">Ambiente Seguro</h4>
              <p className="text-xs mt-1">
                Sua conexão está criptografada de ponta a ponta.
              </p>
            </div>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default AlertExample;
