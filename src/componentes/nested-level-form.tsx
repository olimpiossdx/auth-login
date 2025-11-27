import React from "react";
import useForm from "../hooks/use-form";
import Autocomplete, { type IOption } from "./autocomplete";
import StarRating from "./start-rating";
import showModal from "./modal/hook";


// --- DADOS ESTÁTICOS ---
const DEPARTAMENTOS: IOption[] = [
  { value: 'ti', label: 'Tecnologia' },
  { value: 'rh', label: 'Recursos Humanos' },
  { value: 'fin', label: 'Financeiro' },
  { value: 'mkt', label: 'Marketing' },
  { value: 'ops', label: 'Operações' }
];

// --- COMPONENTE RECURSIVO (SUPER NÓ) ---
interface RecursiveLevelProps {
  depth: number;
  maxDepth: number;
  prefix: string; 
  onDelete?: () => void;
}

const RecursiveLevel = ({ depth, maxDepth, prefix, onDelete }: RecursiveLevelProps) => {
  const [children, setChildren] = React.useState<{ id: number }[]>([]);
  
  const addChild = () => {
    setChildren(prev => [...prev, { id: Date.now() + Math.random() }]);
  };

  const removeChild = (indexToRemove: number) => {
    setChildren(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  // Cores e estilos baseados na profundidade para facilitar visualização
  const colors = ['border-l-cyan-500', 'border-l-purple-500', 'border-l-yellow-500', 'border-l-green-500'];
  const borderColor = colors[depth % colors.length];
  const bgOpacity = `rgba(17, 24, 39, ${Math.max(0.3, 1 - depth * 0.1)})`; // Escurece conforme afunda

  return (
    <div className={`pl-4 ml-2 border-l-2 ${borderColor} my-4 transition-all`}>
      
      {/* --- O CARD DO NÍVEL ATUAL --- */}
      <div 
        className="p-4 rounded-lg border border-gray-700 shadow-sm mb-2"
        style={{ backgroundColor: bgOpacity }}
      >
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest bg-gray-900 px-2 py-1 rounded">
            Nível {depth}
          </span>
          {onDelete && (
            <button 
              type="button" 
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 text-xs px-2 hover:bg-red-900/20 rounded py-1 transition-colors"
            >
              ✕ Remover Item
            </button>
          )}
        </div>

        {/* --- GRID DE CAMPOS COMPLEXOS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. Input Texto */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Título da Tarefa</label>
            <input 
              name={`${prefix}.titulo`} 
              placeholder="Ex: Refatorar Código"
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
              required // Teste de validação nativa
            />
          </div>

          {/* 2. Autocomplete (Select Oculto) */}
          <div>
             {/* Note que passamos initialValue vazio para ele começar limpo ou ler do DOM se já existir */}
            <Autocomplete 
              name={`${prefix}.departamento`}
              label="Departamento Responsável"
              options={DEPARTAMENTOS}
              required
              validationKey={`validarDepto-${depth}`} // Só para diferenciar se usarmos custom val
            />
          </div>

          {/* 3. StarRating (Input Âncora) */}
          <div className="md:col-span-2 flex gap-4 items-start">
            <div className="flex-1">
               <StarRating 
                 name={`${prefix}.prioridade`}
                 label="Nível de Prioridade"
                 required
               />
            </div>
            
            {/* 4. Input Date Nativo */}
            <div className="w-1/3">
                <label className="block text-xs text-gray-400 mb-1">Prazo Limite</label>
                <input 
                    type="date"
                    name={`${prefix}.prazo`}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:border-cyan-500 outline-none"
                />
            </div>
          </div>

          {/* 5. Textarea */}
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Descrição Detalhada</label>
            <textarea 
                name={`${prefix}.descricao`}
                rows={2}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none resize-y"
                placeholder="Descreva os detalhes desta etapa..."
            />
          </div>

        </div>
      </div>

      {/* --- ÁREA RECURSIVA (FILHOS) --- */}
      {depth < maxDepth ? (
        <div className="flex flex-col gap-2 mt-2">
          {children.map((child, index) => (
            <RecursiveLevel
              key={child.id}
              depth={depth + 1}
              maxDepth={maxDepth}
              // A Mágica: "pai.filhos[0]"
              prefix={`${prefix}.subtarefas[${index}]`} 
              onDelete={() => removeChild(index)}
            />
          ))}
          
          <button
            type="button"
            onClick={addChild}
            className="self-start text-xs bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-cyan-900/30 px-4 py-2 rounded mt-2 flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-cyan-900/20"
          >
            <span className="text-lg leading-none">+</span> 
            Adicionar Subtarefa (Nível {depth + 1})
          </button>
        </div>
      ) : (
        <div className="text-xs text-gray-600 italic pl-4 border-l border-gray-800">
          • Limite de profundidade atingido.
        </div>
      )}
    </div>
  );
};

// --- CENÁRIO PRINCIPAL ---

interface INestedFormValues {
  config: {
    maxDepth: number;
    projectParams: string;
  };
  projeto: any; 
}

const NestedLevelForm = () => {
  const { handleSubmit, formId } = useForm<INestedFormValues>("nested-level-form");
  const [targetDepth, setTargetDepth] = React.useState(3);
  const [isGenerated, setIsGenerated] = React.useState(false);

  const onSubmit = (data: INestedFormValues) => {
    showModal({
      title: "JSON da Estrutura Complexa",
      content: () => (
        <pre className="text-xs bg-black p-4 rounded text-green-400 overflow-auto max-h-[60vh] font-mono border border-gray-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      ),
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h2 className="text-xl font-bold text-cyan-400">Gerador de Projetos (Fractal UI)</h2>
            <p className="text-xs text-gray-400">Teste de inputs complexos aninhados recursivamente.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-900 p-2 rounded border border-gray-700">
            <label className="text-xs text-gray-400">Profundidade Max:</label>
            <input 
                type="number" 
                min="1" 
                max="5" 
                value={targetDepth} 
                onChange={e => setTargetDepth(Number(e.target.value))}
                className="w-12 bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white text-center text-sm"
            />
            <button 
                type="button"
                onClick={() => setIsGenerated(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3 py-1 rounded transition-colors uppercase font-bold tracking-wide"
            >
                {isGenerated ? 'Reiniciar' : 'Iniciar'}
            </button>
        </div>
      </div>

      <form id={formId} onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        {isGenerated ? (
            <div className="animate-in fade-in zoom-in duration-300">
                <RecursiveLevel 
                    depth={0} 
                    maxDepth={targetDepth}
                    prefix="projeto" // Raiz
                />
                
                <div className="mt-8 flex justify-end border-t border-gray-700 pt-6 sticky bottom-0 bg-gray-800/95 p-4 backdrop-blur-sm z-50">
                    <button
                        type="submit"
                        className="py-3 px-8 rounded bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg hover:shadow-green-500/20 transition-all transform hover:-translate-y-1"
                    >
                        Validar e Salvar Estrutura
                    </button>
                </div>
            </div>
        ) : (
            <div className="text-center py-20 border-2 border-dashed border-gray-700 rounded-lg text-gray-500">
                <p>Clique em "Iniciar" para gerar a árvore de inputs.</p>
            </div>
        )}
      </form>
    </div>
  );
};

export default NestedLevelForm;