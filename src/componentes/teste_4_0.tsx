import React from "react";
import TabButton from "./tab-button";
import RegistrationForm from "../paginas/teste/tab-registration-form";
import LoginForm from "../paginas/teste/tab-login";
import HybridFormSimple from "../paginas/teste/tab-hibryd-form-simple";
import NestedListForm from "../paginas/teste/tab-nested-list-form";
import CurriculumForm from "../paginas/teste/tab-curriculum";
import CheckboxGroupForm from "../paginas/teste/tab-checkbox-group-form";

// Foca no nova tab/formulário-ativo
const Teste: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState("curriculum");

  //cenários de teste do hook useForm com componentes customizados e nativos
  const scenarios = {
    login: <LoginForm />,
    registration: <RegistrationForm />,
    hybrid: <HybridFormSimple />,
    nestedList: <NestedListForm />,
    curriculum: <CurriculumForm />,
    checkboxGroup: <CheckboxGroupForm />
  };

  return (<div className="bg-gray-800 text-white min-h-screen p-2 sm:p-4 font-sans">
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-xl sm:text-4xl font-extrabold text-cyan-400">
          `useForm` - v4.12
        </h1>
        <p className="text-gray-400 mt-2">Edição Contextual por Seção</p>
      </header>

      <div className="flex justify-center flex-wrap gap-2 mb-6">
        {/* Implementação dos Botões */}
        <TabButton
          tabId="login"
          label="Nativo"
          isActive={activeTab === "login"}
          onClick={setActiveTab}
        />
        <TabButton
          tabId="registration"
          label="Nativo (Custom)"
          isActive={activeTab === "registration"}
          onClick={setActiveTab}
        />
        <TabButton
          tabId="hybrid"
          label="Híbrido Simples"
          isActive={activeTab === "hybrid"}
          onClick={setActiveTab}
        />
        <TabButton
          tabId="nestedList"
          label="Lista Aninhada"
          isActive={activeTab === "nestedList"}
          onClick={setActiveTab}
        />
        <TabButton
          tabId="curriculum"
          label="Currículo (Edição)"
          isActive={activeTab === "curriculum"}
          onClick={setActiveTab}
        />
        <TabButton
          tabId="checkboxGroup"
          label="Checkboxes"
          isActive={activeTab === "checkboxGroup"}
          onClick={setActiveTab}
        />
      </div>

      <main className="transition-opacity duration-300 ease-in-out">
        {scenarios[activeTab as keyof typeof scenarios]}
      </main>
    </div>
  </div>);
};

export default Teste;
