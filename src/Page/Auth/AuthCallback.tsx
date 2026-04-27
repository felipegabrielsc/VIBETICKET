import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Hook/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner/LoadingSpinner';

const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        // O token via URL agora serve apenas como um sinalizador para engatilhar a checagem,
        // mas a segurança real (o JWT) já foi gravada silenciosamente pelo backend no Cookie.
        const urlToken = searchParams.get('token');

        const handleAuth = async () => {
            try {
                // Bate na API. Se o cookie foi configurado pelo redirect anterior do backend, isso vai passar.
                const response = await api.get('/api/users/check-auth');

                if (response.data && response.data.user) {
                    const { user } = response.data;

                    // 🔥 Apenas UM argumento. Nada de token!
                    login(user);

                    navigate('/Home');
                } else {
                    throw new Error("Dados do usuário não retornados.");
                }

            } catch (err) {
                console.error("Falha ao autenticar após verificação:", err);
                navigate('/login');
            }
        };

        if (urlToken) {
            handleAuth();
        } else {
            navigate('/login');
        }
    }, [searchParams, login, navigate]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <LoadingSpinner />
            <p style={{ marginLeft: '1rem', fontSize: '1.2rem' }}>Autenticando, aguarde...</p>
        </div>
    );
};

export default AuthCallback;