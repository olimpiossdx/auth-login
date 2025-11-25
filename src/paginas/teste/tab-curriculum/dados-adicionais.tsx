import React from 'react'
import type { IDadosAdicionais, ISectionProps } from './types';
import ActionButtons from './action-button';

const DadosAdicionais: React.FC<ISectionProps> = ({
  editingId, handleCancel, handleEdit
}) => {
  const isEditingAny = editingId !== null;

  const [initialDadosAdicionais] = React.useState<IDadosAdicionais>({
    rg: 'mg 888888',
    orgaoEmissor: 'ssp',
    pis: '123.12233.44-5',
    filiacao1: 'MINHA MÃE',
    filiacao2: 'MEU PAI',
    nacionalidade: 'Brasileira',
    naturalidade: 'BETIM - MG',
    raca: 'Branca',
    tipoResidencia: 'Própria',
    parenteEmpresa: 'false',
    situacao: 'Trabalhando',
    ultimaConsulta: '2025-10-13',
    retorno: '(13454) OLIMPIO...',
    exFuncionario: 'false',
    pcdFisico: false,
    pcdIntelectual: false,
    pcdVisual: false,
    pcdAuditivo: false,
    pcdOutra: false,
    pcdDetalhe: 'um teste',
    altura: '0,00',
    tamanhoUniforme: 'Não',
    tamanhoCalcado: '0',
  });

  return (

    <fieldset
      className='mb-6 p-4 border rounded border-gray-700'
      disabled={isEditingAny && editingId !== 'dadosAdicionais'}
    >
      <legend className='text-lg font-semibold text-cyan-400 px-2 flex justify-between items-center w-full'>
        Dados Adicionais
        <ActionButtons
          sectionId='dadosAdicionais'
          prefix='dadosAdicionais.'
          isEditingThis={editingId === 'dadosAdicionais'}
          isOtherEditing={isEditingAny && editingId !== 'dadosAdicionais'}
          onEdit={() => handleEdit('dadosAdicionais', 'dadosAdicionais.')}
          onCancel={() =>
            handleCancel('dadosAdicionais', 'dadosAdicionais.')
          }
        />
      </legend>
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2`}
      >
        <div>
          <label className='block text-sm mb-1'>RG</label>
          <input
            name='dadosAdicionais.rg'
            className='form-input'
            defaultValue={initialDadosAdicionais.rg}
            readOnly={editingId !== 'dadosAdicionais'}
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Órgão Emissor</label>
          <input
            name='dadosAdicionais.orgaoEmissor'
            className='form-input'
            defaultValue={initialDadosAdicionais.orgaoEmissor}
            readOnly={editingId !== 'dadosAdicionais'}
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>PIS</label>
          <input
            name='dadosAdicionais.pis'
            className='form-input'
            type='number'
            defaultValue={initialDadosAdicionais.pis}
            readOnly={editingId !== 'dadosAdicionais'}
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Filiação 1</label>
          <input
            name='dadosAdicionais.filiacao1'
            className='form-input'
            defaultValue={initialDadosAdicionais.filiacao1}
            readOnly={editingId !== 'dadosAdicionais'}
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Filiação 2</label>
          <input
            name='dadosAdicionais.filiacao2'
            className='form-input'
            defaultValue={initialDadosAdicionais.filiacao2}
            readOnly={editingId !== 'dadosAdicionais'}
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Nacionalidade *</label>
          <input
            name='dadosAdicionais.nacionalidade'
            className='form-input'
            required
            defaultValue={initialDadosAdicionais.nacionalidade}
            readOnly={editingId !== 'dadosAdicionais'}
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Naturalidade *</label>
          <input
            name='dadosAdicionais.naturalidade'
            className='form-input'
            required
            defaultValue={initialDadosAdicionais.naturalidade}
            readOnly={editingId !== 'dadosAdicionais'}
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Raça *</label>
          <select
            name='dadosAdicionais.raca'
            className='form-input bg-gray-600'
            required
            defaultValue={initialDadosAdicionais.raca}
            disabled={editingId !== 'dadosAdicionais'}
          >
            <option>Branca</option>
            <option>Parda</option>
            <option>Preta</option>
          </select>
        </div>
        <div>
          <label className='block text-sm mb-1'>Tipo Residência *</label>
          <select
            name='dadosAdicionais.tipoResidencia'
            className='form-input bg-gray-600'
            required
            defaultValue={initialDadosAdicionais.tipoResidencia}
            disabled={editingId !== 'dadosAdicionais'}
          >
            <option>Própria</option>
            <option>Alugada</option>
          </select>
        </div>
        <div className='col-span-full'>
          <label className='block text-sm mb-1'>
            Possui parente na empresa?
          </label>
          <div className='flex gap-4'>
            <label>
              <input
                type='radio'
                name='dadosAdicionais.parenteEmpresa'
                value='true'
                defaultChecked={
                  initialDadosAdicionais.parenteEmpresa === 'true'
                }
                disabled={editingId !== 'dadosAdicionais'}
              />
              Sim
            </label>
            <label>
              <input
                type='radio'
                name='dadosAdicionais.parenteEmpresa'
                value='false'
                defaultChecked={
                  initialDadosAdicionais.parenteEmpresa === 'false'
                }
                disabled={editingId !== 'dadosAdicionais'}
              />
              Não
            </label>
          </div>
        </div>
      </div>
    </fieldset>);
};

export default DadosAdicionais