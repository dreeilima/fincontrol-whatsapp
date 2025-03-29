require("dotenv").config();

module.exports = {
  API_URL: process.env.API_URL || "http://localhost:8000",
  API_KEY: process.env.API_KEY,
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
  PORT: process.env.PORT || 3000,
};
