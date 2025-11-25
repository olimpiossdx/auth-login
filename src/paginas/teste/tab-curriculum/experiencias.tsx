import React from 'react'
import type { IExperiencia, ISectionProps } from './types';
import useList from '../../../hooks/list';
import ActionButtons from './action-button';

const Experiencias: React.FC<ISectionProps> = ({ editingId, handleCancel, handleEdit }) => {
  const isEditingAny = editingId !== null;

  const [initialExperiencias] = React.useState<IExperiencia[]>([
    { nomeEmpresa: 'Teste de empresa', cargo: 'Cargo de empresa', inicio: '2025-02', finalizacao: '2024-01', atual: false, atividades: 'Profissão de empresa', },
    { nomeEmpresa: 'Supermercados BH', cargo: 'Desenvolvedor', inicio: '2019-04', finalizacao: '', atual: true, atividades: 'Desenvolvendo soluções para o supermercado BH.' },
  ]);

  const { fields: experienciaFields, append: appendExperiencia, remove: removeExperiencia } = useList<IExperiencia>(initialExperiencias);

  function handleAdd(_: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    appendExperiencia({ nomeEmpresa: '', cargo: '', inicio: '', finalizacao: '', atual: false, atividades: '' });
  };

  function handleRemove(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    removeExperiencia(+event.currentTarget.id);
  };

  const disabled = isEditingAny && editingId !== 'experiencias';
  return (<fieldset
    className='mb-6 border rounded border-gray-700'
    disabled={disabled}>
    <legend className='text-lg font-semibold text-cyan-400 px-2 w-full flex justify-between items-center'>
      Experiências
      <ActionButtons
        sectionId='experiencias'
        prefix='experiencias.'
        isEditingThis={editingId === 'experiencias'}
        isOtherEditing={isEditingAny && editingId !== 'experiencias'}
        onEdit={() => handleEdit('experiencias', 'experiencias.')}
        onCancel={() => handleCancel('experiencias', 'experiencias.')}
      //onSave={() => {}} // O submit faz o save
      />
    </legend>
    <div className='p-4 space-y-4'>
      {experienciaFields.map((field, index) => {
        const isEditingThisSection = editingId === 'experiencias';
        return (<fieldset
          key={field.id}
          className={`p-3 border rounded relative border-gray-600`}
        >
          {isEditingThisSection
            ? (<button type='button' id={`${index}`} onClick={handleRemove} title='Remover'
              className={`absolute top-2 right-2 py-0.5 px-2 rounded text-xs bg-red-600 hover:bg-red-700 text-white`}>
              X
            </button>)
            : null
          }
          <div className='space-y-2 mt-1'>
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <label className='block text-sm mb-1'>
                  Nome Empresa *
                </label>
                <input
                  name={`experiencias.${index}.nomeEmpresa`}
                  className='form-input'
                  required
                  defaultValue={field.value.nomeEmpresa}
                  readOnly={!isEditingThisSection}
                />
              </div>
              <div>
                <label className='block text-sm mb-1'>Cargo *</label>
                <input
                  name={`experiencias.${index}.cargo`}
                  className='form-input'
                  required
                  defaultValue={field.value.cargo}
                  readOnly={!isEditingThisSection}
                />
              </div>
            </div>
            <div className='grid grid-cols-3 gap-2 items-end'>
              <div>
                <label className='block text-sm mb-1'>Início *</label>
                <input
                  name={`experiencias.${index}.inicio`}
                  type='month'
                  className='form-input'
                  required
                  defaultValue={
                    field.value.inicio
                      ? field.value.inicio.substring(0, 7)
                      : ''
                  }
                  readOnly={!isEditingThisSection}
                />
              </div>
              <div>
                <label className='block text-sm mb-1'>
                  Finalização
                </label>
                <input
                  name={`experiencias.${index}.finalizacao`}
                  type='month'
                  className='form-input'
                  defaultValue={
                    field.value.finalizacao
                      ? field.value.finalizacao.substring(0, 7)
                      : ''
                  }
                  readOnly={!isEditingThisSection || field.value.atual}
                  disabled={field.value.atual || !isEditingThisSection}
                />
              </div>
              <div className='flex items-center pb-2'>
                <label>
                  <input
                    type='checkbox'
                    name={`experiencias.${index}.atual`}
                    defaultChecked={field.value.atual}
                    disabled={!isEditingThisSection}
                    className='mr-1'
                  />
                  Emprego Atual
                </label>
              </div>
            </div>
            <div>
              <label className='block text-sm mb-1'>
                Atividades Exercidas
              </label>
              <textarea
                name={`experiencias.${index}.atividades`}
                className='form-input h-16 resize-none'
                defaultValue={field.value.atividades}
                readOnly={!isEditingThisSection}
              ></textarea>
            </div>
          </div>
        </fieldset>
        );
      })}
      {editingId === 'experiencias' && (
        <button
          type='button'
          onClick={handleAdd}
          className={`text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded w-full`}
        >
          + Adicionar Experiência
        </button>
      )}
    </div>
  </fieldset>);

};

export default Experiencias;