#!/usr/bin/env node

require('dotenv').config({ path: '../../.env.local' });
const twilio = require('twilio');

async function testWhatsApp() {
  console.log('🧪 Testando conexão Twilio WhatsApp...\n');

  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const message = await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_SANDBOX}`,
      to: `whatsapp:${process.env.WHATSAPP_RECIPIENT}`,
      body: '✅ Teste de conexão - Agente de Monitoramento de Ads\n\nSe você recebeu esta mensagem, a integração Twilio WhatsApp está funcionando corretamente!'
    });

    console.log('✅ Mensagem enviada com sucesso!');
    console.log(`   SID: ${message.sid}`);
    console.log(`   Status: ${message.status}`);
    console.log(`   De: ${message.from}`);
    console.log(`   Para: ${message.to}\n`);
    console.log('📱 Verifique seu WhatsApp para confirmar recebimento!');
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:');
    console.error(`   ${error.message}`);

    if (error.code === 21606) {
      console.log('\n⚠️  Aviso: Você pode estar fora do Sandbox do Twilio');
      console.log('   Confirme que enviou "join [codigo]" para o número do Twilio');
    }
  }
}

testWhatsApp();
