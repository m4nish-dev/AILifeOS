import api from './api.js';

export const studyService = {
  async startSession(sessionData) {
    const { data } = await api.post('/study/sessions', sessionData);
    return data.data.session;
  },
  
  async endSession(id, endData) {
    const { data } = await api.put(`/study/sessions/${id}/end`, endData);
    return data.data.session;
  },

  async getSessions(filters = {}) {
    const { data } = await api.get('/study/sessions', { params: filters });
    return data.data.sessions;
  },

  async getStats() {
    const { data } = await api.get('/study/stats');
    return data.data;
  },

  async deleteSession(id) {
    const { data } = await api.delete(`/study/sessions/${id}`);
    return data;
  }
};

export default studyService;
