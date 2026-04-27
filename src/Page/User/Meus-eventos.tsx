// Meus-eventos.tsx (com sistema de pesquisa) - ORGANIZADO
import React, { useState, useEffect, useCallback } from "react";
import "../../styles/MeusEventos.css";
import { FaEye, FaPencilAlt, FaPlus, FaSearch } from "react-icons/fa";
import { IoTrashBin } from "react-icons/io5";
import { MdEvent } from "react-icons/md";
import { Link } from "react-router-dom";
import ModalAviso from "../../components/sections/User/ModalAviso/ModalAviso";
import ModalDetalhesEvento from "../../components/sections/Adm/ModalDetalhesEvento/ModalDetalhesEvento";
import VoltarParaInicio from "../../components/layout/VoltarParaInicio/VoltarParaInicio";

import api from "../../services/api";

import logo from "../../assets/SVGs/img-noEvent.svg";

// TIPAGENS 
type Evento = {
  _id: string;
  nome: string;
  status: "aprovado" | "rejeitado" | "em_analise" | "em_reanalise" | "finalizado";
};

type FiltroStatus = "todos" | "aprovado" | "rejeitado" | "em_analise" | "em_reanalise" | "finalizado";


const MeusEventos = () => {

  // ESTADOS
  const [modalAberta, setModalAberta] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<string | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventosFiltrados, setEventosFiltrados] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para pesquisa e filtros
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");

  // Estados para deleção
  const [isDeleting, setIsDeleting] = useState(false);
  const [eventoParaDeletar, setEventoParaDeletar] = useState<string | null>(null);
  const [modalConfirmOpen, setModalConfirmOpen] = useState(false);

  // Estados para modais de aviso
  const [modalAvisoOpen, setModalAvisoOpen] = useState(false);
  const [modalAvisoMensagem, setModalAvisoMensagem] = useState({ title: '', message: '' });


  // EFFECTS E INICIALIZAÇÕES
  // --- Busca os eventos do usuário logado --- //
  const fetchMeusEventos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Olha a mágica: O Axios cuida do Cookie automaticamente. Nada de localStorage!
      const response = await api.get('/api/eventos/meus-eventos');

      setEventos(response.data);
      setEventosFiltrados(response.data);

    } catch (err: any) {
      console.error('Erro ao buscar eventos:', err);
      // O interceptor do api.ts já vai redirecionar para login se for erro 401.
      // Aqui só tratamos erros comuns de tela.
      setError(err.response?.data?.message || 'Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Aplica os filtros de pesquisa e status --- //
  const aplicarFiltros = useCallback(() => {
    let eventosFiltrados = eventos;

    // Filtro por termo de pesquisa (nome)
    if (termoPesquisa.trim() !== "") {
      eventosFiltrados = eventosFiltrados.filter(evento =>
        evento.nome.toLowerCase().includes(termoPesquisa.toLowerCase())
      );
    }

    // Filtro por status
    if (filtroStatus !== "todos") {
      eventosFiltrados = eventosFiltrados.filter(evento => evento.status === filtroStatus);
    }

    setEventosFiltrados(eventosFiltrados);
  }, [eventos, termoPesquisa, filtroStatus]);

  // --- Effect para aplicar filtros --- //
  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  // --- Effect para buscar eventos --- //
  useEffect(() => {
    fetchMeusEventos();
  }, [fetchMeusEventos]);


  //  FUNÇÕES DE FILTRO E PESQUISA
  // --- Handler para mudança no termo de pesquisa --- //
  const handlePesquisaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermoPesquisa(e.target.value);
  };

  // --- Handler para mudança no filtro de status --- //
  const handleFiltroStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroStatus(e.target.value as FiltroStatus);
  };

  // --- Limpa todos os filtros --- //
  const limparFiltros = () => {
    setTermoPesquisa("");
    setFiltroStatus("todos");
  };


  // FUNÇÕES DE DELEÇÃO
  // --- Abre modal de confirmação para deletar evento --- //
  const handleAbrirConfirmacaoDelete = (eventoId: string) => {
    setEventoParaDeletar(eventoId);
    setModalConfirmOpen(true);
  };

  // --- Confirma e executa a deleção do evento --- //
  const handleConfirmarDelete = useCallback(async () => {
    if (!eventoParaDeletar) return;
    setIsDeleting(true);

    try {
      // Axios mandando o DELETE com o Cookie automaticamente
      await api.delete(`/api/eventos/${eventoParaDeletar}`);

      // Sucesso
      setEventos(prevEventos => prevEventos.filter(evento => evento._id !== eventoParaDeletar));
      setModalConfirmOpen(false);
      setEventoParaDeletar(null);

    } catch (err: any) {
      setModalAvisoMensagem({
        title: 'Operação Falhou',
        message: err.response?.data?.message || 'Ocorreu um erro desconhecido.'
      });
      setModalAvisoOpen(true);
      setModalConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }, [eventoParaDeletar]);


  // FUNÇÕES DE MODAIS 
  // --- Abre modal de detalhes do evento --- //
  const abrirModalDetalhes = (eventoId: string) => {
    setEventoSelecionado(eventoId);
    setModalAberta(true);
  };

  // RENDERIZAÇÃO DE ESTADOS DE CARREGAMENTO 
  if (loading) {
    return (
      <div className="meus-ingressos-container">
        <div className="loading">Carregando eventos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meus-ingressos-container">
        <div className="error">
          <h3>Erro ao carregar eventos</h3>
          <p>{error}</p>
          <button
            onClick={fetchMeusEventos}
            style={{ marginTop: '10px', padding: '8px 16px' }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className="meus-eventos-container">

        {/* ============ SIDEBAR ============ */}
        <aside className="meus-eventos-sidebar">
          <nav>
            <button className="meus-eventos-nav-btn meus-eventos-active">
              <MdEvent /> Meus Eventos
            </button>
            <Link to="/CriarEventos" className="meus-eventos-nav-btn">
              <FaPlus /> Crie seu evento
            </Link>
          </nav>
        </aside>

        {/* ============ CONTEÚDO PRINCIPAL ============ */}
        <main className="meus-eventos-content">
          <VoltarParaInicio />

          {/* Header */}
          <header className="meus-eventos-header">
            <h2 className="meus-eventos-titulo">Meus Eventos</h2>
          </header>

          {/* ============ CARDS DE RESUMO ============ */}
          <section className="meus-eventos-resumo">
            <div className="meus-eventos-card">
              <h3>Total</h3>
              <p>{eventos.length}</p>
            </div>
            <div className="meus-eventos-card meus-eventos-card--aprovado">
              <h3>Aprovados</h3>
              <p>{eventos.filter(e => e.status === "aprovado").length}</p>
            </div>
            <div className="meus-eventos-card meus-eventos-card--em_analise">
              <h3>Em Análise</h3>
              <p>{eventos.filter(e => e.status === "em_analise").length}</p>
            </div>
            <div className="meus-eventos-card meus-eventos-card--rejeitado">
              <h3>Rejeitados</h3>
              <p>{eventos.filter(e => e.status === "rejeitado").length}</p>
            </div>
            <div className="meus-eventos-card meus-eventos-card--em_reanalise">
              <h3>Em Reanálise</h3>
              <p>{eventos.filter(e => e.status === "em_reanalise").length}</p>
            </div>
          </section>

          {/* ============ SISTEMA DE PESQUISA E FILTROS ============ */}
          <div className="meus-eventos-pesquisa-container">
            <div className="meus-eventos-pesquisa-input-group">
              <div className="meus-eventos-pesquisa-wrapper">
                <FaSearch className="meus-eventos-pesquisa-icon" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome do evento..."
                  value={termoPesquisa}
                  onChange={handlePesquisaChange}
                  className="meus-eventos-pesquisa-input"
                />
              </div>

              <select
                value={filtroStatus}
                onChange={handleFiltroStatusChange}
                className="meus-eventos-filtro-select"
              >
                <option value="todos">Todos os status</option>
                <option value="aprovado">Aprovados</option>
                <option value="em_analise">Em Análise</option>
                <option value="em_reanalise">Em Reanálise</option>
                <option value="rejeitado">Rejeitados</option>
                <option value="finalizado">Finalizados</option>
              </select>

              {(termoPesquisa || filtroStatus !== "todos") && (
                <button
                  onClick={limparFiltros}
                  className="meus-eventos-limpar-filtros"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            {/* Contador de resultados */}
            <div className="meus-eventos-resultados-info">
              {eventosFiltrados.length === eventos.length ? (
                <span>Mostrando todos os {eventos.length} eventos</span>
              ) : (
                <span>
                  Mostrando {eventosFiltrados.length} de {eventos.length} eventos
                  {(termoPesquisa || filtroStatus !== "todos") && " filtrados"}
                </span>
              )}
            </div>
          </div>

          {/* ============ TABELA DE EVENTOS ============ */}
          <table className="meus-ingressos-event-table">
            <thead>
              <tr>
                <th>#</th>
                <th>NOME</th>
                <th>AÇÕES</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {eventosFiltrados.map((evento, index) => {

                // 🔥 REGRA DE NEGÓCIO: Define quais status bloqueiam as ações
                // No futuro, se quiser bloquear edição de eventos aprovados, mude para:
                // const isBloqueado = evento.status === "finalizado" || evento.status === "aprovado";
                const isBloqueado = evento.status === "finalizado";

                return (
                  <tr key={evento._id}>
                    <td>{index + 1}</td>
                    <td>{evento.nome}</td>
                    <td className="meus-ingressos-acoes">
                      {/* Visualizar (Sempre liberado) */}
                      <button
                        className="meus-ingressos-acao-btn"
                        title={isBloqueado ? "Visualização bloqueada para este status" : "Visualizar"}
                        onClick={() => abrirModalDetalhes(evento._id)}
                        disabled={isBloqueado}
                        style={{ opacity: isBloqueado ? 0.4 : 1, cursor: isBloqueado ? 'not-allowed' : 'pointer' }}
                      >
                        <FaEye size={18} />
                      </button>

                      {/* Editar (Condicional) */}
                      {isBloqueado ? (
                        <button
                          className="meus-ingressos-acao-btn"
                          title="Edição bloqueada para este status"
                          disabled
                          style={{ opacity: 0.4, cursor: 'not-allowed' }}
                        >
                          <FaPencilAlt size={16} />
                        </button>
                      ) : (
                        <Link
                          to={`/editar-evento/${evento._id}`}
                          className="meus-ingressos-acao-btn"
                          title="Editar"
                        >
                          <FaPencilAlt size={16} />
                        </Link>
                      )}

                      {/* Deletar (Condicional) */}
                      <button
                        className="meus-ingressos-acao-btn"
                        title={isBloqueado ? "Exclusão bloqueada para este status" : "Deletar"}
                        onClick={() => handleAbrirConfirmacaoDelete(evento._id)}
                        disabled={isBloqueado}
                        style={{ opacity: isBloqueado ? 0.4 : 1, cursor: isBloqueado ? 'not-allowed' : 'pointer' }}
                      >
                        <IoTrashBin size={18} />
                      </button>
                    </td>
                    <td className={`meus-ingressos-status meus-ingressos-status--${evento.status}`}>
                      {evento.status === "em_analise" ? "Em Análise" :
                        evento.status === "aprovado" ? "Aprovado" :
                          evento.status === "rejeitado" ? "Rejeitado" :
                            evento.status === "finalizado" ? "Finalizado" : "Em Reanálise"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ============ MENSAGEM SEM EVENTOS ============ */}
          {eventosFiltrados.length === 0 && (
            <div className="no-events">
              <img src={logo} alt="Nenhum evento encontrado" className="no-events-logo" />
              <p>
                {eventos.length === 0
                  ? "Você ainda não criou nenhum evento."
                  : "Nenhum evento encontrado com os filtros aplicados."
                }
              </p>
            </div>
          )}
        </main>

        {/* ============ MODAIS ============ */}
        <ModalDetalhesEvento
          eventoId={eventoSelecionado || ''}
          isOpen={modalAberta}
          onClose={() => setModalAberta(false)}
        />

        {/* Modal de Confirmação de Exclusão */}
        <ModalAviso
          isOpen={modalConfirmOpen}
          onClose={() => setModalConfirmOpen(false)}
          onConfirm={handleConfirmarDelete}
          type="confirmacao"
          theme="info"
          title="Confirmar Exclusão"
          labelConfirmar="Excluir"
          isLoading={isDeleting}
        >
          <p>Tem certeza que deseja excluir este evento?</p>
          <p style={{ fontWeight: 'bold', color: '#c0392b' }}>
            Esta ação não pode ser desfeita.
          </p>
        </ModalAviso>

        {/* Modal de Aviso (Erros) */}
        <ModalAviso
          isOpen={modalAvisoOpen}
          onClose={() => setModalAvisoOpen(false)}
          type="aviso"
          theme="perigo"
          title={modalAvisoMensagem.title}
        >
          <p>{modalAvisoMensagem.message}</p>
        </ModalAviso>
      </div>
    </>
  );
};

export default MeusEventos;