import React, { useState, useEffect, useCallback } from "react";
import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import { IoTicket, IoTime } from "react-icons/io5";
import "./ModalDetalhesEvento.css";
// 🔥 IMPORTAÇÃO DA API PARA ENVIAR O COOKIE E EVITAR O ERRO 401
import api from "../../../../services/api";

// TIPOS E INTERFACES
// 🔥 NOVA ESTRUTURA DE LOTES
interface Lote {
    nome: string;
    valorInteira: number;
    valorMeia: number;
    quantidadeInteira: number;
    quantidadeMeia: number;
}

interface EventoCompleto {
    _id: string;
    nome: string;
    descricao: string;
    dataInicio: string;
    dataFim: string;
    horaInicio: string;
    horaTermino: string;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    linkMaps: string;
    imagem: string;
    criadoPor: any;
    politicas: string[];
    lotes: Lote[]; // Substitui os antigos valorIngressoInteira, etc.
    temMeia: boolean;
}

interface ModalDetalhesEventoProps {
    eventoId: string;
    isOpen: boolean;
    onClose: () => void;
}

// COMPONENTE PRINCIPAL
const ModalDetalhesEvento: React.FC<ModalDetalhesEventoProps> = ({
    eventoId,
    isOpen,
    onClose
}) => {

    // STATE HOOKS
    const [imageLoaded, setImageLoaded] = useState(false);
    const [evento, setEvento] = useState<EventoCompleto | null>(null);
    const [loading, setLoading] = useState(false);

    // CONSTANTES E VARIÁVEIS
    const apiUrl = process.env.REACT_APP_API_URL;

    // EFFECT HOOKS
    const buscarDetalhesEvento = useCallback(async () => {
        setLoading(true);
        try {
            // 🔥 AXIOS FAZ A MÁGICA: O Cookie HttpOnly é enviado automaticamente
            const response = await api.get(`/api/eventos/${eventoId}`);
            setEvento(response.data);
        } catch (error) {
            console.error("Erro ao buscar detalhes do evento:", error);
            setEvento(null);
        } finally {
            setLoading(false);
        }
    }, [eventoId]);

    useEffect(() => {
        if (isOpen && eventoId) {
            setImageLoaded(false); // Reseta o estado da imagem ao abrir um novo evento
            buscarDetalhesEvento();
        }
    }, [isOpen, eventoId, buscarDetalhesEvento]);

    // HANDLER FUNCTIONS
    const handleImageLoad = () => setImageLoaded(true);
    const handleOverlayClick = (e: React.MouseEvent) => e.stopPropagation();

    // RENDER FUNCTIONS
    const renderHeader = () => {
        if (!evento) return null;

        return (
            <div className="modal-detalhes-header">
                {renderImagem()}
                <h2 className="modal-detalhes-titulo">{evento.nome}</h2>
                {renderInfoBasica()}
            </div>
        );
    };

    const renderImagem = () => {
        if (!evento) return null;

        return (
            <>
                <img
                    src={`${apiUrl}/uploads/${evento.imagem}`}
                    alt={evento.nome}
                    className="modal-detalhes-imagem"
                    onLoad={handleImageLoad}
                    style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
                />
                {!imageLoaded && renderImagePlaceholder()}
            </>
        );
    };

    const renderImagePlaceholder = () => (
        <div className="image-placeholder" style={{
            width: '100%',
            height: '250px',
            background: '#f1f5f9',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b'
        }}>
            Carregando imagem...
        </div>
    );

    const renderInfoBasica = () => {
        if (!evento) return null;

        return (
            <div className="modal-detalhes-info">
                <div className="modal-detalhes-info-item">
                    <FaCalendarAlt /> {evento.dataInicio.split('-').reverse().join('/')}
                </div>
                <div className="modal-detalhes-info-item">
                    <IoTime /> {evento.horaInicio} - {evento.horaTermino}
                </div>
                <div className="modal-detalhes-info-item">
                    <FaMapMarkerAlt /> {evento.rua}, {evento.numero}, {evento.bairro}
                </div>
            </div>
        );
    };

    const renderDescricao = () => {
        if (!evento) return null;

        return (
            <div className="modal-detalhes-secao">
                <h3>Descrição do Evento</h3>
                {/* 🔥 A CORREÇÃO ENTRA AQUI: */}
                <p style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                }}>
                    {evento.descricao}
                </p>
            </div>
        );
    };

    // 🔥 RENDERIZAÇÃO DINÂMICA DE LOTES
    const renderIngressos = () => {
        if (!evento || !evento.lotes || evento.lotes.length === 0) return null;

        return (
            <div className="modal-detalhes-secao">
                <h3><IoTicket /> Ingressos e Lotes</h3>
                <div className="modal-detalhes-lotes-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {evento.lotes.map((lote, index) => (
                        <div key={index} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#0969fb', fontSize: '1.05rem' }}>{lote.nome}</h4>
                            <div style={{ display: 'flex', gap: '30px', fontSize: '0.95rem' }}>
                                <div>
                                    <strong style={{ color: '#334155' }}>Inteira:</strong> R$ {lote.valorInteira.toFixed(2).replace('.', ',')} <br />
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Quantidade: {lote.quantidadeInteira}</span>
                                </div>
                                {evento.temMeia && (
                                    <div>
                                        <strong style={{ color: '#334155' }}>Meia:</strong> R$ {lote.valorMeia.toFixed(2).replace('.', ',')} <br />
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Quantidade: {lote.quantidadeMeia}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderLocalizacao = () => {
        if (!evento) return null;

        return (
            <div className="modal-detalhes-secao">
                <h3><FaMapMarkerAlt /> Localização</h3>
                <p>{evento.cidade}, {evento.estado}</p>
                <div style={{ borderRadius: '10px', overflow: 'hidden' }}>
                    <iframe
                        src={evento.linkMaps}
                        className="modal-detalhes-mapa"
                        title="Localização do evento"
                        loading="lazy"
                        style={{ width: '100%', border: 'none', minHeight: '200px' }}
                    ></iframe>
                </div>
            </div>
        );
    };

    const renderPoliticas = () => {
        if (!evento?.politicas || evento.politicas.length === 0) return null;

        return (
            <div className="modal-detalhes-secao">
                <h3>Políticas do Evento</h3>
                <ul>
                    {evento.politicas.map((politica, index) => (
                        <li key={index}>{politica}</li>
                    ))}
                </ul>
            </div>
        );
    };

    const renderConteudo = () => {
        if (loading) {
            return (
                <div className="modal-detalhes-loading" style={{ textAlign: 'center', padding: '40px 0', color: '#0969fb' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 15px', borderColor: '#0969fb', borderTopColor: 'transparent' }}></div>
                    Carregando detalhes...
                </div>
            );
        }

        if (!evento) {
            return <div className="modal-detalhes-error">Erro ao carregar evento</div>;
        }

        return (
            <div className="modal-detalhes-container">
                {renderHeader()}
                {renderDescricao()}
                {renderIngressos()}
                {renderLocalizacao()}
                {renderPoliticas()}
            </div>
        );
    };

    // RENDER CONDITIONS
    if (!isOpen) return null;

    return (
        <div className="modal-detalhes-overlay" onClick={onClose}>
            <div className="modal-detalhes-content" onClick={handleOverlayClick}>
                <button className="modal-detalhes-close" onClick={onClose}>
                    &times;
                </button>
                {renderConteudo()}
            </div>
        </div>
    );
};

export default ModalDetalhesEvento;