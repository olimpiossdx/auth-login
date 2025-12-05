export type EmployeeStatus = 'active' | 'inactive';

export interface IEmployee {
  id: number;
  name: string;
  email: string;
  role: string; // "Frontend", "Backend", etc.
  status: boolean; // Switch
  rating: number; // StarRating
  admissionDate: string; // YYYY-MM-DD
}

export interface IEmployeeFilter {
  term: string;
  role: string;
  // DateRangePicker usa dois inputs ocultos
  date_start: string;
  date_end: string;
}

export interface IEmployeeFormData {
  name: string;
  email: string;
  role: string;
  rating: number;
  status: boolean;
  admissionDate: string;
}