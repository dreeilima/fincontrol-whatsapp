require("dotenv").config();

const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || "127.0.0.1",
  publicUrl: process.env.PUBLIC_URL || "127.0.0.1",
  API_URL: process.env.API_URL || "http://127.0.0.1:8000",
  WHATSAPP_URL: process.env.WHATSAPP_URL || "http://127.0.0.1:3000",
  UPDATE_TOKEN: process.env.UPDATE_TOKEN,
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
};

console.log("\n=== CONFIGURAÇÕES DO WHATSAPP SERVICE ===");
console.log("Host:", config.host);
console.log("Port:", config.port);
console.log("Public URL:", config.publicUrl);
console.log("API URL:", config.API_URL);
console.log("WhatsApp URL:", config.WHATSAPP_URL);

module.exports = config;
