import { useEffect } from "react";
import Autocomplete from "../../../../componentes/autocomplete";
import StarRating from "../../../../componentes/start-rating";
import Switch from "../../../../componentes/switch";
import useForm from "../../../../hooks/use-form";
import type { IEmployee, IEmployeeFormData } from "../types";

const ROLES_OPTIONS = [
  { value: 'Frontend Developer', label: 'Frontend Developer' },
  { value: 'Backend Engineer', label: 'Backend Engineer' },
  { value: 'Product Owner', label: 'Product Owner' },
  { value: 'UX Designer', label: 'UX Designer' },
];

interface Props {
  employee: IEmployee | null; // Se null = Novo, se Obj = Editar
  onSave: (data: IEmployeeFormData) => Promise<void>;
  onCancel: () => void;
}

const EmployeeModal: React.FC<Props> = ({ employee, onSave, onCancel }) => {
  // Instância ISOLADA do useForm para o Modal
  // Importante: Não conflita com o form de Filtro
  const { formProps, handleSubmit, resetSection, setValidators } = useForm<IEmployeeFormData>({
    id: "employee-modal-form",
    onSubmit: onSave
  });

  // Efeito de Carga (Reset)
  useEffect(() => {
    if (employee) {
      // Mapeia IEmployee -> IEmployeeFormData se necessário
      const formData = {
        ...employee,
        // Autocomplete aceita objeto {value, label} para exibir texto correto sem fetch
        role: { value: employee.role, label: employee.role }
      };
      // Delay seguro para garantir que o modal montou no DOM
      setTimeout(() => resetSection("", formData), 50);
    } else {
      setTimeout(() => resetSection("", null), 50);
    }
  }, [employee, resetSection]);

  // Validação
  useEffect(() => {
    setValidators({
      name: (val: string) => !val || val.length < 3 ? { message: "Nome completo obrigatório", type: "error" } : undefined,
      role: (val: any) => !val ? { message: "Cargo obrigatório", type: "error" } : undefined,
      rating: (val: number) => val < 1 ? { message: "Avaliação mínima 1", type: "error" } : undefined
    });
  }, [setValidators]);

  return (
    <form {...formProps} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs text-gray-400 uppercase font-bold">Nome</label>
          <input name="name" className="form-input w-full bg-gray-900 border-gray-600 rounded p-2 text-white" required data-validation="name" />
        </div>

        <div className="col-span-2">
          <label className="text-xs text-gray-400 uppercase font-bold">E-mail</label>
          <input name="email" type="email" className="form-input w-full bg-gray-900 border-gray-600 rounded p-2 text-white" required />
        </div>

        <div>
          <Autocomplete
            name="role"
            label="Cargo"
            options={ROLES_OPTIONS}
            required
            validationKey="role"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Admissão</label>
          <input name="admissionDate" type="date" className="form-input w-full bg-gray-900 border-gray-600 rounded p-2 text-white" required />
        </div>

        <div className="col-span-1">
          <StarRating name="rating" label="Performance" required validationKey="rating" />
        </div>

        <div className="col-span-1 flex items-center pt-6">
          <Switch name="status" label="Usuário Ativo" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-300 hover:text-white">Cancelar</button>
        <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-lg">
          {employee ? 'Atualizar' : 'Cadastrar'}
        </button>
      </div>
    </form>
  );
};

export default EmployeeModal;