import React from "react";
import type { IOption } from "../../componentes/autocomplete";
import Autocomplete from "../../componentes/autocomplete";
import showModal from "../../componentes/modal/hook";
import useForm from "../../hooks/use-form";
import type { FormField } from "../../hooks/use-form/props";

const DEPARTAMENTOS: IOption[] = [
  { value: "dev", label: "Desenvolvimento (DevTeam)" },
  { value: "qa", label: "Quality Assurance (QA)" },
  { value: "produto", label: "Produto & Design" },
  { value: "ops", label: "Operações & Infra" },
];

const DADOS_EDICAO = {
  nome_equipe: "Squad Alpha",
  departamento: "dev",
  lider_id: "2",
  urgente: true,
};

const AsyncAutocompleteExample = () => {
  const onSubmit = (data: any) => {
    showModal({
      title: "Equipe Cadastrada",
      content: () => (
        <pre className="text-xs bg-black p-4 rounded text-green-400 overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      ),
    });
  };

  const { formProps, resetSection, setValidators } = useForm<any>({ id: "team-form", onSubmit: onSubmit });

  const [liderOptions, setLiderOptions] = React.useState<IOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | undefined>(undefined);

  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [shouldFail, setShouldFail] = React.useState(false);
  const [showTestModal, setShowTestModal] = React.useState(false);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  // --- VALIDAÇÃO DE NEGÓCIO (ATUALIZADO) ---
  React.useEffect(() => {
    setValidators({
      validarNome: (val: any) =>
        !val || val.length < 3
          ? { message: "Nome muito curto", type: "error" }
          : undefined,

      // REGRA DE NEGÓCIO CRUZADA:
      // O valor do Autocomplete (Líder) é validado contra o valor do Checkbox (Urgente).
      validarLider: (val: any, _field: FormField | null, formValues: any) => {
        if (!val)
          return { message: "Selecione um líder responsável", type: "error" };

        // ID 1 = Rick Sanchez
        if (val === "1" && formValues.urgente) {
          return {
            message: "⛔ Rick Sanchez recusa projetos urgentes!",
            type: "error",
          };
        }

        return undefined;
      },
    });
  }, [setValidators]);

  // --- FETCH API (Rick & Morty) ---
  const fetchLideres = async (
    query: string,
    pageNum: number,
    isNewSearch: boolean
  ) => {
    if (isNewSearch && abortControllerRef.current)
      abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (isNewSearch) {
        setIsLoading(true);
        setErrorMsg(undefined);
      } else setIsLoadingMore(true);

      if (shouldFail) throw new Error("Simulação: Falha na conexão.");

      const isIdSearch = /^\d+$/.test(query);
      const endpoint = isIdSearch
        ? `${query}`
        : `?name=${query}&page=${pageNum}`;
      const url = `https://rickandmortyapi.com/api/character/${endpoint}`;

      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        if (response.status === 404) {
          if (isNewSearch) setLiderOptions([]);
          setHasMore(false);
          return;
        }
        throw new Error("Erro na API");
      }

      const data = await response.json();
      const results = Array.isArray(data) ? data : data.results || [data];

      const newOptions = results.map((char: any) => ({
        value: String(char.id),
        label: char.name,
        disabled: char.status === "Dead",
      }));

      setLiderOptions((prev) => {
        if (isNewSearch) return newOptions;
        const existingIds = new Set(prev.map((o) => o.value));
        return [
          ...prev,
          ...newOptions.filter((o: any) => !existingIds.has(o.value)),
        ];
      });

      if (data.info) {
        setHasMore(!!data.info.next);
        setPage(pageNum);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error(err);
        setErrorMsg(err.message || "Erro ao carregar lista.");
        if (isNewSearch) setLiderOptions([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  React.useEffect(() => {
    fetchLideres("", 1, true);
  }, [shouldFail]);

  const handleSearch = (q: string) => {
    setSearchTerm(q);
    fetchLideres(q, 1, true);
  };
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) fetchLideres(searchTerm, page + 1, false);
  };

  const handleSimulateEdit = async () => {
    await fetchLideres("2", 1, true);
    setTimeout(() => resetSection("", DADOS_EDICAO), 50);
  };

  const handleReset = () => {
    setSearchTerm("");
    fetchLideres("", 1, true);
    setTimeout(
      () =>
        resetSection("", {
          nome_equipe: "",
          departamento: "",
          lider_id: "",
          urgente: false,
        }),
      50
    );
  };
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 max-w-4xl mx-auto relative">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Cadastro de Equipe
            <span className="text-xs font-normal bg-blue-900 text-blue-200 px-2 py-0.5 rounded border border-blue-800">
              v2.5
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Teste de Validação Cruzada (Regra do Rick).
          </p>
        </div>

        <div className="flex flex-wrap gap-2 bg-gray-900 p-2 rounded border border-gray-700">
          <button
            type="button"
            onClick={() => setShouldFail(!shouldFail)}
            className={`px-3 py-1 text-xs rounded border transition-colors ${shouldFail ? "bg-red-900 text-red-200 border-red-700 font-bold" : "bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700"}`}
          >
            {shouldFail ? "🔥 Erro Ativado" : "Simular Erro API"}
          </button>
          <div className="w-px bg-gray-700 mx-1"></div>
          <button
            type="button"
            onClick={handleSimulateEdit}
            className="px-3 py-1 text-xs bg-blue-900 text-blue-200 rounded border border-blue-800 hover:bg-blue-800"
          >
            ✎ Editar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded border border-gray-600 hover:bg-gray-600"
          >
            ↺ Limpar
          </button>
        </div>
      </div>

      <form {...formProps} className="space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Nome da Equipe *
          </label>
          <input
            type="text"
            name="nome_equipe"
            className="form-input w-full p-2.5 bg-gray-900 border border-gray-600 rounded text-white focus:border-cyan-500 outline-none"
            placeholder="Ex: Squad Rocket"
            required
            data-validation="validarNome"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Autocomplete
              name="lider_id"
              label="Líder do Squad (Async)"
              placeholder="Busque por nome..."
              options={liderOptions}
              onSearch={handleSearch}
              onLoadMore={handleLoadMore}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              errorMessage={errorMsg}
              clearable
              required
              validationKey="validarLider"
            />
            <p className="text-[10px] text-gray-500 mt-1 ml-1">
              * Personagens "Dead" são exibidos desabilitados.
            </p>
          </div>

          <div>
            <Autocomplete
              name="departamento"
              label="Departamento (Local)"
              placeholder="Selecione um setor..."
              options={DEPARTAMENTOS}
              required
            />
          </div>
        </div>

        {/* CHECKBOX REATIVO */}
        <label className="flex items-center gap-3 p-3 bg-gray-900/50 rounded border border-gray-700/50 cursor-pointer hover:bg-gray-900/80 transition-colors">
          <input
            type="checkbox"
            name="urgente"
            className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-cyan-500 focus:ring-offset-gray-900"
          />
          <span className="text-sm text-gray-300">
            Marcar projeto como{" "}
            <strong className="text-red-400">Urgente</strong>
            <span className="block text-xs text-gray-500 font-normal">
              (Obs: Rick Sanchez odeia urgências)
            </span>
          </span>
        </label>

        {/* TESTES DE ROBUSTEZ (Portal) */}
        <div className="border-t border-gray-700 pt-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase">
              Testes de Robustez
            </h3>
            <button
              type="button"
              onClick={() => setShowTestModal(true)}
              className="text-xs bg-purple-900/50 text-purple-200 px-3 py-1 rounded border border-purple-800 hover:bg-purple-900 transition-colors"
            >
              🔍 Testar Portal (Modal)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900/30 p-4 rounded border border-gray-800">
            <Autocomplete
              name="campo_disabled"
              label="Teste: Disabled"
              placeholder="Bloqueado..."
              options={DEPARTAMENTOS}
              disabled
              initialValue="dev"
            />
            <Autocomplete
              name="campo_readonly"
              label="Teste: ReadOnly"
              placeholder="Somente leitura..."
              options={DEPARTAMENTOS}
              readOnly
              initialValue="qa"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-700">
          <button
            type="submit"
            className="py-2.5 px-8 rounded bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg transition-transform active:scale-95"
          >
            Salvar Cadastro
          </button>
        </div>
      </form>

      {showTestModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
          onClick={() => setShowTestModal(false)}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-600 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-2">
              Teste de Portal
            </h3>
            <div className="border border-red-900/50 p-4 rounded bg-gray-900 overflow-hidden relative h-32 mb-4 ring-1 ring-red-900/30">
              <p className="text-[10px] text-red-400 mb-2 font-mono">
                overflow: hidden
              </p>
              <Autocomplete
                name="modal_test"
                label="Departamento"
                options={DEPARTAMENTOS}
                placeholder="Clique aqui..."
                className="mb-0"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsyncAutocompleteExample;
