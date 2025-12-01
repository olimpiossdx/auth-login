import React from 'react';
import Autocomplete from '../../componentes/autocomplete';
import useForm from '../../hooks/use-form';
import showModal from '../../componentes/modal/hook';

// Estilos locais para feedback de erro (borda vermelha + mensagem)
const STYLES = `
  .form-input.is-touched:invalid {
    border-color: #ef4444 !important;
  }
  /* Estilo para Radio/Checkbox inválidos */
  input[type="radio"].is-touched:invalid,
  input[type="checkbox"].is-touched:invalid {
    outline: 2px solid #ef4444;
    outline-offset: 2px;
  }
  
  .error-msg {
    color: #ef4444;
    font-size: 0.75rem;
    margin-top: 4px;
    min-height: 1.2em;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  /* Mostra erro quando o texto é injetado */
  .error-msg[data-visible="true"] {
    opacity: 1;
  }
`;

const CARGOS = [
  { value: 'dev', label: 'Desenvolvedor' },
  { value: 'design', label: 'Designer' },
  { value: 'pm', label: 'Product Manager' },
];

const RegistrationComplexExample = () => {
  const { handleSubmit, setValidators, formId } = useForm("complex-reg-form");

  // Regras de Validação
  React.useEffect(() => {
    setValidators({
      validarNome: (val: string) => {
        if (!val) return { message: "Nome é obrigatório.", type: "error" };
        if (val.split(' ').length < 2) return { message: "Digite sobrenome.", type: "error" };
      },
      validarGenero: (val: string) => {
        if (!val) return { message: "Selecione uma opção.", type: "error" };
      },
      validarSkills: (val: string[]) => {
        if (!val || val.length < 2) return { message: "Selecione pelo menos 2 skills.", type: "error" };
      },
      validarCargo: (val: string) => {
        if (!val) return { message: "Cargo é obrigatório.", type: "error" };
      },
      validarTermos: (val: boolean) => {
        if (!val) return { message: "Você deve aceitar os termos.", type: "error" };
      }
    });
  }, [setValidators]);

  const onSubmit = (data: any) => {
    showModal({
      title: "Cadastro Realizado!",
      content: () => (
        <pre className="text-xs bg-black p-4 rounded text-green-400">
          {JSON.stringify(data, null, 2)}
        </pre>
      )
    });
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700 max-w-2xl mx-auto">
      <style>{STYLES}</style>

      <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-2">
        Cadastro Completo
      </h2>

      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

        {/* 1. INPUT TEXTO */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nome Completo</label>
          <input
            type="text"
            name="nome"
            className="form-input w-full bg-gray-900 border border-gray-600 rounded p-2.5 text-white focus:border-cyan-500 outline-none"
            placeholder="Ex: Ana Silva"
            data-validation="validarNome"
          />
          <div id="error-nome" className="error-msg"></div>
        </div>

        {/* 2. RADIO GROUP */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Modalidade</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="modalidade" value="remoto" data-validation="validarGenero"
                className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500" />
              <span className="text-gray-300">Remoto</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="modalidade" value="hibrido"
                className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500" />
              <span className="text-gray-300">Híbrido</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="modalidade" value="presencial"
                className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500" />
              <span className="text-gray-300">Presencial</span>
            </label>
          </div>
          {/* Slot de erro ancorado no primeiro radio via data-validation */}
          <div id="error-modalidade" className="error-msg"></div>
        </div>

        {/* 3. AUTOCOMPLETE (Select Oculto) */}
        <div>
          <Autocomplete
            name="cargo"
            label="Cargo Pretendido"
            options={CARGOS}
            placeholder="Selecione..."
            validationKey="validarCargo"
            required
            className="mb-0" // Remove margem padrão para colar no erro
          />
          <div id="error-cargo" className="error-msg"></div>
        </div>

        {/* 4. CHECKBOX GROUP (Array) */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Conhecimentos (Mínimo 2)</label>

          {/* Mestre */}
          <label className="flex items-center gap-2 text-cyan-400 font-bold mb-2 cursor-pointer w-fit">
            <input type="checkbox" data-checkbox-master="skills" className="rounded bg-gray-700 border-gray-600" />
            Todas as stacks
          </label>

          <div className="grid grid-cols-2 gap-2 pl-4 border-l border-gray-700">
            {['React', 'Node.js', 'TypeScript', 'Python', 'DevOps', 'UI/UX'].map(skill => (
              <label key={skill} className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  name="skills"
                  value={skill.toLowerCase()}
                  data-validation={skill === 'React' ? "validarSkills" : undefined} // Validação no primeiro
                  className="rounded bg-gray-700 border-gray-600"
                />
                {skill}
              </label>
            ))}
          </div>
          <div id="error-skills" className="error-msg"></div>
        </div>

        {/* 5. CHECKBOX SIMPLES (Boolean) */}
        <div className="pt-4 border-t border-gray-700">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="termos"
              className="w-5 h-5 rounded bg-gray-700 border-gray-600"
              data-validation="validarTermos"
            />
            <span className="text-sm text-gray-300">Li e concordo com os termos de serviço.</span>
          </label>
          <div id="error-termos" className="error-msg"></div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg hover:scale-[1.02] transition-transform"
        >
          Finalizar Cadastro
        </button>
      </form>
    </div>
  );
};

export default RegistrationComplexExample;