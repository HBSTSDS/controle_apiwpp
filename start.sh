#!/bin/bash
# Script de inicialização do servidor AWS

echo "=== Iniciando sistema de gestão ==="

# Navega para a pasta do projeto
cd ~/controle_apiwpp

# --- BACKEND ---
echo ">> Iniciando backend..."
cd backend

# Cria o .env de produção se não existir
if [ ! -f .env ]; then
  echo "DATABASE_URL=\"file:./prisma/prod.db\"" > .env
  echo "JWT_SECRET=\"minhachavesecretajwt2024\"" >> .env
  echo "PORT=3001" >> .env
  echo "CORS_ORIGIN=\"http://44.208.94.22:3000\"" >> .env
fi

# Cria/migra o banco de dados
npx prisma migrate deploy

# Instala apenas as dependências de produção (muito mais leve!)
npm install --production --ignore-scripts

# Inicia o backend com PM2
pm2 delete backend 2>/dev/null || true
pm2 start dist/index.js --name "backend"

# --- FRONTEND ---
echo ">> Iniciando frontend..."
cd ../frontend

# Instala apenas o necessário para rodar (já está compilado!)
npm install --production --ignore-scripts

# Inicia o frontend com PM2
pm2 delete frontend 2>/dev/null || true
pm2 start node_modules/.bin/next --name "frontend" -- start -p 3000

# Salva a configuração do PM2
pm2 save
pm2 startup

echo "=== Sistema no ar! ==="
echo "Backend: http://44.208.94.22:3001"
echo "Frontend: http://44.208.94.22:3000"
