import React from "react";
import StarRating from "../../componentes/start-rating";
import useForm from "../../hooks/use-form";
import showModal from "../../componentes/modal/hook";

interface IFormValues {
  nota_padrao: number;
  nota_nps: number; // 0 a 10
  nota_readonly: number;
};

const TabStarRatingExample = () => {
  const { handleSubmit, formId } = useForm<IFormValues>("star-rating-example");
  const [npsMessage, setNpsMessage] = React.useState("");

  const onSubmit = (data: IFormValues) => {
    showModal({
      title: "Avaliações Recebidas",
      content: () => (
        <pre className="text-xs bg-black p-4 rounded text-green-400">
          {JSON.stringify(data, null, 2)}
        </pre>
      ),
    });
  };

  // Callback de Reatividade (onChange)
  const handleNpsChange = (val: number) => {
    if (val <= 6) {
      setNpsMessage("😟 Poxa, que pena! O que podemos melhorar?");
    } else if (val <= 8) {
      setNpsMessage("😐 Obrigado! Vamos tentar melhorar.");
    } else {
      setNpsMessage("🤩 Uau! Ficamos muito felizes!");
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
      <h2 className="text-xl font-bold mb-6 text-cyan-400">
        Star Rating (v2.0)
      </h2>

      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* 1. PADRÃO */}
        <div className="mb-6 p-4 bg-gray-900 rounded-md border border-gray-700">
          <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase">
            1. Padrão (5 Estrelas)
          </h3>
          <StarRating
            name="nota_padrao"
            label="O que achou do serviço?"
            required
          />
        </div>

        {/* 2. CUSTOMIZADO (10 Estrelas + onChange) */}
        <div className="mb-6 p-4 bg-gray-900 rounded-md border border-gray-700">
          <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase">
            2. NPS (10 Estrelas + Custom CSS)
          </h3>

          <StarRating
            name="nota_nps"
            label="Qual a probabilidade de nos recomendar?"
            maxStars={10}
            onChange={handleNpsChange} // Reatividade
            starClassName="w-6 h-6 text-purple-500" // Cor Customizada
          />

          {npsMessage && (
            <div className="mt-2 text-sm text-purple-300 animate-in fade-in slide-in-from-top-1">
              {npsMessage}
            </div>
          )}
        </div>

        {/* 3. READ ONLY */}
        <div className="mb-6 p-4 bg-gray-900 rounded-md border border-gray-700">
          <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase">
            3. Somente Leitura (Display)
          </h3>
          <StarRating
            name="nota_readonly"
            label="Média atual dos usuários"
            initialValue={4}
            readOnly
            starClassName="w-5 h-5 text-gray-400"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="py-2 px-6 rounded bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg"
          >
            Enviar Avaliação
          </button>
        </div>
      </form>
    </div>
  );
};

export default TabStarRatingExample;
