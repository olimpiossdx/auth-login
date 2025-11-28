// 3. Cenário: Híbrido Simples (Atualizado com resetSection e Submit Parcial)

import React from 'react';
import Autocomplete, { type IOption } from '../../componentes/autocomplete';
import showModal from '../../componentes/modal/hook';
import StarRating from '../../componentes/start-rating';
import useForm from '../../hooks/use-form';
import type { FormField, ValidationResult } from '../../hooks/use-form/props';

interface IMyHybridForm {
  rating: number | '';
  comentario: string;
  corFavorita: string;
};

const HybridFormSimple = ({ }) => {
  const { handleSubmit, setValidators, formId, getValue, resetSection } = useForm<IMyHybridForm>('hybrid-form-simple');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const isEditingAny = editingId !== null;
  const originalEditDataRef = React.useRef<any>(null);

  const validarComentario = React.useCallback((value: any, _: FormField | null, formValues: IMyHybridForm): ValidationResult => {
    const valueRatingForm = Number(formValues.rating);

    if (valueRatingForm > 0 && valueRatingForm <= 3 && !value)
      return { message: 'O comentário é obrigatório...', type: 'error' };
    if (value && value.length > 0 && value.length < 5)
      return { message: 'Comentário curto.', type: 'error' };

    return undefined;
  }, []);

  const validarCor = React.useCallback((value: any, _field: FormField | null, __: IMyHybridForm): ValidationResult => {
    if (value === 'verde') {
      return { message: 'Verde é uma ótima cor!', type: 'success' };
    };

    return undefined;
  }, []);

  React.useEffect(() => setValidators({ validarComentario, validarCor }), [setValidators, validarComentario, validarCor]);

  const onSubmit = (data: IMyHybridForm) => {
    const body = JSON.stringify(data);
    showModal({
      title: 'Form Híbrido Salvo!',
      content: () => <div>Dados: {body}</div>,
      closeOnBackdropClick: false, // Obriga interação
      onClose: () => console.log('Fechou!'), // Callback
    });
    console.log('data', data);
    setEditingId(null);
    originalEditDataRef.current = null;
  };

  const cores: IOption[] = [
    { value: 'vermelho', label: 'Vermelho' },
    { value: 'azul', label: 'Azul' },
    { value: 'verde', label: 'Verde' },
    { value: 'amarelo', label: 'Amarelo', disabled: true },
    { value: 'preto', label: 'Preto' },
    { value: 'branco', label: 'Branco' },
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

  const isEditingThis = editingId === 'hybridSimple';
  const isEditingOther = isEditingAny && !isEditingThis;
  const prefix = '';

  return (
    <div className='bg-gray-800 p-6 rounded-lg shadow-xl'>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <fieldset disabled={isEditingOther}>
          <legend className='text-xl font-bold mb-4 text-cyan-400 flex justify-between items-center w-full'>
            3. Híbrido (Rating + Autocomplete)
            <div>
              {!isEditingThis && (
                <button
                  type='button'
                  onClick={() => handleEdit('hybridSimple', prefix)}
                  disabled={isEditingAny}
                  className={`py-1 px-3 rounded text-sm ${isEditingAny ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  Editar
                </button>
              )}
              {isEditingThis && (
                <div className='flex gap-2'>
                  <button
                    type='button'
                    onClick={() => handleCancel('hybridSimple', prefix)}
                    className='py-1 px-3 rounded text-sm bg-gray-600 hover:bg-gray-700'
                  >
                    Cancelar
                  </button>
                  <button
                    type='submit'
                    className='py-1 px-3 rounded text-sm bg-green-600 hover:bg-green-700'
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>
          </legend>

          <StarRating
            name='rating'
            label='Avaliação (obrigatório)'
            required
            readOnly={!isEditingThis}
            disabled={isEditingOther}
          />
          <Autocomplete
            name='corFavorita'
            label='Cor Favorita (obrigatório)'
            options={cores}
            required
            validationKey='validarCor'
            readOnly={!isEditingThis}
            disabled={isEditingOther}
            initialValue={getValue('corFavorita') || ''}
          />
          <div className='mb-4'>
            <label className='block mb-1 text-gray-300' htmlFor='comentario'>
              Comentário
            </label>
            <input
              id='comentario'
              name='comentario'
              type='text'
              className='form-input'
              data-validation='validarComentario'
              readOnly={!isEditingThis}
            />
          </div>

          {/* Botão de submit geral REMOVIDO */}
        </fieldset>
      </form>
    </div>
  );
};

export default HybridFormSimple;
