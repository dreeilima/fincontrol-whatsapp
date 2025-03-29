const axios = require("axios");
const config = require("../config");

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: config.API_URL,
      headers: {
        Authorization: `Bearer ${config.API_KEY}`,
        "Content-Type": "application/json",
      },
    });
  }

  async registerTransaction(data) {
    try {
      const response = await this.api.post("/transactions", data);
      return response.data;
    } catch (error) {
      console.error(
        "Erro ao registrar transação:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getBalance(userId) {
    try {
      const response = await this.api.get(`/users/${userId}/balance`);
      return response.data;
    } catch (error) {
      console.error(
        "Erro ao obter saldo:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getStatement(userId, params = {}) {
    try {
      const response = await this.api.get(`/users/${userId}/statement`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Erro ao obter extrato:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getReport(userId, period) {
    try {
      const response = await this.api.get(`/users/${userId}/report`, {
        params: { period },
      });
      return response.data;
    } catch (error) {
      console.error(
        "Erro ao obter relatório:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getCategoryReport(userId, category) {
    try {
      const response = await this.api.get(
        `/users/${userId}/report/category/${category}`
      );
      return response.data;
    } catch (error) {
      console.error(
        "Erro ao obter relatório de categoria:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async updateTransaction(transactionId, data) {
    try {
      const response = await this.api.put(
        `/transactions/${transactionId}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error(
        "Erro ao atualizar transação:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

module.exports = new ApiService();
