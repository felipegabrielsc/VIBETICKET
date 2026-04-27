import { useState, useEffect } from 'react';
import '../../styles/CriarEventos.css';
import { MdAddPhotoAlternate } from 'react-icons/md';
import { ImExit } from "react-icons/im";
import { IoSend } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import Conclusao from "../../assets/img-conclusao.png"
import { useAuth } from '../../Hook/AuthContext';

import api from '../../services/api';

import { Link } from 'react-router-dom';
import { GoAlertFill } from "react-icons/go";
import { FaTrashAlt } from "react-icons/fa";

function CriarEventos() {
  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const { user, isLoading: isAuthLoading } = useAuth();

  const [etapaAtual, setEtapaAtual] = useState(1);

  // ESTADOS DO COMPONENTE
  const [nomeEvento, setNomeEvento] = useState('');
  const [categoriaEvento, setCategoriaEvento] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [descricao, setDescricao] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [bairro, setBairro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [linkMaps, setLinkMaps] = useState('');
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaTermino, setHoraTermino] = useState('');
  const [lotes, setLotes] = useState([
    { nome: '1º Lote', valorInteira: '', valorMeia: '', quantidadeInteira: '', quantidadeMeia: '' }
  ]);
  const adicionarLote = () => {
    setLotes([...lotes, { nome: `${lotes.length + 1}º Lote`, valorInteira: '', valorMeia: '', quantidadeInteira: '', quantidadeMeia: '' }]);
  };
  const removerLote = (index: number) => {
    if (lotes.length > 1) setLotes(lotes.filter((_, i) => i !== index));
  };
  const atualizarLote = (index: number, campo: string, valor: string) => {
    const novosLotes = [...lotes];
    (novosLotes[index] as any)[campo] = valor;
    setLotes(novosLotes);
  };
  const [temMeia, setTemMeia] = useState(false);
  const [dataFimVendas, setDataFimVendas] = useState('');
  const [dataInicioVendas, setDataInicioVendas] = useState('');

  // Etapa 6
  const [termosAceitos, setTermosAceitos] = useState(false);

  // Outros estados
  const [modalAberto, setModalAberto] = useState(false);
  const [erros, setErros] = useState<{ [key: string]: string }>({});
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [perfilCompleto, setPerfilCompleto] = useState(false);
  const [perfilCarregado, setPerfilCarregado] = useState(false);

  // MODAL CONCLUSÃO
  const [modalSucessoAberto, setModalSucessoAberto] = useState(false);
  const [statusPerfil, setStatusPerfil] = useState<{ ok: boolean; motivo: string | null }>({ ok: true, motivo: null });
  const [checandoPerfil, setChecandoPerfil] = useState(true);

  const [imageBanner, setImageBanner] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageBanner(file);
      setBannerPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAbrirModal = () => setModalAberto(true);
  const handleFecharModal = () => setModalAberto(false);
  const handleConfirmarSaida = () => navigate('/');
  const handleProximaEtapa = () => {
    if (validarEtapa(etapaAtual)) {
      setEtapaAtual(prevEtapa => prevEtapa + 1);
      window.scrollTo(0, 0);
    }
  };
  const etapaAnterior = () => {
    setEtapaAtual(prevEtapa => prevEtapa - 1);
    window.scrollTo(0, 0);
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreviewUrl(reader.result as string); };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setImagePreviewUrl(null);
    }
  };

  useEffect(() => {
    const validarRequisitos = async () => {
      if (!user?._id) return;
      try {
        const res = await api.get(`/api/perfil/${user._id}`);
        const p = res.data;

        const temNome = (p.nomeExibicao && p.nomeExibicao.trim() !== "") ||
          (p.tipoPessoa === 'cnpj' && p.dadosOrganizacao?.nomeFantasia);
        const temMP = !!p.mercadoPagoAccountId;

        if (!temMP) {
          setStatusPerfil({ ok: false, motivo: 'mercadopago' });
        } else if (!temNome) {
          setStatusPerfil({ ok: false, motivo: 'nome' });
        } else {
          setStatusPerfil({ ok: false, motivo: null }); // Tudo certo
          setStatusPerfil({ ok: true, motivo: null });
        }
      } catch (err) {
        console.error("Erro ao validar perfil", err);
      } finally {
        setChecandoPerfil(false);
      }
    };
    validarRequisitos();
  }, [user]);


  useEffect(() => {
    if (modalSucessoAberto) {
      const timer = setTimeout(() => {
        setModalSucessoAberto(false);
        navigate('/Home');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [modalSucessoAberto, navigate]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    const savedCooldownEnd = localStorage.getItem('eventoCooldownEnd');
    if (savedCooldownEnd) {
      const interval = setInterval(() => {
        const now = Date.now();
        const end = parseInt(savedCooldownEnd);
        const remaining = Math.floor((end - now) / 1000);

        if (remaining <= 0) {
          setIsCooldown(false);
          setCooldownTimeLeft(null);
          localStorage.removeItem('eventoCooldownEnd');
          clearInterval(interval);
        } else {
          setIsCooldown(true);
          setCooldownTimeLeft(remaining);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const verificarPerfil = async () => {
      const userDataString = localStorage.getItem('user');
      if (userDataString) {
        try {
          const usuario = JSON.parse(userDataString);
          const userId = usuario?._id;
          if (userId) {
            const response = await fetch(`${apiUrl}/api/perfil/${userId}`);
            if (response.ok) {
              const perfilData = await response.json();
              const isComplete = (perfilData.dadosPessoais && perfilData.dadosPessoais.cpf) || (perfilData.dadosOrganizacao && perfilData.dadosOrganizacao.cnpj);
              setPerfilCompleto(!!isComplete);
            }
          }
        } catch (error) {
          console.error('Erro ao verificar perfil:', error);
        }
      }
      setPerfilCarregado(true);
    };
    verificarPerfil();
  }, [apiUrl]);

  const buscarEnderecoPorCep = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, '');

    if (cleanedCep.length !== 8) {
      setErros(prevErros => ({ ...prevErros, cep: 'CEP inválido. Deve conter 8 dígitos.' }));
      setRua('');
      setBairro('');
      setCidade('');
      setEstado('');
      return;
    }

    setErros(prevErros => {
      const newErros = { ...prevErros };
      delete newErros.cep;
      return newErros;
    });

    setIsFetchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setErros(prevErros => ({ ...prevErros, cep: 'CEP não encontrado.' }));
        setRua('');
        setBairro('');
        setCidade('');
        setEstado('');
      } else {
        setRua(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setEstado(data.uf || '');
        setErros(prevErros => {
          const newErros = { ...prevErros };
          delete newErros.rua;
          delete newErros.bairro;
          delete newErros.cidade;
          delete newErros.estado;
          return newErros;
        });
      }
    } catch (error) {
      setErros(prevErros => ({ ...prevErros, cep: 'Erro ao buscar CEP. Tente novamente.' }));
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setIsFetchingCep(false);
    }
  };

  const handleLinkMapsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pastedText = e.target.value;

    setErros(prevErros => {
      const newErros = { ...prevErros };
      delete newErros.linkMaps;
      return newErros;
    });

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(pastedText, 'text/html');
      const iframe = doc.querySelector('iframe');

      if (iframe && iframe.getAttribute('src')) {
        const embedUrl = iframe.getAttribute('src')!;
        setLinkMaps(embedUrl);
      } else {
        setLinkMaps(pastedText);
        setErros(prevErros => ({
          ...prevErros,
          linkMaps: 'Cole o código de incorporação completo do mapa (HTML).'
        }));
      }
    } catch (error) {
      console.error("Erro ao analisar o código HTML do mapa:", error);
      setLinkMaps(pastedText);
      setErros(prevErros => ({
        ...prevErros,
        linkMaps: 'Formato de código inválido. Por favor, tente novamente.'
      }));
    }
  };

  const validarEtapa = (etapa: number) => {
    const novosErros: { [key: string]: string } = {};
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    switch (etapa) {
      case 1:
        if (!nomeEvento) novosErros.nomeEvento = 'O nome do evento é obrigatório.';
        if (!image) novosErros.imagem = 'A imagem do evento é obrigatória.';
        if (!categoriaEvento) novosErros.categoriaEvento = 'A categoria do evento é obrigatória.';
        break;
      case 2:
        if (!descricao.trim()) novosErros.descricao = 'A descrição do evento é obrigatória.';
        break;
      case 3:
        if (!cep.replace(/\D/g, '')) novosErros.cep = 'O CEP é obrigatório.';
        if (cep.replace(/\D/g, '').length !== 8) novosErros.cep = 'O CEP deve conter 8 dígitos.';
        if (!rua) novosErros.rua = 'A rua é obrigatória e deve ser preenchida automaticamente pelo CEP.';
        if (!bairro) novosErros.bairro = 'O bairro é obrigatório e deve ser preenchido automaticamente pelo CEP.';
        if (!numero) novosErros.numero = 'O número é obrigatório.';
        if (!cidade) novosErros.cidade = 'A cidade é obrigatória e deve ser preenchida automaticamente pelo CEP.';
        if (!estado) novosErros.estado = 'O estado é obrigatório e deve ser preenchido automaticamente pelo CEP.';

        if (!linkMaps || !linkMaps.startsWith('http')) {
          novosErros.linkMaps = 'O link do Google Maps é inválido ou não foi fornecido. Por favor, cole o código de incorporação completo (HTML) do mapa.';
        }
        break;
      case 4:
        if (!dataInicio) {
          novosErros.dataInicio = 'A data de início do evento é obrigatória.';
        } else {
          const dataEvento = new Date(dataInicio + 'T00:00:00');
          if (dataEvento < hoje) {
            novosErros.dataInicio = 'A data de início do evento não pode ser no passado.';
          }
        }
        if (!horaInicio) novosErros.horaInicio = 'A hora de início é obrigatória.';
        if (!horaTermino) novosErros.horaTermino = 'A hora de término é obrigatória.';
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
          const valorNum = lote.valorInteira ? parseFloat(lote.valorInteira.replace(',', '.')) : 0;
          const qtdNum = lote.quantidadeInteira ? parseInt(lote.quantidadeInteira) : 0;

          if (!lote.nome.trim()) {
            novosErros[`loteNome_${index}`] = 'O nome do lote é obrigatório.';
          }
          if (valorNum <= 0) {
            novosErros[`valorInteira_${index}`] = 'O valor da inteira deve ser maior que zero.';
          }
          if (qtdNum <= 0) {
            novosErros[`qtdInteira_${index}`] = 'A quantidade de inteiras deve ser maior que zero.';
          }

          if (temMeia) {
            const valorMeiaNum = lote.valorMeia ? parseFloat(lote.valorMeia.replace(',', '.')) : 0;
            const qtdMeiaNum = lote.quantidadeMeia ? parseInt(lote.quantidadeMeia) : 0;

            if (valorMeiaNum <= 0) {
              novosErros[`valorMeia_${index}`] = 'O valor da meia deve ser maior que zero.';
            }
            if (qtdMeiaNum <= 0) {
              novosErros[`qtdMeia_${index}`] = 'A quantidade de meia deve ser maior que zero.';
            }
          }
        });
        break;
      case 6:
        break;
      default:
        break;
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // --- Função para calcular os 7% de taxa da VibeTicket --- //
  const calcularValorComTaxa = (valor: string) => {
    const num = parseFloat(valor.replace(',', '.'));
    if (isNaN(num) || num <= 0) return 0;
    const taxa = num * 0.07; // 7%
    return num + taxa;
  };

  useEffect(() => {
    // Só executa a lógica depois que o AuthContext terminou de verificar a sessão
    if (!isAuthLoading) {
      // Se o usuário está logado, mas NÃO tem a conta do MP conectada...
      if (user && !user.mercadoPagoAccountId) {
        // ...redireciona ele para a página de perfil com uma mensagem de alerta.
        navigate('/perfil', {
          replace: true, // Impede o usuário de voltar para a página de criação
          state: {
            alerta: 'Para criar um evento, você precisa primeiro vincular sua conta do Mercado Pago.'
          }
        });
      }
    }
  }, [isAuthLoading, user, navigate]);

  // ALTERADO 
  const handleEnviarAnalise = async () => {
    // 1. Validação de Etapas (Mantida original)
    if (!validarEtapa(1) || !validarEtapa(2) || !validarEtapa(3) || !validarEtapa(4) || !validarEtapa(5)) {
      alert('Por favor, corrija os erros em todos os campos antes de enviar para análise.');
      if (!validarEtapa(1)) { setEtapaAtual(1); return; }
      if (!validarEtapa(2)) { setEtapaAtual(2); return; }
      if (!validarEtapa(3)) { setEtapaAtual(3); return; }
      if (!validarEtapa(4)) { setEtapaAtual(4); return; }
      if (!validarEtapa(5)) { setEtapaAtual(5); return; }
      return;
    }

    if (!termosAceitos) {
      alert('Você deve aceitar os Termos e Condições para criar o evento.');
      return;
    }

    // 2. Verificação de Usuário (Sem localStorage!)
    if (!user || !user._id) {
      alert('Usuário não autenticado. Por favor, faça login.');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);

    try {
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
      formData.append("dataFimVendas", dataFimVendas);
      formData.append("dataInicioVendas", dataInicioVendas);

      formData.append("lotes", JSON.stringify(lotes.map(l => ({
        nome: l.nome,
        // Passa o valor pela função que já adiciona os 7%
        valorInteira: calcularValorComTaxa(l.valorInteira),
        valorMeia: temMeia ? calcularValorComTaxa(l.valorMeia) : 0,
        quantidadeInteira: parseInt(l.quantidadeInteira),
        quantidadeMeia: temMeia ? parseInt(l.quantidadeMeia) : 0
      }))));

      // 🔥 CORREÇÃO: FormData exige string, então convertemos o booleano para texto 'true' ou 'false'
      formData.append("temMeia", temMeia ? 'true' : 'false');
      formData.append("criadoPor", user._id);

      if (image) {
        formData.append("imagem", image); // Banner Principal
      }
      if (imageBanner) {
        formData.append("imagemDescricao", imageBanner); // Banner da Descrição
      }

      // 4. ENVIO COM AXIOS (A ponte para os Cookies)
      await api.post('/api/eventos/criar', formData);

      setModalSucessoAberto(true);

      // Inicia o Cooldown
      const cooldownDuration = 5 * 60 * 1000;
      const cooldownEndTime = Date.now() + cooldownDuration;
      localStorage.setItem('eventoCooldownEnd', cooldownEndTime.toString());
      setIsCooldown(true);
      setCooldownTimeLeft(Math.floor(cooldownDuration / 1000));

      // Navega após um pequeno delay para o usuário ver o sucesso
      setTimeout(() => {
        setModalSucessoAberto(false);
        navigate('/meus-eventos');
      }, 3000);

    } catch (error: any) {
      console.error("Erro ao criar evento:", error);
      alert(error.response?.data?.message || "Erro interno ao enviar para análise.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || (user && !user.mercadoPagoAccountId)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Verificando seu perfil de criador...
      </div>
    );
  }

  // Adicione a função para fechar o modal de sucesso e navegar

  if (checandoPerfil) {
    return <div className="loading">Carregando requisitos...</div>;
  }

  // Se o perfil não estiver OK, mostramos a tela de bloqueio e PARAMOS AQUI.
  // O código abaixo deste return nunca será lido se statusPerfil.ok for false.
  if (!statusPerfil.ok) {
    return (
      <div className="bloqueio-wrapper">
        <div className="bloqueio-container">
          <img src={logo} alt="Logo VibeTicket" className="bloqueio-img" />
          <h2>Ação Necessária</h2>
          <p>
            {statusPerfil.motivo === 'mercadopago'
              ? "Você precisa vincular sua conta do Mercado Pago para receber os pagamentos dos ingressos com segurança."
              : "Você precisa configurar um Nome de Exibição ou Nome Fantasia para que os clientes saibam quem está organizando o evento."}
          </p>
          <button className="btn-ir-perfil" onClick={() => navigate('/perfil')}>
            Completar Perfil Agora
          </button>
        </div>
      </div>
    );
  }

  const getError = (fieldName: string) => erros[fieldName];




  return (
    <div>
      <header className="criar-evento-header">
        <div className="criar-juntos">
          <Link to="/Home" title="Voltar">
            <img src={logo} alt="Logo" className="duvidas-header-logo" />
          </Link>
          <hr className="duvidas-hr" />
          <h1 className="criar-titulo">
            Crie <span className="criar-dubtitle">seu evento</span>
          </h1>
        </div>
        <div className="criar-header-botoes">
          <button className="btn-salvar-sair" onClick={handleAbrirModal}>
            <ImExit />
            Sair
          </button>
          {isCooldown && (
            <span className="header-cooldown-timer">
              {`Próximo envio disponível em (${formatTime(cooldownTimeLeft || 0)})`}
            </span>
          )}
        </div>
      </header>

      {modalAberto && (
        <div className="criar-modal-overlay">
          <div className="criar-modal-content">
            <h2>Tem certeza que deseja sair?</h2>
            <p>Todo o progresso preenchido no formulário será perdido.</p>
            <div className="criar-modal-botoes">
              <button onClick={handleFecharModal} className="criar-modal-btn-cancelar">
                Não, continuar
              </button>
              <button onClick={handleConfirmarSaida} className="criar-modal-btn-confirmar">
                Sim, quero sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* O Modal de Doação foi removido para simplificar a lógica */}
      {/* {modalDoacaoAberto && (...) } */}

      <div className="criar-form">
        {perfilCarregado && !perfilCompleto && (
          <div className="alerta-amarelo">
            <GoAlertFill /> <strong>Atenção:</strong> Para que você possa receber o <strong>pagamento</strong> do seu evento, é <strong>obrigatório</strong><br />
            preencher suas <strong>informações pessoais e vincular sua conta do mercado pago</strong> ao site. Por favor, <a href="/perfil">clique aqui e complete seu perfil</a>.
            <p></p>
            <br></br>
            <strong>Observação: o valor recebido sobre o ingresso antes da conexão com mercado pago não será resarcido</strong>
          </div>
        )}

        {etapaAtual === 1 && (
          <div className="informacoes-basicas-container">
            <div className="criar-Informaçao">
              <h2>1. Informações básicas</h2>
            </div>
            <p style={{ margin: 10, color: "red" }}>(*) Todos os campos que contém asterisco são obrigatórios!!!</p>
            <div className="campo">
              <label htmlFor="nome-evento">
                Nome do evento <span className={getError('nomeEvento') ? 'erro-asterisco' : ''}>*</span>
              </label>
              <input
                type="text"
                id="nome-evento"
                placeholder="Digite o nome do evento"
                value={nomeEvento}
                onChange={(e) => setNomeEvento(e.target.value)}
                className={getError('nomeEvento') ? 'erro-campo' : ''}
              />
              {getError('nomeEvento') && <span className="mensagem-erro">{getError('nomeEvento')}</span>}
            </div>

            <div className="campo">
              <label htmlFor="imagem-evento">
                Imagem do evento <span className={getError('imagem') ? 'erro-asterisco' : ''}>*</span>
              </label>
              <div className="upload-imagem">
                <input
                  type="file"
                  id="imagem-evento"
                  className="input-file"
                  onChange={handleImageChange}
                  accept="image/*"
                />
                {imagePreviewUrl ? (
                  <div className="image-preview-container">
                    <img src={imagePreviewUrl} alt="Preview do evento" className="image-preview" />
                    <p className="image-name">{image?.name}</p>
                    <button
                      className="remove-image-button"
                      onClick={() => {
                        setImage(null);
                        setImagePreviewUrl(null);
                      }}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="imagem-evento" className="upload-placeholder">
                    <MdAddPhotoAlternate size={55} />
                    <p>Clique para adicionar a imagem</p>
                  </label>
                )}
              </div>
              {getError('imagem') && <span className="mensagem-erro">{getError('imagem')}</span>}
            </div>

            <div className="campo">
              <label htmlFor="categoria-evento">
                Categoria do evento <span className={getError('categoriaEvento') ? 'erro-asterisco' : ''}>*</span>
              </label>
              <select
                id="categoria-evento"
                value={categoriaEvento}
                onChange={(e) => setCategoriaEvento(e.target.value)}
                className={getError('categoriaEvento') ? 'erro-campo' : ''}
              >
                <option value="">Selecione uma categoria</option>
                <option value="Rock">Rock</option>
                <option value="pop">Pop</option>
                <option value="Funk">Funk</option>
                <option value="Rap">Rap</option>
                <option value="Jazz">Jazz</option>
                <option value="Sertanejo">Sertanejo</option>
                <option value="Eletrônica">Eletrônica</option>
              </select>
              {getError('categoriaEvento') && <span className="mensagem-erro">{getError('categoriaEvento')}</span>}
            </div>
          </div>
        )}

        {etapaAtual === 2 && (
          <div className="informacoes-basicas-container">
            <div className="criar-Informaçao">
              <h2>Conteúdo do Evento</h2>
              <p>Capriche na descrição e adicione um banner secundário para o corpo da página.</p>
            </div>
            <div className="campo">
              <label>Descrição Detalhada <span className="erro-asterisco">*</span></label>
              <textarea
                className={`perfil-input ${erros.descricao ? 'erro-campo' : ''}`}
                placeholder="Conte tudo sobre o seu evento..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={12} // 🔥 Espaço aumentado
                style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', resize: 'vertical' }}
              />
            </div>

            {/* 🔥 Novo Campo de Banner para a Descrição */}
            <div className="campo">
              <label>Banner Complementar (Opcional)</label>
              <div className="upload-container" onClick={() => document.getElementById('banner-input')?.click()}>
                {bannerPreviewUrl ? (
                  <img src={bannerPreviewUrl} alt="Preview Banner" className="preview-img" />
                ) : (
                  <div className="upload-placeholder">
                    <MdAddPhotoAlternate size={40} />
                    <span>Adicionar banner para a descrição</span>
                  </div>
                )}
                <input id="banner-input" type="file" hidden onChange={handleBannerChange} accept="image/*" />
              </div>
            </div>
          </div>
        )}

        {etapaAtual === 3 && (
          <div className="informacoes-basicas-container">
            <div className="criar-Informaçao">
              <h2>3. Local do seu evento</h2>
            </div>
            <div className="campo">
              <label htmlFor="cep-evento">
                CEP <span className={getError('cep') ? 'erro-asterisco' : ''}>*</span>
              </label>
              <input
                type="text"
                id="cep-evento"
                placeholder="Digite o CEP (ex: 00000-000)"
                value={cep}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length > 8) {
                    value = value.substring(0, 8);
                  }
                  let formattedValue = value;
                  if (value.length > 5) {
                    formattedValue = value.substring(0, 5) + '-' + value.substring(5);
                  }

                  setCep(formattedValue);
                  if (value.length === 8) {
                    buscarEnderecoPorCep(value);
                  } else {
                    setRua('');
                    setBairro('');
                    setCidade('');
                    setEstado('');
                  }
                }}
                maxLength={9}
                className={getError('cep') ? 'erro-campo' : ''}
              />
              {isFetchingCep && <span className="mensagem-info">Buscando CEP...</span>}
              {getError('cep') && <span className="mensagem-erro">{getError('cep')}</span>}
            </div>

            <div className="campo">
              <label htmlFor="rua-evento">
                Rua <span className={getError('rua') ? 'erro-asterisco' : ''}>*</span>
              </label>
              <input
                type="text"
                id="rua-evento"
                placeholder="Preenchido automaticamente"
                value={rua}
                readOnly
                className={`input-readonly ${getError('rua') ? 'erro-campo' : ''}`}
              />
              {getError('rua') && <span className="mensagem-erro">{getError('rua')}</span>}
            </div>

            <div className="campo">
              <label htmlFor="bairro-evento">
                Bairro <span className={getError('bairro') ? 'erro-asterisco' : ''}>*</span>
              </label>
              <input
                type="text"
                id="bairro-evento"
                placeholder="Preenchido automaticamente"
                value={bairro}
                readOnly
                className={`input-readonly ${getError('bairro') ? 'erro-campo' : ''}`}
              />
              {getError('bairro') && <span className="mensagem-erro">{getError('bairro')}</span>}
            </div>

            <div className="campos-horizontais">
              <div className="campo">
                <label htmlFor="numero-casa">
                  Número<span className={getError('numero') ? 'erro-asterisco' : ''}>*</span>
                </label>
                <input
                  type="text"
                  id="numero-casa"
                  placeholder="Número do Local"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className={getError('numero') ? 'erro-campo' : ''}
                />
                {getError('numero') && <span className="mensagem-erro">{getError('numero')}</span>}
              </div>

              <div className="campo">
                <label htmlFor="complemento-casa">
                  Complemento
                </label>
                <input
                  type="text"
                  id="complemento-casa"
                  placeholder="Referência / Ex: Bloco B"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                />
              </div>
            </div>

            <div className="campo">
              <label htmlFor="cidade-evento">
                Cidade <span className={getError('cidade') ? 'erro-asterisco' : ''}>*</span>
              </label>
              <input
                type="text"
                id="cidade-evento"
                placeholder="Preenchido automaticamente"
                value={cidade}
                readOnly
                className={`input-readonly ${getError('cidade') ? 'erro-campo' : ''}`}
              />
              {getError('cidade') && <span className="mensagem-erro">{getError('cidade')}</span>}
            </div>

            <div className="campo">
              <label htmlFor="estado-evento">
                Estado <span className={getError('estado') ? 'erro-asterisco' : ''}>*</span>
              </label>
              <input
                type="text"
                id="estado-evento"
                placeholder="Preenchido automaticamente"
                value={estado}
                readOnly
                className={`input-readonly ${getError('estado') ? 'erro-campo' : ''}`}
              />
              {getError('estado') && <span className="mensagem-erro">{getError('estado')}</span>}
            </div>

            <div className="campo">
              <label htmlFor="link-maps" style={{ display: 'flex', alignItems: 'center' }}>
                Link do Local no Google Maps <span className={getError('linkMaps') ? 'erro-asterisco' : ''}>*</span>
              </label>
              <input
                type="url"
                id="link-maps"
                placeholder="Cole o código de incorporação do mapa aqui"
                value={linkMaps}
                onChange={handleLinkMapsChange}
                className={getError('linkMaps') ? 'erro-campo' : ''}
              />
              {getError('linkMaps') && <span className="mensagem-erro">{getError('linkMaps')}</span>}
              <span className="tutorial-mapa">
                Como obter o link do Google Maps:
                <br />
                1. Acesse o Google Maps e pesquise pelo local.
                <br />
                2. Clique em 'Compartilhar' (ícone de seta).
                <br />
                3. Clique na aba 'Incorporar um mapa'.
                <br />
                4. Clique em 'Copiar HTML' e cole todo o código aqui.
              </span>
            </div>
          </div>
        )}

        {/* ETAPA 4: DATA DO EVENTO */}
        {etapaAtual === 4 && (
          <div className="informacoes-basicas-container"> {/* 🔥 Wrapper corrigido para o CSS pegar */}
            <div className="criar-Informaçao">
              <h2>Cronograma</h2>
              <p>Defina quando o seu evento começa e termina.</p>
            </div>
            <div className="perfil-form-grid">
              <div className="campo">
                <label>Data do Evento <span className="erro-asterisco">*</span></label>
                <input type="date" className="perfil-input" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div className="campo">
                <label>Hora de Início <span className="erro-asterisco">*</span></label>
                <input type="time" className="perfil-input" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
              </div>
              <div className="campo">
                <label>Hora de Término <span className="erro-asterisco">*</span></label>
                <input type="time" className="perfil-input" value={horaTermino} onChange={(e) => setHoraTermino(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 5: INGRESSOS E LOTES */}
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
                  <input
                    className="perfil-input"
                    style={{ fontWeight: 'bold', width: '70%' }}
                    value={lote.nome}
                    onChange={(e) => atualizarLote(index, 'nome', e.target.value)}
                    placeholder="Nome do Lote (Ex: 1º Lote)"
                  />
                  {index > 0 && (
                    <button type="button" onClick={() => removerLote(index)} style={{ color: '#e74c3c', border: 'none', background: 'none', cursor: 'pointer' }}>
                      <FaTrashAlt /> Remover
                    </button>
                  )}
                </div>

                <div className="perfil-form-grid">
                  <div className="campo">
                    <label>Preço Base Inteira (R$)</label>
                    <input
                      className="perfil-input"
                      placeholder="0,00"
                      value={lote.valorInteira}
                      onChange={(e) => atualizarLote(index, 'valorInteira', e.target.value)}
                    />
                    {/* 🔥 AVISO DE TAXA - INTEIRA */}
                    {lote.valorInteira && (
                      <span style={{ display: 'block', marginTop: '5px', fontSize: '0.8rem', color: '#6c757d' }}>
                        Valor final p/ comprador: <strong style={{ color: '#0969fb' }}>R$ {calcularValorComTaxa(lote.valorInteira).toFixed(2).replace('.', ',')}</strong> (7% taxa)
                      </span>
                    )}
                  </div>

                  <div className="campo">
                    <label>Qtd. Inteira</label>
                    <input className="perfil-input" type="number" value={lote.quantidadeInteira} onChange={(e) => atualizarLote(index, 'quantidadeInteira', e.target.value)} />
                  </div>

                  {temMeia && (
                    <>
                      <div className="campo">
                        <label>Preço Base Meia (R$)</label>
                        <input
                          className="perfil-input"
                          placeholder="0,00"
                          value={lote.valorMeia}
                          onChange={(e) => atualizarLote(index, 'valorMeia', e.target.value)}
                        />
                        {/* 🔥 AVISO DE TAXA - MEIA */}
                        {lote.valorMeia && (
                          <span style={{ display: 'block', marginTop: '5px', fontSize: '0.8rem', color: '#6c757d' }}>
                            Valor final p/ comprador: <strong style={{ color: '#0969fb' }}>R$ {calcularValorComTaxa(lote.valorMeia).toFixed(2).replace('.', ',')}</strong> (7% taxa)
                          </span>
                        )}
                      </div>
                      <div className="campo">
                        <label>Qtd. Meia</label>
                        <input className="perfil-input" type="number" value={lote.quantidadeMeia} onChange={(e) => atualizarLote(index, 'quantidadeMeia', e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            <button type="button" onClick={adicionarLote} className="btn-adicionar-lote-dotted" style={{ width: '100%', padding: '12px', border: '2px dashed #0969fb', borderRadius: '8px', color: '#0969fb', background: 'transparent', fontWeight: 'bold', cursor: 'pointer' }}>
              + Adicionar Novo Lote
            </button>
          </div>
        )}



        {etapaAtual === 6 && (
          <div className="informacoes-basicas-container">
            <h2 className="criar-doacao-title">6. Termos de Responsabilidade</h2>

            <div className="termos-container">
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="termos-aceitos"
                  checked={termosAceitos}
                  onChange={(e) => setTermosAceitos(e.target.checked)}
                />
                <label htmlFor="termos-aceitos">
                  Eu li e concordo com os{' '}
                  <a href="/Termos" target="_blank" rel="noopener noreferrer">
                    Termos e Condições para a criação de eventos
                  </a>.
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="navegacao-etapas">
          {etapaAtual > 1 && (
            <button className="btn-anterior" onClick={etapaAnterior}>
              Voltar
            </button>
          )}
          {etapaAtual < 6 && (
            <button className="btn-proximo" onClick={handleProximaEtapa}>
              Próxima Etapa
            </button>
          )}
          {etapaAtual === 6 && (
            <button
              className="criar-btn-enviar"
              onClick={handleEnviarAnalise}
              disabled={isCooldown || !termosAceitos || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Enviando...</span>
                </>
              ) : isCooldown ? (
                `Aguarde... (${formatTime(cooldownTimeLeft || 0)})`
              ) : (
                <>
                  Enviar para Análise
                  <IoSend />
                </>
              )}
            </button>
          )}
          {modalSucessoAberto && (
            <div className="criar-modal-overlay">
              <div className="criar-modal-content criar-modal-sucesso">
                <div className="criar-modal-sucesso-conteudo">
                  <img
                    src={Conclusao}
                    alt="Conclusão"
                    className="criar-modal-sucesso-imagem"
                  />
                  <h2 className="criar-modal-sucesso-titulo">
                    Parabéns! Seu evento foi criado!
                  </h2>
                  <p className="criar-modal-sucesso-mensagem">
                    Seu evento foi enviado para análise.
                  </p>
                  <div className="criar-modal-sucesso-progresso">
                    <div className="criar-modal-sucesso-barra"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CriarEventos;