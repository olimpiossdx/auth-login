import React from "react";

interface StarRatingProps {
  name: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  name,
  label,
  required,
  readOnly,
  disabled,
}) => {
  const [currentValue, setCurrentValue] = React.useState<number | string>("");
  const [hoverValue, setHoverValue] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const effectiveDisabled = disabled || readOnly;

  const handleClick = (value: number) => {
    if (effectiveDisabled) {
      return;
    };

    const newValue = value === currentValue ? "" : value;
    setCurrentValue(newValue);

    if (inputRef.current) {
      inputRef.current.value = String(newValue);

      // 1. Limpeza Fundamental:
      // Ao clicar, dizemos ao navegador "Este campo agora está válido (ou limpo)".
      // Isso remove o erro anterior e permite o envio do formulário.
      inputRef.current.setCustomValidity("");

      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const handleBlur = () => {
    if (effectiveDisabled) {
      return;
    };

    inputRef.current?.dispatchEvent(new Event("blur", { bubbles: true }));
  };

  const handleInvalid = (event: React.FormEvent<HTMLInputElement>) => {
    event.currentTarget.setCustomValidity("Selecione entre 1 e 5 estrelas.");
  };

  const displayValue = Number(currentValue) || 0;

  return (
    <div className={`relative mb-4 ${effectiveDisabled ? "opacity-50" : ""}`}>
      <label className="block mb-1 text-gray-300" htmlFor={name}>
        {label}
      </label>
      <div
        className={`star-display flex focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-md ${effectiveDisabled ? "pointer-events-none" : ""}`}
        onBlur={handleBlur}
        tabIndex={effectiveDisabled ? -1 : 0}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <svg
            key={value}
            onClick={() => handleClick(value)}
            onMouseOver={() => setHoverValue(effectiveDisabled ? 0 : value)}
            onMouseOut={() => setHoverValue(0)}
            className={`w-8 h-8 ${effectiveDisabled ? "" : "cursor-pointer"} 
            transition-colors ${(hoverValue || displayValue) >= value ? "text-yellow-400" : "text-gray-600"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* AJUSTE DE CSS PARA O TOOLTIP:
          1. pointer-events-auto: O navegador precisa sentir que o elemento é interativo.
          2. bottom-0 h-0: Posicionado na base para o balão apontar para as estrelas.
          3. w-full: Ocupa toda a largura.
          4. z-0 ou z-[-1]: Garante que não bloqueie o clique nas estrelas (que devem ter z-index maior).
      */}
      <input
        ref={inputRef}
        id={name}
        name={name}
        type="number"
        onInvalid={handleInvalid}
        value={currentValue}
        onChange={() => { }}
        required={required}
        min={required ? 1 : 0}
        max={5}
        tabIndex={-1}
        disabled={disabled}
        style={{ appearance: "none" }}
        className="absolute bottom-0 left-3 w-3 h-3 opacity-0 m-0 p-0 border-0 pointer-events-auto z-0"
      />
    </div>
  );
};

export default StarRating;