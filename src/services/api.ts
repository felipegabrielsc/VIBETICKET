// src/services/api.ts
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true, // A MÁGICA ESTÁ AQUI: Diz ao navegador para anexar o HttpOnly Cookie sozinho
});

// Mantemos apenas o interceptor de RESPOSTA para lidar com sessão expirada (401)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Pega a URL da requisição que falhou
    const originalRequestUrl = error.config?.url || '';

    // Se o erro for 401 (Não Autorizado) ou 403 (Proibido)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {

      // 🔥 A MÁGICA AQUI: Só dispara o alerta se a requisição NÃO for o check-auth
      if (!originalRequestUrl.includes('/check-auth')) {
        console.log("🔒 Sessão expirada ou inválida.");
        alert("Sua sessão expirou. Por favor, faça login novamente.");

        // Limpa o localStorage e redireciona (se você tiver essa lógica aí)
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;