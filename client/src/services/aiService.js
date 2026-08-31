import api from './api.js';

export const aiService = {
  async chatWithAI(messages, conversationId = null) {
    const { data } = await api.post('/ai/chat', { messages, conversationId });
    return data;
  },
  
  async getConversations() {
    const { data } = await api.get('/ai/conversations');
    return data.data;
  },

  async getConversation(id) {
    const { data } = await api.get(`/ai/conversations/${id}`);
    return data.data;
  },

  async deleteConversation(id) {
    const { data } = await api.delete(`/ai/conversations/${id}`);
    return data;
  },

  async generateGoalRoadmap(prompt) {
    const { data } = await api.post('/ai/goal-roadmap', { prompt });
    return data.data;
  },

  async summarizeNote(noteId) {
    const { data } = await api.post(`/ai/summarize-note/${noteId}`);
    return data.data;
  },

  async generateQuiz(noteId) {
    const { data } = await api.post(`/ai/quiz/${noteId}`);
    return data.data;
  }
};

export default aiService;
