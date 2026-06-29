const axios = require('axios');

class QuestAPI {
  constructor(userToken) {
    this.token = userToken;
    this.client = axios.create({
      baseURL: 'https://discordapp.com/api/v10',
      headers: {
        'Authorization': `Bot ${userToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
  }

  // Validar token
  async validateToken() {
    try {
      const response = await this.client.get('/users/@me');
      return response.data;
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }

  // Obter quests disponíveis
  async getQuests() {
    try {
      const response = await this.client.get('/users/@me/quests');
      return response.data || [];
    } catch (error) {
      console.error('Erro ao obter quests:', error.message);
      return [];
    }
  }

  // Aceitar uma quest por ID
  async acceptQuest(questId) {
    try {
      const response = await this.client.post(`/quests/${questId}/accept`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Completar uma quest
  async completeQuest(questId) {
    try {
      const response = await this.client.post(`/quests/${questId}/complete`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Obter detalhes de uma quest específica
  async getQuestDetails(questId) {
    try {
      const response = await this.client.get(`/quests/${questId}`);
      return response.data;
    } catch (error) {
      throw new Error('Não foi possível obter detalhes da quest');
    }
  }

  // Listar quests em andamento
  async getInProgressQuests() {
    try {
      const response = await this.client.get('/users/@me/quests?status=in_progress');
      return response.data || [];
    } catch (error) {
      return [];
    }
  }
}

module.exports = QuestAPI;
