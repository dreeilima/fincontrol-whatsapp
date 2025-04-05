require("dotenv").config();

console.log("\n=== DEBUG VARIÁVEIS DE AMBIENTE ===");
console.log(
  "process.env.ANTHROPIC_API_KEY:",
  process.env.ANTHROPIC_API_KEY ? "Presente" : "Ausente"
);
console.log(
  "process.env.ANTHROPIC_API_KEY length:",
  process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0
);

const config = {
  port: process.env.PORT || 3000,
  host: "0.0.0.0",
  publicUrl: process.env.PUBLIC_URL || "127.0.0.1",
  API_URL: process.env.API_URL || "http://127.0.0.1:8000",
  WHATSAPP_URL: process.env.WHATSAPP_URL || "http://127.0.0.1:3000",
  UPDATE_TOKEN: process.env.UPDATE_TOKEN,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
};

console.log("\n=== CONFIGURAÇÕES DO WHATSAPP SERVICE ===");
console.log("Host:", config.host);
console.log("Port:", config.port);
console.log("Public URL:", config.publicUrl);
console.log("API URL:", config.API_URL);
console.log("WhatsApp URL:", config.WHATSAPP_URL);
console.log(
  "ANTHROPIC_API_KEY:",
  config.ANTHROPIC_API_KEY ? "Presente" : "Ausente"
);

module.exports = config;
