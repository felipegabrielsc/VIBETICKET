import api from './api';
import { CarrinhoItem } from '../types/carrinho';

export class CarrinhoService {
    static async getCarrinho(): Promise<CarrinhoItem[]> {
        try {
            // O Axios e o Navegador tratam do envio do Cookie HttpOnly sozinhos.
            const response = await api.get('/api/carrinho');
            
            if (response.data && response.data.itens) {
                return response.data.itens.map((item: any) => ({
                    id: item._id || item.id,
                    eventoId: item.eventoId,
                    nomeEvento: item.nomeEvento,
                    tipoIngresso: item.tipoIngresso,
                    preco: item.preco,
                    quantidade: item.quantidade,
                    imagem: item.imagem,
                    dataEvento: item.dataEvento,
                    localEvento: item.localEvento
                }));
            }
            return [];
        } catch (error) {
            console.error('Erro ao buscar carrinho:', error);
            return []; // Se der erro 401 (deslogado), retorna array vazio
        }
    }

    static async adicionarItem(itemData: {
        eventoId: string;
        tipoIngresso: string;
        quantidade: number;
    }): Promise<void> {
        try {
            // Removemos a verificação manual do token! A API fará isso.
            await api.post('/api/carrinho/itens', itemData);
        } catch (error) {
            console.error('Erro ao adicionar item:', error);
            throw error;
        }
    }

    static async atualizarQuantidade(itemId: string, quantidade: number): Promise<void> {
        try {
            await api.put(`/api/carrinho/itens/${itemId}`, { quantidade });
        } catch (error) {
            console.error('Erro ao atualizar quantidade:', error);
            throw error;
        }
    }

    static async removerItem(itemId: string): Promise<void> {
        try {
            await api.delete(`/api/carrinho/itens/${itemId}`);
        } catch (error) {
            console.error('Erro ao remover item:', error);
            throw error;
        }
    }

    static async limparCarrinho(): Promise<void> {
        try {
            await api.delete('/api/carrinho');
        } catch (error) {
            console.error('Erro ao limpar carrinho:', error);
            throw error;
        }
    }

    // Sincronizar carrinho local (Visitante) com o Banco de Dados após Login
    static async sincronizarCarrinho(itens: CarrinhoItem[]): Promise<void> {
        try {
            // Primeiro limpa o carrinho atual no servidor
            await this.limparCarrinho();

            // Depois adiciona todos os itens do carrinho local
            for (const item of itens) {
                try {
                    await this.adicionarItem({
                        eventoId: item.eventoId,
                        tipoIngresso: item.tipoIngresso,
                        quantidade: item.quantidade
                    });
                } catch (error) {
                    console.error(`Erro ao sincronizar item ${item.eventoId}:`, error);
                }
            }
        } catch (error) {
            console.error('Erro na sincronização do carrinho:', error);
            throw error;
        }
    }
}