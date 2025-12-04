import useList from "../../hooks/list";

// --- Componente AddressItem ---
export interface IAddress {
  rua: string;
  cidade: string;
};

export interface IAddressListProps {
  contactIndex: number;
  initialAddresses: IAddress[];
  isEditing: boolean;
  isDisabled: boolean;
};

const AddressList: React.FC<IAddressListProps> = ({
  contactIndex, initialAddresses, isEditing, isDisabled
}) => {
  const { items: addressFields, add: appendAddress, remove: removeAddress, } = useList<IAddress>(initialAddresses.length > 0 ? initialAddresses : [{ rua: "", cidade: "" }]);
  return (<div className="ml-4 pl-4 border-l border-gray-600 mt-3 pt-3">
    <h5 className="text-sm font-semibold mb-2 text-gray-400 flex justify-between items-center">
      <span>Endereços</span>
      {/* FIX: Botão Adicionar Endereço agora é desabilitado corretamente */}
      <button
        type="button"
        onClick={() => appendAddress({ rua: "", cidade: "" })}
        className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
        disabled={!isEditing || isDisabled}
      >
        + Adicionar Endereço
      </button>
    </h5>
    {addressFields.map((addressField, addressIndex) => (
      <div
        key={addressField.id}
        className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 relative pr-8"
      >
        <input
          name={`contatos.${contactIndex}.enderecos.${addressIndex}.rua`}
          type="text"
          placeholder="Rua, Nº"
          className="form-input text-sm"
          defaultValue={addressField.data.rua}
          readOnly={!isEditing}
          disabled={isDisabled}
        />
        <input
          name={`contatos.${contactIndex}.enderecos.${addressIndex}.cidade`}
          type="text"
          placeholder="Cidade"
          className="form-input text-sm"
          defaultValue={addressField.data.cidade}
          data-validation="validarCidade"
          readOnly={!isEditing}
          disabled={isDisabled}
        />
        {addressFields.length > 1 && (
          <button
            type="button"
            onClick={() => removeAddress(addressIndex)}
            className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-0.5 px-1.5 rounded-full text-xs leading-none"
            title="Remover Endereço"
            style={{ width: "20px", height: "20px" }}
            disabled={!isEditing || isDisabled}
          >
            X
          </button>
        )}
      </div>
    ))}
  </div>);
};

export default AddressList;