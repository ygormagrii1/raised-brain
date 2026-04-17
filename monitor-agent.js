#!/usr/bin/env node

require('dotenv').config({ path: './.env.local' });
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Load clients config
function loadClientsConfig() {
  const configPath = path.join(__dirname, 'clients-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config.clientes.filter(c => c.ativo);
}

// Get Google Ads balance (mock for now - will integrate real API)
async function getGoogleAdsBalance(customerId) {
  try {
    // TODO: Implement real Google Ads API call
    // Using google-ads-api library or official Google Ads API client
    console.log(`Fetching Google Ads balance for customer: ${customerId}`);

    // Mock response for now
    return {
      customerId,
      saldo: Math.random() * 500,
      moeda: 'BRL'
    };
  } catch (error) {
    console.error(`Error fetching Google Ads balance: ${error.message}`);
    return null;
  }
}

// Get Meta Ads balance (mock for now - will integrate real API)
async function getMetaAdsBalance(accountId) {
  try {
    // TODO: Implement real Meta Ads API call
    // Using meta-ads-api or axios to call Graph API
    console.log(`Fetching Meta Ads balance for account: ${accountId}`);

    // Mock response for now
    return {
      accountId,
      saldo: Math.random() * 500,
      moeda: 'BRL'
    };
  } catch (error) {
    console.error(`Error fetching Meta Ads balance: ${error.message}`);
    return null;
  }
}

// Determine status based on balance
function getStatus(saldo) {
  if (saldo === 0) return 'SEM SALDO';
  if (saldo < process.env.SALDO_BAIXO_THRESHOLD) return 'SALDO ACABANDO';
  return 'COM SALDO';
}

// Build WhatsApp message
function buildWhatsAppMessage(relatorio) {
  let mensagem = `📊 *Relatório de Saldo - Campanhas de Ads*\n`;
  mensagem += `🕒 ${new Date().toLocaleString('pt-BR')}\n\n`;

  relatorio.forEach(item => {
    mensagem += `*${item.cliente}*\n`;

    if (item.google_ads) {
      const status = getStatus(item.google_ads.saldo);
      mensagem += `├─ Google Ads: ${status} (R$ ${item.google_ads.saldo.toFixed(2)})\n`;
    }

    if (item.meta_ads) {
      const status = getStatus(item.meta_ads.saldo);
      mensagem += `└─ Meta Ads: ${status} (R$ ${item.meta_ads.saldo.toFixed(2)})\n`;
    }

    mensagem += '\n';
  });

  return mensagem;
}

// Send WhatsApp message via Twilio
async function sendWhatsAppReport(mensagem) {
  try {
    const message = await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_SANDBOX}`,
      to: `whatsapp:${process.env.WHATSAPP_RECIPIENT}`,
      body: mensagem
    });

    console.log(`✅ WhatsApp message sent: ${message.sid}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending WhatsApp message: ${error.message}`);
    return false;
  }
}

// Main monitoring function
async function monitorarCampanhas() {
  console.log('🚀 Iniciando monitoramento de campanhas...');

  const clientes = loadClientsConfig();
  const relatorio = [];

  for (const cliente of clientes) {
    const item = {
      cliente: cliente.nome,
      google_ads: null,
      meta_ads: null
    };

    // Fetch Google Ads balance
    if (cliente.plataformas.google_ads?.enabled) {
      item.google_ads = await getGoogleAdsBalance(
        cliente.plataformas.google_ads.customer_id
      );
    }

    // Fetch Meta Ads balance
    if (cliente.plataformas.meta_ads?.enabled) {
      item.meta_ads = await getMetaAdsBalance(
        cliente.plataformas.meta_ads.account_id
      );
    }

    relatorio.push(item);
  }

  // Build and send report
  const mensagem = buildWhatsAppMessage(relatorio);
  console.log('\n📝 Mensagem a enviar:\n', mensagem);

  await sendWhatsAppReport(mensagem);

  console.log('✅ Monitoramento concluído!');
}

// Run the monitoring
monitorarCampanhas().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
