const axios = require("axios");
const { generateResponse } = require("./claude");
const {
  extractCategoryAndDescription,
  detectarCategoriaAutomatica,
  sendMessageWithTyping,
} = require("./utils");
const { API_URL } = require("../config");
const { v4: uuidv4 } = require("uuid");

const RegistrationState = {
  WAITING_EMAIL: "WAITING_EMAIL",
  WAITING_NAME: "WAITING_NAME",
  WAITING_PASSWORD: "WAITING_PASSWORD",
};

async function handleRegistration(
  from,
  text,
  phone,
  registrationState,
  client,
  registrationStates
) {
  try {
    console.log("\n=== PROCESSANDO REGISTRO ===");
    console.log("Estado atual:", registrationState.state);
    console.log("Dados:", registrationState.data);

    if (registrationState.state === RegistrationState.WAITING_EMAIL) {
      const email = text.trim().toLowerCase();

      // Validar formato do email
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        const invalidEmailContext = {
          type: "REGISTRATION",
          step: "ERROR",
          errorType: "INVALID_EMAIL",
        };
        const invalidEmailMessage = await generateResponse(invalidEmailContext);
        await sendMessageWithTyping(client, from, invalidEmailMessage);
        return true;
      }

      registrationState.data.email = email;
      registrationState.state = RegistrationState.WAITING_NAME;

      const emailConfirmedContext = {
        type: "REGISTRATION",
        step: "EMAIL_CONFIRMED",
        nextStep: "NAME_REQUEST",
        email: email,
      };

      const emailConfirmedMessage = await generateResponse(
        emailConfirmedContext
      );
      await sendMessageWithTyping(client, from, emailConfirmedMessage);
      return true;
    }

    if (registrationState.state === RegistrationState.WAITING_NAME) {
      const name = text.trim();
      registrationState.data.name = name;
      registrationState.state = RegistrationState.WAITING_PASSWORD;

      const nameConfirmedContext = {
        type: "REGISTRATION",
        step: "NAME_CONFIRMED",
        nextStep: "PASSWORD_REQUEST",
        name: name,
        email: registrationState.data.email,
      };

      const nameConfirmedMessage = await generateResponse(nameConfirmedContext);
      await sendMessageWithTyping(client, from, nameConfirmedMessage);
      return true;
    }

    if (registrationState.state === RegistrationState.WAITING_PASSWORD) {
      const userData = {
        id: uuidv4(),
        email: registrationState.data.email,
        name: registrationState.data.name,
        password: text,
        phone: phone,
      };

      console.log("Enviando dados do usuário:", userData);

      try {
        await axios.post(`${API_URL}/users/register`, userData);

        const successContext = {
          type: "REGISTRATION",
          step: "SUCCESS",
          name: userData.name,
        };

        const successMessage = await generateResponse(successContext);
        await sendMessageWithTyping(client, from, successMessage);
        registrationStates.delete(phone);
      } catch (error) {
        if (
          error.response?.data?.detail?.includes("Unique constraint failed")
        ) {
          const errorContext = {
            type: "REGISTRATION",
            step: "ERROR",
            errorType: "EMAIL_EXISTS",
            email: userData.email,
          };

          const errorMessage = await generateResponse(errorContext);
          await sendMessageWithTyping(client, from, errorMessage);

          registrationState.state = RegistrationState.WAITING_EMAIL;
          registrationState.data = {};
        } else {
          const errorContext = {
            type: "REGISTRATION",
            step: "ERROR",
            errorType: "GENERAL",
            errorMessage: error.message,
          };

          const errorMessage = await generateResponse(errorContext);
          await sendMessageWithTyping(client, from, errorMessage);
        }
      }
      return true;
    }
  } catch (error) {
    console.error("Erro no registro:", error);
    const errorContext = {
      type: "REGISTRATION",
      step: "ERROR",
      errorType: "GENERAL",
      errorMessage: error.message,
    };

    const errorMessage = await generateResponse(errorContext);
    await sendMessageWithTyping(client, from, errorMessage);
    return false;
  }
}

// Remover todos os tipos de relatório exceto o mensal
const REPORT_TYPES = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
};

const normalizarValor = (valor) => {
  // Remove R$ e espaços
  valor = valor.replace(/R\$\s*/gi, "").trim();

  // Remove pontos de milhar e substitui vírgula por ponto
  valor = valor.replace(/\./g, "").replace(",", ".");

  // Converte para número
  const numero = parseFloat(valor);

  // Verifica se é um número válido
  if (isNaN(numero)) {
    throw new Error("Valor inválido");
  }

  return numero;
};

const detectarData = (texto) => {
  texto = texto.toLowerCase();
  const hoje = new Date();

  console.log("\n=== PROCESSANDO DATA ===");
  console.log("Texto recebido:", texto);

  // Ajusta para o fuso horário de Brasília (UTC-3)
  hoje.setUTCHours(0, 0, 0, 0);
  console.log("Data atual:", hoje.toLocaleString("pt-BR"));

  // Detectar data específica (dd/mm)
  const dataEspecifica = texto.match(/dia (\d{1,2})(\/\d{1,2})?/);
  if (dataEspecifica) {
    const [_, dia, mesStr] = dataEspecifica;
    let mes = mesStr ? parseInt(mesStr.substring(1)) - 1 : hoje.getMonth();
    let ano = hoje.getFullYear();

    console.log("Data específica encontrada:", { dia, mes: mes + 1 });

    // Lógica para datas futuras
    if (mes < hoje.getMonth()) {
      // Se o mês é menor que o atual, assumimos que é do próximo ano
      ano = hoje.getFullYear() + 1;
    } else if (mes === hoje.getMonth() && parseInt(dia) < hoje.getDate()) {
      // Se é o mesmo mês mas o dia já passou, assumimos próximo mês
      mes = mes + 1;
    }

    // Criar data no fuso de Brasília
    const data = new Date(ano, mes, parseInt(dia));
    data.setHours(0, 0, 0, 0);

    console.log("Data definida:", data.toLocaleString("pt-BR"));
    return data;
  }

  // Suporte para datas relativas
  if (texto.includes("ontem")) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - 1);
    console.log("Data definida como ontem:", data.toLocaleString("pt-BR"));
    return data;
  }

  // Suporte para "próximo mês" ou "mês que vem"
  if (texto.includes("próximo mês") || texto.includes("mes que vem")) {
    const data = new Date(hoje);
    data.setMonth(hoje.getMonth() + 1);
    console.log(
      "Data definida para próximo mês:",
      data.toLocaleString("pt-BR")
    );
    return data;
  }

  console.log(
    "Nenhuma data específica encontrada, usando hoje:",
    hoje.toLocaleString("pt-BR")
  );
  return hoje;
};

async function handleCommands(from, text, phone, client) {
  try {
    phone = phone.replace("@c.us", "");
    // Remover o + se existir
    phone = phone.replace(/^\+/, "");

    console.log("\n=== PROCESSANDO COMANDO ===");
    console.log("Telefone formatado:", phone);

    // Verificar se o usuário existe
    try {
      const userResponse = await axios.get(`${API_URL}/users/phone/${phone}`);
      console.log("Resposta da API:", userResponse.data);

      if (!userResponse.data || !userResponse.data.id) {
        throw new Error("Usuário não encontrado");
      }

      const userId = userResponse.data.id;
      const userName = userResponse.data.name;

      console.log("Usuário encontrado:", { userId, userName });

      const lowerText = text.toLowerCase();

      // Verificar saudações
      const saudacoes = [
        "oi",
        "olá",
        "ola",
        "bom dia",
        "boa tarde",
        "boa noite",
        "ei",
        "hey",
        "hello",
      ];

      if (saudacoes.includes(lowerText)) {
        const welcomeContext = {
          type: "WELCOME_REGISTERED_USER",
          userName: userName,
          userId: userId,
          message: text
        };

        const welcomeMessage = await generateResponse(welcomeContext);
        await sendMessageWithTyping(client, from, welcomeMessage);
        return true;
      }

      // Verificar comando de ajuda
      if (lowerText === "ajuda" || lowerText === "❓ ajuda") {
        try {
          const response = await axios.post(`${API_URL}/whatsapp/webhook`, {
            type: "HELP_MESSAGE",
            phone: phone,
            user_id: userId
          });
          await sendMessageWithTyping(client, from, response.data.message);
          return true;
        } catch (error) {
          console.error("Erro ao processar comando de ajuda:", error);
          await sendMessageWithTyping(
            client,
            from,
            "❌ Desculpe, tive um problema ao processar sua solicitação. Tente novamente mais tarde."
          );
          return true;
        }
      }

      // Verificar ajuda específica para comando
      if (lowerText.startsWith("ajuda ")) {
        try {
          const command = lowerText.split(" ")[1];
          const payload = {
            type: "HELP_DETAILS",
            phone: phone,
            user_id: userId,
            command: command
          };
          
          const response = await axios.post(
            `${API_URL}/whatsapp/webhook`,
            payload
          );
          await sendMessageWithTyping(client, from, response.data.message);
          return true;
        } catch (error) {
          console.error("Erro ao mostrar ajuda específica:", error);
          await sendMessageWithTyping(
            client,
            from,
            "❌ Desculpe, ocorreu um erro ao mostrar a ajuda. Tente novamente."
          );
          return true;
        }
      }

      // Atualizar os padrões para aceitar mais formatos e datas
      const incomePattern =
        /ganhei\s+R?\$?\s*([0-9]+(?:\.[0-9]+)*(?:,[0-9]{2})?|\d+(?:\.\d{2})?)\s+(?:(?:em|de)\s+)?(.+?)(?:\s+dia\s+\d{1,2}(?:\/\d{1,2})?)?$/i;
      const expensePattern =
        /gastei\s+R?\$?\s*([0-9]+(?:\.[0-9]+)*(?:,[0-9]{2})?|\d+(?:\.\d{2})?)\s+(?:(?:em|de)\s+)?(.+?)(?:\s+dia\s+\d{1,2}(?:\/\d{1,2})?)?$/i;

      const incomeMatch = text.match(incomePattern);
      if (incomeMatch) {
        try {
          const [_, rawAmount, description] = incomeMatch;
          console.log("\n=== PROCESSANDO RECEITA ===");
          console.log("Valor bruto:", rawAmount);

          const amount = normalizarValor(rawAmount);
          console.log("Valor normalizado:", amount);
          console.log("Descrição completa:", description);

          // Processar a data antes de limpar a descrição
          const data = detectarData(text);
          console.log("Data detectada:", data);

          // Detectar categoria usando a função do utils.js
          const categoria = detectarCategoriaAutomatica(text, "INCOME");
          console.log("Categoria detectada:", categoria);

          // Limpar a descrição após processar a data
          const descricaoLimpa = description
            .replace(/\s+dia\s+\d{1,2}(?:\/\d{1,2})?\s*$/gi, "")
            .trim();

          const payload = {
            type: "INCOME",
            phone: phone,
            user_id: userId,
            amount: amount,
            description: descricaoLimpa,
            category: categoria,
            date: data.toISOString(),
          };

          console.log("Enviando dados:", payload);
          const response = await axios.post(
            `${API_URL}/whatsapp/webhook`,
            payload
          );
          console.log("Resposta do webhook:", response.data);

          await sendMessageWithTyping(client, from, response.data.message);
        } catch (error) {
          console.error("Erro ao registrar receita:", error);
          const errorContext = {
            type: "ERROR",
            errorType: "INCOME_ADD",
            errorMessage: error.message,
          };
          const errorMessage = await generateResponse(errorContext);
          await sendMessageWithTyping(client, from, errorMessage);
        }
        return true;
      }

      const expenseMatch = text.match(expensePattern);
      if (expenseMatch) {
        try {
          const [_, rawAmount, description] = expenseMatch;
          console.log("\n=== PROCESSANDO DESPESA ===");
          console.log("Valor bruto:", rawAmount);

          const amount = normalizarValor(rawAmount);
          console.log("Valor normalizado:", amount);
          console.log("Descrição completa:", description);

          // Processar a data antes de limpar a descrição
          const data = detectarData(text);
          console.log("Data detectada:", data);

          // Detectar categoria usando a função do utils.js
          const categoria = detectarCategoriaAutomatica(text, "EXPENSE");
          console.log("Categoria detectada:", categoria);

          // Limpar a descrição após processar a data
          const descricaoLimpa = description
            .replace(/\s+dia\s+\d{1,2}(?:\/\d{1,2})?\s*$/gi, "")
            .trim();

          const payload = {
            type: "EXPENSE",
            phone: phone,
            user_id: userId,
            amount: amount,
            description: descricaoLimpa,
            category: categoria,
            date: data.toISOString().split("T")[0] + "T00:00:00.000Z", // Força o horário para 00:00:00
          };

          console.log("Enviando despesa:", payload);
          const response = await axios.post(
            `${API_URL}/whatsapp/webhook`,
            payload
          );
          console.log("Resposta do webhook:", response.data);

          await sendMessageWithTyping(client, from, response.data.message);
        } catch (error) {
          console.error("Erro detalhado:", error.response?.data);
          const errorContext = {
            type: "ERROR",
            errorType: "EXPENSE_ADD",
            errorMessage: error.response?.data?.detail || error.message,
          };
          const errorMessage = await generateResponse(errorContext);
          await sendMessageWithTyping(client, from, errorMessage);
        }
        return true;
      }

      if (lowerText === "saldo" || lowerText === "💰 saldo") {
        try {
          const balanceResponse = await axios.post(
            `${API_URL}/whatsapp/webhook`,
            {
              type: "BALANCE",
              phone: phone,
              user_id: userId,
            }
          );

          await sendMessageWithTyping(
            client,
            from,
            balanceResponse.data.message
          );
        } catch (error) {
          console.error(
            "Erro ao verificar saldo:",
            error.response?.data || error
          );
          const errorContext = {
            type: "ERROR",
            errorType: "BALANCE_CHECK",
            errorMessage: error.response?.data?.detail || error.message,
          };

          const errorMessage = await generateResponse(errorContext);
          await sendMessageWithTyping(client, from, errorMessage);
        }
        return true;
      }

      if (
        lowerText.startsWith("relatorio") ||
        lowerText.startsWith("relatório")
      ) {
        try {
          const words = lowerText.split(" ");
          
          // Verificar se é um relatório de categoria
          if (words.length > 2 && words[1].toLowerCase() === "categoria") {
            const category = words.slice(2).join(" ");
            console.log("\n=== GERANDO RELATÓRIO DE CATEGORIA ===");
            console.log("Categoria:", category);
            
            const payload = {
              type: "CATEGORY_REPORT",
              phone: phone,
              user_id: userId,
              category: category
            };
            
            const response = await axios.post(
              `${API_URL}/whatsapp/webhook`,
              payload
            );
            await sendMessageWithTyping(client, from, response.data.message);
            return true;
          }
          
          // Relatório normal
          let reportType = REPORT_TYPES.MONTHLY; // padrão

          if (words.length > 1) {
            switch (words[1].toLowerCase()) {
              case "diário":
              case "diario":
                reportType = REPORT_TYPES.DAILY;
                break;
              case "semanal":
                reportType = REPORT_TYPES.WEEKLY;
                break;
              case "mensal":
                reportType = REPORT_TYPES.MONTHLY;
                break;
              case "anual":
                reportType = REPORT_TYPES.YEARLY;
                break;
            }
          }

          const payload = {
            type: "REPORT",
            phone: phone,
            user_id: userId,
            period: reportType,
          };

          const response = await axios.post(
            `${API_URL}/whatsapp/webhook`,
            payload
          );
          await sendMessageWithTyping(client, from, response.data.message);
        } catch (error) {
          console.error(
            "Erro ao gerar relatório:",
            error.response?.data || error
          );
          const errorContext = {
            type: "ERROR",
            errorType: "REPORT_ERROR",
            errorMessage: error.response?.data?.detail || error.message,
          };

          const errorMessage = await generateResponse(errorContext);
          await sendMessageWithTyping(client, from, errorMessage);
        }
        return true;
      }

      if (lowerText === "extrato" || lowerText === "📊 extrato") {
        try {
          const response = await axios.post(`${API_URL}/whatsapp/webhook`, {
            type: "STATEMENT",
            phone: phone,
            user_id: userId,
          });

          await sendMessageWithTyping(client, from, response.data.message);
        } catch (error) {
          console.error(
            "Erro ao buscar extrato:",
            error.response?.data || error
          );
          const errorContext = {
            type: "ERROR",
            errorType: "TRANSACTIONS_CHECK",
            errorMessage: error.response?.data?.detail || error.message,
          };

          const errorMessage = await generateResponse(errorContext);
          await sendMessageWithTyping(client, from, errorMessage);
        }
        return true;
      }

      if (lowerText.startsWith("editar")) {
        try {
          const words = lowerText.split(" ");
          if (words.length < 3) {
            await sendMessageWithTyping(
              client,
              from,
              "❌ Formato inválido. Use: editar #ID [novo valor]\nExemplo: editar #174000 150.00"
            );
            return true;
          }

          const id = words[1].replace("#", "");
          const newAmount = words[2];

          const payload = {
            type: "EDIT",
            phone: phone,
            user_id: userId,
            transaction_id: id,
            amount: newAmount
          };

          const response = await axios.post(
            `${API_URL}/whatsapp/webhook`,
            payload
          );
          await sendMessageWithTyping(client, from, response.data.message);
          return true;
        } catch (error) {
          console.error("Erro ao editar transação:", error);
          await sendMessageWithTyping(
            client,
            from,
            "❌ Erro ao editar transação. Verifique o ID e tente novamente."
          );
          return true;
        }
      } else if (lowerText.startsWith("excluir")) {
        try {
          const words = lowerText.split(" ");
          if (words.length !== 2) {
            await sendMessageWithTyping(
              client,
              from,
              "❌ Formato inválido. Use: excluir #ID\nExemplo: excluir #174000"
            );
            return true;
          }

          const id = words[1].replace("#", "");

          const payload = {
            type: "DELETE",
            phone: phone,
            user_id: userId,
            transaction_id: id
          };

          const response = await axios.post(
            `${API_URL}/whatsapp/webhook`,
            payload
          );
          await sendMessageWithTyping(client, from, response.data.message);
          return true;
        } catch (error) {
          console.error("Erro ao excluir transação:", error);
          await sendMessageWithTyping(
            client,
            from,
            "❌ Erro ao excluir transação. Verifique o ID e tente novamente."
          );
          return true;
        }
      } else if (lowerText.startsWith("ajuda")) {
        try {
          const words = lowerText.split(" ");
          let payload;
          
          if (words.length > 1) {
            // Ajuda específica para um comando
            const command = words[1];
            payload = {
              type: "HELP_DETAILS",
              phone: phone,
              user_id: userId,
              command: command
            };
          } else {
            // Ajuda geral
            payload = {
              type: "HELP_MESSAGE",
              phone: phone,
              user_id: userId
            };
          }
          
          const response = await axios.post(
            `${API_URL}/whatsapp/webhook`,
            payload
          );
          await sendMessageWithTyping(client, from, response.data.message);
          return true;
        } catch (error) {
          console.error("Erro ao mostrar ajuda:", error);
          await sendMessageWithTyping(
            client,
            from,
            "❌ Desculpe, ocorreu um erro ao mostrar a ajuda. Tente novamente."
          );
          return true;
        }
      }

      // Handler para conselhos financeiros
      if (text === "conselhos" || text === "dicas") {
        try {
          // Primeiro, buscar o contexto financeiro do usuário
          const financialContext = await axios.get(`${API_URL}/whatsapp/financial-context/${userId}`);
          
          // Criar o contexto para a resposta dinâmica
          const adviceContext = {
            type: "FINANCIAL_ADVICE",
            message: text,
            financialContext: financialContext.data,
            userName: userName
          };
          
          // Gerar resposta usando o Claude
          const response = await generateResponse(adviceContext);
          
          if (response) {
            await sendMessageWithTyping(client, from, response);
          } else {
            // Se não houver resposta do Claude, tentar usar o backend
            const backendResponse = await axios.post(`${API_URL}/whatsapp/webhook`, {
              type: "FINANCIAL_ADVICE",
              phone: phone,
              user_id: userId,
              financialContext: financialContext.data
            });
            await sendMessageWithTyping(client, from, backendResponse.data.message);
          }
          return true;
        } catch (error) {
          console.error("Erro ao processar solicitação de conselhos:", error);
          await sendMessageWithTyping(
            client,
            from,
            "❌ Desculpe, tive um problema ao analisar suas finanças. Tente novamente mais tarde."
          );
          return true;
        }
      }

      const unknownCommandContext = {
        type: "UNKNOWN_COMMAND",
        command: text,
      };

      const unknownCommandMessage = await generateResponse(
        unknownCommandContext
      );
      await sendMessageWithTyping(client, from, unknownCommandMessage);
      return true;
    } catch (error) {
      console.error(
        "Erro ao buscar usuário:",
        error.response?.data || error.message
      );

      // Se o usuário não existe, informar sobre o registro no site
      if (error.response?.status === 404) {
        const registrationInfoContext = {
          type: "REGISTRATION_INFO",
          siteUrl: "https://fincontrol.com.br/register",
        };

        const registrationInfoMessage = await generateResponse(
          registrationInfoContext
        );
        await sendMessageWithTyping(client, from, registrationInfoMessage);
        return true;
      }

      throw error;
    }
  } catch (error) {
    console.error("Erro completo:", error);
    const errorContext = {
      type: "ERROR",
      errorType: "USER_CHECK",
      errorMessage: error.response?.data?.detail || error.message,
    };

    const errorMessage = await generateResponse(errorContext);
    await sendMessageWithTyping(client, from, errorMessage);
    return false;
  }
}

module.exports = {
  handleCommands,
};
