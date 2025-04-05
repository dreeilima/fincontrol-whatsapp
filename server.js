const express = require("express");
const { connectToWhatsApp, checkClientHealth } = require("./modules/whatsapp");
const config = require("./config");

const app = express();
let qrCodeData = null;
const registrationStates = new Map();

// Setup express middleware
app.use(express.json({ limit: "50mb" }));

// QR Code route
app.get("/qr", (req, res) => {
  console.log("\n=== QR CODE REQUEST ===");
  console.log("Client IP:", req.ip);
  console.log("QR Code available:", !!qrCodeData);

  if (qrCodeData) {
    res.setHeader("Content-Type", "text/html");
    res.send(`
      <html>
        <head>
          <title>FinControl WhatsApp - QR Code</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="refresh" content="30">
        </head>
        <body style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; font-family: Arial, sans-serif;">
          <img src="${qrCodeData}" style="max-width: 100%; height: auto;" />
          <p style="margin-top: 20px; color: #075e54;">Escaneie o QR Code com seu WhatsApp</p>
          <p style="color: #666; font-size: 0.9em;">Esta página será atualizada automaticamente a cada 30 segundos</p>
        </body>
      </html>
    `);
  } else {
    res.setHeader("Content-Type", "text/html");
    res.status(503).send(`
      <html>
        <head>
          <title>FinControl WhatsApp - Aguardando</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="refresh" content="5">
        </head>
        <body style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; font-family: Arial, sans-serif;">
          <h2 style="color: #075e54;">Aguarde um momento...</h2>
          <p style="color: #128c7e;">O QR Code está sendo gerado. A página será atualizada automaticamente.</p>
          <p style="color: #666; font-size: 0.9em;">Atualizando em 5 segundos...</p>
        </body>
      </html>
    `);
  }
});

// Test route
app.get("/test", (req, res) => {
  console.log("\n=== TESTE DE ACESSO ===");
  console.log("Cliente acessou a rota /test");
  console.log("IP do cliente:", req.ip);
  res.send("Servidor está funcionando! Acesse /qr para ver o QR Code.");
});

// Status route
app.get("/status", (req, res) => {
  console.log("\n=== VERIFICAÇÃO DE STATUS ===");
  console.log("Cliente acessou a rota /status");
  console.log("IP do cliente:", req.ip);

  res.json({
    status: "online",
    serverTime: new Date().toISOString(),
    qrAvailable: !!qrCodeData,
    clientConnected:
      global.client && global.client.info && global.client.info.wid
        ? true
        : false,
  });
});

// Update file route
app.post("/update-file", async (req, res) => {
  const { path, content, token } = req.body;

  if (token !== process.env.UPDATE_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await require("fs").promises.writeFile(path, content, "utf8");
    console.log("File updated:", path);
    res.json({ success: true, message: "File updated successfully" });
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize server
const server = app
  .listen(config.port, "0.0.0.0", () => {
    console.log("\n=== SERVIDOR INICIADO ===");
    console.log(`Local: http://0.0.0.0:${config.port}/`);
    console.log(`Público: http://${config.publicUrl}:${config.port}/qr`);
    console.log(`IP Público: ${config.publicUrl}`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(
        `Port ${config.port} is in use. Trying port ${config.port + 1}`
      );
      server.listen(config.port + 1, "0.0.0.0");
    } else {
      console.error("Server error:", err);
    }
  });

// Initialize WhatsApp
async function initializeWhatsApp() {
  try {
    await connectToWhatsApp(registrationStates, (qr) => {
      qrCodeData = qr;
    });
    setInterval(checkClientHealth, 30 * 60 * 1000); // Check every 30 minutes
  } catch (error) {
    console.error("\n=== ERRO NA INICIALIZAÇÃO ===");
    console.error("Erro:", error);
    setTimeout(initializeWhatsApp, 30000);
  }
}

// Start the application
initializeWhatsApp();

// Log configuration
console.log("\n=== WHATSAPP SERVICE ===");
console.log(`URL: ${config.WHATSAPP_URL}`);
console.log(`API URL: ${config.API_URL}`);
