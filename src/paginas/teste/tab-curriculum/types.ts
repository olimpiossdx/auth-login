
// --- Tipos para o Currículo ---
export interface IEscolaridade {
  nivel: string;
  curso: string;
  situacao: string;
};

export interface IExperiencia {
  nomeEmpresa: string;
  cargo: string;
  inicio: string;
  finalizacao: string;
  atual: boolean;
  atividades: string;
};

export interface IConhecimento {
  nivel: string;
  descricao: string;
};

export interface IDadosAdicionais {
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
};

export interface ICurriculumFormValues {
  dadosAdicionais?: IDadosAdicionais;
  escolaridades?: IEscolaridade[];
  experiencias?: IExperiencia[];
  conhecimentos?: IConhecimento[];
};

export interface IActionButton {
  sectionId: string;
  prefix: string;
  onCancel: () => void;
  onEdit: () => void;
  isOtherEditing: boolean;
  isEditingThis: boolean;
};


export interface ISectionProps {
  editingId: string | null;
  handleCancel: (_: string, prefix: string) => void;
  handleEdit: (id: string, prefix: string) => void
};