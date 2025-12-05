import { createRoot } from 'react-dom/client';
import React from 'react'; 
import ToastContainer from './container';
import { toastManager } from './manager';
import type { IToastOptions, ToastType } from './types';

const CONTAINER_ID = 'hybrid-toast-portal';

const ensureContainerExists = () => {
  if (document.getElementById(CONTAINER_ID)){
     return;
  };
  
  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(React.createElement(ToastContainer));
};

const dispatch = (type: ToastType, message: string, options?: IToastOptions) => {
  ensureContainerExists();
  const id = crypto.randomUUID();
  
  toastManager.add({
    id,
    type,
    message,
    title: options?.title,
    duration: options?.duration,
    action: options?.action,
    position: options?.position,
    icon: options?.icon,
    size: options?.size,
    createdAt: Date.now()
  });
};

export const toast = {
  success: (message: string, options?: IToastOptions) => dispatch('success', message, options),
  error: (message: string, options?: IToastOptions) => dispatch('error', message, options),
  warning: (message: string, options?: IToastOptions) => dispatch('warning', message, options),
  info: (message: string, options?: IToastOptions) => dispatch('info', message, options),
  custom: (message: string, options?: IToastOptions) => dispatch('custom', message, options),
};