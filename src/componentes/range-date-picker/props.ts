import { getToday, addDays } from "../../utils/date";

export interface DatePreset {
  label: string;
  getValue: () => [Date, Date];
}

export interface IDateRangeProps {
  startDateName: string;
  endDateName: string;
  label?: string;

  minDate?: string;
  maxDate?: string;
  excludeWeekends?: boolean;

  months?: 1 | 2;
  showPresets?: boolean;
  matchInputWidth?: boolean;
  presets?: DatePreset[];

  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

export const DEFAULT_PRESETS: DatePreset[] = [
  { label: 'Hoje', getValue: () => [getToday(), getToday()] },
  { label: 'Ontem', getValue: () => [addDays(getToday(), -1), addDays(getToday(), -1)] },
  { label: 'Últimos 7 Dias', getValue: () => [addDays(getToday(), -7), getToday()] },
  { label: 'Últimos 30 Dias', getValue: () => [addDays(getToday(), -30), getToday()] },
  {
    label: 'Este Mês', getValue: () => {
      const now = getToday();
      return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)];
    }
  },
];

export interface ICalendarGridProps {
  monthDate: Date;
  start: Date | null;
  end: Date | null;
  hoverDate: Date | null;
  minDate?: string;
  maxDate?: string;
  excludeWeekends?: boolean;
  onDayClick: (date: Date) => void;
  onHover: (date: Date | null) => void;
}