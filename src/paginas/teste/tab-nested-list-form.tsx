import React from "react";
import showModal from "../../componentes/modal/hook";
import useList from "../../hooks/list";
import useForm from "../../hooks/use-form";
import type { FormField, ValidationResult } from "../../hooks/use-form/props";
import type { IAddress } from "./adress-list";
import ContactItem from "./contato-item";

export interface Contato {
  numero: string;
  tipo: string;
  enderecos?: IAddress[];
}

// 4. Cenário: Lista Aninhada (Atualizado com Submit Parcial)
interface IMyNestedListForm {
  contatos?: Contato[];
}
const NestedListForm = ({ }) => {
  const { handleSubmit, setValidators, formId, getValue, resetSection } = useForm<IMyNestedListForm>("nested-list-form");
  const { fields: contactFields, append: appendContact, remove: removeContact, } = useList<Contato>([]);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const isEditingAny = editingId !== null;
  const originalEditDataRef = React.useRef<any>(null);

  const validarCidade = React.useCallback((value: any, field: FormField | null, formValues: IMyNestedListForm): ValidationResult => {
    const valueField = field?.name.match(/contatos\.(\d+)\.enderecos\.(\d+)\.cidade/);

    if (valueField) {
      const cI = parseInt(valueField[1], 10);
      const aI = parseInt(valueField[2], 10);
      const rua = formValues.contatos?.[cI]?.enderecos?.[aI]?.rua;

      if (rua && !value)
        return { message: "Cidade obrigatória se rua preenchida.", type: "error", };
    };

    return undefined;
  }, []);

  React.useEffect(() => {
    setValidators({ validarCidade });
  }, [setValidators, validarCidade]);

  const onSubmit = (data: IMyNestedListForm) => {
    showModal({
      title: "Item Salvo",
      content: () => <div>Dados: {JSON.stringify(data, null, 2)}</div>,
      closeOnBackdropClick: false, // Obriga interação
      onClose: () => console.log("Fechou!"), // Callback
    });

    setEditingId(null);
    originalEditDataRef.current = null;
  };

  const handleEdit = (id: string, prefix: string) => {
    originalEditDataRef.current = getValue(prefix);
    setEditingId(id);
  };
  const handleCancel = (_: string, prefix: string) => {
    resetSection(prefix, originalEditDataRef.current);
    originalEditDataRef.current = null;
    setEditingId(null);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
      <h3 className="text-xl font-bold mb-4 text-cyan-400">
        4. Lista Aninhada (Contatos + Endereços)
      </h3>
      <p className="text-gray-400 mb-4">Validação por item (Submit Parcial).</p>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <h4 className="text-lg font-semibold mt-6 mb-2 text-cyan-500 flex justify-between items-center">
          Contatos
          <button
            type="button"
            onClick={() =>
              appendContact({
                numero: "",
                tipo: "celular",
                enderecos: [{ rua: "", cidade: "" }],
              })
            }
            className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded"
            disabled={isEditingAny}
          >
            Adicionar Contato
          </button>
        </h4>
        {contactFields.map((contactField, contactIndex) => {
          const sectionId = `contatos.${contactIndex}`;
          const prefix = `${sectionId}.`;
          const isEditingThis = editingId === sectionId;
          const isEditingOther = isEditingAny && !isEditingThis;
          return (
            <div key={contactField.id} className="relative">
              <div className="absolute top-6 right-2 z-10 flex gap-1">
                {!isEditingThis && (
                  <button
                    type="button"
                    onClick={() => handleEdit(sectionId, prefix)}
                    disabled={isEditingOther}
                    className={`py-0.5 px-2 rounded text-xs ${isEditingOther
                      ? "bg-gray-500"
                      : "bg-blue-600 hover:bg-blue-700"
                      }`}
                  >
                    Editar
                  </button>
                )}
                {isEditingThis && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCancel(sectionId, prefix)}
                      className="py-0.5 px-2 rounded text-xs bg-gray-600 hover:bg-gray-700"
                    >
                      Can
                    </button>
                    <button
                      type="submit"
                      className="py-0.5 px-2 rounded text-xs bg-green-600 hover:bg-green-700"
                    >
                      Sal
                    </button>
                  </>
                )}
              </div>
              <ContactItem
                contactIndex={contactIndex}
                initialData={contactField.value}
                onRemoveContact={() => removeContact(contactIndex)}
                isEditing={isEditingThis}
                isDisabled={isEditingOther}
              />
            </div>
          );
        })}
      </form>
    </div>
  );
};
export default NestedListForm;