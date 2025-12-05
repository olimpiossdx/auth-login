import type { IEmployee, IEmployeeFilter } from './types';

const ROLES = ['Frontend Developer', 'Backend Engineer', 'Product Owner', 'UX Designer'];

// Helper para gerar dados fakes consistentes
const enrichUser = (user: any): IEmployee => ({
  id: user.id,
  name: user.name,
  email: user.email.toLowerCase(),
  role: ROLES[user.id % ROLES.length],
  rating: (user.id % 5) + 1,
  status: user.id % 2 !== 0, // Ímpares ativos
  admissionDate: new Date(2020, 0, user.id * 10).toISOString().split('T')[0]
});

export const EmployeeService = {
  async getAll(filters?: IEmployeeFilter): Promise<IEmployee[]> {
    // Simula delay de rede
    await new Promise(r => setTimeout(r, 600));

    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    const users = await response.json();
    let employees = users.map(enrichUser);

    // Filtro Backend Simulado
    if (filters) {
      if (filters.term) {
        const t = filters.term.toLowerCase();
        employees = employees.filter((e: IEmployee) => e.name.toLowerCase().includes(t) || e.email.includes(t));
      }
      if (filters.role) {
        employees = employees.filter((e: IEmployee) => e.role === filters.role);
      }
      if (filters.date_start) {
        employees = employees.filter((e: IEmployee) => e.admissionDate >= filters.date_start);
      }
      if (filters.date_end) {
        employees = employees.filter((e: IEmployee) => e.admissionDate <= filters.date_end);
      }
    }
    
    return employees;
  },

  async save(data: Partial<IEmployee>) {
    await new Promise(r => setTimeout(r, 1000));
    if (data.name === 'Erro') throw new Error("Simulação de Erro no Save");
    return { ...data, id: data.id || Math.floor(Math.random() * 1000) };
  },
  
  async toggleStatus(id: number, status: boolean) {
     await new Promise(r => setTimeout(r, 300)); // Rápido
     return true;
  }
};