// src/Hook/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api'; 
import axios, { AxiosError } from 'axios';

interface UserData {
    _id: string;
    nome: string;
    email: string;
    role: string;
    isVerified: boolean;
    imagemPerfil?: string;
    mercadoPagoAccountId?: string | null;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserData | null;
    isLoading: boolean;
    login: (userData: UserData) => void; // 🔥 Apenas userData, o token sumiu!
    logout: () => Promise<void>;
    updateUser: (newUserData: UserData) => void;
    updateUserProfileImage: (newImageUrl: string) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // =================================================================
    // 🔥 NOVA VERIFICAÇÃO DE SESSÃO (Via HttpOnly Cookie)
    // =================================================================
    useEffect(() => {
        const verifySession = async () => {
            try {
                // Não procuramos mais o token no localStorage.
                // O Axios vai enviar o Cookie HttpOnly automaticamente para o backend.
                const response = await api.get('/api/users/check-auth');

                if (response.data && response.data.user) {
                    setUser(response.data.user);
                    // Opcional: Atualiza o cache local com os dados públicos mais recentes
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                } else {
                    throw new Error("Resposta de verificação de sessão inválida");
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const axiosError = error as AxiosError;
                    console.error("🔒 Sessão inválida ou não encontrada (Erro API):", axiosError.response?.status);
                } else {
                    console.error("❌ Nenhuma sessão válida encontrada.", error);
                }

                // Limpa o estado em caso de falha
                setUser(null);
                localStorage.removeItem('user');
            } finally {
                setIsLoading(false);
            }
        };

        verifySession();
    }, []);

    // =================================================================
    // Funções de Gerenciamento de Estado
    // =================================================================

    // 🔥 O login não recebe mais o token
    const login = useCallback((userData: UserData) => {
        setUser(userData);
        // Guardamos apenas os dados não sensíveis do usuário para exibição rápida
        localStorage.setItem('user', JSON.stringify(userData));
    }, []);

    const logout = useCallback(async () => {
        try {
            // Remove do localStorage PRIMEIRO
            localStorage.removeItem('user');

            // Depois chama o backend (que vai invalidar e destruir o Cookie HttpOnly)
            await api.post('/api/users/logout');
        } catch (error) {
            console.error("Erro ao fazer logout no backend:", error);
        } finally {
            // Garante que o estado seja limpo
            setUser(null);
            localStorage.removeItem('user');

            // Redireciona forçadamente
            window.location.href = '/login';
        }
    }, []);

    const updateUser = useCallback((newUserData: UserData) => {
        setUser(newUserData);
        localStorage.setItem('user', JSON.stringify(newUserData));
    }, []);

    const updateUserProfileImage = useCallback((newImageUrl: string) => {
        setUser(prevUser => {
            if (!prevUser) return null;
            const updatedUser = { ...prevUser, imagemPerfil: newImageUrl };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    }, []);

    // =================================================================
    // Context Value
    // =================================================================

    const contextValue = useMemo(() => ({
        isAuthenticated: !!user,
        user,
        isLoading,
        login,
        logout,
        updateUser,
        updateUserProfileImage,
    }), [user, isLoading, login, logout, updateUser, updateUserProfileImage]);

    return (
        <AuthContext.Provider value={contextValue}>
            {/* Se estiver carregando, podemos mostrar uma tela em branco ou loading, 
                isso evita que rotas protegidas pisquem antes de saber se está logado */}
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return context;
}