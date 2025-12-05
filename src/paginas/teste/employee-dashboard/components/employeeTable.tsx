import { Edit, Trash2 } from "lucide-react";
import Alert from "../../../../componentes/alert";
import StarRating from "../../../../componentes/start-rating";
import Switch from "../../../../componentes/switch";
import type { IEmployee } from "../types";

interface Props {
  data: IEmployee[];
  isLoading: boolean;
  onEdit: (employee: IEmployee) => void;
  onToggleStatus: (id: number, status: boolean) => void;
}

const EmployeeTable: React.FC<Props> = ({ data, isLoading, onEdit, onToggleStatus }) => {
  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-800 rounded border border-gray-700" />)}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Alert variant="info" title="Sem resultados">
        Nenhum funcionário encontrado com os filtros atuais.
      </Alert>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-700 shadow-xl">
      <table className="w-full text-sm text-left text-gray-400">
        <thead className="text-xs text-gray-400 uppercase bg-gray-800 border-b border-gray-700">
          <tr>
            <th className="px-6 py-3">Funcionário</th>
            <th className="px-6 py-3">Cargo</th>
            <th className="px-6 py-3">Avaliação</th>
            <th className="px-6 py-3 text-center">Status</th>
            <th className="px-6 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
              <td className="px-6 py-4 font-medium text-white">
                <div>{item.name}</div>
                <div className="text-xs text-gray-500">{item.email}</div>
              </td>
              <td className="px-6 py-4">
                <span className="bg-gray-800 text-cyan-400 px-2 py-1 rounded border border-gray-700 text-xs">{item.role}</span>
              </td>
              <td className="px-6 py-4">
                {/* StarRating ReadOnly mas visual */}
                <StarRating name={`rate_${item.id}`} initialValue={item.rating} readOnly className="mb-0" starClassName="w-4 h-4" />
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  {/* Switch com ação imediata (Ilha de Reatividade) */}
                  <Switch
                    name={`status_${item.id}`}
                    defaultValue={item.status}
                    onChange={(val) => onToggleStatus(item.id, val)}
                    className="mb-0"
                    size="sm"
                  />
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button onClick={() => onEdit(item)} className="text-blue-400 hover:text-white mr-3 transition-colors"><Edit size={18} /></button>
                <button className="text-red-500 hover:text-white transition-colors"><Trash2 size={18} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;