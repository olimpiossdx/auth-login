import React from 'react';

interface Props {
  selected?: string[];
}

const Conhecimentos: React.FC<Props> = ({ selected = [] }) => {
  // Lista de Opções com IDs estáveis
  const stacks = [
    { id: 'js', label: 'JavaScript (ES6+)' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'react', label: 'React.js' },
    { id: 'node', label: 'Node.js' },
    { id: 'css', label: 'Tailwind CSS' },
    { id: 'sql', label: 'PostgreSQL' },
    { id: 'docker', label: 'Docker' },
    { id: 'aws', label: 'AWS' },
  ];

  return (
    <div className="bg-gray-900/30 p-4 rounded border border-gray-700/50">
      <h3 className="text-sm font-bold text-gray-300 uppercase mb-4">4. Conhecimentos Técnicos</h3>

      {/* MESTRE (Controller) */}
      <div className="mb-3 pb-3 border-b border-gray-700">
        <label className="flex items-center gap-2 text-cyan-400 font-bold cursor-pointer w-fit hover:opacity-80 transition-opacity">
          <input
            type="checkbox"
            data-checkbox-master="conhecimentos"
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
          />
          Selecionar Todas as Stacks
        </label>
      </div>

      {/* FILHOS (Dados) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-2">
        {stacks.map((tech) => (
          <label key={tech.id} className="flex items-center gap-2 text-gray-300 cursor-pointer hover:text-white transition-colors p-1 rounded hover:bg-gray-800">
            <input
              type="checkbox"
              name="conhecimentos"
              // CORREÇÃO: Usar o ID como valor, não o Label
              value={tech.id}
              // Verifica se o ID está no array recebido
              defaultChecked={selected.includes(tech.id)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
            />
            {tech.label}
          </label>
        ))}
      </div>
    </div>
  );
};

export default Conhecimentos;