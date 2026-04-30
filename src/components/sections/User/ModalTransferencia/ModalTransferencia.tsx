// src/components/sections/User/ModalTransferencia/ModalTransferencia.tsx

import React, { useState, useEffect } from 'react';
import { FiX, FiMail, FiDollarSign, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { Ingresso } from '../../../../types/Ingresso';
import './ModalTransferencia.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ingresso: Ingresso;
  onSubmit: (dadosTransferencia: any) => void;
  isLoading: boolean;
}

type TipoTransferencia = 'Direta' | 'Segura';
type PagadorTaxa = 'Remetente' | 'Destinatario';

export const ModalTransferencia: React.FC<Props> = ({ isOpen, onClose, ingresso, onSubmit, isLoading }) => {
  // Estados do Formulário
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState<TipoTransferencia>('Direta');
  const [quemPaga, setQuemPaga] = useState<PagadorTaxa>('Destinatario');
  const [valorRevendaStr, setValorRevendaStr] = useState('');
  const [erro, setErro] = useState('');

  // Resetar estados ao abrir/mudar de ingresso
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setTipo('Direta');
      setQuemPaga('Destinatario');
      setValorRevendaStr('');
      setErro('');
    }
  }, [isOpen, ingresso]);

  if (!isOpen) return null;

  // Lógica Financeira (Valores Base)
  const valorOriginal = ingresso.valor || 0;
  const limiteMinimo = valorOriginal * 0.92; // Max 8% de desconto
  const valorRevendaNum = parseFloat(valorRevendaStr.replace(',', '.')) || 0;

  // Cálculos da Transferência DIRETA (Taxa 7% do valor original)
  const taxaDireta = valorOriginal * 0.07;
  
  // Cálculos da Transferência SEGURA (Taxa 10% do valor de revenda)
  const taxaSegura = valorRevendaNum * 0.10;

  // Validação em Tempo Real
  const handleTransferir = () => {
    setErro('');

    // Valida Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErro('Por favor, digite um e-mail válido.');
      return;
    }

    // Valida Regras da Venda Segura
    if (tipo === 'Segura') {
      if (valorRevendaNum <= 0) {
        setErro('Digite um valor de venda válido.');
        return;
      }
      if (valorRevendaNum < limiteMinimo) {
        setErro(`O valor mínimo permitido para revenda é R$ ${limiteMinimo.toFixed(2).replace('.', ',')} (Desconto máx 8%).`);
        return;
      }
    }

    // Passou nas validações, empacota os dados e envia para o componente pai
    const dados = {
      ingressoId: ingresso.id,
      destinatarioEmail: email.toLowerCase(),
      tipo,
      quemPagaTaxa: quemPaga,
      valorRevenda: tipo === 'Segura' ? valorRevendaNum : undefined,
    };

    onSubmit(dados);
  };

  return (
    <div className="modal-transferencia-overlay" onClick={onClose}>
      <div className="modal-transferencia-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-transferencia-header">
          <h2>Transferir Ingresso</h2>
          <button className="btn-fechar" onClick={onClose}><FiX /></button>
        </div>

        <div className="modal-transferencia-body">
          {/* Aba de Seleção do Tipo */}
          <div className="transferencia-tabs">
            <button 
              className={`transferencia-tab ${tipo === 'Direta' ? 'active' : ''}`}
              onClick={() => setTipo('Direta')}
            >
              Transferência Gratuita
            </button>
            <button 
              className={`transferencia-tab ${tipo === 'Segura' ? 'active' : ''}`}
              onClick={() => setTipo('Segura')}
            >
              Venda Segura
            </button>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', gap: '5px' }}>
            <FiInfo size={16} />
            {tipo === 'Direta' 
              ? 'Envie o ingresso gratuitamente. É cobrada apenas uma taxa de transferência de 7%.'
              : 'Nós mediamos a venda, cobramos do destinatário e repassamos o dinheiro para você.'}
          </div>

          {/* Campo E-mail */}
          <div className="transferencia-secao">
            <label>E-mail do Destinatário</label>
            <div className="transferencia-input-group">
              <FiMail className="transferencia-icon" />
              <input 
                type="email" 
                className="transferencia-input"
                placeholder="email@amigo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Campo Valor (Apenas Venda Segura) */}
          {tipo === 'Segura' && (
            <div className="transferencia-secao">
              <label>Por quanto quer vender? (R$)</label>
              <div className="transferencia-input-group">
                <FiDollarSign className="transferencia-icon" />
                <input 
                  type="text" 
                  className="transferencia-input"
                  placeholder="Ex: 150,00"
                  value={valorRevendaStr}
                  onChange={(e) => {
                    let v = e.target.value.replace(/[^0-9,]/g, '');
                    setValorRevendaStr(v);
                  }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Valor pago originalmente: R$ {valorOriginal.toFixed(2).replace('.', ',')} | 
                Mínimo permitido: R$ {limiteMinimo.toFixed(2).replace('.', ',')}
              </span>
            </div>
          )}

          {/* Quem Paga a Taxa? */}
          <div className="transferencia-secao">
            <label>Quem pagará a taxa do site?</label>
            <div className="radio-group">
              <label className={`radio-label ${quemPaga === 'Destinatario' ? 'selecionado' : ''}`}>
                <input 
                  type="radio" 
                  name="taxa" 
                  checked={quemPaga === 'Destinatario'} 
                  onChange={() => setQuemPaga('Destinatario')} 
                />
                <span>O Destinatário (Ele paga para liberar o ingresso)</span>
              </label>
              <label className={`radio-label ${quemPaga === 'Remetente' ? 'selecionado' : ''}`}>
                <input 
                  type="radio" 
                  name="taxa" 
                  checked={quemPaga === 'Remetente'} 
                  onChange={() => setQuemPaga('Remetente')} 
                />
                <span>Eu pagarei (Descontado agora ou no repasse)</span>
              </label>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="erro-mensagem">
              <FiAlertCircle size={18} /> {erro}
            </div>
          )}

          {/* Resumo Financeiro Dinâmico */}
          <div className="transferencia-resumo">
            {tipo === 'Direta' ? (
              <>
                <div className="resumo-linha">
                  <span>Valor do Ingresso:</span>
                  <span>R$ 0,00</span>
                </div>
                <div className="resumo-linha">
                  <span>Taxa de Transferência (7%):</span>
                  <span>R$ {taxaDireta.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="resumo-linha destaque">
                  {quemPaga === 'Remetente' ? (
                    <><span>Você vai pagar agora:</span> <span>R$ {taxaDireta.toFixed(2).replace('.', ',')}</span></>
                  ) : (
                    <><span>Seu amigo vai pagar:</span> <span>R$ {taxaDireta.toFixed(2).replace('.', ',')}</span></>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="resumo-linha">
                  <span>Valor da Venda:</span>
                  <span>R$ {valorRevendaNum.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="resumo-linha">
                  <span>Taxa da Plataforma (10%):</span>
                  <span style={{ color: '#dc2626' }}>- R$ {taxaSegura.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="resumo-linha destaque">
                  {quemPaga === 'Remetente' ? (
                    <>
                      <span>Destinatário paga:</span>
                      <span>R$ {valorRevendaNum.toFixed(2).replace('.', ',')}</span>
                    </>
                  ) : (
                    <>
                      <span>Destinatário paga:</span>
                      <span>R$ {(valorRevendaNum + taxaSegura).toFixed(2).replace('.', ',')}</span>
                    </>
                  )}
                </div>
                <div className="resumo-linha lucro">
                  <span>Você vai receber (Repasse):</span>
                  <span>R$ {(quemPaga === 'Remetente' ? valorRevendaNum - taxaSegura : valorRevendaNum).toFixed(2).replace('.', ',')}</span>
                </div>
              </>
            )}
          </div>

        </div>

        <div className="modal-transferencia-footer">
          <button 
            className="btn-confirmar-transfer" 
            onClick={handleTransferir}
            disabled={isLoading || (tipo === 'Segura' && !valorRevendaStr)}
          >
            {isLoading ? 'Processando...' : 'Avançar para Pagamento'}
          </button>
        </div>

      </div>
    </div>
  );
};