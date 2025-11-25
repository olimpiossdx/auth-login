import React from "react";
import useForm from "../hooks/use-form";
import showModal from "./modal/hook";
import type { IModalHandle, IModalOptions } from "./modal/types";
import useList from "../hooks/list";
import type { FormField, ValidationResult } from "../hooks/use-form/props";
import Autocomplete, { type IOption } from "./autocomplete";
import StarRating from "./start-rating";
import TabButton from "./tab-button";

// --- Componente AddressItem ---
interface Address {
  rua: string;
  cidade: string;
}
interface AddressListProps {
  contactIndex: number;
  initialAddresses: Address[];
  isEditing: boolean;
  isDisabled: boolean;
}
const AddressList: React.FC<AddressListProps> = ({
  contactIndex,
  initialAddresses,
  isEditing,
  isDisabled,
}) => {
  const {
    fields: addressFields,
    append: appendAddress,
    remove: removeAddress,
  } = useList<Address>(
    initialAddresses.length > 0 ? initialAddresses : [{ rua: "", cidade: "" }]
  );
  return (
    <div className="ml-4 pl-4 border-l border-gray-600 mt-3 pt-3">
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
            defaultValue={addressField.value.rua}
            readOnly={!isEditing}
            disabled={isDisabled}
          />
          <input
            name={`contatos.${contactIndex}.enderecos.${addressIndex}.cidade`}
            type="text"
            placeholder="Cidade"
            className="form-input text-sm"
            defaultValue={addressField.value.cidade}
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
    </div>
  );
};

// --- Componente ContactItem ---
interface Contato {
  numero: string;
  tipo: string;
  enderecos?: Address[];
}
interface ContactItemProps {
  contactIndex: number;
  initialData: Contato;
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

// --- COMPONENTES DE EXEMPLO ---

// 1. Cenário: Formulário de Login (Nativo)
const LoginForm = ({
  showModal,
}: {
  showModal: (options: IModalOptions) => IModalHandle;
}) => {
  interface LoginFormValues {
    email: string;
    senha?: string;
  }
  const { handleSubmit, formId } = useForm<LoginFormValues>("login-form");
  const onSubmit = (data: LoginFormValues) => {
    showModal({
      title: "Login bem-sucedido!",
      content: () => <div>Dados: {JSON.stringify(data)}</div>,
      closeOnBackdropClick: false, // Obriga interação
      onClose: () => console.log("Fechou!"), // Callback
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
      <h3 className="text-xl font-bold mb-4 text-cyan-400">
        1. Campos Nativos
      </h3>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-4">
          <label className="block mb-1 text-gray-300" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-input"
            required
            pattern="^\S+@\S+$"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-gray-300" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            className="form-input"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Entrar
        </button>
      </form>
    </div>
  );
};

// 2. Cenário: Validação Customizada (Nativo)
const RegistrationForm = ({
  showModal,
}: {
  showModal: (options: IModalOptions) => IModalHandle;
}) => {
  interface RegFormValues {
    senha?: string;
    confirmarSenha?: string;
  }
  const { handleSubmit, setValidators, formId } =
    useForm<RegFormValues>("reg-form");
  const validarSenha = React.useCallback(
    (
      value: any,
      _: FormField | null,
      formValues: RegFormValues
    ): ValidationResult =>
      value !== formValues.senha
        ? { message: "As senhas não correspondem", type: "error" }
        : undefined,
    []
  );

  React.useEffect(
    () => setValidators({ validarSenha }),
    [setValidators, validarSenha]
  );
  const onSubmit = (data: RegFormValues) => {
    showModal({
      title: "Cadastro realizado!",
      content: () => <div>Dados: {JSON.stringify(data)}</div>,
      closeOnBackdropClick: false, // Obriga interação
      contentProps: { className: "whitespace-pre-wrap" },
      onClose: () => console.log("Fechou!"), // Callback
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
      <h3 className="text-xl font-bold mb-4 text-cyan-400">
        2. Validação Customizada (Nativo)
      </h3>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-4">
          <label className="block mb-1 text-gray-300" htmlFor="reg_senha">
            Senha
          </label>
          <input
            id="reg_senha"
            name="senha"
            type="password"
            className="form-input"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-gray-300" htmlFor="confirmarSenha">
            Confirmar Senha
          </label>
          <input
            id="confirmarSenha"
            name="confirmarSenha"
            type="password"
            className="form-input"
            required
            data-validation="validarSenha"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded"
        >
          Cadastrar
        </button>
      </form>
    </div>
  );
};

// 3. Cenário: Híbrido Simples (Atualizado com resetSection e Submit Parcial)
const HybridFormSimple = ({
  showModal,
}: {
  showModal: (options: IModalOptions) => IModalHandle;
}) => {
  interface MyHybridForm {
    rating: number | "";
    comentario: string;
    corFavorita: string;
  }
  const { handleSubmit, setValidators, formId, getValue, resetSection } = useForm<MyHybridForm>("hybrid-form-simple");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const isEditingAny = editingId !== null;
  const originalEditDataRef = React.useRef<any>(null);

  const validarComentario = React.useCallback((value: any, _: FormField | null, formValues: MyHybridForm ): ValidationResult => {
      const r = Number(formValues.rating);

      if (r > 0 && r <= 3 && !value)
        return { message: "O comentário é obrigatório...", type: "error" };
      if (value && value.length > 0 && value.length < 5)
        return { message: "Comentário curto.", type: "warning" };
      return undefined;
    },
    []
  );

  const validarCor = React.useCallback((value: any,_field: FormField | null,__: MyHybridForm ): ValidationResult => {
      if (value === "verde") {
        return { message: "Verde é uma ótima cor!", type: "success" };
      };

      return undefined;
    },[]);

  React.useEffect(    () => setValidators({ validarComentario, validarCor }),
    [setValidators, validarComentario, validarCor]
  );

  const onSubmit = (data: MyHybridForm) => {
    const body =JSON.stringify(data);
    showModal({
      title: "Form Híbrido Salvo!",
      content: () => <div>Dados: {body}</div>,
      closeOnBackdropClick: false, // Obriga interação
      onClose: () => console.log("Fechou!"), // Callback
    });
    console.log('data', data);
    setEditingId(null);
    originalEditDataRef.current = null;
  };

  const cores: IOption[] = [
    { value: "vermelho", label: "Vermelho" },
    { value: "azul", label: "Azul" },
    { value: "verde", label: "Verde" },
    { value: "amarelo", label: "Amarelo", disabled: true },
    { value: "preto", label: "Preto" },
    { value: "branco", label: "Branco" },
  ];

  const handleEdit = (id: string, prefix: string) => {
    originalEditDataRef.current = getValue(prefix);
    setEditingId(id);
  };
  const handleCancel = (_: string, prefix: string) => {
    resetSection(prefix, originalEditDataRef.current);
    originalEditDataRef.current = null;
    setEditingId(null);
  };

  const isEditingThis = editingId === "hybridSimple";
  const isEditingOther = isEditingAny && !isEditingThis;
  const prefix = "";

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <fieldset disabled={isEditingOther}>
          <legend className="text-xl font-bold mb-4 text-cyan-400 flex justify-between items-center w-full">
            3. Híbrido (Rating + Autocomplete)
            <div>
              {!isEditingThis && (
                <button
                  type="button"
                  onClick={() => handleEdit("hybridSimple", prefix)}
                  disabled={isEditingAny}
                  className={`py-1 px-3 rounded text-sm ${
                    isEditingAny
                      ? "bg-gray-500"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Editar
                </button>
              )}
              {isEditingThis && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCancel("hybridSimple", prefix)}
                    className="py-1 px-3 rounded text-sm bg-gray-600 hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-1 px-3 rounded text-sm bg-green-600 hover:bg-green-700"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>
          </legend>

          <StarRating
            name="rating"
            label="Avaliação (obrigatório)"
            required
            readOnly={!isEditingThis}
            disabled={isEditingOther}
          />
          <Autocomplete
            name="corFavorita"
            label="Cor Favorita (obrigatório)"
            options={cores}
            required
            validationKey="validarCor"
            readOnly={!isEditingThis}
            disabled={isEditingOther}
            initialValue={getValue("corFavorita") || ""} 
          />
          <div className="mb-4">
            <label className="block mb-1 text-gray-300" htmlFor="comentario">
              Comentário
            </label>
            <input
              id="comentario"
              name="comentario"
              type="text"
              className="form-input"
              data-validation="validarComentario"
              readOnly={!isEditingThis}
            />
          </div>

          {/* Botão de submit geral REMOVIDO */}
        </fieldset>
      </form>
    </div>
  );
};

// 4. Cenário: Lista Aninhada (Atualizado com Submit Parcial)
const NestedListForm = ({
  showModal,
}: {
  showModal: (options: IModalOptions) => IModalHandle;
}) => {
  interface MyNestedListForm {
    contatos?: Contato[];
  }
  const { handleSubmit, setValidators, formId, getValue, resetSection } =
    useForm<MyNestedListForm>("nested-list-form");
  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useList<Contato>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const isEditingAny = editingId !== null;
  const originalEditDataRef = React.useRef<any>(null);

  const validarCidade = React.useCallback(
    (value: any,
      field: FormField | null,
      formValues: MyNestedListForm
    ): ValidationResult => {
      const m = field?.name.match(/contatos\.(\d+)\.enderecos\.(\d+)\.cidade/);
      if (m) {
        const cI = parseInt(m[1], 10);
        const aI = parseInt(m[2], 10);
        const rua = formValues.contatos?.[cI]?.enderecos?.[aI]?.rua;
        if (rua && !value)
          return {
            message: "Cidade obrigatória se rua preenchida.",
            type: "error",
          };
      }
      return undefined;
    },
    []
  );

  React.useEffect(() => {
    setValidators({ validarCidade });
  }, [setValidators, validarCidade]);

  const onSubmit = (data: MyNestedListForm) => {
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
                    className={`py-0.5 px-2 rounded text-xs ${
                      isEditingOther
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

// --- NOVO CENÁRIO 5: Currículo Completo (com Edição Contextual e Submit Parcial) ---
const CurriculumForm = ({
  showModal,
}: {
  showModal: (options: IModalOptions) => IModalHandle;
}) => {
  // --- Tipos para o Currículo ---
  interface IEscolaridade {
    nivel: string;
    curso: string;
    situacao: string;
  }
  interface IExperiencia {
    nomeEmpresa: string;
    cargo: string;
    inicio: string;
    finalizacao: string;
    atual: boolean;
    atividades: string;
  }
  interface IConhecimento {
    nivel: string;
    descricao: string;
  }
  interface IDadosAdicionais {
    rg: string;
    orgaoEmissor: string;
    pis: string;
    filiacao1: string;
    filiacao2: string;
    nacionalidade: string;
    naturalidade: string;
    raca: string;
    tipoResidencia: string;
    parenteEmpresa: string;
    situacao: string;
    ultimaConsulta: string;
    retorno: string;
    exFuncionario: string;
    pcdFisico: boolean;
    pcdIntelectual: boolean;
    pcdVisual: boolean;
    pcdAuditivo: boolean;
    pcdOutra: boolean;
    pcdDetalhe: string;
    altura: string;
    tamanhoUniforme: string;
    tamanhoCalcado: string;
  }
  interface ICurriculumFormValues {
    dadosAdicionais?: IDadosAdicionais;
    escolaridades?: IEscolaridade[];
    experiencias?: IExperiencia[];
    conhecimentos?: IConhecimento[];
  }

  // --- Dados Iniciais ---
  const [initialEscolaridade] = React.useState<IEscolaridade[]>([
    {
      nivel: "Ensino Técnico - Superior",
      curso: "Engenharia de Computação",
      situacao: "Completo",
    },
  ]);
  const [initialExperiencias] = React.useState<IExperiencia[]>([
    {
      nomeEmpresa: "Teste de empresa",
      cargo: "Cargo de empresa",
      inicio: "2025-02",
      finalizacao: "2024-01",
      atual: false,
      atividades: "Profissão de empresa",
    },
    {
      nomeEmpresa: "Supermercados BH",
      cargo: "Desenvolvedor",
      inicio: "2019-04",
      finalizacao: "",
      atual: true,
      atividades: "Desenvolvendo soluções para o supermercado BH.",
    },
  ]);
  const [initialConhecimentos] = React.useState<IConhecimento[]>([
    { nivel: "Intermediário", descricao: "asdasd" },
  ]);
  const [initialDadosAdicionais] = React.useState<IDadosAdicionais>({
    rg: "mg 888888",
    orgaoEmissor: "ssp",
    pis: "123.12233.44-5",
    filiacao1: "MINHA MÃE",
    filiacao2: "MEU PAI",
    nacionalidade: "Brasileira",
    naturalidade: "BETIM - MG",
    raca: "Branca",
    tipoResidencia: "Própria",
    parenteEmpresa: "false",
    situacao: "Trabalhando",
    ultimaConsulta: "2025-10-13",
    retorno: "(13454) OLIMPIO...",
    exFuncionario: "false",
    pcdFisico: false,
    pcdIntelectual: false,
    pcdVisual: false,
    pcdAuditivo: false,
    pcdOutra: false,
    pcdDetalhe: "um teste",
    altura: "0,00",
    tamanhoUniforme: "Não",
    tamanhoCalcado: "0",
  });

  const { handleSubmit, formId, getValue, resetSection } =
    useForm<ICurriculumFormValues>("curriculum-form");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const originalEditDataRef = React.useRef<any>(null); // Ref para snapshot

  const {
    fields: escolaridadeFields,
    append: appendEscolaridade,
    remove: removeEscolaridade,
  } = useList<IEscolaridade>(initialEscolaridade);
  const {
    fields: experienciaFields,
    append: appendExperiencia,
    remove: removeExperiencia,
  } = useList<IExperiencia>(initialExperiencias);
  const {
    fields: conhecimentoFields,
    append: appendConhecimento,
    remove: removeConhecimento,
  } = useList<IConhecimento>(initialConhecimentos);

  const handleEdit = (id: string, prefix: string) => {
    originalEditDataRef.current = getValue(prefix);
    setEditingId(id);
  };
  const handleCancel = (_: string, prefix: string) => {
    resetSection(prefix, originalEditDataRef.current);
    originalEditDataRef.current = null;
    setEditingId(null);
  };

  const onSubmit = (data: ICurriculumFormValues) => {
    const cleanData = { ...data /* ... limpeza ... */ };

    showModal({
      title: "Seção Salva!",
      content: () => (
        <div>{`Dados do Formulário Inteiro: ${JSON.stringify(cleanData, null, 2)}`}</div>
      ),
      onClose: () => console.log("Fechou!"), // Callback
    });

    setEditingId(null);
    originalEditDataRef.current = null;
  };

  const ActionButtons: React.FC<{
    sectionId: string;
    prefix: string;
    onCancel: () => void;
    onEdit: () => void;
    isOtherEditing: boolean;
    isEditingThis: boolean;
  }> = ({ onCancel, onEdit, isOtherEditing, isEditingThis }) => (
    <div className="flex justify-end gap-2 mt-2 shrink-0">
      {!isEditingThis && (
        <button
          type="button"
          onClick={onEdit}
          disabled={isOtherEditing}
          className={`py-1 px-3 rounded text-sm font-medium ${
            isOtherEditing
              ? "bg-gray-500 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          Editar
        </button>
      )}
      {isEditingThis && (
        <>
          <button
            type="button"
            onClick={onCancel}
            className="py-1 px-3 rounded text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="py-1 px-3 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
          >
            Salvar
          </button>
        </>
      )}
    </div>
  );

  const isEditingAny = editingId !== null;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* --- SEÇÃO DADOS ADICIONAIS --- */}
        <fieldset
          className="mb-6 p-4 border rounded border-gray-700"
          disabled={isEditingAny && editingId !== "dadosAdicionais"}
        >
          <legend className="text-lg font-semibold text-cyan-400 px-2 flex justify-between items-center w-full">
            Dados Adicionais
            <ActionButtons
              sectionId="dadosAdicionais"
              prefix="dadosAdicionais."
              isEditingThis={editingId === "dadosAdicionais"}
              isOtherEditing={isEditingAny && editingId !== "dadosAdicionais"}
              onEdit={() => handleEdit("dadosAdicionais", "dadosAdicionais.")}
              onCancel={() =>
                handleCancel("dadosAdicionais", "dadosAdicionais.")
              }
            />
          </legend>
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2`}
          >
            <div>
              <label className="block text-sm mb-1">RG</label>
              <input
                name="dadosAdicionais.rg"
                className="form-input"
                defaultValue={initialDadosAdicionais.rg}
                readOnly={editingId !== "dadosAdicionais"}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Órgão Emissor</label>
              <input
                name="dadosAdicionais.orgaoEmissor"
                className="form-input"
                defaultValue={initialDadosAdicionais.orgaoEmissor}
                readOnly={editingId !== "dadosAdicionais"}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">PIS</label>
              <input
                name="dadosAdicionais.pis"
                className="form-input"
                type="number"
                defaultValue={initialDadosAdicionais.pis}
                readOnly={editingId !== "dadosAdicionais"}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Filiação 1</label>
              <input
                name="dadosAdicionais.filiacao1"
                className="form-input"
                defaultValue={initialDadosAdicionais.filiacao1}
                readOnly={editingId !== "dadosAdicionais"}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Filiação 2</label>
              <input
                name="dadosAdicionais.filiacao2"
                className="form-input"
                defaultValue={initialDadosAdicionais.filiacao2}
                readOnly={editingId !== "dadosAdicionais"}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Nacionalidade *</label>
              <input
                name="dadosAdicionais.nacionalidade"
                className="form-input"
                required
                defaultValue={initialDadosAdicionais.nacionalidade}
                readOnly={editingId !== "dadosAdicionais"}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Naturalidade *</label>
              <input
                name="dadosAdicionais.naturalidade"
                className="form-input"
                required
                defaultValue={initialDadosAdicionais.naturalidade}
                readOnly={editingId !== "dadosAdicionais"}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Raça *</label>
              <select
                name="dadosAdicionais.raca"
                className="form-input bg-gray-600"
                required
                defaultValue={initialDadosAdicionais.raca}
                disabled={editingId !== "dadosAdicionais"}
              >
                <option>Branca</option>
                <option>Parda</option>
                <option>Preta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Tipo Residência *</label>
              <select
                name="dadosAdicionais.tipoResidencia"
                className="form-input bg-gray-600"
                required
                defaultValue={initialDadosAdicionais.tipoResidencia}
                disabled={editingId !== "dadosAdicionais"}
              >
                <option>Própria</option>
                <option>Alugada</option>
              </select>
            </div>
            <div className="col-span-full">
              <label className="block text-sm mb-1">
                Possui parente na empresa?
              </label>
              <div className="flex gap-4">
                <label>
                  <input
                    type="radio"
                    name="dadosAdicionais.parenteEmpresa"
                    value="true"
                    defaultChecked={
                      initialDadosAdicionais.parenteEmpresa === "true"
                    }
                    disabled={editingId !== "dadosAdicionais"}
                  />
                  Sim
                </label>
                <label>
                  <input
                    type="radio"
                    name="dadosAdicionais.parenteEmpresa"
                    value="false"
                    defaultChecked={
                      initialDadosAdicionais.parenteEmpresa === "false"
                    }
                    disabled={editingId !== "dadosAdicionais"}
                  />
                  Não
                </label>
              </div>
            </div>
            {/* ... (outros campos) ... */}
          </div>
        </fieldset>

        {/* --- SEÇÃO ESCOLARIDADES (LISTA) --- */}
        <fieldset
          className="mb-6 border rounded border-gray-700"
          disabled={isEditingAny && editingId !== "escolaridades"}
        >
          <legend className="text-lg font-semibold text-cyan-400 px-2 w-full flex justify-between items-center">
            Escolaridades
            <ActionButtons
              sectionId="escolaridades"
              prefix="escolaridades."
              isEditingThis={editingId === "escolaridades"}
              isOtherEditing={isEditingAny && editingId !== "escolaridades"}
              onEdit={() => handleEdit("escolaridades", "escolaridades.")}
              onCancel={() => handleCancel("escolaridades", "escolaridades.")}
              //onSave={() => {}} // O submit faz o save
            />
          </legend>
          <div className="p-4 space-y-4">
            {escolaridadeFields.map((field, index) => {
              const isEditingThisSection = editingId === "escolaridades";
              return (
                <fieldset
                  key={field.id}
                  className={`p-3 border rounded relative border-gray-600`}
                >
                  {/* Botão de remover SÓ aparece no modo de edição da seção */}
                  {isEditingThisSection && (
                    <button
                      type="button"
                      onClick={() => removeEscolaridade(index)}
                      className={`absolute top-2 right-2 py-0.5 px-2 rounded text-xs bg-red-600 hover:bg-red-700 text-white`}
                      title="Remover"
                    >
                      X
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                    <div>
                      <label className="block text-sm mb-1">
                        Escolaridade *
                      </label>
                      <select
                        name={`escolaridades.${index}.nivel`}
                        className="form-input bg-gray-600"
                        required
                        defaultValue={field.value.nivel}
                        disabled={!isEditingThisSection}
                      >
                        <option>Ensino Médio</option>
                        <option>Ensino Técnico - Superior</option>
                        <option>Pós-graduação</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Curso *</label>
                      <input
                        name={`escolaridades.${index}.curso`}
                        className="form-input"
                        required
                        defaultValue={field.value.curso}
                        readOnly={!isEditingThisSection}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Situação *</label>
                      <select
                        name={`escolaridades.${index}.situacao`}
                        className="form-input bg-gray-600"
                        required
                        defaultValue={field.value.situacao}
                        disabled={!isEditingThisSection}
                      >
                        <option>Completo</option>
                        <option>Cursando</option>
                        <option>Incompleto</option>
                      </select>
                    </div>
                  </div>
                </fieldset>
              );
            })}
            {/* Botão Adicionar SÓ é habilitado/visível quando a seção está em edição */}
            {editingId === "escolaridades" && (
              <button
                type="button"
                onClick={() =>
                  appendEscolaridade({
                    nivel: "Ensino Médio",
                    curso: "",
                    situacao: "Cursando",
                  })
                }
                className={`text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded w-full`}
              >
                + Adicionar Escolaridade
              </button>
            )}
          </div>
        </fieldset>

        {/* --- SEÇÃO EXPERIÊNCIAS (LISTA) --- */}
        <fieldset
          className="mb-6 border rounded border-gray-700"
          disabled={isEditingAny && editingId !== "experiencias"}
        >
          <legend className="text-lg font-semibold text-cyan-400 px-2 w-full flex justify-between items-center">
            Experiências
            <ActionButtons
              sectionId="experiencias"
              prefix="experiencias."
              isEditingThis={editingId === "experiencias"}
              isOtherEditing={isEditingAny && editingId !== "experiencias"}
              onEdit={() => handleEdit("experiencias", "experiencias.")}
              onCancel={() => handleCancel("experiencias", "experiencias.")}
              //onSave={() => {}} // O submit faz o save
            />
          </legend>
          <div className="p-4 space-y-4">
            {experienciaFields.map((field, index) => {
              const isEditingThisSection = editingId === "experiencias";
              return (
                <fieldset
                  key={field.id}
                  className={`p-3 border rounded relative border-gray-600`}
                >
                  {isEditingThisSection && (
                    <button
                      type="button"
                      onClick={() => removeExperiencia(index)}
                      className={`absolute top-2 right-2 py-0.5 px-2 rounded text-xs bg-red-600 hover:bg-red-700 text-white`}
                      title="Remover"
                    >
                      X
                    </button>
                  )}
                  <div className="space-y-2 mt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm mb-1">
                          Nome Empresa *
                        </label>
                        <input
                          name={`experiencias.${index}.nomeEmpresa`}
                          className="form-input"
                          required
                          defaultValue={field.value.nomeEmpresa}
                          readOnly={!isEditingThisSection}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Cargo *</label>
                        <input
                          name={`experiencias.${index}.cargo`}
                          className="form-input"
                          required
                          defaultValue={field.value.cargo}
                          readOnly={!isEditingThisSection}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-end">
                      <div>
                        <label className="block text-sm mb-1">Início *</label>
                        <input
                          name={`experiencias.${index}.inicio`}
                          type="month"
                          className="form-input"
                          required
                          defaultValue={
                            field.value.inicio
                              ? field.value.inicio.substring(0, 7)
                              : ""
                          }
                          readOnly={!isEditingThisSection}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Finalização
                        </label>
                        <input
                          name={`experiencias.${index}.finalizacao`}
                          type="month"
                          className="form-input"
                          defaultValue={
                            field.value.finalizacao
                              ? field.value.finalizacao.substring(0, 7)
                              : ""
                          }
                          readOnly={!isEditingThisSection || field.value.atual}
                          disabled={field.value.atual || !isEditingThisSection}
                        />
                      </div>
                      <div className="flex items-center pb-2">
                        <label>
                          <input
                            type="checkbox"
                            name={`experiencias.${index}.atual`}
                            defaultChecked={field.value.atual}
                            disabled={!isEditingThisSection}
                            className="mr-1"
                          />
                          Emprego Atual
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">
                        Atividades Exercidas
                      </label>
                      <textarea
                        name={`experiencias.${index}.atividades`}
                        className="form-input h-16 resize-none"
                        defaultValue={field.value.atividades}
                        readOnly={!isEditingThisSection}
                      ></textarea>
                    </div>
                  </div>
                </fieldset>
              );
            })}
            {editingId === "experiencias" && (
              <button
                type="button"
                onClick={() =>
                  appendExperiencia({
                    nomeEmpresa: "",
                    cargo: "",
                    inicio: "",
                    finalizacao: "",
                    atual: false,
                    atividades: "",
                  })
                }
                className={`text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded w-full`}
              >
                + Adicionar Experiência
              </button>
            )}
          </div>
        </fieldset>

        {/* --- SEÇÃO CONHECIMENTOS (LISTA) --- */}
        <fieldset
          className="mb-6 border rounded border-gray-700"
          disabled={isEditingAny && editingId !== "conhecimentos"}
        >
          <legend className="text-lg font-semibold text-cyan-400 px-2 w-full flex justify-between items-center">
            Conhecimentos
            <ActionButtons
              sectionId="conhecimentos"
              prefix="conhecimentos."
              isEditingThis={editingId === "conhecimentos"}
              isOtherEditing={isEditingAny && editingId !== "conhecimentos"}
              onEdit={() => handleEdit("conhecimentos", "conhecimentos.")}
              onCancel={() => handleCancel("conhecimentos", "conhecimentos.")}
              //onSave={() => {}} // O submit faz o save
            />
          </legend>
          <div className="p-4 space-y-4">
            {conhecimentoFields.map((field, index) => {
              const isEditingThisSection = editingId === "conhecimentos";
              return (
                <fieldset
                  key={field.id}
                  className={`p-3 border rounded relative border-gray-600`}
                >
                  {isEditingThisSection && (
                    <button
                      type="button"
                      onClick={() => removeConhecimento(index)}
                      className={`absolute top-2 right-2 py-0.5 px-2 rounded text-xs bg-red-600 hover:bg-red-700 text-white`}
                      title="Remover"
                    >
                      X
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                    <div>
                      <label className="block text-sm mb-1">Nível *</label>
                      <select
                        name={`conhecimentos.${index}.nivel`}
                        className="form-input bg-gray-600"
                        required
                        defaultValue={field.value.nivel}
                        disabled={!isEditingThisSection}
                      >
                        <option>Básico</option>
                        <option>Intermediário</option>
                        <option>Avançado</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm mb-1">Descrição *</label>
                      <input
                        name={`conhecimentos.${index}.descricao`}
                        className="form-input"
                        required
                        defaultValue={field.value.descricao}
                        readOnly={!isEditingThisSection}
                      />
                    </div>
                  </div>
                </fieldset>
              );
            })}
            {editingId === "conhecimentos" && (
              <button
                type="button"
                onClick={() =>
                  appendConhecimento({ nivel: "Básico", descricao: "" })
                }
                className={`text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded w-full`}
              >
                + Adicionar Conhecimento
              </button>
            )}
          </div>
        </fieldset>

        {/* O submit geral agora está dentro dos botões "Salvar Seção" */}
      </form>
    </div>
  );
};

// --- Componente Principal e Estilos ---

const Teste: React.FC = () => {
  // Foca no nova tab/formulário-ativo
  const [activeTab, setActiveTab] = React.useState("curriculum"); 

  const scenarios = {
    login: <LoginForm showModal={showModal} />,
    registration: <RegistrationForm showModal={showModal} />,
    hybrid: <HybridFormSimple showModal={showModal} />,
    nestedList: <NestedListForm showModal={showModal} />,
    curriculum: <CurriculumForm showModal={showModal} />,
  };

  return (
    <div className="bg-gray-800 text-white min-h-screen p-4 sm:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-xl sm:text-4xl font-extrabold text-cyan-400">
            `useForm` - v4.12
          </h1>
          <p className="text-gray-400 mt-2">Edição Contextual por Seção</p>
        </header>

        <div className="flex justify-center flex-wrap gap-2 mb-6">
          {/* Implementação dos Botões */}
          <TabButton 
            tabId="login" 
            label="Nativo" 
            isActive={activeTab === "login"} 
            onClick={setActiveTab} 
          />
          <TabButton 
            tabId="registration" 
            label="Nativo (Custom)" 
            isActive={activeTab === "registration"} 
            onClick={setActiveTab} 
          />
          <TabButton 
            tabId="hybrid" 
            label="Híbrido Simples" 
            isActive={activeTab === "hybrid"} 
            onClick={setActiveTab} 
          />
          <TabButton 
            tabId="nestedList" 
            label="Lista Aninhada" 
            isActive={activeTab === "nestedList"} 
            onClick={setActiveTab} 
          />
          <TabButton 
            tabId="curriculum" 
            label="Currículo (Edição)" 
            isActive={activeTab === "curriculum"} 
            onClick={setActiveTab} 
          />
        </div>

        <main className="transition-opacity duration-300 ease-in-out">
            {scenarios[activeTab as keyof typeof scenarios]}
        </main>
      </div>
    </div>
  );
};

export default Teste;
