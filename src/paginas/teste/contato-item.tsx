import AddressList from "./adress-list";

interface IContato {
  numero: string;
  tipo: number;
  enderecos: any[];
}

interface ContactItemProps {
  contactIndex: number;
  initialData: IContato;
  onRemoveContact: () => void;
  isEditing: boolean;
  isDisabled: boolean;
}
const ContactItem: React.FC<ContactItemProps> = ({
  contactIndex,
  initialData,
  onRemoveContact,
  isEditing,
  isDisabled,
}) => {
  const fieldsetDisabled = isDisabled;
  const fieldsReadOnly = !isEditing;

  return (
    <fieldset
      className="mb-4 p-4 border border-gray-700 rounded"
      disabled={fieldsetDisabled}
    >
      <div className="flex items-end gap-2 mb-3">
        <div className="flex-grow">
          <label
            className="block text-sm mb-1 text-gray-400"
            htmlFor={`contatos.${contactIndex}.numero`}
          >
            Número
          </label>
          <input
            id={`contatos.${contactIndex}.numero`}
            name={`contatos.${contactIndex}.numero`}
            type="tel"
            placeholder="(XX)..."
            className="form-input"
            required
            defaultValue={initialData.numero}
            readOnly={fieldsReadOnly}
          />
        </div>
        <div className="w-auto">
          <label
            className="block text-sm mb-1 text-gray-400"
            htmlFor={`contatos.${contactIndex}.tipo`}
          >
            Tipo
          </label>
          <select
            id={`contatos.${contactIndex}.tipo`}
            name={`contatos.${contactIndex}.tipo`}
            className="form-input bg-gray-600"
            defaultValue={initialData.tipo}
            disabled={fieldsReadOnly}
          >
            <option value="celular">Celular</option>
            <option value="casa">Casa</option>
            <option value="trabalho">Trabalho</option>
          </select>
        </div>
        {/* FIX: Botão remover Contato agora é desabilitado se *este* item estiver em edição, ou se outro estiver */}
        <button
          type="button"
          onClick={onRemoveContact}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm flex-shrink-0 self-end h-[42px]"
          title="Remover Contato"
          disabled={isDisabled || isEditing}
        >
          X
        </button>
      </div>
      <AddressList
        contactIndex={contactIndex}
        initialAddresses={initialData.enderecos || []}
        isEditing={isEditing}
        isDisabled={isDisabled}
      />
    </fieldset>
  );
};

export default ContactItem;