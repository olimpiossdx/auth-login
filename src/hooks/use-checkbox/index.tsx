import React from 'react';

/**
 * Hook para gerenciar a lógica de "Select All" com estado Indeterminado.
 * Retorna refs e handlers para conectar o Pai aos Filhos.
 */
export const useIndeterminate = () => {
  const parentRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 1. Função chamada quando um FILHO é clicado
  // Verifica quantos estão marcados e atualiza o visual do Pai
  const updateParentVisualState = React.useCallback(() => {
    if (!parentRef.current || !containerRef.current) return;

    const children = Array.from(containerRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    const checkedCount = children.filter(c => c.checked).length;

    if (checkedCount === 0) {
      // Nenhum marcado: Pai desmarcado
      parentRef.current.checked = false;
      parentRef.current.indeterminate = false;
    } else if (checkedCount === children.length) {
      // Todos marcados: Pai marcado
      parentRef.current.checked = true;
      parentRef.current.indeterminate = false;
    } else {
      // Misto: Pai Indeterminado (-)
      parentRef.current.checked = false;
      parentRef.current.indeterminate = true;
    }
  }, []);

  // 2. Função chamada quando o PAI é clicado
  // Marca ou desmarca todos os filhos
  const toggleAll = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!containerRef.current) return;

    const isChecked = e.target.checked;
    const children = containerRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

    children.forEach(child => {
      child.checked = isChecked;
      // Dispara evento para notificar o DOM e validações
      child.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }, []);

  return {
    parentRef,
    containerRef,
    updateParentVisualState,
    toggleAll
  };
};