import React from "react";

// --- HOOK useList (Minimalista - Inalterado) ---
function useList<T = any>(initialState: T[] = []) {
  const generateId = () => `field-id-${crypto.randomUUID()}`;

  const [fields, setFields] = React.useState(() =>
    initialState.map((value) => ({ id: generateId(), value }))
  );

  const append = React.useCallback((value: T) => {
    const newId = generateId();
    setFields((p) => [...p, { id: newId, value }]);
  }, []);

  const remove = React.useCallback((index: number) => {
    setFields((p) => p.filter((_, i) => i !== index));
  }, []);

  return { fields, append, remove };
}
export default useList;