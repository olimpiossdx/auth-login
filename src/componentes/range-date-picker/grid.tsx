import React from 'react';
import { isWeekend, parseISODate, isBefore, isAfter, getDaysInMonthGrid, isSameDay, isBetween } from '../../utils/date';
import type { ICalendarGridProps } from './props';

const CalendarGrid: React.FC<ICalendarGridProps> = ({
  monthDate, start, end, hoverDate, minDate, maxDate, excludeWeekends, onDayClick, onHover
}) => {

  const isDateDisabled = (date: Date) => {
    if (excludeWeekends && isWeekend(date)) return true;
    if (minDate) {
      const min = parseISODate(minDate);
      if (min && isBefore(date, min)) return true;
    }
    if (maxDate) {
      const max = parseISODate(maxDate);
      if (max && isAfter(date, max)) return true;
    }
    return false;
  };

  return (
    <div className="w-64 p-2">
      <div className="text-center mb-4 font-bold text-white text-sm capitalize">
        {monthDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <span key={i} className="text-center text-[10px] text-gray-500 font-bold">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {getDaysInMonthGrid(monthDate).map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const disabledDay = isDateDisabled(day);
          const isSelStart = isSameDay(day, start);
          const isSelEnd = isSameDay(day, end);
          const isInRange = isBetween(day, start, end);

          // CORREÇÃO: Verifica se hoverDate existe antes de comparar
          const isHoverRange = start && !end && hoverDate && isBetween(day, start, hoverDate);

          let bgClass = 'hover:bg-gray-700 text-gray-300';
          let roundedClass = 'rounded-full';

          if (disabledDay) {
            bgClass = 'opacity-20 cursor-not-allowed';
          } else if (isSelStart || isSelEnd) {
            bgClass = 'bg-cyan-600 text-white font-bold z-10 relative';
          } else if (isInRange || isHoverRange) {
            bgClass = 'bg-cyan-900/40 text-cyan-200';
            roundedClass = 'rounded-none';
          }

          // CORREÇÃO: Removemos o '!' e adicionamos check de existência
          // Arredonda esquerda se for o início ou se for o fim de um range hover
          if (isSelStart && (end || (hoverDate && isAfter(hoverDate, start)))) {
            roundedClass = 'rounded-l-full rounded-r-none';
          }

          // Arredonda direita se for o fim ou se for o dia que estamos hoverando (se for maior que inicio)
          if (isSelEnd || (start && !end && hoverDate && isSameDay(day, hoverDate))) {
            roundedClass = 'rounded-r-full rounded-l-none';
          }

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabledDay}
              onClick={(e) => { e.stopPropagation(); onDayClick(day); }}
              onMouseEnter={() => onHover(day)}
              className={`
                         h-8 w-8 text-xs flex items-center justify-center transition-all
                         ${bgClass} ${roundedClass}
                     `}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;