// 📦 Importações principais e de ícones
import React, { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import "../../styles/detalhes.css";
import Footer from "../../components/layout/Footer/Footer";
import {
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaShareAlt,
    FaUserCircle,
    FaEnvelope,
    FaPhone,
    FaCheckCircle
} from "react-icons/fa";
import { IoTicket, IoTime } from "react-icons/io5";
import { FiMinus, FiPlus } from "react-icons/fi";
import { Evento } from "../../components/sections/Home/home-eventos/evento";
import { CarrinhoItem } from "../../types/carrinho";
import { useAuth } from "../../Hook/AuthContext";
import { useCart } from "../../Hook/CartContext";
import NavBar3 from "../../components/sections/Home/NavBar3/NavBar3";
import ChatBot from "../../components/sections/Chatbot/Chatbot";
import { FaPlus } from "react-icons/fa6";

// 🧱 Interfaces e Tipagens
interface CriadorUsuario {
    email: string;
    imagemPerfil: string;
    nome: string;
}

interface CriadorPerfil {
    dadosOrganizacao?: {
        nomeFantasia: string;
    };
    dadosPessoais?: {
        telefone: string;
    };
}

interface CriadorPopulado {
    _id: string;
    nome: string;
    email: string;
    imagemPerfil?: string;
}

// 🔥 Adicionada a Interface do Lote
interface Lote {
    nome: string;
    valorInteira: number;
    valorMeia: number;
    quantidadeInteira: number;
    quantidadeMeia: number;
}

// 🔥 Adicionado o campo lotes e imagemDescricao
interface EventoComCriador extends Omit<Evento, "criadoPor"> {
    criadoPor: string | CriadorPopulado;
    politicas: string[];
    lotes: Lote[];
    imagemDescricao?: string;
    quantidadeInteira: number; // Mantido por compatibilidade de aviso (fallback)
}

// 🎟️ Componente principal
const Detalhes: React.FC = () => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const { id } = useParams<{ id: string }>();
    const { state } = useLocation();

    // 🔧 Contextos globais
    const { addItemToCart } = useCart();
    const { user: authUser } = useAuth();

    const isUserAdmin = authUser && (authUser.role === 'SUPER_ADMIN' || authUser.role === 'MANAGER_SITE');

    // 🔧 Estados locais
    const [evento, setEvento] = useState<EventoComCriador | null>(
        (state as EventoComCriador) || null
    );
    const [criadorUsuario, setCriadorUsuario] = useState<CriadorUsuario | null>(null);
    const [criadorPerfil, _setCriadorPerfil] = useState<CriadorPerfil | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [eventoEncerrado, setEventoEncerrado] = useState(false);
    const [vendasEncerradas, setVendasEncerradas] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    // 🔥 NOVO ESTADO: Rastreador de quantidades por Lote e Tipo
    // O formato será: { "0-inteira": 2, "0-meia": 1, "1-inteira": 0 }
    const [quantidadesSelecionadas, setQuantidadesSelecionadas] = useState<{ [key: string]: number }>({});

    // 🕓 Verifica encerramentos
    useEffect(() => {
        if (evento) {
            const agora = new Date();
            const dataFimEvento = new Date(`${evento.dataFim}T${evento.horaTermino}`);
            if (agora > dataFimEvento) setEventoEncerrado(true);

            const dataFimVendas = new Date(
                `${evento.dataFimVendas}T${evento.horaInicio}`
            );
            if (agora > dataFimVendas) setVendasEncerradas(true);
        }
    }, [evento]);

    // 🖼️ Helper para Imagem do Perfil
    const getImagemPerfilUrl = (imagemPerfil?: string) => {
        if (!imagemPerfil) return `${apiUrl}/uploads/blank_profile.png`;
        if (imagemPerfil.startsWith("http")) return imagemPerfil;
        if (imagemPerfil.startsWith("/uploads")) return `${apiUrl}${imagemPerfil}`;
        if (imagemPerfil.includes("/")) return `${apiUrl}/${imagemPerfil}`;
        return `${apiUrl}/uploads/perfil-img/${imagemPerfil}`;
    };

    // 📅 Helper: Formatar Data para o Brasil
    const formatarDataExtenso = (dataString: string) => {
        if (!dataString) return "";
        const data = new Date(dataString + 'T12:00:00');
        if (isNaN(data.getTime())) return dataString;

        return data.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // 🔁 Atualiza imagem do criador
    useEffect(() => {
        const forceUpdateImage = async () => {
            if (!evento?.criadoPor || !authUser) return;
            try {
                const criadorId = typeof evento.criadoPor === "string" ? evento.criadoPor : (evento.criadoPor as CriadorPopulado)._id;

                if (criadorId === authUser._id) {
                    const response = await fetch(`${apiUrl}/api/users/${authUser._id}`);
                    if (response.ok) {
                        const latestUserData = await response.json();
                        if (criadorUsuario) {
                            setCriadorUsuario((prev) => ({ ...prev!, imagemPerfil: latestUserData.imagemPerfil || prev!.imagemPerfil }));
                        } else if (evento.criadoPor && typeof evento.criadoPor === "object") {
                            const criadorPopulado = evento.criadoPor as CriadorPopulado;
                            setCriadorUsuario({
                                nome: criadorPopulado.nome,
                                email: criadorPopulado.email,
                                imagemPerfil: latestUserData.imagemPerfil || criadorPopulado.imagemPerfil || "",
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Erro ao atualizar imagem:", error);
            }
        };
        const timer = setTimeout(forceUpdateImage, 500);
        return () => clearTimeout(timer);
    }, [authUser, evento?.criadoPor, apiUrl, criadorUsuario]);

    // 🔍 Busca os dados
    useEffect(() => {
        window.scrollTo(0, 0);
        const buscarDados = async () => {
            setIsLoading(true);
            try {
                const eventoResponse = await fetch(`${apiUrl}/api/eventos/publico/${id}`);
                if (!eventoResponse.ok) throw new Error("Evento não encontrado");
                const eventoData: EventoComCriador = await eventoResponse.json();
                setEvento(eventoData);

                if (eventoData.criadoPor && typeof eventoData.criadoPor === "object") {
                    const criadorPopulado = eventoData.criadoPor as CriadorPopulado;
                    setCriadorUsuario({
                        nome: criadorPopulado.nome,
                        email: criadorPopulado.email,
                        imagemPerfil: criadorPopulado.imagemPerfil || "",
                    });
                }
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
                setEvento(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) buscarDados();
    }, [id, apiUrl]);

    // 🔥 FUNÇÕES DE CARRINHO ADAPTADAS PARA LOTES
    const aumentarQtd = (key: string, limite: number) => {
        setQuantidadesSelecionadas(prev => ({
            ...prev,
            [key]: Math.min((prev[key] || 0) + 1, limite > 4 ? 4 : limite) // Máximo de 8 ingressos por pessoa
        }));
    };

    const diminuirQtd = (key: string) => {
        setQuantidadesSelecionadas(prev => ({
            ...prev,
            [key]: Math.max((prev[key] || 0) - 1, 0)
        }));
    };

    const adicionarLoteAoCarrinho = async (lote: Lote, tipo: 'Inteira' | 'Meia', loteIndex: number) => {
        const key = `${loteIndex}-${tipo.toLowerCase()}`;
        const qtd = quantidadesSelecionadas[key] || 0;
        
        if (qtd === 0) return;

        const preco = tipo === 'Inteira' ? lote.valorInteira : lote.valorMeia;

        try {
            const novoItem: CarrinhoItem = {
                id: `${evento?._id}-${loteIndex}-${tipo}-${Date.now()}`,
                eventoId: evento?._id || "",
                nomeEvento: `${evento?.nome} (${lote.nome})`, // Adiciona o Lote ao nome do Evento!
                tipoIngresso: tipo,
                preco: preco,
                quantidade: qtd,
                imagem: evento?.imagem || "",
                dataEvento: evento?.dataInicio || "",
                localEvento: `${evento?.rua}, ${evento?.numero}, ${evento?.bairro} - ${evento?.cidade}, ${evento?.estado}`,
            };

            await addItemToCart(novoItem);
            setModalMessage(`${qtd} ingresso(s) do ${lote.nome} (${tipo}) foram adicionados!`);
            setIsModalOpen(true);
            
            // Zera a quantidade daquele input após adicionar
            setQuantidadesSelecionadas(prev => ({ ...prev, [key]: 0 }));
            
        } catch (error) {
            console.error("Erro ao adicionar ao carrinho:", error);
            setModalMessage("Erro ao adicionar ingressos ao carrinho");
            setIsModalOpen(true);
        }
    };

    const calcularTotalGeral = () => {
        if (!evento?.lotes) return "0.00";
        let total = 0;
        evento.lotes.forEach((lote, index) => {
            const qtdInt = quantidadesSelecionadas[`${index}-inteira`] || 0;
            const qtdMeia = quantidadesSelecionadas[`${index}-meia`] || 0;
            total += (qtdInt * lote.valorInteira) + (qtdMeia * lote.valorMeia);
        });
        return total.toFixed(2);
    };

    const compartilharEvento = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: evento?.nome || "Evento",
                    text: `Garanta já o seu ingresso para o evento: ${evento?.nome}!`,
                    url,
                });
            } catch (err: any) {
                if (err.name !== 'AbortError') fallbackCopiarLink(url);
            }
        } else {
            fallbackCopiarLink(url);
        }
    };

    const fallbackCopiarLink = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setModalMessage("Link copiado para a área de transferência! Cole onde quiser.");
            setIsModalOpen(true);
        } catch (err) {
            prompt("Copie o link abaixo para compartilhar:", url);
        }
    };

    const getCriadorNome = () => criadorUsuario?.nome || (typeof evento?.criadoPor === "object" && evento.criadoPor.nome) || "Organizador";
    const getCriadorEmail = () => criadorUsuario?.email || (typeof evento?.criadoPor === "object" && evento.criadoPor.email) || "";
    const getCriadorImagem = () => criadorUsuario?.imagemPerfil || (typeof evento?.criadoPor === "object" && evento.criadoPor.imagemPerfil) || "";

    if (isLoading) return <div className="detalhes-container"><div style={{ padding: '120px 20px', textAlign: 'center' }}>Carregando evento...</div></div>;
    if (!evento)
        return (
            <div className="evento-nao-encontrado" style={{ padding: '120px 20px', textAlign: 'center' }}>
                <h2>Evento não encontrado!</h2>
                <p>Verifique o link ou volte à página inicial.</p>
            </div>
        );

    const imageUrl = `${apiUrl}/uploads/${evento.imagem}`;
    const bannerSecundarioUrl = evento.imagemDescricao ? `${apiUrl}/uploads/${evento.imagemDescricao}` : null;
    
    const politicasPadrao = [
        "REEMBOLSO EM ATÉ 7 DIAS APÓS A COMPRA, DESDE QUE ENVIADA 48 HORAS ANTES DO INICIO DO EVENTO",
        "INGRESSOS PODEM SER TRANSFERIDOS EM ATÉ 24 HORAS ANTES DO EVENTO",
        "É NECESSÁRIO APRESENTAR DOCUMENTO QUE COMPROVE O DIREITO AO DESCONTO NA ENTRADA",
    ];
    const politicasDoEvento = evento.politicas && evento.politicas.length > 0 ? evento.politicas : politicasPadrao;

    return (
        <>
            {isModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
                    <div className="Detalhes-modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="modal-titulo" aria-modal="true">
                        <div className="modal-header">
                            <h3 id="modal-titulo" className="modal-title">
                                <FaCheckCircle className="modal-icon" aria-hidden="true" /> Sucesso!
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="modal-close-button" aria-label="Fechar janela">&times;</button>
                        </div>
                        <div className="modal-body"><p>{modalMessage}</p></div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Continuar Vendo</button>
                            <Link to="/carrinho" className="btn btn-primary">Ir para o Carrinho</Link>
                        </div>
                    </div>
                </div>
            )}

            <div className="detalhes-container">
                <NavBar3 />

                <header className="detalhes-header" aria-labelledby="titulo-evento">
                    <div className="detalhes-header-content">
                        {/* Fallback caso lote esteja zerado mas o evento antigo tenha qtd guardada */}
                        {evento.quantidadeInteira > 0 && evento.quantidadeInteira <= 50 && (!evento.lotes || evento.lotes.length === 0) && (
                            <div className="aviso-ingressos-limitados" role="alert">
                                <strong>Restam apenas {evento.quantidadeInteira} ingressos!</strong>
                            </div>
                        )}

                        {eventoEncerrado && <div className="evento-encerrado-aviso" role="alert">Evento Encerrado</div>}

                        <div className="detalhes-info-evento">
                            <h1 id="titulo-evento" className="detalhes-titulo-evento">{evento.nome}</h1>
                            <div className="detalhes-meta-info">
                                <div className="detalhes-info-linha">
                                    <span className="detalhes-label"><FaCalendarAlt aria-hidden="true" /> Data:</span>
                                    <time dateTime={evento.dataInicio}>{formatarDataExtenso(evento.dataInicio)}</time>
                                </div>
                                <div className="detalhes-info-linha">
                                    <span className="detalhes-label"><IoTime aria-hidden="true" /> Hora:</span>
                                    <time>{evento.horaInicio} às {evento.horaTermino}</time>
                                </div>
                                <div className="detalhes-info-linha">
                                    <span className="detalhes-label"><FaMapMarkerAlt aria-hidden="true" /> Local:</span>
                                    <address style={{ fontStyle: 'normal' }}>{`${evento.rua}, ${evento.numero}, ${evento.bairro} - ${evento.cidade}, ${evento.estado}`}</address>
                                </div>
                            </div>
                            <button className="share-button" onClick={compartilharEvento} aria-label="Compartilhar evento">
                                <FaShareAlt aria-hidden="true" /> Compartilhar
                            </button>
                        </div>
                        {evento.imagem && (
                            <img src={imageUrl} alt={`Banner promocional do evento ${evento.nome}`} className="detalhes-imagem-evento" />
                        )}
                    </div>
                </header>

                <main className="detalhes-main-content">
                    
                    {/* BARRA LATERAL ESQUERDA: INGRESSOS (LOTES) */}
                    <section className="detalhes-ingressos-box" aria-labelledby="titulo-ingressos">
                        {vendasEncerradas || isUserAdmin ? (
                            <div className="vendas-encerradas-aviso" role="alert">
                                <h3><IoTicket aria-hidden="true" /> {isUserAdmin ? "Acesso Restrito" : "Vendas Encerradas"}</h3>
                                <p>{isUserAdmin ? "Administradores não compram ingressos." : "A venda de ingressos foi encerrada."}</p>
                            </div>
                        ) : (
                            <>
                                <h3 id="titulo-ingressos" className="detalhes-title-ingresso">
                                    <IoTicket aria-hidden="true" /> Ingressos
                                </h3>
                                <div className="detalhes-lotes-wrapper">
                                    
                                    {evento.lotes && evento.lotes.map((lote, index) => (
                                        <div key={index} className="lote-grupo-compacto">
                                            {/* Cabeçalho do Lote - Fino e elegante */}
                                            <div className="lote-header-mini">
                                                <span>{lote.nome}</span>
                                            </div>

                                            {/* LINHA INTEIRA */}
                                            {lote.quantidadeInteira > 0 && (
                                                <div className="ingresso-linha-compacta">
                                                    <div className="ingresso-info-tipo">
                                                        <span className="tipo-label">Inteira</span>
                                                        <span className="preco-label">R$ {lote.valorInteira.toFixed(2).replace('.', ',')}</span>
                                                    </div>
                                                    <div className="ingresso-acoes-mini">
                                                        <div className="selector-mini">
                                                            <button onClick={() => diminuirQtd(`${index}-inteira`)} disabled={!quantidadesSelecionadas[`${index}-inteira`]}><FiMinus /></button>
                                                            <span>{quantidadesSelecionadas[`${index}-inteira`] || 0}</span>
                                                            <button onClick={() => aumentarQtd(`${index}-inteira`, lote.quantidadeInteira)}><FiPlus /></button>
                                                        </div>
                                                        <button 
                                                            className="btn-add-mini" 
                                                            onClick={() => adicionarLoteAoCarrinho(lote, 'Inteira', index)} 
                                                            disabled={!quantidadesSelecionadas[`${index}-inteira`]}
                                                            title="Adicionar ao carrinho"
                                                        >
                                                            <FaPlus />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* LINHA MEIA */}
                                            {evento.temMeia && lote.quantidadeMeia > 0 && (
                                                <div className="ingresso-linha-compacta">
                                                    <div className="ingresso-info-tipo">
                                                        <span className="tipo-label">Meia</span>
                                                        <span className="preco-label">R$ {lote.valorMeia.toFixed(2).replace('.', ',')}</span>
                                                    </div>
                                                    <div className="ingresso-acoes-mini">
                                                        <div className="selector-mini">
                                                            <button onClick={() => diminuirQtd(`${index}-meia`)} disabled={!quantidadesSelecionadas[`${index}-meia`]}><FiMinus /></button>
                                                            <span>{quantidadesSelecionadas[`${index}-meia`] || 0}</span>
                                                            <button onClick={() => aumentarQtd(`${index}-meia`, lote.quantidadeMeia)}><FiPlus /></button>
                                                        </div>
                                                        <button 
                                                            className="btn-add-mini" 
                                                            onClick={() => adicionarLoteAoCarrinho(lote, 'Meia', index)} 
                                                            disabled={!quantidadesSelecionadas[`${index}-meia`]}
                                                            title="Adicionar ao carrinho"
                                                        >
                                                            <FaPlus />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {(!evento.lotes || evento.lotes.length === 0) && (
                                        <div className="sem-ingressos">Nenhum lote disponível.</div>
                                    )}
                                </div>

                                <div className="ingresso-total">
                                    <span>Total Selecionado:</span>
                                    <span className="total-valor">R$ {calcularTotalGeral().replace('.', ',')}</span>
                                </div>
                            </>
                        )}
                    </section>

                    {/* CORPO CENTRAL: DESCRIÇÃO E POLÍTICAS EMPILHADAS */}
                    <section className="detalhes-info-container">
                        
                        {/* 1. DESCRIÇÃO E BANNER */}
                        <div className="detalhes-descricao" style={{ marginBottom: '40px' }}>
                            <h2 style={{ fontSize: '1.8rem', color: 'var(--cor-texto-escuro)', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid var(--cor-fundo-cinza)' }}>
                                Sobre o Evento
                            </h2>
                            
                            {/* 🔥 Renderização do Banner de Descrição, se existir */}
                            {bannerSecundarioUrl && (
                                <div style={{ marginBottom: '25px', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--sombra-suave)' }}>
                                    <img 
                                        src={bannerSecundarioUrl} 
                                        alt="Banner descritivo do evento" 
                                        style={{ width: '100%', height: 'auto', display: 'block' }} 
                                    />
                                </div>
                            )}

                            <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '1.1rem', color: 'var(--cor-texto-medio)' }}>
                                {evento.descricao}
                            </p>
                        </div>

                        {/* 2. POLÍTICAS (Agora embaixo da descrição) */}
                        <div className="detalhes-politicas" style={{ backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '12px', border: '1px solid var(--cor-borda)' }}>
                            <h3 style={{ fontSize: '1.5rem', color: 'var(--cor-texto-escuro)', marginBottom: '20px' }}>
                                Políticas e Normas
                            </h3>
                            <ul style={{ paddingLeft: '20px', color: 'var(--cor-texto-medio)' }}>
                                {politicasDoEvento.map((p, i) => (
                                    <li key={i} style={{ marginBottom: '12px', lineHeight: '1.5' }}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    </section>

                </main>

                <section className="detalhes-bloco" aria-labelledby="titulo-mapa">
                    <h3 id="titulo-mapa" className="detalhes-titulo-mapa">
                        <FaMapMarkerAlt aria-hidden="true" /> Localização do Evento
                    </h3>
                    <div className="detalhes-container-mapa">
                        <iframe
                            title={`Mapa mostrando a localização do evento em ${evento.cidade}`}
                            src={evento.linkMaps}
                            className="detalhes-mapa"
                            allowFullScreen
                            loading="lazy"
                        ></iframe>
                    </div>
                </section>

                {(criadorUsuario || (evento.criadoPor && typeof evento.criadoPor === "object")) && (
                    <section className="organizador-container" aria-labelledby="titulo-organizador">
                        <h3 id="titulo-organizador" className="organizador-titulo">
                            <FaUserCircle aria-hidden="true" /> Informações do Organizador
                        </h3>
                        <div className="organizador-conteudo">
                            <img
                                src={getImagemPerfilUrl(getCriadorImagem())}
                                alt={`Logo do organizador ${getCriadorNome()}`}
                                className="organizador-avatar"
                                onError={(e) => ((e.target as HTMLImageElement).src = `${apiUrl}/uploads/blank_profile.png`)}
                            />
                            <div className="organizador-info">
                                <p className="organizador-nome">{getCriadorNome()}</p>
                                {getCriadorEmail() && (
                                    <p className="organizador-contato">
                                        <FaEnvelope aria-hidden="true" /> {getCriadorEmail()}
                                    </p>
                                )}
                                {criadorPerfil?.dadosPessoais?.telefone && (
                                    <p className="organizador-contato">
                                        <FaPhone aria-hidden="true" /> {criadorPerfil.dadosPessoais.telefone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </div>

            <div style={{ display: "flex", right: "20px", bottom: "30px", position: "fixed", zIndex: "1000" }}>
                <ChatBot />
            </div>

            <Footer />
        </>
    );
};

export default Detalhes;