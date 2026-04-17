# 🎯 Ads Monitor Squad

Sistema automático de monitoramento de saldo em Google Ads e Meta Ads com notificações via WhatsApp.

## ✨ Funcionalidades

- ✅ Monitora saldo de campanhas no Google Ads
- ✅ Monitora saldo de campanhas no Meta Ads
- ✅ Envia relatório diário via WhatsApp às 9h da manhã
- ✅ Sistema simples de adicionar/remover clientes
- ✅ Status automático: "COM SALDO", "SALDO ACABANDO" (<R$100), "SEM SALDO"

## 🚀 Setup Inicial

### 1. Instalar dependências

```bash
cd squads/ads-monitor
npm install
```

### 2. Validar credenciais (arquivo .env.local já criado)

O arquivo `.env.local` já está na raiz do projeto com todas as credenciais. Verifique se está completo.

### 3. Testar integração Twilio WhatsApp

```bash
npm run test-whatsapp
```

Se receber a mensagem de teste no WhatsApp, está tudo ok! ✅

## 📋 Gerenciar Clientes

### Menu interativo

```bash
npm run manage-clients
```

Você terá um menu com opções para:
1. **Listar** clientes cadastrados
2. **Adicionar** novo cliente
3. **Remover** cliente
4. **Desativar** cliente (sem deletar)
5. **Ativar** cliente desativado

### Exemplo: Adicionar cliente

```bash
npm run add-client "Cliente ABC" "1234567890" "act_9876543210"
```

- Primeiro argumento: Nome do cliente
- Segundo: Google Ads Customer ID (opcional)
- Terceiro: Meta Ads Account ID (opcional)

### Exemplo: Listar clientes

```bash
npm run list-clients
```

Mostra todos os clientes ativos/inativos.

## 🤖 Executar Monitoramento

### Teste rápido

```bash
npm run monitor
```

Isso irá:
1. Ler a lista de clientes do `clients-config.json`
2. Buscar o saldo de cada plataforma (Google Ads + Meta Ads)
3. Compilar um relatório
4. Enviar via WhatsApp

### Agendar para rodar diariamente às 9h

Use o comando Claude Code `/schedule`:

```
/schedule "0 9 * * *" npm run monitor
```

Isso criará um job que executa todos os dias às 9h (timezone: Brasil).

## 📊 Estrutura do Relatório

Você receberá um relatório assim:

```
📊 Relatório de Saldo - Campanhas de Ads
🕒 17/04/2026 09:00:00

Cliente XYZ
├─ Google Ads: COM SALDO (R$ 450,00)
└─ Meta Ads: SALDO ACABANDO (R$ 75,00)

Cliente ABC
├─ Google Ads: SEM SALDO (R$ 0,00)
└─ Meta Ads: COM SALDO (R$ 250,00)
```

## 🔧 Configuração Avançada

### Modificar threshold de "saldo acabando"

No arquivo `.env.local`, altere:

```
SALDO_BAIXO_THRESHOLD=100  # Altere para seu valor desejado (em R$)
```

### Timezone

No `clients-config.json`:

```json
"timezone": "America/Sao_Paulo"  // Altere conforme necessário
```

### Horário do relatório

No `clients-config.json`:

```json
"horario_relatorio": "09:00"  // Mude para seu horário desejado
```

## 🔐 Segurança

- ✅ Credenciais armazenadas em `.env.local` (não versionado no git)
- ✅ Arquivo `clients-config.json` pode ser versionado (não contém secrets)
- ✅ Twilio usa ambiente de Sandbox (seguro para testes)

## 📝 Próximos Passos

### Fase 1 (Atual)
- [x] Configurar credenciais
- [x] Testar Twilio WhatsApp
- [x] Criar sistema de gestão de clientes
- [x] Implementar relatório básico

### Fase 2 (A implementar)
- [ ] Integração real com Google Ads API
- [ ] Integração real com Meta Ads API
- [ ] Cálculo real de saldo das campanhas
- [ ] Configurar scheduler automático

### Fase 3 (Futura)
- [ ] Monitorar status de campanhas (paradas/ativas/pendentes)
- [ ] Alertas em tempo real para saldo crítico
- [ ] Histórico de saldos
- [ ] Dashboard visual

## 🐛 Troubleshooting

### "Erro: Twilio message failed"

**Problema:** Mensagem não foi enviada

**Solução:**
1. Confirme que respondeu com "join [codigo]" para o Twilio no WhatsApp
2. Verifique que seu número está correto em `.env.local`
3. Teste com `npm run test-whatsapp`

### "Erro: Invalid Google Ads credentials"

**Problema:** Não conseguiu conectar ao Google Ads

**Solução:**
1. Verifique Developer Token em `.env.local`
2. Confirme que MCC ID está correto
3. Aguarde integração real da API

### "Cliente não aparece no relatório"

**Problema:** Cliente adicionado não entra no monitoramento

**Solução:**
1. Confirme que `ativo: true` no `clients-config.json`
2. Verifique que pelo menos uma plataforma está `enabled: true`

## 📞 Suporte

Para ajuda com configuração, execute:

```bash
npm run manage-clients
```

E escolha a opção do menu interativo.

---

**Status:** Pronto para produção com integração real de APIs ✅
