import React from 'react';
import { toastManager } from './manager';
import type { IToast, ToastPosition } from './types';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Star } from 'lucide-react';

const ToastContainer = () => {
  const [toasts, setToasts] = React.useState<IToast[]>([]);

  React.useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  // Agrupa os toasts por posição para renderizar nos containers corretos
  const positions: ToastPosition[] = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'];

  const getPositionClasses = (pos: ToastPosition) => {
    const fixed = "fixed z-[9999] flex flex-col gap-3 p-4 pointer-events-none max-h-screen overflow-hidden";
    switch (pos) {
      case 'top-right': return `${fixed} top-0 right-0 items-end`;
      case 'top-left': return `${fixed} top-0 left-0 items-start`;
      case 'bottom-right': return `${fixed} bottom-0 right-0 items-end flex-col-reverse`;
      case 'bottom-left': return `${fixed} bottom-0 left-0 items-start flex-col-reverse`;
      case 'top-center': return `${fixed} top-0 left-1/2 -translate-x-1/2 items-center`;
      case 'bottom-center': return `${fixed} bottom-0 left-1/2 -translate-x-1/2 items-center flex-col-reverse`;
    }
  };

  return (<>
    {positions.map(pos => (
      <div key={pos} className={getPositionClasses(pos)}>
        {toasts.filter(t => (t.position || 'top-right') === pos).map(toast => {
          return (<ToastItem key={toast.id} toast={toast} />);
        })}
      </div>
    ))}
  </>);
};

const ToastItem = ({ toast }: { toast: IToast }) => {
  const [isExiting, setIsExiting] = React.useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => toastManager.remove(toast.id), 300);
  };

  React.useEffect(() => {
    if (toast.duration !== Infinity) {
      const timer = setTimeout(handleClose, toast.duration || 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const icons = {
    success: <CheckCircle className="text-green-400" size={24} />,
    error: <AlertCircle className="text-red-400" size={24} />,
    warning: <AlertTriangle className="text-yellow-400" size={24} />,
    info: <Info className="text-blue-400" size={24} />,
    custom: toast.icon || <Star className="text-purple-400" size={24} />
  };

  const colors = {
    success: "border-green-500 bg-gray-800",
    error: "border-red-500 bg-gray-800",
    warning: "border-yellow-500 bg-gray-800",
    info: "border-blue-500 bg-gray-800",
    custom: "border-purple-500 bg-gray-900"
  };

  const isLarge = toast.size === 'large';

  const handleAction = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.stopPropagation();
    toast.action?.onClick();
  };

  const containerStyle = `pointer-events-auto ${isLarge ? 'w-96 p-6' : 'w-80 p-4'} border-l-4 rounded shadow-2xl flex items-start gap-4
        transition-all duration-300 ease-in-out transform ${colors[toast.type]}
        ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100 animate-in fade-in slide-in-from-bottom-2'}`

  return (<div className={containerStyle}>
    <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
    <div className="flex-1 min-w-0">
      {toast.title
        ? <h4 className={`font-bold text-white mb-1 ${isLarge ? 'text-lg' : 'text-sm'}`}>{toast.title}</h4>
        : null
      }
      <p className={`text-gray-300 leading-relaxed ${isLarge ? 'text-base' : 'text-sm'}`}>{toast.message}</p>
      {toast.action
        ? (<button onClick={handleAction}
          className="mt-3 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors">
          {toast.action.label}
        </button>)
        : null}
    </div>
    <button onClick={handleClose} className="text-gray-500 hover:text-white shrink-0 -mt-1 -mr-1 p-1">
      <X size={16} />
    </button>
  </div>);
};

export default ToastContainer;