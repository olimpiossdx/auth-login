import React from 'react';
import { CheckCircle, AlertTriangle, Trash2, Lock, FileText, Layers, User, Wand2, Settings, ChevronRight, Bell, Shield, CreditCard, MessageSquare, Star } from 'lucide-react';
import showModal from '../../componentes/modal/hook';

const DeleteFooter = ({ closeModal }: any) => (
  <>
    <button onClick={closeModal} className="px-4 py-2 text-gray-300 hover:text-white transition-colors">Cancelar</button>
    <button onClick={() => { alert('Item excluído!'); closeModal(); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium flex items-center gap-2">
      <Trash2 size={16} /> Excluir Definitivamente
    </button>
  </>
);

const LoginForm = ({ closeModal }: any) => {
  const [loading, setLoading] = React.useState(false);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      closeModal();
      showModal({
        title: "Bem-vindo",
        content: "Login realizado com sucesso!",
        size: "standard"
      });
    }, 1500);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
        <input type="email" required className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 outline-none" placeholder="user@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
        <input type="password" required className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 outline-none" placeholder="••••••" />
      </div>
      <button disabled={loading} type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold py-2 rounded transition-all flex justify-center items-center gap-2">
        {loading ? "Processando..." : <><Lock size={16} /> Entrar no Sistema</>}
      </button>
    </form>
  );
};

const ReportContent = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-700 p-4 rounded border border-gray-600">
          <h4 className="text-gray-400 text-sm">Métrica {i}</h4>
          <p className="text-2xl font-bold text-white mt-1">{(Math.random() * 1000).toFixed(2)}</p>
        </div>
      ))}
    </div>
    <div className="bg-gray-900 p-4 rounded font-mono text-sm text-green-400 border border-gray-700">
      <p>{`> Iniciando análise de sistema...`}</p>
      <p>{`> Carregando módulos de dados... [OK]`}</p>
      <p>{`> Renderizando gráficos vetoriais... [OK]`}</p>
      <p>{`> Relatório gerado com sucesso.`}</p>
    </div>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
  </div>
);

// --- NOVOS EXEMPLOS ELABORADOS ---

// EXEMPLO 6: Wizard (Passo a Passo)
const WizardContent = ({ closeModal }: any) => {
  const [step, setStep] = React.useState(1);

  const steps = [
    { title: "Dados Pessoais", icon: <User size={20} /> },
    { title: "Preferências", icon: <Settings size={20} /> },
    { title: "Revisão", icon: <CheckCircle size={20} /> }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Stepper Header */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 z-0"></div>
        {steps.map((s, idx) => {
          const active = step >= idx + 1;
          return (
            <div key={idx} className="relative z-10 flex flex-col items-center gap-2 bg-gray-800 px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${active ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-500'}`}>
                {s.icon}
              </div>
              <span className={`text-xs font-bold ${active ? 'text-cyan-400' : 'text-gray-500'}`}>{s.title}</span>
            </div>
          );
        })}
      </div>

      {/* Conteúdo Variável */}
      <div className="grow py-4">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white">Vamos começar com o básico</h3>
            <input className="w-full bg-gray-700 p-3 rounded text-white border border-gray-600" placeholder="Nome Completo" />
            <input className="w-full bg-gray-700 p-3 rounded text-white border border-gray-600" placeholder="Cargo / Função" />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white">Configure suas preferências</h3>
            <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700">
              <input type="checkbox" className="w-5 h-5 accent-cyan-500" defaultChecked />
              <label>Receber notificações por e-mail</label>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700">
              <input type="checkbox" className="w-5 h-5 accent-cyan-500" />
              <label>Ativar modo escuro automático</label>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="text-center py-6 animate-fade-in">
            <div className="inline-block p-4 bg-green-500/20 rounded-full text-green-400 mb-4">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Tudo pronto!</h3>
            <p className="text-gray-400">Revise seus dados antes de finalizar o cadastro.</p>
          </div>
        )}
      </div>

      {/* Footer Interno (Navegação) */}
      <div className="flex justify-between mt-6 pt-4 border-t border-gray-700">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : closeModal()}
          className="px-4 py-2 text-gray-400 hover:text-white"
        >
          {step === 1 ? 'Cancelar' : 'Voltar'}
        </button>
        <button
          onClick={() => step < 3 ? setStep(step + 1) : (alert('Finalizado!'), closeModal())}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-bold flex items-center gap-2"
        >
          {step === 3 ? 'Finalizar' : <>Próximo <ChevronRight size={16} /></>}
        </button>
      </div>
    </div>
  );
};

// EXEMPLO 7: Configurações com Tabs
const SettingsTabsContent = () => {
  const [activeTab, setActiveTab] = React.useState('profile');

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notif', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'billing', label: 'Cobrança', icon: CreditCard },
  ];

  return (
    <div className="flex flex-col md:flex-row h-[400px] gap-6">
      {/* Sidebar de Tabs */}
      <div className="w-full md:w-1/4 flex flex-col gap-1 border-r border-gray-700 pr-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded text-left transition-all ${activeTab === tab.id
              ? 'bg-cyan-600/20 text-cyan-400 border-l-4 border-cyan-500'
              : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
          >
            <tab.icon size={18} />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 overflow-y-auto pr-2">
        {activeTab === 'profile' && (
          <div className="animate-fade-in space-y-4">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><User className="text-cyan-400" /> Editar Perfil</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-2xl font-bold">JD</div>
              <button className="text-cyan-400 text-sm hover:underline">Alterar foto</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-500 uppercase">Nome</label><input defaultValue="John Doe" className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600" /></div>
              <div><label className="text-xs text-gray-500 uppercase">Username</label><input defaultValue="@johndoe" className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600" /></div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Bio</label>
              <textarea
                defaultValue="Desenvolvedor Full Stack apaixonado por React."
                className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600 h-24"
              />
            </div>
          </div>
        )}

        {activeTab === 'notif' && (
          <div className="animate-fade-in space-y-4">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Bell className="text-cyan-400" /> Preferências de Notificação</h3>
            {['Emails de Marketing', 'Notificações Push no Desktop', 'Novos Seguidores', 'Atualizações de Segurança'].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded border border-gray-700">
                <span className="text-gray-300">{item}</span>
                <div className={`w-10 h-5 rounded-full relative cursor-pointer ${i % 2 === 0 ? 'bg-cyan-600' : 'bg-gray-600'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${i % 2 === 0 ? 'left-6' : 'left-1'}`}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Placeholders para as outras tabs */}
        {(activeTab === 'security' || activeTab === 'billing') && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-fade-in">
            <Shield size={48} className="mb-4 opacity-20" />
            <p>Conteúdo da aba <strong>{tabs.find(t => t.id === activeTab)?.label}</strong> em desenvolvimento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// EXEMPLO 8: Formulário de Feedback (NOVO)
const FeedbackForm = ({ closeModal }: any) => {
  const [rating, setRating] = React.useState(0);
  const [category, setCategory] = React.useState('suggestion');
  const [comment, setComment] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (rating === 0) {
      return alert('Por favor, selecione uma nota.');
    };

    setLoading(true);
    // Simula envio
    setTimeout(() => {
      setLoading(false);
      alert('Obrigado pelo seu feedback!');
      closeModal();
    }, 1200);
  };

  return (<form onSubmit={handleSubmit} className="space-y-5">
    {/* Avaliação por Estrelas */}
    <div className="text-center mb-6">
      <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Sua Avaliação</label>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`transition-transform hover:scale-110 focus:outline-none ${star <= rating ? 'text-yellow-400' : 'text-gray-600'
              }`}
          >
            <Star size={32} fill={star <= rating ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2 h-4">
        {rating === 1 && "Muito ruim"}
        {rating === 2 && "Ruim"}
        {rating === 3 && "Regular"}
        {rating === 4 && "Bom"}
        {rating === 5 && "Excelente!"}
      </p>
    </div>

    {/* Categoria */}
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Feedback</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 outline-none"
      >
        <option value="suggestion">💡 Sugestão</option>
        <option value="bug">🐛 Relatar Bug</option>
        <option value="other">💬 Outros</option>
      </select>
    </div>

    {/* Comentário */}
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">Comentários</label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Conte-nos mais detalhes..."
        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 outline-none h-24 resize-none"
      />
    </div>

    {/* Botões */}
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={closeModal}
        className="flex-1 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={loading}
        className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold rounded transition-colors flex justify-center items-center gap-2"
      >
        {loading ? 'Enviando...' : 'Enviar Feedback'}
      </button>
    </div>
  </form>);
};

// --- Componente Principal da Demo ---

const TabModal = () => {

  // Funções de Abertura (Exemplos Anteriores)
  const openSuccessModal = () => showModal({ title: <div className="flex items-center gap-2 text-green-400"><CheckCircle size={24} /><span>Operação Realizada</span></div>, content: "Os dados foram salvos com sucesso no servidor.", footer: ({ closeModal }: any) => <button onClick={closeModal} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">OK, Entendido</button> });
  const openDeleteModal = () => showModal({ title: <div className="flex items-center gap-2 text-red-400"><AlertTriangle size={24} /><span>Excluir Usuário?</span></div>, content: "Esta ação é irreversível. Todos os dados associados a este usuário serão perdidos permanentemente.", footer: DeleteFooter, closeOnBackdropClick: false });
  const openLoginModal = () => showModal({ title: "Acesso Restrito", content: LoginForm, size: "standard", styleConfig: { width: 'max-w-md' } });
  const openFullModal = () => showModal({ title: "Relatório Mensal de Performance", content: ReportContent, size: "full", styleConfig: { padding: 'p-8' }, footer: ({ closeModal }: any) => <button onClick={closeModal} className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded">Fechar Relatório</button> });

  const openStackedModal = () => {
    showModal({
      title: "Nível 1: Painel Principal",
      content: () => (
        <div className="flex flex-col gap-4 items-center py-8">
          <p>Este é o primeiro modal. Imagine que sua sessão expirou aqui.</p>
          <button onClick={() => showModal({ title: "Nível 2: Sessão Expirada", content: "Sua sessão expirou. Por favor, faça login novamente para continuar no Nível 1.", closeOnBackdropClick: false, styleConfig: { width: 'max-w-sm', className: 'border-2 border-red-500' }, footer: ({ closeModal: closeSecond }: any) => <button onClick={() => { closeSecond(); alert("Logado!"); }} className="bg-red-600 text-white px-4 py-2 rounded w-full">Relogar</button> })} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2"><Layers size={16} /> Simular Erro (Abrir 2º Modal)</button>
        </div>
      ), size: "standard"
    });
  };

  const openWizardModal = () => {
    showModal({
      title: "Cadastro de Novo Membro",
      content: WizardContent,
      size: "standard",
      styleConfig: { width: 'max-w-3xl' },
    });
  };

  const openSettingsModal = () => {
    showModal({
      title: "Configurações da Conta",
      content: SettingsTabsContent,
      size: "custom",
      styleConfig: { width: 'max-w-4xl' },
      footer: ({ closeModal }: any) => (
        <div className="flex justify-between w-full">
          <span className="text-xs text-gray-500 flex items-center">ID: 8493-2023-AF</span>
          <div className="flex gap-2">
            <button onClick={closeModal} className="text-gray-400 hover:text-white px-4">Cancelar</button>
            <button onClick={() => { alert('Configurações salvas!'); closeModal(); }} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded">Salvar Alterações</button>
          </div>
        </div>
      )
    });
  };

  // Nova função para abrir o formulário de feedback
  const openFeedbackModal = () => {
    showModal({
      title: <div className="flex items-center gap-2"><MessageSquare className="text-cyan-400" /> <span>Envie seu Feedback</span></div>,
      content: FeedbackForm,
      styleConfig: { width: 'max-w-md' } // Tamanho ideal para formulários
    });
  };

  return (<div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
    <div className="max-w-6xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">Sistema de Modais Refinado</h1>
        <p className="text-gray-400">Implementação imperativa com exemplos complexos de UI.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

        {/* Card 1 */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-cyan-500 transition-colors">
          <div className="flex items-center gap-2 mb-4 text-green-400"><CheckCircle /> <h3 className="font-bold text-white">Modelo Padrão</h3></div>
          <p className="text-sm text-gray-400 mb-6 h-12">Modal simples de sucesso com título customizado.</p>
          <button onClick={openSuccessModal} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded border border-gray-600">Abrir Padrão</button>
        </div>

        {/* Card 2 */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-red-500 transition-colors">
          <div className="flex items-center gap-2 mb-4 text-red-400"><AlertTriangle /> <h3 className="font-bold text-white">Destrutivo</h3></div>
          <p className="text-sm text-gray-400 mb-6 h-12">Backdrop bloqueado e botões de perigo.</p>
          <button onClick={openDeleteModal} className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-200 py-2 rounded border border-red-800">Abrir Destrutivo</button>
        </div>

        {/* Card 3 */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-cyan-500 transition-colors">
          <div className="flex items-center gap-2 mb-4 text-cyan-400"><User /> <h3 className="font-bold text-white">Login (Form)</h3></div>
          <p className="text-sm text-gray-400 mb-6 h-12">Gerenciamento de estado interno e loading.</p>
          <button onClick={openLoginModal} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded border border-gray-600">Abrir Login</button>
        </div>

        {/* Card 4 */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors">
          <div className="flex items-center gap-2 mb-4 text-purple-400"><FileText /> <h3 className="font-bold text-white">Full Screen</h3></div>
          <p className="text-sm text-gray-400 mb-6 h-12">Ocupa quase toda a tela. Ideal para relatórios.</p>
          <button onClick={openFullModal} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded border border-gray-600">Abrir Full</button>
        </div>

        {/* Card 5 */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-yellow-500 transition-colors">
          <div className="flex items-center gap-2 mb-4 text-yellow-400"><Layers /> <h3 className="font-bold text-white">Stacking</h3></div>
          <p className="text-sm text-gray-400 mb-6 h-12">Abre um modal sobre o outro (ex: timeout).</p>
          <button onClick={openStackedModal} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded border border-gray-600">Abrir Stacked</button>
        </div>

        {/* NOVO: Card 6 - Wizard */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors">
          <div className="flex items-center gap-2 mb-4 text-blue-400"><Wand2 /> <h3 className="font-bold text-white">Wizard</h3></div>
          <p className="text-sm text-gray-400 mb-6 h-12">Passo a passo com barra de progresso e validação.</p>
          <button onClick={openWizardModal} className="w-full bg-blue-900/30 hover:bg-blue-900/50 text-blue-200 py-2 rounded border border-blue-800">Abrir Wizard</button>
        </div>

        {/* NOVO: Card 7 - Settings */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-orange-500 transition-colors">
          <div className="flex items-center gap-2 mb-4 text-orange-400"><Settings /> <h3 className="font-bold text-white">Configurações</h3></div>
          <p className="text-sm text-gray-400 mb-6 h-12">Layout complexo com navegação interna.</p>
          <button onClick={openSettingsModal} className="w-full bg-orange-900/30 hover:bg-orange-900/50 text-orange-200 py-2 rounded border border-orange-800">Abrir Configurações</button>
        </div>

        {/* NOVO: Card 8 - Feedback Form */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-pink-500 transition-colors">
          <div className="flex items-center gap-2 mb-4 text-pink-400"><MessageSquare /> <h3 className="font-bold text-white">Feedback</h3></div>
          <p className="text-sm text-gray-400 mb-6 h-12">Formulário interativo com avaliação por estrelas.</p>
          <button onClick={openFeedbackModal} className="w-full bg-pink-900/30 hover:bg-pink-900/50 text-pink-200 py-2 rounded border border-pink-800">Abrir Feedback</button>
        </div>

      </div>
    </div>
  </div>);
};
export default TabModal;