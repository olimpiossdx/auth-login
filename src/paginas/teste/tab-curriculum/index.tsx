// --- NOVO CENÁRIO 5: Currículo Completo (com Edição Contextual e Submit Parcial) ---

import React from 'react';
import showModal from '../../../componentes/modal/hook';
import useForm from '../../../hooks/use-form';
import type { ICurriculumFormValues } from './types';
import DadosAdicionais from './dados-adicionais';
import Escolaridades from './escolaridades';
import Experiencias from './experiencias';
import Conhecimentos from './conhecimentos';

const CurriculumForm = ({ }) => {
  const { handleSubmit, formId, getValue, resetSection } = useForm<ICurriculumFormValues>('curriculum-form');

  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Ref para snapshot
  const originalEditDataRef = React.useRef<any>(null);

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
    /* ... clone ... */
    const cleanData = { ...data };

    showModal({
      title: 'Seção Salva!',
      content: () => (
        <div>{`Dados do Formulário Inteiro: ${JSON.stringify(cleanData, null, 2)}`}</div>
      ),
      // Callback - adicionando função de execução ao final do modal
      onClose: () => console.log('Fechou!'),
    });
    console.log('body', cleanData);
    setEditingId(null);
    originalEditDataRef.current = null;
  };

  return (<div className='bg-gray-800 p-6 rounded-lg shadow-xl'>
    <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* --- SEÇÃO DADOS ADICIONAIS --- */}
      <DadosAdicionais editingId={editingId} handleCancel={handleCancel} handleEdit={handleEdit} />

      {/* --- SEÇÃO ESCOLARIDADES (LISTA) --- */}
      <Escolaridades editingId={editingId} handleCancel={handleCancel} handleEdit={handleEdit} />

      {/* --- SEÇÃO EXPERIÊNCIAS (LISTA) --- */}
      <Experiencias editingId={editingId} handleCancel={handleCancel} handleEdit={handleEdit} />

      {/* --- SEÇÃO CONHECIMENTOS (LISTA) --- */}
      <Conhecimentos editingId={editingId} handleCancel={handleCancel} handleEdit={handleEdit} />

      {/* O submit geral agora está dentro dos botões 'Salvar Seção' */}
    </form>
  </div>);
};

export default CurriculumForm;
