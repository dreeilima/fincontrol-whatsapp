const {
  detectarCategoriaAutomatica: detectarCategoriaAutomaticaBase,
} = require("./categories");

function extractCategoryAndDescription(args, defaultCategory = "outros") {
  const fullText = args.join(" ");
  let description = fullText;
  let category = defaultCategory;

  if (fullText.includes("#")) {
    const parts = fullText.split("#");
    description = parts[0].trim();
    category = parts[1].trim() || defaultCategory;
  }

  return { description, category };
}

function detectarCategoriaAutomatica(texto, tipo) {
  return detectarCategoriaAutomaticaBase(texto, tipo);
}

async function sendMessageWithTyping(client, to, message) {
  try {
    const chat = await client.getChatById(to);

    // Tenta iniciar o estado de digitação
    try {
      await chat.sendStateTyping();
    } catch (typingError) {
      console.log("Não foi possível iniciar estado de digitação");
    }

    // Delay fixo de 1 segundo
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Envia a mensagem
    await client.sendMessage(to, message);

    // Tenta parar o estado de digitação
    try {
      await chat.clearState();
    } catch (typingError) {
      console.log("Não foi possível finalizar estado de digitação");
    }
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    await client.sendMessage(to, message);
  }
}

module.exports = {
  extractCategoryAndDescription,
  detectarCategoriaAutomatica,
  sendMessageWithTyping,
};
