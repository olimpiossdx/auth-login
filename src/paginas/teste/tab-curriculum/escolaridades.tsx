import React from 'react'
import type { IEscolaridade, ISectionProps } from './types';
import useList from '../../../hooks/list';
import ActionButtons from './action-button';

const Escolaridades: React.FC<ISectionProps> = ({ editingId, handleCancel, handleEdit }) => {
  const isEditingAny = editingId !== null;

  const [initialEscolaridade] = React.useState<IEscolaridade[]>([{ nivel: 'Ensino Técnico - Superior', curso: 'Engenharia de Computação', situacao: 'Completo' }]);
  const { fields: escolaridadeFields, append: appendEscolaridade, remove: removeEscolaridade } = useList<IEscolaridade>(initialEscolaridade);

  return (
    <fieldset
      className='mb-6 border rounded border-gray-700'
      disabled={isEditingAny && editingId !== 'escolaridades'}
    >
      <legend className='text-lg font-semibold text-cyan-400 px-2 w-full flex justify-between items-center'>
        Escolaridades
        <ActionButtons
          sectionId='escolaridades'
          prefix='escolaridades.'
          isEditingThis={editingId === 'escolaridades'}
          isOtherEditing={isEditingAny && editingId !== 'escolaridades'}
          onEdit={() => handleEdit('escolaridades', 'escolaridades.')}
          onCancel={() => handleCancel('escolaridades', 'escolaridades.')}
        //onSave={() => {}} // O submit faz o save
        />
      </legend>
      <div className='p-4 space-y-4'>
        {escolaridadeFields.map((field, index) => {
          const isEditingThisSection = editingId === 'escolaridades';
          return (
            <fieldset
              key={field.id}
              className={`p-3 border rounded relative border-gray-600`}
            >
              {/* Botão de remover SÓ aparece no modo de edição da seção */}
              {isEditingThisSection && (
                <button
                  type='button'
                  onClick={() => removeEscolaridade(index)}
                  className={`absolute top-2 right-2 py-0.5 px-2 rounded text-xs bg-red-600 hover:bg-red-700 text-white`}
                  title='Remover'
                >
                  X
                </button>
              )}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-2 mt-1'>
                <div>
                  <label className='block text-sm mb-1'>
                    Escolaridade *
                  </label>
                  <select
                    name={`escolaridades.${index}.nivel`}
                    className='form-input bg-gray-600'
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
                  <label className='block text-sm mb-1'>Curso *</label>
                  <input
                    name={`escolaridades.${index}.curso`}
                    className='form-input'
                    required
                    defaultValue={field.value.curso}
                    readOnly={!isEditingThisSection}
                  />
                </div>
                <div>
                  <label className='block text-sm mb-1'>Situação *</label>
                  <select
                    name={`escolaridades.${index}.situacao`}
                    className='form-input bg-gray-600'
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
        {editingId === 'escolaridades' && (
          <button
            type='button'
            onClick={() =>
              appendEscolaridade({
                nivel: 'Ensino Médio',
                curso: '',
                situacao: 'Cursando',
              })
            }
            className={`text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded w-full`}
          >
            + Adicionar Escolaridade
          </button>
        )}
      </div>
    </fieldset>

  )
}

export default Escolaridades