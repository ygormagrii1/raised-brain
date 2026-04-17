# 🎉 Setup Final - Agente de Monitoramento de Ads

## ✅ Tudo Pronto!

Seu agente de monitoramento está pronto para uso. Aqui está o que foi criado:

### 📁 Arquivos Criados

```
squads/ads-monitor/
├── .env.local                    # ✅ Credenciais (gitignored)
├── clients-config.json           # Configuração de clientes
├── package.json                  # Dependências npm
├── monitor-agent.js              # Agente principal
├── manage-clients.js             # Gerenciador de clientes
├── test-whatsapp.js              # Teste de conexão
├── README.md                      # Documentação completa
└── SETUP-FINAL.md               # Este arquivo

node_modules/                      # ✅ Dependências instaladas
```

### 🚀 Próximos Passos

#### 1. Adicione seus primeiros clientes

**Opção A - Menu interativo (recomendado):**
```bash
cd squads/ads-monitor
npm run manage-clients
```

**Opção B - Linha de comando:**
```bash
npm run add-client "Nome do Cliente" "123456789" "act_987654321"
```

#### 2. Teste o monitoramento

```bash
npm run monitor
```

Isso irá:
- Ler seus clientes cadastrados
- Buscar saldos (atualmente usando dados simulados)
- Compilar relatório
- Enviar via WhatsApp

Você receberá uma mensagem assim:
```
📊 Relatório de Saldo - Campanhas de Ads
🕒 17/04/2026 09:15:00

Cliente XYZ
├─ Google Ads: COM SALDO (R$ 450,00)
└─ Meta Ads: SALDO ACABANDO (R$ 75,00)
```

#### 3. Configure para rodar automaticamente às 9h da manhã

Use o comando do Claude Code:

```
/schedule create ads-monitor "0 9 * * *" "cd c:/Users/User/Documents/Raised/opensquad/squads/ads-monitor && npm run monitor"
```

Ou use a skill de scheduling:

```
/schedule
```

E crie um novo job com:
- **Cron:** `0 9 * * *` (todos os dias às 9h)
- **Comando:** `cd c:/Users/User/Documents/Raised/opensquad/squads/ads-monitor && npm run monitor`

### 📊 Estrutura de Dados

O arquivo `clients-config.json` armazena seus clientes:

```json
{
  "clientes": [
    {
      "id": "cliente-001",
      "nome": "Cliente XYZ",
      "plataformas": {
        "google_ads": {
          "customer_id": "1234567890",
          "enabled": true
        },
        "meta_ads": {
          "account_id": "act_1234567890",
          "enabled": true
        }
      },
      "ativo": true
    }
  ]
}
```

## 🔄 Próxima Fase: Integração Real das APIs

Atualmente, o agente está **simulando dados**. Para usar dados reais:

### Google Ads API

Precisaremos implementar:
1. Autenticação OAuth com seu MCC ID
2. Buscar lista de clientes na MCC
3. Para cada cliente, buscar `CustomerService` e pegar o `AutoBudget`

Dependência a adicionar:
```bash
npm install google-ads-api
```

### Meta Ads API

Precisaremos implementar:
1. Fazer chamada à Graph API para cada account
2. Endpoint: `https://graph.instagram.com/{account-id}/adaccounts`
3. Buscar campo `balance` ou `funding_entity`

Já temos `axios` instalado para isso.

## 📋 Comando Rápido

Para gerenciar clientes, use sempre:

```bash
npm run manage-clients
```

Menu options:
- **1** - Listar clientes ✅
- **2** - Adicionar cliente ➕
- **3** - Remover cliente ❌
- **4** - Desativar cliente ⏸️
- **5** - Ativar cliente ▶️
- **6** - Sair

## 🧪 Testando Sem Dados Reais

Se quiser testar o relatório completo agora, execute:

```bash
npm run monitor
```

Você receberá um relatório com dados simulados. Assim você valida:
- ✅ Conexão Twilio
- ✅ Formato de mensagem
- ✅ Execução do agente

## 📱 Checklist Final

- [x] Credenciais Twilio configuradas
- [x] Mensagem de teste enviada com sucesso
- [x] npm dependencies instaladas
- [ ] Adicionar seus clientes ao sistema
- [ ] Testar `npm run monitor`
- [ ] Configurar scheduler para 9h diárias
- [ ] (Futuro) Integrar APIs reais

## 🤔 Dúvidas?

Abra o menu de gerenciamento:
```bash
npm run manage-clients
```

Ou consulte o README completo:
```bash
cat README.md
```

---

**Status:** ✅ Pronto para rodar! Próximo passo: Adicionar clientes e configurar scheduler.
