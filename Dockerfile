# Estágio 1: Build (Usando o Node padrão, robusto e sem bugs de permissão)
FROM node:20 as build
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Tiro de misericórdia: Força o sistema a dar permissão de execução ao react-scripts
RUN chmod +x node_modules/.bin/react-scripts

# Compila o React
RUN npm run build

# Estágio 2: Produção com Nginx (Continua usando o Alpine para ser super leve)
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]