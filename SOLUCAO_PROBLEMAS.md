# Solução de Problemas - FinControl WhatsApp

## Problemas Identificados e Soluções

### 1. Erro de Conexão: `EADDRNOTAVAIL: address not available 191.252.111.20:3000`

**Problema:** O servidor está tentando se vincular a um endereço IP específico (191.252.111.20) em vez de usar `0.0.0.0` (que aceita conexões de qualquer interface).

**Solução:**
1. Modificamos o arquivo `.env.docker` para usar `HOST=0.0.0.0` em vez de `HOST=191.252.111.20`
2. Criamos um arquivo `docker-compose.override.yml` com a configuração `network_mode: "host"` para garantir que o contêiner use a rede do host

### 2. Erro da API da Anthropic: `anthropic-version: "2024-03-20" is not a valid version`

**Problema:** A versão da API da Anthropic não está sendo especificada corretamente.

**Solução:**
Atualizamos o arquivo `modules/claude.js` para definir explicitamente a versão da API:
```javascript
const anthropic = new Anthropic({
  apiKey: cleanApiKey,
  // Definir a versão da API explicitamente
  anthropicVersion: "2023-06-01"
});
```

## Como Aplicar as Soluções

1. Certifique-se de que as alterações nos arquivos foram salvas
2. Reconstrua e reinicie o contêiner Docker:
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```
3. Verifique os logs para confirmar que os erros foram resolvidos:
   ```bash
   docker-compose logs -f
   ```

## Observações Adicionais

- Se você estiver usando um proxy reverso (como Nginx), certifique-se de que ele está configurado corretamente para encaminhar as solicitações para o contêiner
- Verifique se as portas necessárias estão abertas no firewall do servidor
- Se o problema persistir, tente usar a opção `--network=host` ao executar o contêiner Docker
