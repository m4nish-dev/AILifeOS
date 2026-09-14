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

  async getSubjectStats() {
    const { data } = await api.get('/study/stats/subjects');
    return data.data;
  },

  async getFocusPattern() {
    const { data } = await api.get('/study/stats/focus-pattern');
    return data.data;
  },

  async deleteSession(id) {
    const { data } = await api.delete(`/study/sessions/${id}`);
    return data;
  },

  // --- GOALS ---
  async getGoals() {
    const { data } = await api.get('/study/goals');
    return data.data;
  },
  
  async getGoalProgress() {
    const { data } = await api.get('/study/goals/progress');
    return data.data;
  },

  async createGoal(goalData) {
    const { data } = await api.post('/study/goals', goalData);
    return data.data;
  },

  async deleteGoal(id) {
    const { data } = await api.delete(`/study/goals/${id}`);
    return data;
  },

  // --- FLASHCARDS ---
  async getDecks() {
    const { data } = await api.get('/study/flashcards/decks');
    return data.data;
  },

  async getFlashcardsByDeck(deckName) {
    const { data } = await api.get(`/study/flashcards/deck/${deckName}`);
    return data.data;
  },

  async getDueFlashcards() {
    const { data } = await api.get('/study/flashcards/due');
    return data.data;
  },

  async createFlashcard(cardData) {
    const { data } = await api.post('/study/flashcards', cardData);
    return data.data;
  },

  async reviewFlashcard(id, correct) {
    const { data } = await api.post(`/study/flashcards/${id}/review`, { correct });
    return data.data;
  },

  async generateFlashcardsFromNote(noteId, deckName) {
    const { data } = await api.post(`/study/flashcards/generate/${noteId}`, { deckName });
    return data.data;
  }
};

export default studyService;
