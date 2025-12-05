import { Search } from "lucide-react";
import Autocomplete from "../../../../componentes/autocomplete";
import DateRangePicker from "../../../../componentes/range-date-picker";
import useForm from "../../../../hooks/use-form";
import type { IEmployeeFilter } from "../types";

interface Props {
  onFilter: (filters: IEmployeeFilter) => void;
}

const ROLES_OPTIONS = [
  { value: 'Frontend Developer', label: 'Frontend' },
  { value: 'Backend Engineer', label: 'Backend' },
  { value: 'Product Owner', label: 'Produto' },
  { value: 'UX Designer', label: 'Design' },
];

const EmployeeFilter: React.FC<Props> = ({ onFilter }) => {
  // Instância ISOLADA do useForm para o filtro
  const { formProps, handleSubmit } = useForm<IEmployeeFilter>({
    id: "employee-filter-form",
    onSubmit: onFilter
  });

  return (
    <form {...formProps} className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6 flex flex-col md:flex-row gap-4 items-end">

      {/* Busca Textual */}
      <div className="flex-1 w-full">
        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Buscar</label>
        <div className="relative">
          <input name="term" className="form-input w-full bg-gray-900 border border-gray-600 rounded pl-9 p-2 text-white focus:border-cyan-500 outline-none" placeholder="Nome ou E-mail..." />
          <Search className="absolute left-2.5 top-2.5 text-gray-500 w-4 h-4" />
        </div>
      </div>

      {/* Filtro de Cargo */}
      <div className="w-full md:w-48">
        <Autocomplete
          name="role"
          label="Cargo"
          options={ROLES_OPTIONS}
          placeholder="Todos"
          clearable
        />
      </div>

      {/* Filtro de Data (Range) */}
      <div className="w-full md:w-64">
        <DateRangePicker
          startDateName="date_start"
          endDateName="date_end"
          label="Admissão"
          matchInputWidth
        />
      </div>

      <button type="submit" className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg transition-transform active:scale-95 h-[42px] mb-[1px]">
        Filtrar
      </button>
    </form>
  );
};

export default EmployeeFilter;