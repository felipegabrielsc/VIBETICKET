// src/Hook/CartContext.js

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CarrinhoService } from '../services/carrinhoService';
import { CarrinhoItem } from '../types/carrinho';
import { useAuth } from '../Hook/AuthContext';

interface CartContextType {
    cartItemsCount: number;
    cartItems: CarrinhoItem[];
    isLoading: boolean;
    addItemToCart: (item: CarrinhoItem) => Promise<void>;
    removeItemFromCart: (id: string) => Promise<void>;
    updateItemQuantity: (id: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CarrinhoItem[]>([]);
    const [cartItemsCount, setCartItemsCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();

    // Efeito para calcular a contagem total de itens sempre que o carrinho mudar
    useEffect(() => {
        const totalCount = cartItems.reduce((sum, item) => sum + item.quantidade, 0);
        setCartItemsCount(totalCount);
    }, [cartItems]);

    // 🧠 EFEITO PRINCIPAL DE SINCRONIZAÇÃO
    // Gerencia o carregamento inicial e a transição entre logado/deslogado.
    useEffect(() => {
        // 1. Não faz nada até que o status de autenticação seja definitivo
        if (isAuthLoading) {
            return;
        }

        const syncAndLoadCart = async () => {
            setIsLoading(true);
            try {
                if (isAuthenticated) {
                    // 2. USUÁRIO ESTÁ LOGADO
                    const localItemsJSON = localStorage.getItem('localCart');
                    const localItems = localItemsJSON ? JSON.parse(localItemsJSON) : [];

                    if (localItems.length > 0) {
                        // Se há itens locais, sincroniza com o backend
                        await CarrinhoService.sincronizarCarrinho(localItems);
                        // Limpa o local APÓS a sincronização bem-sucedida
                        localStorage.removeItem('localCart');
                    }

                    // Carrega o carrinho final e atualizado do backend
                    const serverItems = await CarrinhoService.getCarrinho();
                    setCartItems(serverItems);

                } else {
                    // 3. USUÁRIO NÃO ESTÁ LOGADO
                    // A fonte da verdade é o localStorage.
                    const localItemsJSON = localStorage.getItem('localCart');
                    const localItems = localItemsJSON ? JSON.parse(localItemsJSON) : [];
                    setCartItems(localItems);
                }
            } catch (error) {
                console.error("Erro ao sincronizar ou carregar carrinho:", error);
            } finally {
                setIsLoading(false);
            }
        };

        syncAndLoadCart();

    }, [isAuthenticated, user, isAuthLoading]);


    // FUNÇÕES DE MANIPULAÇÃO DO CARRINHO
    const addItemToCart = async (item: CarrinhoItem) => {
        setIsLoading(true);
        try {
            if (isAuthenticated) {
                await CarrinhoService.adicionarItem({
                    eventoId: item.eventoId,
                    tipoIngresso: item.tipoIngresso,
                    quantidade: item.quantidade
                });
                // Recarrega do servidor para ter a fonte da verdade
                const updatedCart = await CarrinhoService.getCarrinho();
                setCartItems(updatedCart);
            } else {
                // Lógica para usuário deslogado
                const currentItems = [...cartItems];
                const existingItemIndex = currentItems.findIndex(i =>
                    i.eventoId === item.eventoId && i.tipoIngresso === item.tipoIngresso
                );

                if (existingItemIndex > -1) {
                    currentItems[existingItemIndex].quantidade += item.quantidade;
                } else {
                    currentItems.push({ ...item, id: `${item.eventoId}-${item.tipoIngresso}` });
                }

                setCartItems(currentItems);
                localStorage.setItem('localCart', JSON.stringify(currentItems));
            }
        } catch (error) {
            console.error('Erro ao adicionar item ao carrinho:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const updateItemQuantity = async (id: string, quantity: number) => {
        if (quantity < 1) {
            return removeItemFromCart(id);
        }
        setIsLoading(true);
        try {
            if (isAuthenticated) {
                await CarrinhoService.atualizarQuantidade(id, quantity);
                const updatedCart = await CarrinhoService.getCarrinho();
                setCartItems(updatedCart);
            } else {
                const newItems = cartItems.map(item =>
                    item.id === id ? { ...item, quantidade: quantity } : item
                );
                setCartItems(newItems);
                localStorage.setItem('localCart', JSON.stringify(newItems));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const removeItemFromCart = async (id: string) => {
        setIsLoading(true);
        try {
            if (isAuthenticated) {
                await CarrinhoService.removerItem(id);
                const updatedCart = await CarrinhoService.getCarrinho();
                setCartItems(updatedCart);
            } else {
                const newItems = cartItems.filter(item => item.id !== id);
                setCartItems(newItems);
                localStorage.setItem('localCart', JSON.stringify(newItems));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearCart = async () => {
        setIsLoading(true);
        try {
            if (isAuthenticated) {
                await CarrinhoService.limparCarrinho();
            }
            setCartItems([]);
            localStorage.removeItem('localCart');
        } finally {
            setIsLoading(false);
        }
    };

    const refreshCart = async () => {
        if (isAuthLoading) return;
        setIsLoading(true);
        try {
            if (isAuthenticated) {
                const serverItems = await CarrinhoService.getCarrinho();
                setCartItems(serverItems);
            } else {
                const localItemsJSON = localStorage.getItem('localCart');
                const localItems = localItemsJSON ? JSON.parse(localItemsJSON) : [];
                setCartItems(localItems);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const value: CartContextType = {
        cartItemsCount,
        cartItems,
        isLoading,
        addItemToCart,
        removeItemFromCart,
        updateItemQuantity,
        clearCart,
        refreshCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};