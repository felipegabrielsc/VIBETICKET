import React, { useState, useEffect } from 'react';
import '../../styles/CriarEventos.css';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { MdAddPhotoAlternate } from 'react-icons/md';
import { GoAlertFill } from "react-icons/go";
import { FaTrashAlt } from "react-icons/fa";
import { ImExit } from "react-icons/im";
import { IoSend } from "react-icons/io5";
import { useAuth } from '../../Hook/AuthContext';
import logo from '../../assets/logo.png';

export default function EditarEvento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const apiUrl = process.env.REACT_APP_API_URL;

  const [etapaAtual, setEtapaAtual] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erros, setErros] = useState<{ [key: string]: string }>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalSucessoAberto, setModalSucessoAberto] = useState(false);

  // ESTADOS DO FORMULÁRIO
  const [nomeEvento, setNomeEvento] = useState('');
  const [categoriaEvento, setCategoriaEvento] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [descricao, setDescricao] = useState('');
  const [imageBanner, setImageBanner] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);

  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [bairro, setBairro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [linkMaps, setLinkMaps] = useState('');

  const [dataInicio, setDataInicio] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaTermino, setHoraTermino] = useState('');

  const [dataInicioVendas, setDataInicioVendas] = useState('');
  const [dataFimVendas, setDataFimVendas] = useState('');

  // ESTADOS DE LOTES (Novo Padrão)
  const [lotes, setLotes] = useState<any[]>([
    { nome: '1º Lote', valorInteira: '', valorMeia: '', quantidadeInteira: '', quantidadeMeia: '' }
  ]);
  const [temMeia, setTemMeia] = useState(false);

  const [_termosAceitos, setTermosAceitos] = useState(false);
  const [perfilCompleto, setPerfilCompleto] = useState(false);
  const [perfilCarregado, setPerfilCarregado] = useState(false);

  // --- Função para remover a taxa de 7% e mostrar o valor base --- //
  const reverterTaxa = (valorFinal: number) => {
    if (!valorFinal) return '0,00';
    return (valorFinal / 1.07).toFixed(2).replace('.', ',');
  };

  // --- Função para aplicar os 7% de taxa da VibeTicket --- //
  const calcularValorComTaxa = (valor: string) => {
    const num = parseFloat(valor.replace(',', '.'));
    if (isNaN(num) || num <= 0) return 0;
    return num * 1.07;
  };

  useEffect(() => {
    const fetchEvento = async () => {
      if (!id) {
        setErrorMessage('Evento não encontrado.');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/api/eventos/${id}`);
        const data = response.data;

        setNomeEvento(data.nome);
        setCategoriaEvento(data.categoria);
        setDescricao(data.descricao);
        setCep(data.cep);
        setRua(data.rua);
        setBairro(data.bairro);
        setNumero(data.numero);
        setComplemento(data.complemento || '');
        setCidade(data.cidade);
        setEstado(data.estado);
        setLinkMaps(data.linkMaps);
        setDataInicio(data.dataInicio);
        setHoraInicio(data.horaInicio);
        setHoraTermino(data.horaTermino);

        setDataInicioVendas(data.dataInicioVendas || '');
        setDataFimVendas(data.dataFimVendas || '');

        // Configurando os lotes com a engenharia reversa da taxa
        setTemMeia(data.temMeia || false);
        if (data.lotes && data.lotes.length > 0) {
          setLotes(data.lotes.map((l: any) => ({
            nome: l.nome,
            valorInteira: reverterTaxa(l.valorInteira),
            valorMeia: reverterTaxa(l.valorMeia),
            quantidadeInteira: l.quantidadeInteira.toString(),
            quantidadeMeia: l.quantidadeMeia.toString()
          })));
        }

        setTermosAceitos(true);

        if (data.imagem) setImagePreviewUrl(`${apiUrl}/uploads/${data.imagem}`);
        if (data.imagemDescricao) setBannerPreviewUrl(`${apiUrl}/uploads/${data.imagemDescricao}`);

      } catch (error: any) {
        setErrorMessage(error.response?.data?.message || 'Erro ao carregar evento');
      } finally {
        setLoading(false);
      }
    };
    fetchEvento();
  }, [id, apiUrl]);

  useEffect(() => {
    if (user && user._id) {
      const verificarPerfil = async () => {
        try {
          const response = await api.get(`/api/perfil/${user._id}`);
          const p = response.data;
          const dadosPessoaisOK = p.tipoPessoa === 'cpf' && p.dadosPessoais?.cpf;
          const dadosOrgOK = p.tipoPessoa === 'cnpj' && p.dadosPessoais?.cnpj;
          if ((dadosPessoaisOK || dadosOrgOK) && !!p.mercadoPagoAccountId) {
            setPerfilCompleto(true);
          }
        } catch (error) {
          setPerfilCompleto(false);
        } finally {
          setPerfilCarregado(true);
        }
      };
      verificarPerfil();
    } else if (!isAuthLoading) {
      setPerfilCarregado(true);
    }
  }, [user, isAuthLoading]);

  // FUNÇÕES DE MANIPULAÇÃO DOS LOTES
  const adicionarLote = () => setLotes([...lotes, { nome: `${lotes.length + 1}º Lote`, valorInteira: '', valorMeia: '', quantidadeInteira: '', quantidadeMeia: '' }]);
  const removerLote = (index: number) => { if (lotes.length > 1) setLotes(lotes.filter((_, i) => i !== index)); };
  const atualizarLote = (index: number, campo: string, valor: string) => {
    const novosLotes = [...lotes];
    novosLotes[index][campo] = valor;
    setLotes(novosLotes);
  };

  const getError = (fieldName: string) => erros[fieldName];
  const handleProximaEtapa = () => { if (validarEtapa(etapaAtual)) { setEtapaAtual(p => p + 1); window.scrollTo(0, 0); } };
  const etapaAnterior = () => { setEtapaAtual(p => p - 1); window.scrollTo(0, 0); };

  const validarEtapa = (etapa: number) => {
    const novosErros: { [key: string]: string } = {};
    switch (etapa) {
      case 1:
        if (!nomeEvento) novosErros.nomeEvento = 'Obrigatório.';
        if (!categoriaEvento) novosErros.categoriaEvento = 'Obrigatório.';
        break;
      case 2:
        if (!descricao.trim()) novosErros.descricao = 'Obrigatório.';
        break;
      case 3:
        if (!cep) novosErros.cep = 'Obrigatório.';
        if (!numero) novosErros.numero = 'Obrigatório.';
        if (!linkMaps) novosErros.linkMaps = 'Obrigatório.';
        break;
      case 4:
        if (!dataInicio) novosErros.dataInicio = 'Obrigatório.';
        if (!horaInicio) novosErros.horaInicio = 'Obrigatório.';
        if (!horaTermino) novosErros.horaTermino = 'Obrigatório.';
        break;
      case 5:
        // 🔥 Validação das Datas de Venda
        if (!dataInicioVendas) {
          novosErros.dataInicioVendas = 'A data de início das vendas é obrigatória.';
        } else if (dataInicio) {
          const inicioVendasObj = new Date(dataInicioVendas + 'T00:00:00');
          const dataEventoObj = new Date(dataInicio + 'T00:00:00');
          if (inicioVendasObj > dataEventoObj) {
            novosErros.dataInicioVendas = 'O início das vendas não pode ser depois do evento.';
          }
        }

        if (!dataFimVendas) {
          novosErros.dataFimVendas = 'A data de fim das vendas é obrigatória.';
        } else {
          const fimVendasObj = new Date(dataFimVendas + 'T00:00:00');
          const inicioVendasObj = dataInicioVendas ? new Date(dataInicioVendas + 'T00:00:00') : null;
          const dataEventoObj = dataInicio ? new Date(dataInicio + 'T00:00:00') : null;

          if (inicioVendasObj && fimVendasObj < inicioVendasObj) {
            novosErros.dataFimVendas = 'O fim das vendas não pode ser antes do início.';
          }
          if (dataEventoObj && fimVendasObj > dataEventoObj) {
            novosErros.dataFimVendas = 'O fim das vendas não pode ser depois do evento.';
          }
        }

        lotes.forEach((lote, index) => {
          const vI = parseFloat(lote.valorInteira.replace(',', '.'));
          const qI = parseInt(lote.quantidadeInteira);
          if (!lote.nome) novosErros[`loteNome_${index}`] = 'Obrigatório';
          if (isNaN(vI) || vI <= 0) novosErros[`valorInteira_${index}`] = 'Inválido';
          if (isNaN(qI) || qI <= 0) novosErros[`qtdInteira_${index}`] = 'Inválido';
          if (temMeia) {
            const vM = parseFloat(lote.valorMeia.replace(',', '.'));
            const qM = parseInt(lote.quantidadeMeia);
            if (isNaN(vM) || vM <= 0) novosErros[`valorMeia_${index}`] = 'Inválido';
            if (isNaN(qM) || qM <= 0) novosErros[`qtdMeia_${index}`] = 'Inválido';
          }
        });
        break;
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleEnviarEdicao = async () => {
    if (!validarEtapa(1) || !validarEtapa(2) || !validarEtapa(3) || !validarEtapa(4) || !validarEtapa(5)) return alert("Corrija os erros nas etapas.");
    setSaving(true);

    const formData = new FormData();
    formData.append("nome", nomeEvento);
    formData.append("categoria", categoriaEvento);
    formData.append("descricao", descricao);
    formData.append("cep", cep.replace(/\D/g, ''));
    formData.append("rua", rua);
    formData.append("bairro", bairro);
    formData.append("numero", numero);
    formData.append("complemento", complemento);
    formData.append("cidade", cidade);
    formData.append("estado", estado);
    formData.append("linkMaps", linkMaps);
    formData.append("dataInicio", dataInicio);
    formData.append("horaInicio", horaInicio);
    formData.append("horaTermino", horaTermino);

    formData.append("dataInicioVendas", dataInicioVendas);
    formData.append("dataFimVendas", dataFimVendas);

    formData.append("temMeia", temMeia ? 'true' : 'false');

    formData.append("lotes", JSON.stringify(lotes.map(l => ({
      nome: l.nome,
      valorInteira: calcularValorComTaxa(l.valorInteira),
      valorMeia: temMeia ? calcularValorComTaxa(l.valorMeia) : 0,
      quantidadeInteira: parseInt(l.quantidadeInteira),
      quantidadeMeia: temMeia ? parseInt(l.quantidadeMeia) : 0
    }))));

    if (image) formData.append('imagem', image);
    if (imageBanner) formData.append("imagemDescricao", imageBanner);

    try {
      await api.put(`/api/eventos/${id}/editar`, formData);
      setModalSucessoAberto(true);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao editar evento');
    } finally {
      setSaving(false);
    }
  };

  if (loading || isAuthLoading || (user && !perfilCarregado)) return <div className="loading">Carregando...</div>;
  if (errorMessage) return <div className="error-message">{errorMessage}</div>;

  return (
    <div>
      <header className="criar-evento-header">
        <div className="criar-juntos">
          <Link to="/meus-eventos"><img src={logo} alt="Logo" className="duvidas-header-logo" /></Link>
          <hr className="duvidas-hr" />
          <h1 className="criar-titulo">Editar <span className="criar-dubtitle">evento</span></h1>
        </div>
        <div className="criar-header-botoes">
          <button className="btn-salvar-sair" onClick={() => setModalAberto(true)}><ImExit />Sair</button>
        </div>
      </header>

      {modalAberto && (
        <div className="criar-modal-overlay">
          <div className="criar-modal-content">
            <h2>Tem certeza que deseja sair?</h2>
            <p>Todo o progresso não salvo será perdido.</p>
            <div className="criar-modal-botoes">
              <button onClick={() => setModalAberto(false)} className="criar-modal-btn-cancelar">Não, continuar</button>
              <button onClick={() => navigate('/meus-eventos')} className="criar-modal-btn-confirmar">Sim, quero sair</button>
            </div>
          </div>
        </div>
      )}

      <div className="criar-form">
        {perfilCarregado && !perfilCompleto && (
          <div className="alerta-amarelo">
            <GoAlertFill /> <strong>Atenção:</strong> Complete seu perfil para receber pagamentos.
          </div>
        )}

        {/* ETAPA 1 */}
        {etapaAtual === 1 && (
          <div className="informacoes-basicas-container">
            <div className="criar-Informaçao"><h2>1. Informações básicas</h2></div>
            <div className="campo">
              <label>Nome do evento *</label>
              <input type="text" className={`perfil-input ${getError('nomeEvento') ? 'erro-campo' : ''}`} value={nomeEvento} onChange={(e) => setNomeEvento(e.target.value)} />
            </div>
            <div className="campo">
              <label>Imagem do evento</label>
              <div className="upload-imagem">
                <input type="file" className="input-file" onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setImage(e.target.files[0]);
                    setImagePreviewUrl(URL.createObjectURL(e.target.files[0]));
                  }
                }} accept="image/*" />
                {imagePreviewUrl ? (
                  <div className="image-preview-container">
                    <img src={imagePreviewUrl} alt="Preview" className="image-preview" />
                    <button className="remove-image-button" onClick={(e) => { e.preventDefault(); setImage(null); setImagePreviewUrl(null); }}><FaTrashAlt /></button>
                  </div>
                ) : (
                  <label className="upload-placeholder"><MdAddPhotoAlternate size={55} /><p>Clique para adicionar imagem</p></label>
                )}
              </div>
            </div>
            <div className="campo">
              <label>Categoria do evento *</label>
              <select className={`perfil-input ${getError('categoriaEvento') ? 'erro-campo' : ''}`} value={categoriaEvento} onChange={(e) => setCategoriaEvento(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="Rock">Rock</option>
                <option value="Pop">Pop</option>
                <option value="Funk">Funk</option>
                <option value="Rap">Rap</option>
                <option value="Eletrônica">Eletrônica</option>
              </select>
            </div>
          </div>
        )}

        {/* ETAPA 2 */}
        {etapaAtual === 2 && (
          <div className="informacoes-basicas-container">
            <div className="criar-Informaçao"><h2>2. Conteúdo do Evento</h2></div>
            <div className="campo">
              <label>Descrição Detalhada *</label>
              <textarea className={`perfil-input ${getError('descricao') ? 'erro-campo' : ''}`} value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={12} style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', resize: 'vertical' }} />
            </div>
            <div className="campo">
              <label>Banner Complementar (Opcional)</label>
              <div className="upload-container" onClick={() => document.getElementById('banner-input')?.click()}>
                {bannerPreviewUrl ? (
                  <div className="image-preview-container">
                    <img src={bannerPreviewUrl} alt="Banner" className="image-preview" style={{ maxHeight: "150px" }} />
                  </div>
                ) : (
                  <div className="upload-placeholder"><MdAddPhotoAlternate size={40} /><span>Adicionar banner</span></div>
                )}
                <input id="banner-input" type="file" hidden onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setImageBanner(e.target.files[0]);
                    setBannerPreviewUrl(URL.createObjectURL(e.target.files[0]));
                  }
                }} accept="image/*" />
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 3 */}
        {etapaAtual === 3 && (
          <div className="informacoes-basicas-container">
            <div className="criar-Informaçao"><h2>3. Localização</h2></div>
            <div className="campo"><label>CEP *</label><input type="text" className="perfil-input" value={cep} onChange={(e) => setCep(e.target.value)} /></div>
            <div className="campo"><label>Rua</label><input type="text" className="input-readonly" value={rua} readOnly /></div>
            <div className="campo"><label>Número *</label><input type="text" className="perfil-input" value={numero} onChange={(e) => setNumero(e.target.value)} /></div>
            <div className="campo"><label>Link do Maps (Iframe) *</label><input type="text" className="perfil-input" value={linkMaps} onChange={(e) => setLinkMaps(e.target.value)} /></div>
          </div>
        )}

        {/* ETAPA 4 */}
        {etapaAtual === 4 && (
          <div className="informacoes-basicas-container">
            <div className="criar-Informaçao"><h2>4. Cronograma</h2></div>
            <div className="perfil-form-grid">
              <div className="campo"><label>Data do Evento *</label><input type="date" className="perfil-input" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /></div>
              <div className="campo"><label>Hora de Início *</label><input type="time" className="perfil-input" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} /></div>
              <div className="campo"><label>Hora de Término *</label><input type="time" className="perfil-input" value={horaTermino} onChange={(e) => setHoraTermino(e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* ETAPA 5 */}
        {etapaAtual === 5 && (
          <div className="informacoes-basicas-container">
            <div className="criar-Informaçao">
              <h2>Ingressos e Lotes</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <label className="toggle-meia-wrapper">
                  <input
                    type="checkbox"
                    className="toggle-meia-input"
                    checked={temMeia}
                    onChange={(e) => setTemMeia(e.target.checked)}
                  />
                  <span className="toggle-meia-texto">Habilitar Meia-Entrada em todos os lotes</span>
                </label>
              </div>
            </div>

            {/* 🔥 AS DATAS DE VENDA VOLTARAM AQUI */}
            <div className="campos-horizontais" style={{ marginTop: '25px', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px dashed #eee' }}>
              <div className="campo">
                <label>Início das Vendas <span className="erro-asterisco">*</span></label>
                <input
                  type="date"
                  className={`perfil-input ${getError('dataInicioVendas') ? 'erro-campo' : ''}`}
                  value={dataInicioVendas}
                  onChange={(e) => setDataInicioVendas(e.target.value)}
                />
                {getError('dataInicioVendas') && <span className="mensagem-erro">{getError('dataInicioVendas')}</span>}
              </div>
              <div className="campo">
                <label>Fim das Vendas <span className="erro-asterisco">*</span></label>
                <input
                  type="date"
                  className={`perfil-input ${getError('dataFimVendas') ? 'erro-campo' : ''}`}
                  value={dataFimVendas}
                  onChange={(e) => setDataFimVendas(e.target.value)}
                />
                {getError('dataFimVendas') && <span className="mensagem-erro">{getError('dataFimVendas')}</span>}
              </div>
            </div>

            {lotes.map((lote, index) => (
              <div key={index} className="lote-card-cadastro" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '10px', marginBottom: '20px', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <input className="perfil-input" style={{ fontWeight: 'bold', width: '70%' }} value={lote.nome} onChange={(e) => atualizarLote(index, 'nome', e.target.value)} placeholder="Nome do Lote" />
                  {index > 0 && (<button type="button" onClick={() => removerLote(index)} style={{ color: '#e74c3c', border: 'none', background: 'none', cursor: 'pointer' }}><FaTrashAlt /> Remover</button>)}
                </div>
                <div className="perfil-form-grid">
                  <div className="campo">
                    <label>Preço Base Inteira (R$)</label>
                    <input className="perfil-input" value={lote.valorInteira} onChange={(e) => atualizarLote(index, 'valorInteira', e.target.value)} />
                    {lote.valorInteira && (
                      <span style={{ display: 'block', marginTop: '5px', fontSize: '0.8rem', color: '#6c757d' }}>Valor p/ comprador: <strong style={{ color: '#0969fb' }}>R$ {calcularValorComTaxa(lote.valorInteira).toFixed(2).replace('.', ',')}</strong> (7% taxa)</span>
                    )}
                  </div>
                  <div className="campo"><label>Qtd. Inteira</label><input className="perfil-input" type="number" value={lote.quantidadeInteira} onChange={(e) => atualizarLote(index, 'quantidadeInteira', e.target.value)} /></div>
                  {temMeia && (
                    <>
                      <div className="campo">
                        <label>Preço Base Meia (R$)</label>
                        <input className="perfil-input" value={lote.valorMeia} onChange={(e) => atualizarLote(index, 'valorMeia', e.target.value)} />
                        {lote.valorMeia && (
                          <span style={{ display: 'block', marginTop: '5px', fontSize: '0.8rem', color: '#6c757d' }}>Valor p/ comprador: <strong style={{ color: '#0969fb' }}>R$ {calcularValorComTaxa(lote.valorMeia).toFixed(2).replace('.', ',')}</strong> (7% taxa)</span>
                        )}
                      </div>
                      <div className="campo"><label>Qtd. Meia</label><input className="perfil-input" type="number" value={lote.quantidadeMeia} onChange={(e) => atualizarLote(index, 'quantidadeMeia', e.target.value)} /></div>
                    </>
                  )}
                </div>
              </div>
            ))}
            <button type="button" onClick={adicionarLote} className="btn-adicionar-lote-dotted" style={{ width: '100%', padding: '12px', border: '2px dashed #0969fb', borderRadius: '8px', color: '#0969fb', background: 'transparent', fontWeight: 'bold', cursor: 'pointer' }}>
              + Adicionar Lote
            </button>
          </div>
        )}

        <div className="navegacao-etapas">
          {etapaAtual > 1 && <button className="btn-anterior" onClick={etapaAnterior}>Voltar</button>}
          {etapaAtual < 5 && <button className="btn-proximo" onClick={handleProximaEtapa}>Próxima Etapa</button>}
          {etapaAtual === 5 && (
            <button className="criar-btn-enviar" onClick={handleEnviarEdicao} disabled={saving}>
              {saving ? 'Salvando...' : 'Enviar para reanálise'} <IoSend />
            </button>
          )}
        </div>

        {modalSucessoAberto && (
          <div className="editarEvento-modal-overlay">
            <div className="editarEvento-modal">
              <div className="editarEvento-modal-content">
                <div className="editarEvento-modal-icon">✓</div>
                <h3 className="editarEvento-modal-title">Editado com sucesso!</h3>
                <p className="editarEvento-modal-message">Seu evento foi para reanálise e logo estará disponível.</p>
                <button className="editarEvento-modal-btn-entendi" onClick={() => navigate('/meus-eventos')}>Entendi</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}