import React, { memo } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode; // Conteúdo rico
  icon?: React.ReactNode;     // Ícone opcional (substitui o padrão)
  onClose?: () => void;       // Torna o alerta "fechável"
  className?: string;
}

const variants = {
  info: {
    container: 'bg-blue-900/20 border-blue-800 text-blue-200',
    iconColor: 'text-blue-400',
    DefaultIcon: Info
  },
  success: {
    container: 'bg-green-900/20 border-green-800 text-green-200',
    iconColor: 'text-green-400',
    DefaultIcon: CheckCircle
  },
  warning: {
    container: 'bg-yellow-900/20 border-yellow-800 text-yellow-200',
    iconColor: 'text-yellow-400',
    DefaultIcon: AlertTriangle
  },
  error: {
    container: 'bg-red-900/20 border-red-800 text-red-200',
    iconColor: 'text-red-400',
    DefaultIcon: AlertCircle
  },
  neutral: {
    container: 'bg-gray-800 border-gray-700 text-gray-300',
    iconColor: 'text-gray-400',
    DefaultIcon: Info
  }
};

/**
 * Componente de Alerta Contextual.
 * Otimizado com React.memo para evitar re-renders desnecessários em formulários densos.
 */
const Alert: React.FC<AlertProps> = memo(({ 
  variant = 'neutral', 
  title, 
  children, 
  icon, 
  onClose,
  className = ""
}) => {
  const style = variants[variant];
  const IconComp = style.DefaultIcon;

  return (
    <div 
      role="alert"
      className={`
        flex items-start gap-3 p-4 rounded-lg border-l-4 border 
        animate-in fade-in slide-in-from-top-2 duration-300
        ${style.container} 
        ${className}
      `}
    >
      <div className={`shrink-0 mt-0.5 ${style.iconColor}`}>
        {icon || <IconComp size={20} />}
      </div>

      <div className="flex-1 min-w-0">
        {title && <h5 className="font-bold mb-1 leading-tight">{title}</h5>}
        <div className="text-sm opacity-90 leading-relaxed">
          {children}
        </div>
      </div>

      {onClose && (
        <button 
          onClick={onClose} 
          className={`shrink-0 -mt-1 -mr-1 p-1 rounded hover:bg-black/20 transition-colors ${style.iconColor}`}
          aria-label="Fechar alerta"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
});

export default Alert;