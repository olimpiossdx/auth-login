import { Users } from "lucide-react";
import { useState, useEffect } from "react";
import showModal from "../../../componentes/modal/hook";
import { toast } from "../../../componentes/toast";
import EmployeeFilter from "./components/EmployeeFilter";
import EmployeeModal from "./components/employeeModal";
import EmployeeTable from "./components/employeeTable";
import { EmployeeService } from "./service";
import type { IEmployee, IEmployeeFilter } from "./types";

const TabEmployeeDashboard = () => {
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado para recarregar a tabela
  const [filters, setFilters] = useState<IEmployeeFilter | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await EmployeeService.getAll(filters);
      setEmployees(data);
    } catch (error) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  // Recarrega quando filtros mudam
  useEffect(() => {
    loadData();
  }, [filters]);

  const handleSave = async (data: any) => {
    try {
      await EmployeeService.save(data);
      toast.success("Funcionário salvo com sucesso!");
      loadData(); // Refresh
      return true; // Sinaliza sucesso para fechar modal se fosse promise
    } catch (e) {
      toast.error("Erro ao salvar.");
      throw e; // Repassa erro para o form tratar se quiser
    }
  };

  const openEditModal = (employee?: IEmployee) => {
    const modalHandle = showModal({
      title: <div className="flex items-center gap-2 text-cyan-400"><Users /> <span>{employee ? 'Editar Funcionário' : 'Novo Funcionário'}</span></div>,
      size: 'lg',
      // Injetamos o componente de formulário dentro do modal
      content: ({ onClose }: any) => (
        <EmployeeModal
          employee={employee || null}
          onCancel={onClose}
          onSave={async (data) => {
            await handleSave({ ...employee, ...data });
            onClose();
          }}
        />
      )
    });
  };

  const handleToggleStatus = async (id: number, status: boolean) => {
    // Optimistic UI: Poderíamos atualizar o estado local antes, mas aqui vamos esperar a API
    try {
      await EmployeeService.toggleStatus(id, status);
      toast.info(`Status alterado para ${status ? 'Ativo' : 'Inativo'}`);
      // Atualiza lista localmente para evitar refetch total (Opcional)
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    } catch {
      toast.error("Falha ao alterar status");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-end border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestão de Pessoas</h1>
          <p className="text-gray-400">Dashboard administrativo com filtros avançados.</p>
        </div>
        <button
          onClick={() => openEditModal()}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold shadow-lg flex items-center gap-2"
        >
          + Novo Funcionário
        </button>
      </header>

      <EmployeeFilter onFilter={setFilters} />

      <EmployeeTable
        data={employees}
        isLoading={loading}
        onEdit={openEditModal}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
};

export default TabEmployeeDashboard;