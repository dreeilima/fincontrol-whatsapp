# Usar versão slim do Node.js para reduzir tamanho
FROM node:18-slim

# Instalar dependências do Chrome de forma otimizada
RUN apt-get update && apt-get install -y --no-install-recommends \
    gconf-service \
    libgbm-dev \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    chromium \
    chromium-l10n \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/cache/apt/*

# Configurações do Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_ARGS="--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-gpu,--no-first-run,--no-zygote,--single-process,--disable-extensions"

# Criar diretório para dados do Chromium com permissões corretas
RUN mkdir -p /app/.wwebjs_auth /app/whatsapp-data \
    && chmod -R 777 /app

WORKDIR /app

# Copiar apenas os arquivos de dependências primeiro
COPY package*.json ./

# Instalar dependências de produção apenas
RUN npm ci --only=production

# Copiar o arquivo .env.docker como .env
COPY .env.docker ./.env

# Copiar o resto dos arquivos
COPY . .

# Criar diretórios temporários com permissões corretas
RUN mkdir -p /tmp/chrome-data /tmp/whatsapp-data && \
    chmod -R 777 /tmp/chrome-data /tmp/whatsapp-data

EXPOSE 3000

CMD ["node", "server.js"]