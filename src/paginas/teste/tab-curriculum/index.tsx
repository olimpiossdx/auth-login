import React from 'react';
import showModal from '../../../componentes/modal/hook';
import useForm from '../../../hooks/use-form';
import type { ICurriculumFormValues } from './types';
import DadosAdicionais from './dados-adicionais';
import Escolaridades from './escolaridades';
import Experiencias from './experiencias';
import Conhecimentos from './conhecimentos';
import DadosPessoais from './dados-pessoais';

// MOCK
const DATA_MOCK: ICurriculumFormValues = {
  nome: 'Ana Souza',
  email: 'ana.souza@tech.com',
  resumo: 'Engenheira de Software com foco em React.',
  escolaridades: [
    { instituicao: 'USP', curso: 'Ciência da Computação', ano: 2019 },
    { instituicao: 'Rocketseat', curso: 'Ignite ReactJS', ano: 2021 }
  ],
  experiencias: [
    { empresa: 'StartUp X', cargo: 'Frontend Jr', anoInicio: 2020, anoFim: 2021 },
    { empresa: 'Big Tech Y', cargo: 'Frontend Pleno', anoInicio: 2022, anoFim: 2024 }
  ],
  conhecimentos: ['react', 'typescript', 'docker'],
  adicionais: {
    pretensaoSalarial: 8500,
    disponibilidadeImediata: true
  }
};

// ESTADO VAZIO ESTÁVEL (Crucial para evitar Loop Infinito no useList)
const EMPTY_DATA: ICurriculumFormValues = {
  nome: '',
  email: '',
  resumo: '',
  escolaridades: [], // Array estável
  experiencias: [],  // Array estável
  conhecimentos: [], // Array estável
  adicionais: { pretensaoSalarial: 0, disponibilidadeImediata: false }
};

const CurriculumForm = () => {
  const { handleSubmit, formId, resetSection, registerForm } = useForm<ICurriculumFormValues>("curriculum-form");

  // CORREÇÃO: Inicializa com EMPTY_DATA em vez de null.
  // Isso garante que as listas recebam arrays estáveis desde a primeira renderização,
  // evitando que o 'useList' entre em loop infinito de dependência.
  const [formData, setFormData] = React.useState<ICurriculumFormValues>(EMPTY_DATA);

  const handleLoadData = () => {
    // Simula API Call
    setFormData(DATA_MOCK);

    // Sincroniza valores no DOM
    setTimeout(() => {
      resetSection("", DATA_MOCK);
    }, 50);
  };

  const handleReset = () => {
    // Volta para estrutura vazia estável
    setFormData(EMPTY_DATA);

    setTimeout(() => {
      resetSection("", null);
    }, 50);
  };

  const onSubmit = (data: ICurriculumFormValues) => {
    showModal({
      title: "Currículo Salvo",
      content: () => <pre className="text-xs bg-black p-4 text-green-400">{JSON.stringify(data, null, 2)}</pre>
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-cyan-400">Currículo (Data-Driven)</h2>
        <div className="flex gap-2">
          <button onClick={handleLoadData} type="button" className="px-3 py-1 text-sm bg-blue-900 text-blue-200 rounded hover:bg-blue-800 border border-blue-700">
            📥 Carregar Mock
          </button>
          <button onClick={handleReset} type="button" className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 border border-gray-600">
            ↺ Limpar
          </button>
        </div>
      </div>

      {/* Usamos uma key baseada no objeto para forçar remontagem limpa apenas se necessário,
          mas com a correção do estado estável, isso é menos crítico. */}
      <form id={formId} ref={registerForm} onSubmit={handleSubmit(onSubmit)} className="space-y-8" key={formData === DATA_MOCK ? 'loaded' : 'empty'}>

        <DadosPessoais data={formData} />

        {/* Listas Dinâmicas agora recebem arrays estáveis de EMPTY_DATA na inicialização */}
        <Escolaridades data={formData.escolaridades} />
        <Experiencias data={formData.experiencias} />

        {/* Grupos */}
        <Conhecimentos selected={formData.conhecimentos} />
        <DadosAdicionais data={formData.adicionais} />

        <div className="flex justify-end pt-6 border-t border-gray-700">
          <button type="submit" className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-lg">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CurriculumForm;