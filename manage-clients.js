#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CONFIG_PATH = path.join(__dirname, 'clients-config.json');

// Load config
function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

// Save config
function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log('✅ Configuração salva!');
}

// List all clients
function listarClientes() {
  const config = loadConfig();
  console.log('\n📋 CLIENTES CADASTRADOS:\n');

  config.clientes.forEach(cliente => {
    const status = cliente.ativo ? '✅' : '❌';
    console.log(`${status} ${cliente.nome} (ID: ${cliente.id})`);

    if (cliente.plataformas.google_ads.enabled) {
      console.log(`   └─ Google Ads: ${cliente.plataformas.google_ads.customer_id}`);
    }
    if (cliente.plataformas.meta_ads.enabled) {
      console.log(`   └─ Meta Ads: ${cliente.plataformas.meta_ads.account_id}`);
    }
    console.log('');
  });
}

// Add new client
function adicionarCliente(config, nome, googleId, metaId) {
  const novoId = `cliente-${Date.now()}`;

  const novoCliente = {
    id: novoId,
    nome,
    plataformas: {
      google_ads: {
        customer_id: googleId || null,
        enabled: !!googleId
      },
      meta_ads: {
        account_id: metaId || null,
        enabled: !!metaId
      }
    },
    ativo: true
  };

  config.clientes.push(novoCliente);
  saveConfig(config);

  console.log(`\n✅ Cliente "${nome}" adicionado com sucesso!`);
  console.log(`   ID: ${novoId}`);
}

// Remove client
function removerCliente(config, clienteId) {
  const index = config.clientes.findIndex(c => c.id === clienteId);

  if (index === -1) {
    console.log(`❌ Cliente com ID "${clienteId}" não encontrado!`);
    return;
  }

  const clienteRemovido = config.clientes[index];
  config.clientes.splice(index, 1);
  saveConfig(config);

  console.log(`✅ Cliente "${clienteRemovido.nome}" removido com sucesso!`);
}

// Disable/Enable client
function desativarCliente(config, clienteId, desativar = true) {
  const cliente = config.clientes.find(c => c.id === clienteId);

  if (!cliente) {
    console.log(`❌ Cliente com ID "${clienteId}" não encontrado!`);
    return;
  }

  cliente.ativo = !desativar;
  saveConfig(config);

  const acao = desativar ? 'desativado' : 'ativado';
  console.log(`✅ Cliente "${cliente.nome}" ${acao}!`);
}

// Interactive menu
async function menu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

  console.log('\n🎯 GERENCIADOR DE CLIENTES - ADS MONITOR\n');
  console.log('1. Listar clientes');
  console.log('2. Adicionar cliente');
  console.log('3. Remover cliente');
  console.log('4. Desativar cliente');
  console.log('5. Ativar cliente');
  console.log('6. Sair\n');

  const choice = await question('Escolha uma opção (1-6): ');

  const config = loadConfig();

  switch (choice) {
    case '1':
      listarClientes();
      break;

    case '2': {
      const nome = await question('\n📝 Nome do cliente: ');
      const googleId = await question('Google Ads Customer ID (deixe vazio para pular): ');
      const metaId = await question('Meta Ads Account ID (deixe vazio para pular): ');

      adicionarCliente(config, nome, googleId || null, metaId || null);
      break;
    }

    case '3': {
      listarClientes();
      const clienteId = await question('\n❌ ID do cliente a remover: ');
      removerCliente(config, clienteId);
      break;
    }

    case '4': {
      listarClientes();
      const clienteId = await question('\n⏸️  ID do cliente a desativar: ');
      desativarCliente(config, clienteId, true);
      break;
    }

    case '5': {
      listarClientes();
      const clienteId = await question('\n▶️  ID do cliente a ativar: ');
      desativarCliente(config, clienteId, false);
      break;
    }

    case '6':
      console.log('\n👋 Até logo!');
      rl.close();
      return;

    default:
      console.log('\n❌ Opção inválida!');
  }

  rl.close();

  // Ask if user wants to continue
  const continuar = await new Promise(resolve => {
    const rl2 = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl2.question('\n➕ Fazer outra operação? (s/n): ', answer => {
      rl2.close();
      resolve(answer.toLowerCase() === 's');
    });
  });

  if (continuar) {
    await menu();
  }
}

// Run CLI
const command = process.argv[2];

if (!command) {
  menu().catch(console.error);
} else if (command === 'list') {
  listarClientes();
} else if (command === 'add') {
  const nome = process.argv[3];
  const googleId = process.argv[4] || null;
  const metaId = process.argv[5] || null;

  if (!nome) {
    console.log('❌ Uso: manage-clients.js add "<nome>" [googleId] [metaId]');
    process.exit(1);
  }

  const config = loadConfig();
  adicionarCliente(config, nome, googleId, metaId);
} else if (command === 'remove') {
  const clienteId = process.argv[3];

  if (!clienteId) {
    console.log('❌ Uso: manage-clients.js remove <clienteId>');
    process.exit(1);
  }

  const config = loadConfig();
  removerCliente(config, clienteId);
} else {
  console.log('❌ Comando desconhecido!');
  console.log('Uso: manage-clients.js [list|add|remove]');
  process.exit(1);
}
