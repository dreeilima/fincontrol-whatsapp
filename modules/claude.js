// Importar o SDK do Anthropic
const Anthropic = require("@anthropic-ai/sdk");
const config = require("../config");

console.log("=== DEBUG ANTHROPIC API ===");
console.log(
  "Config ANTHROPIC_API_KEY:",
  config.ANTHROPIC_API_KEY ? "Presente" : "Ausente"
);
console.log(
  "Config ANTHROPIC_API_KEY length:",
  config.ANTHROPIC_API_KEY ? config.ANTHROPIC_API_KEY.length : 0
);
console.log(
  "Config ANTHROPIC_API_KEY prefix:",
  config.ANTHROPIC_API_KEY
    ? config.ANTHROPIC_API_KEY.substring(0, 10) + "..."
    : "não configurada"
);

// Verificar se a chave existe antes de tentar usar
if (!config.ANTHROPIC_API_KEY) {
  console.error("ERRO: ANTHROPIC_API_KEY não está configurada!");
  console.error(
    "Por favor, configure a variável ANTHROPIC_API_KEY no arquivo .env"
  );
  // Não vamos encerrar o processo, apenas retornar um objeto vazio
  module.exports = {
    testConnection: async () => false,
    anthropic: null,
  };
  return;
}

// Limpar e formatar a chave
const cleanApiKey = config.ANTHROPIC_API_KEY.trim();
console.log("Chave limpa:", cleanApiKey.substring(0, 10) + "...");

// Criar instância do Anthropic com configurações específicas
const anthropic = new Anthropic({
  apiKey: cleanApiKey,
  // Definir a versão da API explicitamente
  anthropicVersion: "2023-06-01",
});

// Função para testar a conexão
async function testConnection() {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 10,
      messages: [{ role: "user", content: "test" }],
    });
    console.log("=== TESTE DE CONEXÃO BEM-SUCEDIDO ===");
    return true;
  } catch (error) {
    console.error("=== ERRO NO TESTE DE CONEXÃO ===");
    console.error("Detalhes do erro:", {
      message: error.message,
      status: error.status,
      headers: error.headers,
      request_id: error.request_id,
    });
    return false;
  }
}

// Executar teste de conexão
testConnection();

const REGISTRATION_INFO = `
Olá! 👋

Para começar a usar o FinControl, você precisa criar uma conta em nosso site.

🌐 Acesse: {siteUrl}

📱 No site você poderá:
• Criar sua conta
• Escolher o plano ideal para você
• Configurar suas preferências
• Começar a usar o FinControl via WhatsApp

💡 Após criar sua conta, volte aqui e me envie um "oi" para começarmos!
`;

const WELCOME_REGISTERED_USER = `
Olá {name}! 👋

Que bom ter você de volta! Vou te ajudar a gerenciar suas finanças de forma simples e prática.

📱 *Como usar o FinControl*

1️⃣ *Registrar Receitas*
   • "ganhei 1000 de salário"
   • "ganhei 500 de freela"

2️⃣ *Registrar Despesas*
   • "gastei 50 em almoço"
   • "gastei 200 em compras"

3️⃣ *Consultas*
   • "💰 saldo" - Ver seu saldo atual
   • "📊 extrato" - Ver suas transações
   • "📈 relatório" - Ver relatórios

💡 *Dicas*
• Use vírgula para centavos (ex: 10,50)
• Pode usar "ontem" ou "mês passado" nas descrições
• Categorias são detectadas automaticamente

❓ Use "ajuda" para ver mais detalhes sobre cada comando.

Como posso te ajudar hoje? 😊
`;

const ERROR_MESSAGE = `
❌ *Ops! Algo deu errado*

Não consegui processar sua solicitação.

💡 *O que fazer?*
• Verifique se o comando está correto
• Use "❓ ajuda" para ver os comandos disponíveis
• Tente novamente com o formato correto
`;

const TRANSACTION_CONFIRMATION = `
✅ *Transação Registrada com Sucesso!*

{type} registrada:
💰 Valor: R$ {amount}
📝 Descrição: {description}
🏷️ Categoria: {category}
📅 Data: {date}

💡 *Próximos Passos*
• Use "💰 saldo" para ver seu saldo atual
• Use "📊 extrato" para ver todas as transações
• Use "📈 relatório" para ver relatórios
`;

const TRANSACTION_ERROR = `
❌ *Não consegui registrar sua {type}*

💡 *Verifique se:*
• O valor está correto (ex: 10,50)
• A descrição está clara
• O formato está correto

📝 *Exemplos:*
• "ganhei 1000 de salário"
• "gastei 50 em almoço"

Use "❓ ajuda" para ver mais exemplos.
`;

const BALANCE_INFO = `
💰 *Seu Saldo Atual*

Saldo: R$ {balance} {balanceEmoji}

📊 *Últimas Transações*
{transactionsList}

💡 *Dicas*
• Use "📊 extrato" para ver todas as transações
• Use "📈 relatório" para ver relatórios detalhados
• Use "❓ ajuda" para ver mais opções
`;

const EXTRACT_INFO = `
📊 *Seu Extrato*

{transactionsList}

💡 *Dicas*
• Use "💰 saldo" para ver seu saldo atual
• Use "📈 relatório" para ver relatórios
• Use "❓ ajuda" para ver mais opções
`;

const REPORT_INFO = `
📈 *Relatório {period}*

💰 *Resumo*
• Receitas: R$ {income}
• Despesas: R$ {expenses}
• Saldo: R$ {balance} {balanceEmoji}

📊 *Detalhes por Categoria*
{categoryDetails}

💡 *Dicas*
• Use "💰 saldo" para ver seu saldo atual
• Use "📊 extrato" para ver todas as transações
• Use "❓ ajuda" para ver mais opções
`;

const REPORT_ERROR = `
❌ *Não consegui gerar o relatório*

💡 *Tente usar:*
• "📈 relatório hoje"
• "📈 relatório semana"
• "📈 relatório mês"
• "📈 relatório ano"

Use "❓ ajuda" para ver mais opções.
`;

const HELP_MESSAGE = null;

const HELP_DETAILS = {
  saldo: `
💰 *Comando: Saldo*

Mostra seu saldo atual e últimas transações.

Exemplo: "💰 saldo"
`,
  extrato: `
📊 *Comando: Extrato*

Mostra suas transações.

Exemplos:
• "📊 extrato" - Ver todas as transações
• "📊 extrato dia 15/03" - Ver transações de um dia específico
• "📊 extrato ontem" - Ver transações de ontem
• "📊 extrato mês passado" - Ver transações do mês passado
`,
  relatorio: `
📈 *Comando: Relatório*

Mostra um relatório detalhado do período especificado.

Exemplos:
• "📈 relatório hoje"
• "📈 relatório semana"
• "📈 relatório mês"
• "📈 relatório ano"
`,
  ganhei: `
💰 *Comando: Registrar Receita*

Registra uma nova receita.

Exemplos:
• "ganhei 1000 de salário"
• "ganhei 500 de freela"
• "ganhei 200 dia 15/03" (data específica)
• "ganhei 300 ontem"
`,
  gastei: `
💸 *Comando: Registrar Despesa*

Registra uma nova despesa.

Exemplos:
• "gastei 50 em almoço"
• "gastei 200 em compras"
• "gastei 100 dia 10/03" (data específica)
• "gastei 150 ontem"
`,
};

const BALANCE_RESPONSE = `
💰 *Seu Saldo*
━━━━━━━━━━━━━━━━━━━━━

🏦 *R$ {balance}*
{status_emoji} Status: {status}

📊 *Resumo Rápido:*
• Últimas receitas: R$ {total_receitas:.2f}
• Últimas despesas: R$ {total_despesas:.2f}
`;

const STATEMENT_RESPONSE = `
📋 *Seu Extrato*
━━━━━━━━━━━━━━━━━━━━━

📊 *Resumo:*
• Receitas: R$ {total_receitas:.2f}
• Despesas: R$ {total_despesas:.2f}
• Saldo: R$ {saldo:.2f}

🔍 *Últimas Transações:*
{transactions_list}
`;

const REPORT_RESPONSE = `
📊 *Relatório {period_name}*
━━━━━━━━━━━━━━━━━━━━━

💰 *Resumo Financeiro*
• Receitas: R$ {receitas:.2f} ({num_receitas} transações)
• Despesas: R$ {despesas:.2f} ({num_despesas} transações)
• Saldo: {saldo_emoji} R$ {saldo:.2f}

📈 *Médias*
• Receita média: R$ {media_receitas:.2f}
• Despesa média: R$ {media_despesas:.2f}

🏷️ *Top 5 Categorias*
{lista_categorias}

💡 *Dicas*
• Digite 'relatório categoria [nome]' para mais detalhes
• Use 'relatório [diário/semanal/mensal/anual]'
`;

const CATEGORY_REPORT_RESPONSE = `
📊 *Relatório da Categoria: {category}*

💰 *Resumo:*
📈 Total gasto: R$ {total:.2f}
📊 Média por transação: R$ {media:.2f}
🔄 Última transação: R$ {ultima:.2f}

{meses_list}
`;

const EDIT_RESPONSE = `
✅ {tipo} atualizada!

💰 Valor: R$ {valor:.2f}
📝 Descrição: {description}
🏷️ Categoria: {category}
`;

const NO_TRANSACTIONS = "Nenhuma transação encontrada.";
const NO_TRANSACTIONS_BALANCE =
  "Nenhuma transação encontrada. Seu saldo é R$ 0,00";
const NO_TRANSACTIONS_STATEMENT =
  "Nenhuma transação encontrada no seu extrato.";
const NO_TRANSACTIONS_CATEGORY =
  "❌ Nenhuma transação encontrada na categoria '{category}'";

async function generateDynamicResponse(context) {
  try {
    const hora = new Date().toLocaleTimeString("pt-BR");
    const horaNum = parseInt(hora.split(":")[0]);
    let saudacao = "";

    if (horaNum >= 5 && horaNum < 12) {
      saudacao = "Bom dia";
    } else if (horaNum >= 12 && horaNum < 18) {
      saudacao = "Boa tarde";
    } else {
      saudacao = "Boa noite";
    }

    let prompt = `Você é o FinControl, um assistente financeiro amigável via WhatsApp.
    Responda de forma curta e objetiva, usando emojis e formatação adequada.

    Contexto atual:
    - Saudação: ${saudacao}
    - Hora: ${hora}
    - Tipo de mensagem: ${context.type}
    - Mensagem do usuário: ${context.message || ""}
    - Nome do usuário: ${context.userName || "Usuário"}`;

    // Se for uma solicitação de conselho financeiro, adiciona o contexto financeiro
    if (context.type === "FINANCIAL_ADVICE" && context.financialContext) {
      const message = context.message?.toLowerCase() || "";
      const isAdvice = message.includes("conselhos");
      const isTips = message.includes("dicas");

      prompt += `

      Contexto Financeiro:
      - Saldo atual: ${context.financialContext.balance}
      - Receitas do mês: ${context.financialContext.monthlyIncome}
      - Despesas do mês: ${context.financialContext.monthlyExpenses}
      - Categorias com mais gastos: ${
        context.financialContext.topExpenseCategories
      }
      - Tendências: ${context.financialContext.trends}

      ${
        isAdvice
          ? `
      Gere uma análise financeira estratégica seguindo EXATAMENTE este formato:

      💡 *Análise Financeira Estratégica*
      ━━━━━━━━━━━━━━━━━━━━━

      💰 [Primeiro Parágrafo - Avaliação do Cenário]
      Analise o saldo atual e tendências, destaque pontos positivos e pontos de atenção, mencione padrões de gastos identificados.

      🎯 [Segundo Parágrafo - Recomendações Estratégicas]
      Sugira melhorias específicas para cada categoria, proponha metas financeiras realistas, inclua sugestões de investimentos.

      🚀 [Terceiro Parágrafo - Plano de Ação]
      Liste 2-3 ações concretas para implementar agora, mantenha o tom motivador e profissional.

      IMPORTANTE:
      1. Siga exatamente este formato, incluindo os emojis e a formatação markdown
      2. Não inclua títulos adicionais
      3. Não use listas com bullets (•) no texto
      4. Escreva em parágrafos contínuos
      5. Use os emojis sugeridos no início de cada parágrafo
      6. Mantenha o tom profissional e estratégico
      7. Não adicione linhas em branco extras entre os parágrafos`
          : isTips
          ? `
      Gere dicas práticas de economia seguindo EXATAMENTE este formato:

      💡 *Dicas Práticas de Economia*
      ━━━━━━━━━━━━━━━━━━━━━

      💡 [Primeiro Parágrafo - Dicas para Categorias Principais]
      Sugira reduções específicas de gastos, foque nas categorias com mais despesas.

      ✨ [Segundo Parágrafo - Truques do Dia a Dia]
      Dê exemplos práticos e acionáveis, sugira substituições inteligentes, inclua dicas de economia doméstica.

      🌱 [Terceiro Parágrafo - Hábitos Positivos]
      Liste 2-3 hábitos simples para implementar, mantenha o tom leve e motivador.

      IMPORTANTE:
      1. Siga exatamente este formato, incluindo os emojis e a formatação markdown
      2. Não inclua títulos adicionais
      3. Não use listas com bullets (•) no texto
      4. Escreva em parágrafos contínuos
      5. Use os emojis sugeridos no início de cada parágrafo
      6. Mantenha o tom leve e motivador
      7. Não adicione linhas em branco extras entre os parágrafos`
          : `Gere uma análise financeira personalizada seguindo EXATAMENTE este formato:

      💡 *Análise Financeira Personalizada*
      ━━━━━━━━━━━━━━━━━━━━━

      💰 [Primeiro Parágrafo - Avaliação do Cenário]
      Analise o saldo atual e tendências, destaque pontos positivos e pontos de atenção, mencione padrões de gastos identificados.

      🎯 [Segundo Parágrafo - Recomendações Específicas]
      Sugira melhorias para cada categoria, proponha metas financeiras realistas, inclua sugestões de investimentos.

      🚀 [Terceiro Parágrafo - Ações Práticas]
      Liste 2-3 ações concretas para implementar, mantenha o tom motivador e profissional.

      IMPORTANTE:
      1. Siga exatamente este formato, incluindo os emojis e a formatação markdown
      2. Não inclua títulos adicionais
      3. Não use listas com bullets (•) no texto
      4. Escreva em parágrafos contínuos
      5. Use os emojis sugeridos no início de cada parágrafo
      6. Mantenha o tom profissional e motivador
      7. Não adicione linhas em branco extras entre os parágrafos`
      }`;
    } else {
      prompt += `

      Regras para a resposta:
      1. Use emojis relevantes (💰, 📊, 💡, etc)
      2. Use formatação markdown para destaque (*texto*)
      3. Mantenha a resposta em 2-3 linhas no máximo
      4. Seja direto e amigável
      5. Não liste comandos, apenas mencione que existem
      6. Use quebras de linha para melhor legibilidade

      Exemplo de estilo:
      👋 *Bom dia, {nome}!*

      Como posso te ajudar hoje? Use "❓ ajuda" para ver os comandos disponíveis.`;
    }

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: context.type === "FINANCIAL_ADVICE" ? 500 : 150,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      system:
        context.type === "FINANCIAL_ADVICE"
          ? context.message?.toLowerCase().includes("conselhos")
            ? "Você é um consultor financeiro estratégico especializado em análise de gastos pessoais. Suas respostas devem seguir EXATAMENTE o formato solicitado, incluindo emojis e formatação markdown."
            : "Você é um especialista em economia doméstica e dicas práticas de finanças. Suas respostas devem seguir EXATAMENTE o formato solicitado, incluindo emojis e formatação markdown."
          : "Você é um consultor financeiro especializado em análise de gastos pessoais. Suas respostas devem seguir EXATAMENTE o formato solicitado, incluindo emojis e formatação markdown.",
    });

    return response.content[0].text;
  } catch (error) {
    console.error("Erro ao gerar resposta dinâmica:", error);
    return null;
  }
}

async function generateResponse(context) {
  // Para mensagens que podem ser dinâmicas
  if (
    context.type === "WELCOME_REGISTERED_USER" ||
    context.type === "REGISTRATION_INFO" ||
    context.type === "ERROR" ||
    context.type === "UNKNOWN_COMMAND" ||
    context.type === "FINANCIAL_ADVICE"
  ) {
    const dynamicResponse = await generateDynamicResponse(context);
    if (dynamicResponse) {
      return dynamicResponse;
    }
  }

  // Para outras mensagens, mantém o comportamento padrão
  switch (context.type) {
    case "REGISTRATION_INFO":
      return REGISTRATION_INFO.replace("{siteUrl}", context.siteUrl);
    case "WELCOME_REGISTERED_USER":
      return WELCOME_REGISTERED_USER.replace("{name}", context.userName);
    case "ERROR":
      return ERROR_MESSAGE.replace("{error}", context.errorMessage);
    case "TRANSACTION":
      switch (context.step) {
        case "CONFIRMATION":
          return TRANSACTION_CONFIRMATION.replace(
            "{type}",
            context.type === "EXPENSE" ? "despesa" : "receita"
          )
            .replace("{amount}", context.amount)
            .replace("{description}", context.description)
            .replace("{category}", context.category)
            .replace("{date}", context.date);
        case "ERROR":
          return TRANSACTION_ERROR.replace("{error}", context.errorMessage);
        default:
          return "Desculpe, ocorreu um erro ao processar sua transação.";
      }
    case "UNKNOWN_COMMAND":
      return "❌ Comando não reconhecido. Use 'ajuda' para ver os comandos disponíveis.";
    case "HELP_MESSAGE":
    case "HELP_DETAILS":
    case "BALANCE":
    case "STATEMENT":
    case "REPORT":
    case "CATEGORY_REPORT":
    case "EDIT":
    case "DELETE":
      // Encaminhar para o backend
      return null;
    default:
      return "Desculpe, não entendi sua solicitação.";
  }
}

// Função para enriquecer o contexto com informações adicionais
function enrichContext(context) {
  const enriched = { ...context };

  // Update balance formatting to ensure correct sign
  if (enriched.balance !== undefined) {
    const balanceValue = Number(enriched.balance);
    enriched.formattedBalance = formatCurrency(Math.abs(balanceValue));
    enriched.isNegative = balanceValue < 0;
    enriched.balanceEmoji = getBalanceEmoji(balanceValue);
    enriched.formattedFullBalance = `${balanceValue < 0 ? "-" : ""}R$ ${
      enriched.formattedBalance
    }`;
  }

  // Update transaction formatting to include proper sign
  if (enriched.transactions && Array.isArray(enriched.transactions)) {
    enriched.formattedTransactions = enriched.transactions.map((t) => ({
      ...t,
      formattedAmount: `${t.type === "EXPENSE" ? "-" : ""}R$ ${formatCurrency(
        t.amount
      )}`,
      emoji: t.type === "EXPENSE" ? "💸" : "💰",
      formattedDate: formatDate(t.date || new Date()),
    }));

    // Calcular totais das últimas transações
    const lastTransactions = enriched.transactions.slice(0, 5);
    enriched.lastIncome = formatCurrency(
      lastTransactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + Number(t.amount), 0)
    );
    enriched.lastExpense = formatCurrency(
      lastTransactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
    );

    // Criar uma lista formatada para exibição
    enriched.transactionsList = enriched.formattedTransactions
      .slice(0, 5) // Limitar a 5 transações
      .map(
        (t) =>
          `${t.type === "EXPENSE" ? "📤" : "📥"} *${
            t.type === "EXPENSE" ? "Despesa" : "Receita"
          }*
          💰 Valor: R$ ${formatCurrency(t.amount)}
          📝 Descrição: ${t.description}
          📅 Data: ${t.formattedDate}
          ━━━━━━━━━━━━━━━`
      )
      .join("\n\n");

    // Adicionar indicador se houver mais transações
    if (enriched.transactions.length > 5) {
      enriched.transactionsList += `\n\n... e mais ${
        enriched.transactions.length - 5
      } transações`;
    }
  }

  // Enriquecer relatórios se existirem
  if (enriched.report) {
    enriched.report.formattedIncome = formatCurrency(
      enriched.report.income || 0
    );
    enriched.report.formattedExpenses = formatCurrency(
      enriched.report.expenses || 0
    );
    enriched.report.formattedBalance = formatCurrency(
      enriched.report.balance || 0
    );
    enriched.report.balanceEmoji = getBalanceEmoji(
      enriched.report.balance || 0
    );
  }

  // Adicionar tratamento específico para erros de relatório
  if (enriched.type === "ERROR" && enriched.errorType === "REPORT_ERROR") {
    enriched.errorDetails = {
      message: "Erro ao gerar relatório",
      period: enriched.errorMessage[0]?.input,
      reason: enriched.errorMessage[0]?.msg,
    };
  }

  return enriched;
}

// Função para formatar valores monetários
function formatCurrency(value) {
  const absValue = Math.abs(Number(value) || 0);
  return absValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Função para obter emoji baseado no saldo
function getBalanceEmoji(balance) {
  const value = Number(balance) || 0;
  if (value > 0) return "💰";
  if (value < 0) return "⚠️";
  return "📊";
}

// Função para formatar datas
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

module.exports = { generateResponse };
