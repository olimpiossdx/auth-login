import React from 'react';
import { Calendar, Layout, Smartphone, ShieldAlert, MousePointer2 } from 'lucide-react';

import useForm from '../../hooks/use-form';
import { createDate, getToday, toISODate, addDays } from '../../utils/date';
import showModal from '../../componentes/modal/hook';
import DateRangePicker from '../../componentes/range-date-picker';
import type { DatePreset } from '../../componentes/range-date-picker/props';

// --- PRESETS CUSTOMIZADOS (Cenário Financeiro) ---
const FINANCIAL_PRESETS: DatePreset[] = [
  {
    label: '1º Semestre',
    getValue: () => [createDate(getToday().getFullYear(), 0, 1), createDate(getToday().getFullYear(), 5, 30)]
  },
  {
    label: '2º Semestre',
    getValue: () => [createDate(getToday().getFullYear(), 6, 1), createDate(getToday().getFullYear(), 11, 31)]
  },
  {
    label: 'Ano Fiscal Anterior',
    getValue: () => [createDate(getToday().getFullYear() - 1, 0, 1), createDate(getToday().getFullYear() - 1, 11, 31)]
  }
];

const DateRangeExample: React.FC = () => {
  const today = getToday();

  const onSubmit = (data: any) => {
    showModal({
      title: "Períodos Selecionados",
      content: () => (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Dados brutos enviados pelo formulário:</p>
          <pre className="text-xs bg-black p-4 rounded text-green-400 overflow-auto border border-gray-700">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )
    });
  };

  // --- HANDLERS DE CICLO DE VIDA ---
  const handleReset = () => {
    resetSection("", null);
  };

  const handleSimulateEdit = () => {
    const natalStart = "2023-12-20";
    const natalEnd = "2023-12-31";

    resetSection("", {
      // Preenche todos os cenários para validar a sincronia
      enterprise_start: natalStart, enterprise_end: natalEnd,
      fiscal_start: "2023-01-01", fiscal_end: "2023-06-30",
      restricted_start: toISODate(today), restricted_end: toISODate(addDays(today, 5)), // Válido
      mobile_start: "", mobile_end: ""
    });
  };

  const { formProps, resetSection } = useForm({ id: "date-example", onSubmit });

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700 max-w-6xl mx-auto">

      {/* HEADER E CONTROLES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-gray-700 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Date Range Picker v3.0
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Validação de Layouts, Regras de Negócio e Posicionamento Inteligente.
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={handleSimulateEdit} className="px-4 py-2 text-xs font-bold bg-blue-900/30 text-blue-200 rounded border border-blue-800 hover:bg-blue-900/50 transition-colors">
            Simular Edição
          </button>
          <button type="button" onClick={handleReset} className="px-4 py-2 text-xs font-bold bg-gray-700 text-gray-300 rounded border border-gray-600 hover:bg-gray-600 transition-colors">
            Limpar Tudo
          </button>
        </div>
      </div>

      <form {...formProps} noValidate className="space-y-12">

        {/* BLOCO 1: VARIAÇÕES DE LAYOUT */}
        <section className="space-y-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 border-b border-gray-700 pb-2">
            <Layout size={16} /> Layouts & Visual
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* 1. ENTERPRISE (Dual + Presets) */}
            <div className="bg-gray-900/50 p-5 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors">
              <div className="mb-4">
                <h4 className="text-white font-bold text-sm">1. Enterprise (Dual View)</h4>
                <p className="text-xs text-gray-500 mt-1">Ideal para desktops. Exibe 2 meses e atalhos laterais.</p>
              </div>
              <DateRangePicker
                startDateName="enterprise_start"
                endDateName="enterprise_end"
                label="Período Completo"
                months={2}
                showPresets={true}
                required
              />
            </div>

            {/* 2. MOBILE / COMPACT */}
            <div className="bg-gray-900/50 p-5 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors">
              <div className="mb-4">
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                  <Smartphone size={14} /> 2. Mobile / Compacto
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  <code>matchInputWidth</code> força o calendário a caber na largura do input.
                  Sem sidebar.
                </p>
              </div>
              <div className="max-w-xs mx-auto"> {/* Container estreito simulando mobile */}
                <DateRangePicker
                  startDateName="mobile_start"
                  endDateName="mobile_end"
                  label="Data (Simulação Mobile)"
                  months={1}
                  showPresets={false}
                  matchInputWidth
                />
              </div>
            </div>
          </div>
        </section>

        {/* BLOCO 2: REGRAS DE NEGÓCIO */}
        <section className="space-y-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 border-b border-gray-700 pb-2">
            <ShieldAlert size={16} /> Regras & Validação
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* 3. RESTRITO (Min/Max) */}
            <div className="bg-gray-900/30 p-4 rounded border border-gray-800">
              <h4 className="text-gray-300 font-bold text-xs mb-2">3. Restrito (Futuro)</h4>
              <p className="text-[10px] text-gray-500 mb-4">Bloqueia passado e limite de 60 dias.</p>
              <DateRangePicker
                startDateName="restricted_start"
                endDateName="restricted_end"
                label="Agendamento"
                minDate={toISODate(today)}
                maxDate={toISODate(addDays(today, 60))}
              />
            </div>

            {/* 4. DIAS ÚTEIS */}
            <div className="bg-gray-900/30 p-4 rounded border border-gray-800">
              <h4 className="text-gray-300 font-bold text-xs mb-2">4. Apenas Dias Úteis</h4>
              <p className="text-[10px] text-gray-500 mb-4">Sábados e Domingos desabilitados visualmente.</p>
              <DateRangePicker
                startDateName="business_start"
                endDateName="business_end"
                label="Prazo Útil"
                excludeWeekends
                months={1}
              />
            </div>

            {/* 5. CUSTOM PRESETS */}
            <div className="bg-gray-900/30 p-4 rounded border border-gray-800">
              <h4 className="text-gray-300 font-bold text-xs mb-2">5. Presets Customizados</h4>
              <p className="text-[10px] text-gray-500 mb-4">Atalhos de negócio (ex: Financeiro).</p>
              <DateRangePicker
                startDateName="fiscal_start"
                endDateName="fiscal_end"
                label="Ano Fiscal"
                presets={FINANCIAL_PRESETS}
              />
            </div>
          </div>
        </section>

        {/* BLOCO 3: TESTE DE COLISÃO (POPOVER INTELIGENTE) */}
        <section className="space-y-6 pt-8 mt-12 border-t-2 border-dashed border-gray-800">
          <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
            <MousePointer2 size={16} /> Teste de Colisão (Smart Positioning)
          </h3>
          <p className="text-sm text-gray-400">
            Estes inputs estão propositalmente nas bordas para testar se o calendário
            <strong> inverte a direção</strong> automaticamente.
          </p>

          <div className="flex justify-between items-end h-32">
            {/* Canto Inferior Esquerdo */}
            <div className="w-64">
              <DateRangePicker
                startDateName="edge_left_start"
                endDateName="edge_left_end"
                label="Teste: Borda Inferior (Deve abrir P/ CIMA)"
              />
            </div>

            {/* Canto Inferior Direito */}
            <div className="w-64 text-right">
              <DateRangePicker
                startDateName="edge_right_start"
                endDateName="edge_right_end"
                label="Teste: Borda Direita (Deve abrir P/ ESQUERDA)"
                months={2} // Grande para forçar colisão
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-8">
          <button type="submit" className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg hover:shadow-green-900/20 transition-all active:scale-95">
            Validar Formulário
          </button>
        </div>
      </form>
    </div>
  );
};

export default DateRangeExample;