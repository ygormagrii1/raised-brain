#!/bin/bash

echo "🚀 Instalador do Ads Monitor"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Passo 1: Instalando dependências...${NC}"
npm install

if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Erro na instalação. Verifique se npm está instalado.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Dependências instaladas!${NC}"
echo ""

echo -e "${BLUE}Passo 2: Testando conexão Twilio...${NC}"
npm run test-whatsapp

echo ""
echo -e "${BLUE}Passo 3: Próximas ações${NC}"
echo ""
echo "Para gerenciar clientes:"
echo -e "  ${YELLOW}npm run manage-clients${NC}"
echo ""
echo "Para testar o monitoramento:"
echo -e "  ${YELLOW}npm run monitor${NC}"
echo ""
echo "Para agendar a execução diária:"
echo -e "  ${YELLOW}/schedule create ads-monitor \"0 9 * * *\" \"npm run monitor\"${NC}"
echo ""
echo -e "${GREEN}✅ Setup concluído!${NC}"
