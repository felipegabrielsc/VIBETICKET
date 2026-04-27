import React from "react";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { Evento as EventoType } from "../../../../types/evento";
import "./ModalEvento.css";


// TIPOS E INTERFACES
type EventoStatus = "em_analise" | "aprovado" | "rejeitado" | "em_reanalise";

interface CriadorPopulado {
    _id: string;
    nome?: string;
    email?: string;
    cpf?: string;
    cnpj?: string;
    tipoPessoa?: 'cpf' | 'cnpj';
}

// 🔥 Interface dos Lotes Adicionada
interface Lote {
    nome: string;
    valorInteira: number;
    valorMeia: number;
    quantidadeInteira: number;
    quantidadeMeia: number;
}

interface ModalEventoProps {
    evento: Omit<EventoType, 'criadoPor'> & {
        status: EventoStatus,
        temMeia: boolean,
        imagemDescricao?: string,
        dataInicioVendas?: string,
        dataFimVendas?: string,
        lotes?: Lote[], // 🔥 Lotes substituindo os campos velhos
        criadoPor: CriadorPopulado;
    };
    onClose: () => void;
    onAceitar?: () => void;
    onRejeitar?: () => void;
    onReanalise?: () => void;
}


// COMPONENTE PRINCIPAL
const ModalEvento: React.FC<ModalEventoProps> = ({
    evento,
    onClose,
    onAceitar,
    onRejeitar,
    onReanalise
}) => {

    // FUNÇÕES UTILITÁRIAS
    const formatarMoeda = (valor: number | string | undefined) => {
        if (valor === undefined) return 'R$ 0,00';
        if (typeof valor === 'string') {
            valor = parseFloat(valor);
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(valor);
    };

    const getMapSrc = (iframeHtml: string): string | null => {
        if (!iframeHtml) return null;
        const match = iframeHtml.match(/<iframe.*?src=["'](.*?)["']/);
        return match ? match[1] : iframeHtml;
    };

    // VARIÁVEIS DERIVADAS
    const mapSrc = getMapSrc(evento.linkMaps);

    const dadosPessoaisPendentes = !evento.criadoPor ||
        !evento.criadoPor.tipoPessoa ||
        (evento.criadoPor.tipoPessoa === 'cpf' ? !evento.criadoPor.cpf : !evento.criadoPor.cnpj);

    // HANDLER FUNCTIONS
    const handleOverlayClick = (e: React.MouseEvent) => e.stopPropagation();

    // RENDER FUNCTIONS
    const renderHeader = () => (
        <div className="modal-evento-header">
            <img src={evento.imagem} alt={evento.nome} className="modal-evento-imagem" />
            <div className="modal-evento-info-basica">
                <h2 className="modal-evento-titulo">{evento.nome}</h2>
                <p className="modal-evento-data">
                    **📅 {evento.dataInicio}** das {evento.horaInicio} às {evento.horaTermino}
                </p>
                <p className="modal-evento-criador">
                    Criado por: **{evento.criadoPor?.nome || evento.criadoPor?._id || 'Desconhecido'}**
                </p>
                {renderStatusCriador()}
            </div>
        </div>
    );

    const renderStatusCriador = () => (
        <div className={`modal-criador-status ${dadosPessoaisPendentes ? 'pendente' : 'verificado'}`}>
            {dadosPessoaisPendentes ? (
                <>
                    <FaExclamationTriangle />
                    <span>Dados Pessoais Pendentes</span>
                </>
            ) : (
                <>
                    <FaCheckCircle />
                    <span>Dados Verificados</span>
                </>
            )}
        </div>
    );

    const renderDescricao = () => (
        <div className="modal-evento-item full-width">
            <strong className="modal-evento-label">Descrição:</strong>

            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                marginTop: '5px'
            }}>
                {/* 🔥 EXIBIÇÃO DA FOTO DA DESCRIÇÃO */}
                {evento.imagemDescricao && (
                    <img
                        src={evento.imagemDescricao}
                        alt="Banner da descrição"
                        style={{
                            width: '100%',
                            height: 'auto',          // Deixa a altura se adaptar ao formato da foto
                            maxHeight: '400px',      // Limite maior para não ocupar a tela toda
                            objectFit: 'contain',    // O segredo: garante que a foto inteira apareça sem cortes
                            borderRadius: '6px',
                            marginBottom: '15px',
                            display: 'block',
                            backgroundColor: '#fff'  // Fundo branco caso a foto seja estreita
                        }}
                    />
                )}

                <p style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    fontSize: '14px',
                    color: '#444'
                }}>
                    {evento.descricao}
                </p>
            </div>
        </div>
    );

    // 🔥 RENDERIZAÇÃO DOS LOTES E DATAS DE VENDA
    const renderLotes = () => (
        <>
            <strong className="modal-evento-label-secao mt-15">Período de Vendas e Lotes</strong>
            <div className="modal-evento-secao-colunas" style={{ marginBottom: '10px' }}>
                <div className="modal-evento-item">
                    <strong className="modal-evento-label">Início das Vendas:</strong>
                    <span>{evento.dataInicioVendas ? evento.dataInicioVendas.split('-').reverse().join('/') : 'N/A'}</span>
                </div>
                <div className="modal-evento-item">
                    <strong className="modal-evento-label">Fim das Vendas:</strong>
                    <span>{evento.dataFimVendas ? evento.dataFimVendas.split('-').reverse().join('/') : 'N/A'}</span>
                </div>
            </div>

            {evento.lotes && evento.lotes.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
                    {evento.lotes.map((lote, index) => (
                        <div key={index} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '1rem' }}>{lote.nome}</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <div>
                                    <strong style={{ color: '#475569' }}>Inteira</strong><br />
                                    <span style={{ color: '#0969fb', fontWeight: 'bold' }}>{formatarMoeda(lote.valorInteira)}</span><br />
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Qtd: {lote.quantidadeInteira}</span>
                                </div>
                                {evento.temMeia && lote.quantidadeMeia > 0 && (
                                    <div>
                                        <strong style={{ color: '#475569' }}>Meia</strong><br />
                                        <span style={{ color: '#0969fb', fontWeight: 'bold' }}>{formatarMoeda(lote.valorMeia)}</span><br />
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Qtd: {lote.quantidadeMeia}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', padding: '10px', borderRadius: '8px', color: '#e11d48' }}>
                    Nenhum lote foi cadastrado ou o evento utiliza a estrutura antiga.
                </div>
            )}
        </>
    );

    const renderDetalhesAdicionais = () => (
        <>
            <strong className="modal-evento-label-secao mt-15">Detalhes Adicionais</strong>
            <div className="modal-evento-secao-colunas">
                <div className="modal-evento-item">
                    <strong className="modal-evento-label">Categoria:</strong>
                    <span>{evento.categoria}</span>
                </div>
                <div className="modal-evento-item">
                    <strong className="modal-evento-label">Localização:</strong>
                    <p>{evento.rua}, {evento.cidade} - {evento.estado}</p>
                    {renderMapa()}
                </div>
            </div>
        </>
    );

    const renderMapa = () => {
        if (!mapSrc) {
            return <p>Link do mapa não disponível.</p>;
        }

        return (
            <div className="modal-evento-mapa-container">
                <iframe
                    src={mapSrc}
                    className="modal-evento-mapa-iframe"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Mapa do Evento"
                ></iframe>
            </div>
        );
    };

    const renderBotoesAcao = () => (
        <div className="modal-evento-botoes">
            {onRejeitar && (
                <button
                    className="modal-evento-btn modal-evento-btn-rejeitar"
                    onClick={onRejeitar}
                >
                    Rejeitar
                </button>
            )}

            {onReanalise && (
                <button
                    className="modal-evento-btn modal-evento-btn-reanalise"
                    onClick={onReanalise}
                >
                    Reanálise
                </button>
            )}

            {onAceitar && (
                <button
                    className="modal-evento-btn modal-evento-btn-aceitar"
                    onClick={onAceitar}
                >
                    Aceitar
                </button>
            )}
        </div>
    );

    return (
        <div className="modal-evento-overlay" onClick={onClose}>
            <div className="modal-evento-conteudo" onClick={handleOverlayClick}>
                <button className="modal-evento-fechar" onClick={onClose}>
                    ×
                </button>

                {renderHeader()}

                <div className="modal-evento-detalhes">
                    {renderDescricao()}
                    {renderLotes()}
                    {renderDetalhesAdicionais()}
                </div>

                {renderBotoesAcao()}
            </div>
        </div>
    );
};

export default ModalEvento;