import React from 'react';
import { AlertTriangle, XCircle, RefreshCw, Clock, Ban, Network, Database, Edit3, Send, Trash } from 'lucide-react';
import { toast } from '../../componentes/toast';
import { api } from '../../service/api';


const ServiceExample = () => {
    const [loading, setLoading] = React.useState<string | null>(null);
    const [responseInfo, setResponseInfo] = React.useState<any>(null);
    const abortController = React.useRef<AbortController | null>(null);

    // Helper para formatar a exibição
    const displayResult = (res: any, title: string, method: string, payload?: any) => {
        setResponseInfo({
            title,
            method,
            status: res.status,
            isSuccess: res.isSuccess,
            url: res.config?.url || 'N/A', // Assumindo que injetamos a config na resposta ou apenas ilustrativo
            data: res.data,
            error: res.error,
            payloadSent: payload
        });
        setLoading(null);
        abortController.current = null;
    };

    // --- 1. CENÁRIOS DE SUCESSO (JSONPlaceholder) ---

    const handleGetList = async () => {
        setLoading('get-list');
        // Busca lista real de usuários
        const res = await api.get('https://jsonplaceholder.typicode.com/users');

        if (res.isSuccess) toast.success(`Carregados ${Array.isArray(res.data) ? res.data.length : 0} usuários.`);
        displayResult(res, "Listar Usuários", "GET");
    };

    const handlePostCreate = async () => {
        setLoading('post-create');
        const payload = {
            name: "Novo Usuário Híbrido",
            job: "Dev Sênior",
            tech: ["React", "TypeScript"]
        };

        // Envia dados (JSON automático)
        const response = await api.post('https://jsonplaceholder.typicode.com/users', payload);

        if (response.isSuccess) toast.success("Usuário criado com ID: " + (response.data as any)?.id);
        displayResult(response, "Criar Registro", "POST", payload);
    };

    const handlePutUpdate = async () => {
        setLoading('put-update');
        const payload = { id: 1, name: "Usuário Atualizado", job: "Tech Lead" };

        const res = await api.put('https://jsonplaceholder.typicode.com/users/1', payload);
        displayResult(res, "Atualizar Completo", "PUT", payload);
    };

    const handleDelete = async () => {
        setLoading('delete');
        const res = await api.delete('https://jsonplaceholder.typicode.com/users/1');

        if (res.isSuccess) toast.info("Registro excluído.");
        displayResult(res, "Remover Registro", "DELETE");
    };

    // --- 2. CENÁRIOS DE ERRO & RESILIÊNCIA ---

    const handleForce404 = async () => {
        setLoading('404');
        // URL inexistente
        const res = await api.get('https://jsonplaceholder.typicode.com/users/99999', {
            notifyOnError: true // Teste do Toast automático
        });
        displayResult(res, "Erro: Não Encontrado", "GET");
    };

    const handleForce500 = async () => {
        setLoading('500');
        // Httpstat é mais lento, mas bom para simular status específicos
        const res = await api.get('https://httpstat.us/500', {
            notifyOnError: false // Tratamento manual
        });

        if (!res.isSuccess) {
            toast.warning("Erro de servidor detectado e tratado manualmente.");
        }
        displayResult(res, "Erro: Servidor", "GET");
    };

    const handleRetryLogic = async () => {
        setLoading('retry');
        toast.info("Tentando conectar ao serviço instável (3x)...");

        // Simula serviço indisponível (503) com Retry automático
        const res = await api.get('https://httpstat.us/503', {
            retries: 2, // Tenta 1 + 2 vezes
            retryDelay: 800,
            notifyOnError: true
        });

        displayResult(res, "Retry Automático (503)", "GET");
    };

    const handleAbort = async () => {
        setLoading('abort');
        abortController.current = new AbortController();

        toast.info("Iniciando download lento... (ancele para testar)");

        // Delay de 5 segundos
        const response = await api.get('https://httpstat.us/200?sleep=5000', { signal: abortController.current.signal });

        if (response.error?.code === 'REQUEST_ABORTED') {
            toast.warning("Operação cancelada pelo usuário.");
        } else {
            toast.success("Operação finalizada!");
        }

        displayResult(response, "Cancelamento (Abort)", "GET");
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[600px]">

            {/* COLUNA ESQUERDA: CONTROLES */}
            <div className="lg:col-span-5 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                        <Network className="w-6 h-6" /> HTTP Client Lab
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Teste de verbos, payloads, erros e resiliência.
                    </p>
                </div>

                {/* BLOCO 1: CRUD REAL (JSONPlaceholder) */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-700 pb-1">
                        1. Operações CRUD (Estável)
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <ApiButton
                            label="GET List" method="GET" icon={<Database size={16} />}
                            onClick={handleGetList} loading={loading === 'get-list'}
                            color="blue"
                        />
                        <ApiButton
                            label="POST Create" method="POST" icon={<Send size={16} />}
                            onClick={handlePostCreate} loading={loading === 'post-create'}
                            color="green"
                        />
                        <ApiButton
                            label="PUT Update" method="PUT" icon={<Edit3 size={16} />}
                            onClick={handlePutUpdate} loading={loading === 'put-update'}
                            color="orange"
                        />
                        <ApiButton
                            label="DELETE" method="DEL" icon={<Trash size={16} />}
                            onClick={handleDelete} loading={loading === 'delete'}
                            color="red"
                        />
                    </div>
                </div>

                {/* BLOCO 2: TRATAMENTO DE ERROS */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-700 pb-1">
                        2. Erros e Notificações
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        <ApiButton
                            label="Erro 404 (Toast Automático)" method="GET" icon={<AlertTriangle size={16} />}
                            onClick={handleForce404} loading={loading === '404'}
                            color="yellow"
                        />
                        <ApiButton
                            label="Erro 500 (Tratamento Manual)" method="GET" icon={<XCircle size={16} />}
                            onClick={handleForce500} loading={loading === '500'}
                            color="red"
                        />
                    </div>
                </div>

                {/* BLOCO 3: RESILIÊNCIA */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-700 pb-1">
                        3. Resiliência de Rede
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <ApiButton
                            label="Retry (503)" method="GET" icon={<RefreshCw size={16} />}
                            onClick={handleRetryLogic} loading={loading === 'retry'}
                            color="purple" subtext="3 Tentativas"
                        />
                        <div className="flex items-center gap-2">
                            <ApiButton
                                label="Longo (5s)" method="GET" icon={<Clock size={16} />}
                                onClick={handleAbort} loading={loading === 'abort'}
                                color="gray" className="flex-1"
                            />
                            <button
                                onClick={() => abortController.current?.abort()}
                                disabled={loading !== 'abort'}
                                className="p-3 rounded bg-red-900/50 border border-red-800 text-red-200 hover:bg-red-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors h-full"
                                title="Cancelar Requisição"
                            >
                                <Ban size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* COLUNA DIREITA: VIEWER */}
            <div className="lg:col-span-7 bg-gray-900 rounded-lg border border-gray-700 flex flex-col overflow-hidden h-[600px]">
                <div className="p-3 bg-black/40 border-b border-gray-700 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase">Console de Resposta</span>
                    {responseInfo && (
                        <span className={`text-xs px-2 py-0.5 rounded ${responseInfo.isSuccess ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                            STATUS: {responseInfo.status || 0}
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-auto p-4 font-mono text-xs">
                    {responseInfo ? (
                        <div className="space-y-6">
                            {/* Resumo */}
                            <div className="space-y-1">
                                <p className="text-gray-500">// Requisição</p>
                                <div className="flex gap-2">
                                    <span className="text-purple-400 font-bold">{responseInfo.method}</span>
                                    <span className="text-gray-300">{responseInfo.title}</span>
                                </div>
                            </div>

                            {/* Payload Enviado */}
                            {responseInfo.payloadSent && (
                                <div className="space-y-1">
                                    <p className="text-gray-500">// Payload Enviado (Body)</p>
                                    <pre className="text-blue-300">
                                        {JSON.stringify(responseInfo.payloadSent, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* Resposta */}
                            <div className="space-y-1">
                                <p className="text-gray-500">// Resposta da API (Data)</p>
                                {responseInfo.data ? (
                                    <pre className="text-green-300">
                                        {JSON.stringify(responseInfo.data, null, 2)}
                                    </pre>
                                ) : (
                                    <span className="text-gray-600 italic">null</span>
                                )}
                            </div>

                            {/* Erro */}
                            {responseInfo.error && (
                                <div className="space-y-1">
                                    <p className="text-gray-500">// Detalhes do Erro</p>
                                    <pre className="text-red-400 border-l-2 border-red-500 pl-2">
                                        {JSON.stringify(responseInfo.error, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                            <Network size={48} className="mb-4" />
                            <p>Nenhuma requisição realizada.</p>
                            <p className="text-[10px]">Selecione uma operação ao lado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper de Botão Rico
const ApiButton = ({ label, method, icon, onClick, loading, color, subtext, className = "" }: any) => {
    const colors: any = {
        blue: "border-blue-500/30 hover:border-blue-500 text-blue-400 bg-blue-900/10",
        green: "border-green-500/30 hover:border-green-500 text-green-400 bg-green-900/10",
        orange: "border-orange-500/30 hover:border-orange-500 text-orange-400 bg-orange-900/10",
        red: "border-red-500/30 hover:border-red-500 text-red-400 bg-red-900/10",
        yellow: "border-yellow-500/30 hover:border-yellow-500 text-yellow-400 bg-yellow-900/10",
        purple: "border-purple-500/30 hover:border-purple-500 text-purple-400 bg-purple-900/10",
        gray: "border-gray-500/30 hover:border-gray-500 text-gray-400 bg-gray-900/10",
    };

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`flex items-start gap-3 p-3 rounded border transition-all text-left relative overflow-hidden group ${colors[color]} ${className} ${loading ? 'opacity-70 cursor-wait' : ''}`}
        >
            <div className="mt-0.5">
                {loading ? <RefreshCw size={16} className="animate-spin" /> : icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{label}</span>
                    <span className="text-[10px] font-mono opacity-50 border border-current px-1 rounded">{method}</span>
                </div>
                {subtext && <p className="text-[10px] opacity-70 mt-0.5">{subtext}</p>}
            </div>
        </button>
    );
};

export default ServiceExample;