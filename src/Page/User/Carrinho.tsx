import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiPlus, FiMinus, FiArrowLeft } from 'react-icons/fi';
import "../../styles/Carrinho.css";
import { CarrinhoItem } from '../../types/carrinho';
import { CarrinhoService } from '../../services/carrinhoService';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { useAuth } from '../../Hook/AuthContext';
import { useCart } from '../../Hook/CartContext';
import LogoMP from "../../assets/SVGs/Logo_MP.svg";
import VoltarParaInicio from '../../components/layout/VoltarParaInicio/VoltarParaInicio';
import noCart from "../../assets/SVGs/img-noIngresso.svg"

import api from '../../services/api';


const Carrinho = () => {
  // ===========================================================================
  // HOOKS E CONTEXTOS
  // ===========================================================================
  const { user } = useAuth();
  const { cartItems, updateItemQuantity, removeItemFromCart, refreshCart } = useCart();
  const navigate = useNavigate();

  // ===========================================================================
  // ESTADOS
  // ===========================================================================
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>(cartItems);
  const [isLoading, setIsLoading] = useState(false);

  const [modalCompraSucesso, setModalCompraSucesso] = useState(false); // 🔥 NOVO ESTADO

  // ===========================================================================
  // VARIÁVEIS DE AMBIENTE
  // ===========================================================================
  const apiUrl = process.env.REACT_APP_API_URL;
  const MP_KEY_PUBLIC = process.env.MP_PUBLIC_KEY;


  // --- Inicializa o Mercado Pago com a chave pública --- //
  useEffect(() => {
    if (MP_KEY_PUBLIC) {
      initMercadoPago(MP_KEY_PUBLIC);
    }
  }, [MP_KEY_PUBLIC]);


  // --- Sincroniza o estado local com o contexto do carrinho --- //
  useEffect(() => {
    setCarrinho(cartItems);
  }, [cartItems]);


  // --- Processa o retorno do pagamento via query parameters --- //
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');

    if (status) {
      // Limpa a URL para não ficar com os parâmetros do MP aparecendo
      window.history.replaceState({}, document.title, window.location.pathname);

      if (status === 'approved') {
        // 🔥 Abre o Modal em vez de dar alert!
        setModalCompraSucesso(true);
        CarrinhoService.limparCarrinho();
        setCarrinho([]);
        refreshCart(); // Atualiza o contexto global também
      } else if (status === 'pending') {
        alert('Pagamento pendente. A compra será confirmada assim que o pagamento for processado.');
      } else if (status === 'rejected' || status === 'failure') {
        alert('Pagamento rejeitado. Por favor, tente novamente ou use outro método de pagamento.');
      }
    }
  }, [navigate, refreshCart]);

  // ===========================================================================
  // FUNÇÕES PRINCIPAIS - PAGAMENTO
  // ===========================================================================


  // --- Função principal para finalizar a compra e iniciar o pagamento --- //
  const handleFinalizarCompra = async () => {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }

    // 🔥 REMOVIDA A BUSCA PELO LOCALSTORAGE AQUI!
    if (!user || !user._id) {
      alert("Você precisa estar logado para finalizar a compra.");
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);

      // 🔥 AXIOS FAZ A MÁGICA: Envia o Cookie HttpOnly automaticamente
      const response = await api.post('/api/pagamento/iniciar-pagamento');

      // Redireciona para a página de pagamento do Mercado Pago
      window.location.href = response.data.preference_url;

    } catch (error: any) {
      console.error('Falha ao iniciar pagamento:', error);

      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 401 || status === 403) {
          alert("Sessão expirada. Por favor, faça login novamente.");
          navigate('/login');
          return;
        }

        if (status === 400 && errorData.error) {
          alert(errorData.error);
        } else if (status === 400 && errorData.message) {
          alert(errorData.message);
        } else {
          alert(`Erro ao iniciar o pagamento: ${errorData.message || 'Tente novamente.'}`);
        }
      } else {
        alert('Erro de conexão. Verifique sua rede e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ===========================================================================
  // FUNÇÕES DO CARRINHO - GERENCIAMENTO DE ITENS
  // ===========================================================================


  // --- Aumenta a quantidade de um item específico no carrinho --- //
  // --- @param id - ID do item a ser atualizado --- //
  const carrinhoAumentarQuantidade = async (id: string) => {
    const item = carrinho.find(item => item.id === id);
    if (item) {
      try {
        setIsLoading(true);
        await updateItemQuantity(id, item.quantidade + 1);
        await refreshCart();
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao aumentar quantidade');
      } finally {
        setIsLoading(false);
      }
    }
  };


  // --- Diminui a quantidade de um item específico no carrinho --- //
  // --- @param id - ID do item a ser atualizado --- //
  const carrinhoDiminuirQuantidade = async (id: string) => {
    const item = carrinho.find(item => item.id === id);
    if (item && item.quantidade > 1) {
      try {
        setIsLoading(true);
        await updateItemQuantity(id, item.quantidade - 1);
        await refreshCart();
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao diminuir quantidade');
      } finally {
        setIsLoading(false);
      }
    }
  };


  // --- Remove completamente um item do carrinho --- //
  // --- @param id - ID do item a ser removido --- //
  const carrinhoRemoverItem = async (id: string) => {
    try {
      setIsLoading(true);
      await removeItemFromCart(id);
      await refreshCart();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao remover item');
    } finally {
      setIsLoading(false);
    }
  };

  // ===========================================================================
  // FUNÇÕES AUXILIARES - CÁLCULOS E FORMATAÇÕES
  // ===========================================================================

  // --- Calcula o subtotal do carrinho (soma de todos os itens) --- // 
  const carrinhoCalcularSubtotal = () => {
    return carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  };


  // --- Calcula o total final do carrinho --- //
  const carrinhoCalcularTotal = () => {
    return carrinhoCalcularSubtotal();
  };


  // --- Calcula o total de itens no carrinho (soma das quantidades) --- //
  const getTotalItens = () => {
    return carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  };


  // --- Formata a URL da imagem do evento --- //
  // --- @param imagem - Nome da imagem ou URL completa ---// 
  const getImageUrl = (imagem: string) => {
    if (imagem.startsWith('http')) {
      return imagem;
    }
    return `${apiUrl}/uploads/${imagem}`;
  };


  // RENDERIZAÇÃO
  return (
    <div style={{ backgroundColor: "#fff" }}>
      <div className="carrinho-container">

        {/* Header da página */}
        <header className="carrinho-header">
          <h1 className="carrinho-titulo">Seu Carrinho</h1>
          <VoltarParaInicio />
        </header>

        {/* Indicador de carregamento */}
        {isLoading && (
          <div className="carrinho-loading">
            <p>Atualizando carrinho...</p>
          </div>
        )}

        {/* Main content */}
        <main className="carrinho-main">

          {/* Estado: Carrinho vazio */}
          {carrinho.length === 0 ? (
            <section className="carrinho-vazio">
              <img src={noCart} alt="carrinho-img-prop" className='carrinho-noCart' />
              <h2 className="carrinho-vazio-titulo">Seu carrinho está vazio</h2>
              <p className="carrinho-vazio-texto">Parece que você ainda não adicionou nenhum ingresso ao carrinho.</p>
              <button
                className="carrinho-btn-voltar"
                onClick={() => navigate('/eventos')}
                disabled={isLoading}
              >
                <FiArrowLeft /> Ver Eventos
              </button>
            </section>
          ) : (
            <>

              {/* Estado: Carrinho com itens */}
              <section className="carrinho-itens-section">
                <div className="carrinho-itens">
                  {carrinho.map((item) => (
                    <div key={item.id} className="carrinho-item">
                      <div className="carrinho-item-imagem">
                        <img src={getImageUrl(item.imagem)} alt={item.nomeEvento} />
                      </div>

                      <div className="carrinho-item-info">
                        <h3 className="carrinho-item-nome">{item.nomeEvento}</h3>
                        <p className="carrinho-item-meta">
                          <span className="carrinho-item-data">{item.dataEvento}</span> •
                          <span className="carrinho-item-local">{item.localEvento}</span>
                        </p>
                        <div className="carrinho-item-tipo">
                          <span>{item.tipoIngresso}</span>
                        </div>
                      </div>

                      <div className="carrinho-item-preco">
                        R$ {item.preco.toFixed(2)}
                      </div>

                      <div className="carrinho-item-quantidade">
                        <button
                          className="carrinho-item-quantidade-btn"
                          onClick={() => carrinhoDiminuirQuantidade(item.id)}
                          disabled={item.quantidade <= 1 || isLoading}
                        >
                          <FiMinus />
                        </button>
                        <span className="carrinho-item-quantidade-valor">{item.quantidade}</span>
                        <button
                          className="carrinho-item-quantidade-btn"
                          onClick={() => carrinhoAumentarQuantidade(item.id)}
                          disabled={item.quantidade >= 4 || isLoading}
                        >
                          <FiPlus />
                        </button>
                      </div>

                      <div className="carrinho-item-subtotal">
                        R$ {(item.preco * item.quantidade).toFixed(2)}
                      </div>

                      <button
                        className="carrinho-item-remover"
                        onClick={() => carrinhoRemoverItem(item.id)}
                        aria-label="Remover item"
                        disabled={isLoading}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Resumo do pedido */}
              <aside className="carrinho-resumo">
                <div className="carrinho-resumo-detalhes">
                  <h3 className="carrinho-resumo-titulo">Resumo do Pedido</h3>

                  <div className="carrinho-resumo-linha">
                    <span className="carrinho-resumo-label">Subtotal ({getTotalItens()} itens)</span>
                    <span className="carrinho-resumo-valor">R$ {carrinhoCalcularSubtotal().toFixed(2)}</span>
                  </div>

                  <div className="carrinho-resumo-linha">
                    <span className="carrinho-resumo-label">Obs: Taxas de serviço já inclusa</span>
                  </div>

                  <div className="carrinho-resumo-total">
                    <span className="carrinho-resumo-total-label">Total</span>
                    <span className="carrinho-resumo-total-valor">R$ {carrinhoCalcularTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="carrinho-resumo-acoes">
                  <button
                    className="carrinho-btn-continuar"
                    onClick={() => navigate('/eventos')}
                    disabled={isLoading}
                  >
                    <FiArrowLeft /> Continuar Comprando
                  </button>

                  <button
                    className="carrinho-btn-finalizar"
                    onClick={handleFinalizarCompra}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processando...' : 'Finalizar Compra'}
                  </button>
                </div>

                {/* Informações do Mercado Pago */}
                <footer className="mercadopago-info">
                  <p>Pagamento seguro via Mercado Pago</p>
                  <img src={LogoMP} alt="Logo do Mercado Pago" className="mercadopago-logo" />
                </footer>
              </aside>
            </>
          )}
        </main>
      </div>
      {modalCompraSucesso && (
        <div className="carrinho-modal-overlay">
          <div className="carrinho-modal-content">
            <div className="carrinho-modal-icon-sucesso">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 className="carrinho-modal-title">Pagamento Aprovado!</h2>
            <p className="carrinho-modal-message">
              Parabéns! Sua compra foi confirmada com sucesso e seus ingressos já estão garantidos.
            </p>
            <button
              className="carrinho-modal-btn-acao"
              onClick={() => navigate('/meus-ingressos')}
            >
              Ver Meus Ingressos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Carrinho;