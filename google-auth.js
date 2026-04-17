#!/usr/bin/env node

require('dotenv').config({ path: './.env.local' });
const http = require('http');
const url = require('url');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = 'https://www.googleapis.com/auth/adwords';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ GOOGLE_ADS_CLIENT_ID e GOOGLE_ADS_CLIENT_SECRET não encontrados em .env.local');
  process.exit(1);
}

// Generate authorization URL
function getAuthorizationUrl() {
  const state = crypto.randomBytes(32).toString('hex');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `state=${state}&` +
    `access_type=offline&` +
    `prompt=consent`;
  return authUrl;
}

// Exchange authorization code for refresh token
async function exchangeCodeForToken(code) {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    });

    return response.data.refresh_token;
  } catch (error) {
    console.error('❌ Erro ao trocar código por token:', error.response?.data || error.message);
    throw error;
  }
}

// Save refresh token to .env.local
function saveRefreshToken(token) {
  const envPath = path.join(__dirname, '.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Check if GOOGLE_ADS_REFRESH_TOKEN already exists
  if (envContent.includes('GOOGLE_ADS_REFRESH_TOKEN=')) {
    // Replace existing token
    envContent = envContent.replace(
      /GOOGLE_ADS_REFRESH_TOKEN=.*/,
      `GOOGLE_ADS_REFRESH_TOKEN=${token}`
    );
  } else {
    // Add new line
    envContent += `\nGOOGLE_ADS_REFRESH_TOKEN=${token}`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Refresh token salvo em .env.local');
}

// Create HTTP server to handle callback
function startAuthServer() {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/callback') {
      const code = parsedUrl.query.code;
      const error = parsedUrl.query.error;

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`❌ Erro: ${error}`);
        console.error('❌ Erro de autorização:', error);
        server.close();
        return;
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('❌ Código de autorização não encontrado');
        server.close();
        return;
      }

      try {
        console.log('🔄 Trocando código por refresh token...');
        const refreshToken = await exchangeCodeForToken(code);
        saveRefreshToken(refreshToken);

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Autorização Concluída</title>
              <style>
                body { font-family: Arial; text-align: center; padding: 40px; }
                .success { color: #22c55e; font-size: 24px; }
                .message { color: #666; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="success">✅ Autorização Concluída!</div>
              <div class="message">
                <p>Seu refresh token foi salvo em .env.local</p>
                <p>Você pode fechar esta janela e voltar ao terminal.</p>
              </div>
            </body>
          </html>
        `);

        server.close();
        console.log('✅ Autenticação concluída com sucesso!');
        console.log('   Você já pode usar npm run monitor');
        process.exit(0);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('❌ Erro ao processar autorização');
        server.close();
        process.exit(1);
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  });

  server.listen(3000, () => {
    const authUrl = getAuthorizationUrl();
    console.log('🚀 Servidor de autenticação iniciado em http://localhost:3000');
    console.log('\n📱 Abra este link no seu navegador:\n');
    console.log(authUrl);
    console.log('\n⏳ Aguardando autorização...\n');
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error('❌ Porta 3000 já está em uso. Feche o processo anterior ou use outra porta.');
    } else {
      console.error('❌ Erro no servidor:', error.message);
    }
    process.exit(1);
  });
}

// Start the process
console.log('🔐 Google Ads OAuth Authentication\n');
console.log('Este script vai autenticar sua conta Google para acessar Google Ads.');
console.log('Você será redirecionado para fazer login no Google.\n');

startAuthServer();
