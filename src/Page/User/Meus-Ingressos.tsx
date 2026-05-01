// Meus-Ingressos.tsx (com filtro centralizado) - ORGANIZADO
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import api from "../../services/api";

// Components
import { IngressoCard } from '../../components/sections/User/IngressoCard/IngresseCard';
import ModalAviso from '../../components/sections/User/ModalAviso/ModalAviso';
import ModalAvisoEmail from '../../components/ui/ModalAvisoEmail/ModalAvisoEmail';
import VoltarParaInicio from '../../components/layout/VoltarParaInicio/VoltarParaInicio';
import { ModalTransferencia } from '../../components/sections/User/ModalTransferencia/ModalTransferencia';

// Hooks e tipos
import { useAuth } from '../../Hook/AuthContext';
import { Ingresso } from '../../types/Ingresso';

// Estilos
import '../../styles/Meus-Ingressos.css';

// TIPAGENS
type FiltroStatus = 'todos' | 'pagos' | 'pendentes' | 'reembolsados' | 'expirados';

interface TransferenciaRecebida {
    _id: string;
    tipo: 'Direta' | 'Segura';
    quemPagaTaxa: 'Remetente' | 'Destinatario';
    valorRevenda?: number;
    valorTaxa: number;
    expiresAt: string;
    // Tipando o ingresso e o evento como opcionais para evitar o erro de 'undefined'
    ingressoId?: {
        _id: string;
        eventoId?: {
            _id: string;
            nome: string;
            imagem: string;
            dataInicio: string;
            localEvento: string;
        }
    }
}

const MeusIngressos: React.FC = () => {
    // HOOKS E CONFIGURAÇÕES
    const { user, isLoading: isAuthLoading } = useAuth();
    const apiUrl = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();

    // ESTADOS
    const [modalOpen, setModalOpen] = useState(false);
    const [modalInfo, setModalInfo] = useState({ title: '', message: '' });

    const [modalReembolsoOpen, setModalReembolsoOpen] = useState(false);
    const [modalAvisoOpen, setModalAvisoOpen] = useState(false);
    const [modalAvisoMensagem, setModalAvisoMensagem] = useState({ title: '', message: '' });

    // Estados para dados e carregamento
    const [ingressos, setIngressos] = useState<Ingresso[]>([]);
    const [ingressosFiltrados, setIngressosFiltrados] = useState<Ingresso[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para filtros
    const [filtroAtivo, setFiltroAtivo] = useState<FiltroStatus>('todos');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    // Estados para ações
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isReembolsando, setIsReembolsando] = useState(false);
    const [pedidoParaReembolsar, setPedidoParaReembolsar] = useState<string | null>(null);

    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [ingressoParaTransferir, setIngressoParaTransferir] = useState<Ingresso | null>(null);
    const [isTransferindoProcessando, setIsTransferindoProcessando] = useState(false);

    const [transferenciasPendentes, setTransferenciasPendentes] = useState<TransferenciaRecebida[]>([]);
    const [isAceitando, setIsAceitando] = useState(false);
    const [isRejeitando, setIsRejeitando] = useState(false);


    // EFFECTS E INICIALIZAÇÕES
    // --- Effect para buscar ingressos --- //
    useEffect(() => {
        const fetchIngressos = async () => {
            setLoading(true);
            setError(null);

            try {
                // Axios puxando os dados sem precisar montar Header!
                const response = await api.get('/api/ingressos/user');
                const data = response.data;

                const ingressosMapeados = data.map((item: any) => {
                    const evento = item.eventoId || {};
                    let statusAtual = item.status;
                    
                    if (evento.status === 'finalizado' && statusAtual === 'Pago') {
                        statusAtual = 'Expirado';
                    }
                    return {
                        ...item,
                        id: item._id,
                        eventoId: evento,
                        status: statusAtual
                    };

                });
                setIngressos(ingressosMapeados);
                setIngressosFiltrados(ingressosMapeados);

                const respTransfer = await api.get('/api/transferencias/recebidas');
                setTransferenciasPendentes(respTransfer.data);

            } catch (err: any) {
                console.error("Erro detalhado ao buscar ingressos:", err);
                setError(err.response?.data?.message || err.response?.data?.error || "Ocorreu um erro desconhecido.");
            } finally {
                setLoading(false);
            }
        };

        if (!isAuthLoading) {
            if (user) {
                fetchIngressos();
            } else {
                setError("Faça login para ver seus ingressos.");
                setLoading(false);
            }
        }
    }, [user, isAuthLoading, apiUrl, navigate]);

    // --- Effect para filtrar ingressos --- //
    useEffect(() => {
        const filtrarIngressos = () => {
            let filtrados = ingressos;

            switch (filtroAtivo) {
                case 'pagos':
                    filtrados = ingressos.filter(ingresso =>
                        ingresso.status?.toLowerCase().includes('pago') ||
                        ingresso.status?.toLowerCase().includes('confirmado') ||
                        ingresso.status?.toLowerCase().includes('aprovado')
                    );
                    break;
                case 'pendentes':
                    filtrados = ingressos.filter(ingresso =>
                        ingresso.status?.toLowerCase().includes('pendente') ||
                        ingresso.status?.toLowerCase().includes('processando')
                    );
                    break;
                case 'reembolsados':
                    filtrados = ingressos.filter(ingresso =>
                        ingresso.status?.toLowerCase().includes('reembolsado') ||
                        ingresso.status?.toLowerCase().includes('cancelado') ||
                        ingresso.status?.toLowerCase().includes('recusado')
                    );
                    break;
                case 'expirados':
                    filtrados = ingressos.filter(ingresso =>
                        ingresso.status?.toLowerCase().includes('expirado') ||
                        ingresso.status?.toLowerCase().includes('vencido')
                    );
                    break;
                case 'todos':
                default:
                    filtrados = ingressos;
                    break;
            }

            setIngressosFiltrados(filtrados);
        };

        filtrarIngressos();
    }, [filtroAtivo, ingressos]);


    // FUNÇÕES DE FILTROS
    // --- Handler para mudança de filtro --- //
    const handleFiltroChange = (filtro: FiltroStatus) => {
        setFiltroAtivo(filtro);
        setMostrarFiltros(false);
    };


    // FUNÇÕES DE ENVIO DE EMAIL
    // --- Handler para envio de email --- //
    const handleSendEmail = async (ingressoId: string) => {
        setIsSendingEmail(true);
        try {
            const response = await api.post('/api/ingressos/send-email', { ingressoId });

            setModalInfo({ title: "Sucesso!", message: response.data.message });
            setModalOpen(true);
        } catch (err: any) {
            setModalInfo({ title: "Ops!", message: err.response?.data?.message || "Ocorreu um erro" });
            setModalOpen(true);
        } finally {
            setIsSendingEmail(false);
        }
    };


    // FUNÇÕES DE REEMBOLSO
    // --- Abre modal de confirmação de reembolso --- //
    const handleAbrirConfirmacaoReembolso = (pedidoId: string) => {
        setPedidoParaReembolsar(pedidoId);
        setModalReembolsoOpen(true);
    };

    // --- Confirma e executa o reembolso --- //
    const handleConfirmarReembolso = async () => {
        if (!pedidoParaReembolsar || isReembolsando) return;
        setIsReembolsando(true);

        try {
            await api.post('/api/pagamento/reembolsar', { pedidoId: pedidoParaReembolsar });

            setModalAvisoMensagem({ title: 'Sucesso', message: 'Pedido reembolsado com sucesso!' });
            setModalAvisoOpen(true);

            setIngressos(prevIngressos =>
                prevIngressos.map(ing =>
                    ing.pedidoId === pedidoParaReembolsar ? { ...ing, status: 'Reembolsado' } : ing
                )
            );
            setModalReembolsoOpen(false);
            setPedidoParaReembolsar(null);

        } catch (err: any) {
            setModalAvisoMensagem({
                title: 'Reembolso Falhou',
                message: err.response?.data?.message || 'Ocorreu um erro desconhecido.'
            });
            setModalAvisoOpen(true);
            setModalReembolsoOpen(false);
        } finally {
            setIsReembolsando(false);
        }
    };

    // ==========================================
    // FUNÇÕES DE TRANSFERÊNCIA
    // ==========================================
    const handleAbrirTransferencia = (ingresso: Ingresso) => {
        setIngressoParaTransferir(ingresso);
        setTransferModalOpen(true);
    };

    const handleConfirmarTransferencia = async (dadosTransferencia: any) => {
        setIsTransferindoProcessando(true);
        try {
            // 1. Dispara os dados para a nossa nova rota no Backend
            const response = await api.post('/api/transferencias/iniciar', dadosTransferencia);

            setTransferModalOpen(false);

            // 2. Atualiza o ingresso na tela instantaneamente para colocar o "cadeado"
            setIngressos(prevIngressos =>
                prevIngressos.map(ing =>
                    ing.id === dadosTransferencia.ingressoId
                        ? { ...ing, isTransferindo: true }
                        : ing
                )
            );

            // 3. Roteamento do Pagamento
            if (response.data.linkPagamento) {
                // Se a taxa for por conta do Remetente (Gratuita), manda ele pro Mercado Pago
                window.location.href = response.data.linkPagamento;
            } else {
                // Se for Segura ou por conta do Destinatário, mostra o aviso
                setModalAvisoMensagem({
                    title: 'Transferência Iniciada!',
                    message: 'O ingresso foi bloqueado temporariamente. O destinatário agora precisa aceitar e pagar a taxa para concluir a transferência.'
                });
                setModalAvisoOpen(true);
            }

        } catch (err: any) {
            // Aqui é onde o erro das 2 horas (ou qualquer outro) vai aparecer para o usuário!
            setModalAvisoMensagem({
                title: 'Erro na Transferência',
                message: err.response?.data?.message || err.response?.data?.error || 'Ocorreu um erro desconhecido.'
            });
            setModalAvisoOpen(true);
        } finally {
            setIsTransferindoProcessando(false);
        }
    };

    const handleAceitarTransferencia = async (transferenciaId: string) => {
        setIsAceitando(true);
        try {
            const response = await api.post(`/api/transferencias/aceitar/${transferenciaId}`);

            if (response.data.exigePagamento) {
                // O destinatário precisa pagar a taxa ou o ingresso! Joga pro Mercado Pago.
                window.location.href = response.data.linkPagamento;
            } else {
                // Era gratuita e o remetente já pagou a taxa. O ingresso já é dele!
                setModalAvisoMensagem({ title: 'Sucesso!', message: 'O ingresso agora é seu e já está na sua carteira!' });
                setModalAvisoOpen(true);

                // Recarrega a página para o ingresso novo aparecer na lista
                setTimeout(() => window.location.reload(), 2000);
            }
        } catch (err: any) {
            setModalAvisoMensagem({
                title: 'Erro',
                message: err.response?.data?.message || err.response?.data?.error || 'Erro ao aceitar transferência.'
            });
            setModalAvisoOpen(true);
        } finally {
            setIsAceitando(false);
        }
    };

    const handleRejeitarTransferencia = async (transferenciaId: string) => {
        setIsRejeitando(true);
        try {
            await api.post(`/api/transferencias/rejeitar/${transferenciaId}`);

            setModalAvisoMensagem({ title: 'Transferência Rejeitada', message: 'O ingresso foi devolvido ao remetente.' });
            setModalAvisoOpen(true);

            // Remove a transferência da tela instantaneamente
            setTransferenciasPendentes(prev => prev.filter(t => t._id !== transferenciaId));

        } catch (err: any) {
            setModalAvisoMensagem({
                title: 'Erro',
                message: err.response?.data?.message || 'Erro ao rejeitar transferência.'
            });
            setModalAvisoOpen(true);
        } finally {
            setIsRejeitando(false);
        }
    };


    // FUNÇÕES AUXILIARES
    // --- Contadores para os filtros --- //
    const contarIngressosPorStatus = () => {
        return {
            todos: ingressos.length,
            pagos: ingressos.filter(ing =>
                ing.status?.toLowerCase().includes('pago') ||
                ing.status?.toLowerCase().includes('confirmado') ||
                ing.status?.toLowerCase().includes('aprovado')
            ).length,
            pendentes: ingressos.filter(ing =>
                ing.status?.toLowerCase().includes('pendente') ||
                ing.status?.toLowerCase().includes('processando')
            ).length,
            reembolsados: ingressos.filter(ing =>
                ing.status?.toLowerCase().includes('reembolsado') ||
                ing.status?.toLowerCase().includes('cancelado')
            ).length,
            expirados: ingressos.filter(ing =>
                ing.status?.toLowerCase().includes('expirado') ||
                ing.status?.toLowerCase().includes('vencido')
            ).length
        };
    };

    const contadores = contarIngressosPorStatus();


    // RENDERIZAÇÃO DE ESTADOS DE CARREGAMENTO
    if (loading) {
        return <div className="meus-ingressos-carregando">Carregando seus ingressos...</div>;
    }

    if (!user && !loading) {
        return (
            <div className="pagina-meus-ingressos">
                <div className="meus-ingressos-header">
                    <h1 className="meus-ingressos-titulo">Meus Ingressos</h1>
                </div>
                <div className="meus-ingressos-erro">
                    {error || "Faça login para ver seus ingressos."}
                    <button onClick={() => navigate('/login')}>Ir para Login</button>
                </div>
            </div>
        );
    }


    // RENDERIZAÇÃO PRINCIPAL
    return (
        <>
            <VoltarParaInicio />
            <div className="pagina-meus-ingressos">
                <div className="meus-ingressos-header">
                    <h1 className="meus-ingressos-titulo">Meus Ingressos</h1>
                </div>
                {transferenciasPendentes.length > 0 && (
                    <div style={{ padding: '16px', margin: '0 16px 20px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px' }}>
                        <h3 style={{ color: '#1e3a8a', margin: '0 0 12px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🎟️ Você recebeu ingressos!
                        </h3>
                        {transferenciasPendentes.map(trans => (
                            <div key={trans._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '8px' }}>
                                <div>
                                    <strong style={{ display: 'block', color: '#111827' }}>{trans.ingressoId?.eventoId?.nome || 'Ingresso de Evento'}</strong>
                                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                        {trans.tipo === 'Direta' ? 'Transferência Gratuita' : 'Venda Segura'}
                                        {trans.quemPagaTaxa === 'Destinatario' ? ' (Requer Pagamento)' : ' (Taxa Paga)'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleRejeitarTransferencia(trans._id)}
                                    disabled={isRejeitando || isAceitando}
                                    style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    {isRejeitando ? '...' : 'Rejeitar'}
                                </button>

                                <button
                                    onClick={() => handleAceitarTransferencia(trans._id)}
                                    disabled={isAceitando}
                                    style={{ backgroundColor: '#0969fb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    {isAceitando ? 'Processando...' : 'Aceitar'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ============ FILTRO CENTRALIZADO ============ */}
                <div className="meus-ingressos-filtro-centralizado">
                    <div className="meus-ingressos-filtro-container">
                        <button
                            className="meus-ingressos-botao-filtro"
                            onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        >
                            <span>
                                {filtroAtivo === 'todos' ? 'Todos os ingressos' :
                                    filtroAtivo === 'pagos' ? 'Ingressos Pagos' :
                                        filtroAtivo === 'pendentes' ? 'Ingressos Pendentes' :
                                            filtroAtivo === 'reembolsados' ? 'Ingressos Reembolsados' :
                                                'Ingressos Expirados'}
                            </span>
                            <span className={`meus-ingressos-filtro-seta ${mostrarFiltros ? 'aberto' : ''}`}>▼</span>
                        </button>

                        {mostrarFiltros && (
                            <div className="meus-ingressos-filtro-opcoes">
                                <button
                                    className={`meus-ingressos-filtro-opcao ${filtroAtivo === 'todos' ? 'ativo' : ''}`}
                                    onClick={() => handleFiltroChange('todos')}
                                >
                                    Todos ({contadores.todos})
                                </button>
                                <button
                                    className={`meus-ingressos-filtro-opcao ${filtroAtivo === 'pagos' ? 'ativo' : ''}`}
                                    onClick={() => handleFiltroChange('pagos')}
                                >
                                    Pagos ({contadores.pagos})
                                </button>
                                <button
                                    className={`meus-ingressos-filtro-opcao ${filtroAtivo === 'pendentes' ? 'ativo' : ''}`}
                                    onClick={() => handleFiltroChange('pendentes')}
                                >
                                    Pendentes ({contadores.pendentes})
                                </button>
                                <button
                                    className={`meus-ingressos-filtro-opcao ${filtroAtivo === 'reembolsados' ? 'ativo' : ''}`}
                                    onClick={() => handleFiltroChange('reembolsados')}
                                >
                                    Reembolsados ({contadores.reembolsados})
                                </button>
                                <button
                                    className={`meus-ingressos-filtro-opcao ${filtroAtivo === 'expirados' ? 'ativo' : ''}`}
                                    onClick={() => handleFiltroChange('expirados')}
                                >
                                    Expirados ({contadores.expirados})
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {error && user && (
                    <div className="meus-ingressos-erro">
                        Erro: {error}
                    </div>
                )}

                {!error && ingressosFiltrados.length === 0 ? (
                    <div className="meus-ingressos-mensagem-vazia">
                        {filtroAtivo === 'todos'
                            ? "Você ainda não comprou nenhum ingresso."
                            : `Nenhum ingresso encontrado para "${filtroAtivo}".`
                        }
                    </div>
                ) : (
                    <div className="meus-ingressos-lista-ingressos">
                        {ingressosFiltrados.map((ingresso) => (
                            <IngressoCard
                                key={ingresso.id}
                                ingresso={ingresso}
                                onSendEmail={handleSendEmail}
                                isSendingEmail={isSendingEmail}
                                onReembolsar={handleAbrirConfirmacaoReembolso}
                                isReembolsando={isReembolsando}
                                onTransferir={handleAbrirTransferencia}
                            />
                        ))}
                    </div>
                )}

                {/* ============ MODAIS ============ */}
                <ModalAvisoEmail
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={modalInfo.title}
                    message={modalInfo.message}
                />

                <ModalAviso
                    isOpen={modalReembolsoOpen}
                    onClose={() => setModalReembolsoOpen(false)}
                    onConfirm={handleConfirmarReembolso}
                    type="confirmacao"
                    theme="perigo"
                    title="Confirmar Cancelamento"
                    labelConfirmar="Sim, Cancelar"
                    isLoading={isReembolsando}
                >
                    <p>Tem certeza que deseja cancelar este pedido?</p>
                    <p>O valor total será estornado no método de pagamento original.</p>
                </ModalAviso>

                <ModalAviso
                    isOpen={modalAvisoOpen}
                    onClose={() => setModalAvisoOpen(false)}
                    type="aviso"
                    theme={modalAvisoMensagem.title === 'Sucesso' ? 'info' : 'perigo'}
                    title={modalAvisoMensagem.title}
                >
                    <p>{modalAvisoMensagem.message}</p>
                </ModalAviso>

                {ingressoParaTransferir && (
                    <ModalTransferencia
                        isOpen={transferModalOpen}
                        onClose={() => setTransferModalOpen(false)}
                        ingresso={ingressoParaTransferir}
                        onSubmit={handleConfirmarTransferencia}
                        isLoading={isTransferindoProcessando}
                    />
                )}
            </div>
        </>
    );
};

export default MeusIngressos;