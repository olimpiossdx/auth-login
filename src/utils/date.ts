
export const createDate = (year: number, month: number, day: number) => {
  return new Date(year, month, day, 12, 0, 0, 0);
};

export const getToday = () => {
  const now = new Date();
  return createDate(now.getFullYear(), now.getMonth(), now.getDate());
};

export const toISODate = (date?: Date | null) => {
  if (!date || isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const toDisplayDate = (date?: Date | null) => {
  if (!date || isNaN(date.getTime())) return "";
  return date.toLocaleDateString('pt-BR');
};

export const parseISODate = (isoStr: string) => {
  if (!isoStr) return null;
  const [y, m, d] = isoStr.split('-').map(Number);
  return createDate(y, m - 1, d);
};

export const addDays = (date: Date, amount: number) => {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + amount);
  return newDate;
};

export const addMonths = (date: Date, amount: number) => {
  const newDate = new Date(date);
  newDate.setMonth(date.getMonth() + amount);
  return newDate;
};

export const startOfMonth = (date: Date) => createDate(date.getFullYear(), date.getMonth(), 1);
export const endOfMonth = (date: Date) => createDate(date.getFullYear(), date.getMonth() + 1, 0);

// --- COMPARAÇÕES BLINDADAS (Null Safe) ---

export const isSameDay = (d1?: Date | null, d2?: Date | null) => {
  if (!d1 || !d2) return false; // Retorna false se qualquer um for nulo
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const isAfter = (d1?: Date | null, d2?: Date | null) => {
  if (!d1 || !d2) return false;
  return d1.getTime() > d2.getTime();
};

export const isBefore = (d1?: Date | null, d2?: Date | null) => {
  if (!d1 || !d2) return false;
  return d1.getTime() < d2.getTime();
};

export const isBetween = (target: Date, start?: Date | null, end?: Date | null) => {
  if (!start || !end) return false;
  return target.getTime() >= start.getTime() && target.getTime() <= end.getTime();
};

export const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// ... (getDaysInMonthGrid, smartParseDate, maskDateInput MANTIDOS IGUAIS) ...
export const getDaysInMonthGrid = (currentMonth: Date) => {
  const days: (Date | null)[] = [];
  const firstDay = startOfMonth(currentMonth);
  const lastDay = endOfMonth(currentMonth);
  const startDayOfWeek = firstDay.getDay(); 
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(createDate(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }
  return days;
};

export const smartParseDate = (text: string): Date | null => {
  if (!text) return null;
  const cleanText = text.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const today = getToday();
  if (['hoje', 'hj', 't'].includes(cleanText)) return today;
  if (['ontem', 'y'].includes(cleanText)) return addDays(today, -1);
  if (['amanha', 'amanhã', 'tm'].includes(cleanText)) return addDays(today, 1);

  const nums = cleanText.replace(/\D/g, '');
  let d = today.getDate();
  let m = today.getMonth();
  let y = today.getFullYear();

  if (nums.length === 0) return null;

  if (nums.length <= 2) { 
      d = parseInt(nums, 10);
  } else if (nums.length <= 4) {
      d = parseInt(nums.slice(0, 2), 10);
      m = parseInt(nums.slice(2), 10) - 1; 
  } else if (nums.length === 6) {
      d = parseInt(nums.slice(0, 2), 10);
      m = parseInt(nums.slice(2, 4), 10) - 1;
      y = 2000 + parseInt(nums.slice(4), 10);
  } else if (nums.length === 8) {
      d = parseInt(nums.slice(0, 2), 10);
      m = parseInt(nums.slice(2, 4), 10) - 1;
      y = parseInt(nums.slice(4), 10);
  } else {
      return null; 
  }
  const candidate = createDate(y, m, d);
  if (candidate.getMonth() !== m || candidate.getDate() !== d) return null;
  return candidate;
};

export const maskDateInput = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{4})\d+?$/, '$1');
};