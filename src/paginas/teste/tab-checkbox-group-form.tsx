import React from 'react';
import useForm from '../../hooks/use-form';
import type { FormField, ValidationResult } from '../../hooks/use-form/props';
import showModal from '../../componentes/modal/hook';


interface IFormValues {
  notificacoes: boolean; // Checkbox Simples
  permissoes: string[];  // Checkbox Group
}

const CheckboxGroupForm = ({ }) => {
  const { handleSubmit, setValidators, formId } = useForm<IFormValues>("checkbox-group-form");

  // --- LÓGICA DE UI (VISUAL APENAS) ---
  // Refs para manipular o estado 'indeterminate' que não existe no HTML nativo
  const parentRef = React.useRef<HTMLInputElement>(null);
  const childrenContainerRef = React.useRef<HTMLDivElement>(null);

  // Função que recalcula o estado do Pai baseado nos Filhos
  const updateParentState = () => {
    if (!parentRef.current || !childrenContainerRef.current) return;

    const children = Array.from(childrenContainerRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    const checkedCount = children.filter(c => c.checked).length;

    if (checkedCount === 0) {
      parentRef.current.checked = false;
      parentRef.current.indeterminate = false;
    } else if (checkedCount === children.length) {
      parentRef.current.checked = true;
      parentRef.current.indeterminate = false;
    } else {
      parentRef.current.checked = false;
      parentRef.current.indeterminate = true; // O Traço Mágico (-)
    }
  };

  // Função para o Pai marcar/desmarcar todos
  const toggleAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!childrenContainerRef.current) {
      return;
    };

    const isChecked = event.target.checked;

    const children = childrenContainerRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    children.forEach(child => {
      child.checked = isChecked;
      // Dispara evento para o useForm saber que mudou
      child.dispatchEvent(new Event('change', { bubbles: true }));
    });
  };

  // --- LÓGICA DE NEGÓCIO (VALIDAÇÃO) ---

  // Regra: Array de permissões não pode ser vazio
  const validarPermissoes = React.useCallback((values: string[], _: FormField | null): ValidationResult => {
    // O useForm agora nos garante que 'values' será um array de strings
    if (!values || values.length === 0) {
      return { message: "Selecione pelo menos uma permissão abaixo.", type: "error" };
    }
    return undefined;
  }, []);

  React.useEffect(() => {
    setValidators({ validarPermissoes });
  }, [setValidators, validarPermissoes]);

  const onSubmit = (data: IFormValues) => {
    showModal({
      title: "Dados do Grupo",
      content: () => (
        <div className="space-y-2">
          <p><strong>Notificações (Single):</strong> {String(data.notificacoes)}</p>
          <p><strong>Permissões (Group):</strong> {JSON.stringify(data.permissoes)}</p>
        </div>
      ),
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
      <h2 className="text-xl font-bold mb-6 text-cyan-400">Teste de Checkbox & Grupos</h2>

      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* CASO 1: Checkbox Único (Flag) */}
        <div className="mb-8 p-4 bg-gray-900 rounded-md">
          <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Caso 1: Flag Booleana</h3>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="notificacoes"
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
            />
            <span className="text-gray-200 group-hover:text-white transition-colors">
              Ativar notificações por e-mail
            </span>
          </label>
        </div>

        {/* CASO 2: Checkbox Group Hierárquico */}
        <div className="mb-6 p-4 bg-gray-900 rounded-md">
          <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
            Caso 2: Grupo Obrigatório
            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-cyan-300">Array</span>
          </h3>

          {/* Título com Indicador de Obrigatório */}
          <div className="mb-3">
            <span className="font-medium text-white">
              Permissões de Acesso
              <span className="text-red-400 ml-1" title="Campo obrigatório">*</span>
            </span>
            <p className="text-xs text-gray-500">Selecione ao menos uma opção.</p>
          </div>

          {/* Hierarquia Visual */}
          <div className="flex flex-col gap-2">

            {/* O PAI (Controller) */}
            <label className="flex items-center gap-3 font-bold text-cyan-400 cursor-pointer hover:opacity-80">
              <input
                type="checkbox"
                ref={parentRef}
                onChange={toggleAll}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
              />
              Selecionar Todas
            </label>

            {/* OS FILHOS (Dados) */}
            <div
              ref={childrenContainerRef}
              className="ml-1 pl-7 border-l-2 border-gray-700 flex flex-col gap-3 py-1"
            >
              <label className="flex items-center gap-3 cursor-pointer hover:text-white text-gray-300 transition-colors">
                <input
                  type="checkbox"
                  name="permissoes"
                  value="ler"
                  onChange={updateParentState} // Atualiza o estado visual do Pai
                  data-validation="validarPermissoes" // <-- Validação ancorada AQUI
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-gray-900"
                />
                Ler Dados
              </label>

              <label className="flex items-center gap-3 cursor-pointer hover:text-white text-gray-300 transition-colors">
                <input
                  type="checkbox"
                  name="permissoes"
                  value="escrever"
                  onChange={updateParentState}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-gray-900"
                />
                Gravar/Editar Dados
              </label>

              <label className="flex items-center gap-3 cursor-pointer hover:text-white text-gray-300 transition-colors">
                <input
                  type="checkbox"
                  name="permissoes"
                  value="excluir"
                  onChange={updateParentState}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-gray-900"
                />
                Excluir Registros
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="py-2 px-6 rounded bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg transition-transform active:scale-95"
          >
            Validar e Salvar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CheckboxGroupForm;