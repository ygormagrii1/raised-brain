#!/usr/bin/env node

require('dotenv').config({ path: './.env.local' });
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');
const axios = require('axios');

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

// Get Google access token using refresh token
async function getGoogleAccessToken() {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Google access token:', error.message);
    return null;
  }
}

// Check Google Ads campaign status for budget issues
async function getGoogleAdsBalance(customerId) {
  try {
    if (!process.env.GOOGLE_ADS_REFRESH_TOKEN) {
      console.warn(`⚠️  Google Ads não configurado. Execute: npm run auth-google`);
      return null;
    }

    console.log(`Fetching Google Ads status for customer: ${customerId}`);

    const accessToken = await getGoogleAccessToken();
    if (!accessToken) return null;

    // Query to get campaign status and reason
    const response = await axios.post(
      `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
      {
        query: `SELECT campaign.id, campaign.name, campaign.status, campaign.primary_status, campaign.primary_status_reasons
                FROM campaign
                LIMIT 100`
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.results || response.data.results.length === 0) {
      return { customerId, status: 'SEM_DADOS', statusMsg: 'Nenhuma campanha encontrada' };
    }

    // Analyze campaign statuses
    let hasActiveCampaigns = false;
    let hasBudgetIssues = false;
    let secondaryStatus = [];

    response.data.results.forEach(result => {
      const campaign = result.campaign;
      const primaryStatus = campaign.primary_status;
      const reasons = campaign.primary_status_reasons || [];

      // Check if campaign is active
      if (primaryStatus === 'ELIGIBLE' || campaign.status === 'ENABLED') {
        hasActiveCampaigns = true;
      }

      // Check for budget-related issues
      const budgetReasons = reasons.filter(r =>
        r.includes('BUDGET') ||
        r.includes('PAYMENT') ||
        r.includes('POLICY') ||
        r.includes('ACCOUNT')
      );

      if (budgetReasons.length > 0) {
        hasBudgetIssues = true;
        budgetReasons.forEach(reason => {
          if (!secondaryStatus.includes(reason)) {
            secondaryStatus.push(reason);
          }
        });
      }

      // Check for other issues
      if (primaryStatus === 'PAUSED') {
        if (!secondaryStatus.includes('Campanha pausada')) {
          secondaryStatus.push('Campanha pausada');
        }
      }
    });

    // Determine overall status
    let status = 'COM_SALDO';
    let statusMsg = 'Google Ads: COM SALDO *';

    if (hasBudgetIssues) {
      status = 'SEM_SALDO';
      statusMsg = 'Google Ads: SEM SALDO';
    } else if (!hasActiveCampaigns && response.data.results.length > 0) {
      status = 'PAUSADO';
      statusMsg = 'Google Ads: PAUSADO';
    }

    return {
      customerId,
      status,
      statusMsg,
      saldo: hasBudgetIssues ? 0 : 1, // For compatibility with existing code
      moeda: 'BRL',
      detalhes: {
        totalCampanhas: response.data.results.length,
        campanhasAtivas: hasActiveCampaigns,
        issuesSecundarios: secondaryStatus
      }
    };
  } catch (error) {
    console.error(`Error fetching Google Ads status: ${error.message}`);
    // Return null on API error so we skip Google Ads for that customer
    return null;
  }
}

// Get Meta Ads balance from real Graph API
async function getMetaAdsBalance(accountId) {
  try {
    console.log(`Fetching Meta Ads balance for account: ${accountId}`);

    // Ensure account ID has the 'act_' prefix
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    const response = await axios.get(
      `https://graph.facebook.com/v21.0/${formattedAccountId}`,
      {
        params: {
          fields: 'balance,currency,name',
          access_token: process.env.META_ADS_ACCESS_TOKEN
        }
      }
    );

    // Balance is returned in cents (e.g., 34110 = R$ 341.10)
    const balanceCents = parseInt(response.data.balance || '0');
    const saldoReal = balanceCents / 100;

    return {
      accountId,
      saldo: saldoReal,
      moeda: 'BRL'
    };
  } catch (error) {
    console.error(`Error fetching Meta Ads balance: ${error.response?.data?.error?.message || error.message}`);
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
      // Use statusMsg if available (new format), otherwise use saldo (old format)
      if (item.google_ads.statusMsg) {
        mensagem += `├─ ${item.google_ads.statusMsg}`;
        if (item.google_ads.detalhes?.issuesSecundarios?.length > 0) {
          mensagem += ` (${item.google_ads.detalhes.issuesSecundarios.join(', ')})`;
        }
        mensagem += `\n`;
      } else {
        const status = getStatus(item.google_ads.saldo);
        mensagem += `├─ Google Ads: ${status} (R$ ${item.google_ads.saldo.toFixed(2)})\n`;
      }
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

    // Fetch Google Ads balance (disabled for now due to API endpoint issues)
    // TODO: Implement when Google Ads REST API is properly configured
    if (cliente.plataformas.google_ads?.enabled && false) {
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
