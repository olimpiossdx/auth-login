import React from 'react'
import type { IConhecimento, ISectionProps } from './types'
import useList from '../../../hooks/list';
import ActionButtons from './action-button';

const Conhecimentos: React.FC<ISectionProps> = ({ editingId, handleCancel, handleEdit }) => {
  const isEditingAny = editingId !== null;

  const [initialConhecimentos] = React.useState<IConhecimento[]>([{ nivel: 'Intermediário', descricao: 'asdasd' },]);
  const { fields: conhecimentoFields, append: appendConhecimento, remove: removeConhecimento, } = useList<IConhecimento>(initialConhecimentos);

  return (<fieldset
    className='mb-6 border rounded border-gray-700'
    disabled={isEditingAny && editingId !== 'conhecimentos'}
  >
    <legend className='text-lg font-semibold text-cyan-400 px-2 w-full flex justify-between items-center'>
      Conhecimentos
      <ActionButtons
        sectionId='conhecimentos'
        prefix='conhecimentos.'
        isEditingThis={editingId === 'conhecimentos'}
        isOtherEditing={isEditingAny && editingId !== 'conhecimentos'}
        onEdit={() => handleEdit('conhecimentos', 'conhecimentos.')}
        onCancel={() => handleCancel('conhecimentos', 'conhecimentos.')}
      //onSave={() => {}} // O submit faz o save
      />
    </legend>
    <div className='p-4 space-y-4'>
      {conhecimentoFields.map((field, index) => {
        const isEditingThisSection = editingId === 'conhecimentos';
        return (
          <fieldset
            key={field.id}
            className={`p-3 border rounded relative border-gray-600`}
          >
            {isEditingThisSection && (
              <button
                type='button'
                onClick={() => removeConhecimento(index)}
                className={`absolute top-2 right-2 py-0.5 px-2 rounded text-xs bg-red-600 hover:bg-red-700 text-white`}
                title='Remover'
              >
                X
              </button>
            )}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-2 mt-1'>
              <div>
                <label className='block text-sm mb-1'>Nível *</label>
                <select
                  name={`conhecimentos.${index}.nivel`}
                  className='form-input bg-gray-600'
                  required
                  defaultValue={field.value.nivel}
                  disabled={!isEditingThisSection}
                >
                  <option>Básico</option>
                  <option>Intermediário</option>
                  <option>Avançado</option>
                </select>
              </div>
              <div className='md:col-span-2'>
                <label className='block text-sm mb-1'>Descrição *</label>
                <input
                  name={`conhecimentos.${index}.descricao`}
                  className='form-input'
                  required
                  defaultValue={field.value.descricao}
                  readOnly={!isEditingThisSection}
                />
              </div>
            </div>
          </fieldset>
        );
      })}
      {editingId === 'conhecimentos' && (
        <button
          type='button'
          onClick={() =>
            appendConhecimento({ nivel: 'Básico', descricao: '' })
          }
          className={`text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded w-full`}
        >
          + Adicionar Conhecimento
        </button>
      )}
    </div>
  </fieldset>
  )
}

export default Conhecimentos