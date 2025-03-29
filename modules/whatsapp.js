const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const {
  handleRegistration,
  handleCommands,
  RegistrationState,
} = require("./handlers");
const { sendMessageWithTyping } = require("./utils");

let qrCodeData = null;

// Inicializar o Map de estados de registro
const registrationStates = new Map();

async function connectToWhatsApp(registrationStates, setQRCode) {
  try {
    const client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
        headless: true,
      },
    });

    client.on("loading_screen", (percent, message) => {
      console.log("LOADING SCREEN", percent, message);
    });

    client.on("qr", async (qr) => {
      console.log("\n=== QR CODE GERADO ===");
      try {
        const qrImageUrl = await qrcode.generate(qr, { small: true });
        qrCodeData = qrImageUrl;
        if (setQRCode) {
          setQRCode(qrImageUrl);
        }
      } catch (error) {
        console.error("Erro ao gerar QR code:", error);
      }
    });

    client.on("ready", () => {
      console.log("\n=== WHATSAPP CONECTADO ===");
      console.log("Cliente pronto para receber mensagens");
    });

    client.on("authenticated", () => {
      console.log("\n=== AUTENTICAÇÃO BEM-SUCEDIDA ===");
    });

    client.on("auth_failure", (msg) => {
      console.error("\n=== FALHA NA AUTENTICAÇÃO ===");
      console.error("Erro:", msg);
    });

    client.on("disconnected", (reason) => {
      console.log("\n=== DESCONECTADO ===");
      console.log("Motivo:", reason);
      qrCodeData = null;
      setTimeout(() => {
        console.log("Tentando reconectar...");
        connectToWhatsApp(registrationStates, setQRCode);
      }, 5000);
    });

    client.on("message", async (message) => {
      const from = message.from;
      const text = message.body;

      if (!text) return;

      const phone = from.split("@")[0];

      console.log("\n=== MENSAGEM RECEBIDA ===");
      console.log("De:", phone);
      console.log("Mensagem:", text);

      try {
        if (registrationStates.has(phone)) {
          await handleRegistration(
            from,
            text,
            phone,
            registrationStates.get(phone),
            client,
            registrationStates
          );
        } else {
          const isCommand = await handleCommands(
            from,
            text,
            phone,
            client,
            registrationStates
          );

          if (!isCommand) {
            registrationStates.set(phone, {
              state: RegistrationState.WAITING_EMAIL,
              data: {},
            });

            await handleRegistration(
              from,
              text,
              phone,
              registrationStates.get(phone),
              client,
              registrationStates
            );
          }
        }
      } catch (error) {
        console.error("Erro ao processar mensagem:", error);
        await sendMessageWithTyping(
          client,
          from,
          "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente."
        );
      }
    });

    await client.initialize();
    return client;
  } catch (error) {
    console.error("Erro na conexão:", error);
    throw error;
  }
}

function checkClientHealth(client) {
  if (!client || !client.info) {
    console.log("\n=== VERIFICAÇÃO DE SAÚDE ===");
    console.log("Cliente desconectado. Tentando reconectar...");
    return false;
  }
  return true;
}

module.exports = {
  connectToWhatsApp,
  checkClientHealth,
  qrCodeData,
};
