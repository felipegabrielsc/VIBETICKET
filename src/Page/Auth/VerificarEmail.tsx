import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../Hook/AuthContext';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

import "../../styles/Login.css"; // Reaproveitando os seus estilos

const VerificarEmail: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [status, setStatus] = useState<'carregando' | 'sucesso' | 'erro'>('carregando');
    const [mensagemErro, setMensagemErro] = useState('');

    useEffect(() => {
        const verificarToken = async () => {
            if (!token) {
                setStatus('erro');
                setMensagemErro('Nenhum código de verificação foi fornecido na URL.');
                return;
            }

            try {
                // Dispara o token por baixo dos panos (POST)
                const response = await api.post(`/api/users/verify/${token}`);
                
                // O Backend já enviou o Cookie HttpOnly e os dados do usuário!
                if (response.status === 200) {
                    setStatus('sucesso');
                    login(response.data.user); // Atualiza o contexto do React
                    
                    // Joga o usuário para o sistema após 2 segundos para ele ver a mensagem de sucesso
                    setTimeout(() => navigate('/Home'), 2000);
                }
            } catch (error: any) {
                setStatus('erro');
                setMensagemErro(error.response?.data?.message || 'Ocorreu um erro ao verificar o seu e-mail. O link pode ter expirado.');
            }
        };

        verificarToken();
    }, [token, login, navigate]);

    return (
        <main className="login-container">
            <section className="form-section" style={{ textAlign: 'center', padding: '40px' }}>
                
                {status === 'carregando' && (
                    <>
                        <FaSpinner className="spin-icon" style={{ fontSize: '3rem', color: '#0969fb', marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
                        <h2 className="login-bemvido">Verificando sua conta...</h2>
                        <p style={{ color: '#666' }}>Aguarde um momento enquanto validamos o seu acesso.</p>
                        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </>
                )}

                {status === 'sucesso' && (
                    <>
                        <FaCheckCircle style={{ fontSize: '3rem', color: '#28a745', marginBottom: '1rem' }} />
                        <h2 className="login-bemvido" style={{ color: '#28a745' }}>Conta ativada!</h2>
                        <p style={{ color: '#666' }}>Seu e-mail foi verificado com sucesso. Você está sendo redirecionado...</p>
                    </>
                )}

                {status === 'erro' && (
                    <>
                        <FaExclamationTriangle style={{ fontSize: '3rem', color: '#dc3545', marginBottom: '1rem' }} />
                        <h2 className="login-bemvido" style={{ color: '#dc3545' }}>Link Inválido</h2>
                        <p style={{ color: '#666', marginBottom: '2rem' }}>{mensagemErro}</p>
                        <Link to="/login" className="login-crie-conta" style={{ padding: '10px 20px', backgroundColor: '#0969fb', color: 'white', borderRadius: '5px', textDecoration: 'none' }}>
                            Ir para o Login
                        </Link>
                    </>
                )}

            </section>
        </main>
    );
};

export default VerificarEmail;