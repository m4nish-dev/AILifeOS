import api from './api.js';

const normalize = (note) => ({
  ...note,
  id: note._id || note.id
});

export const noteService = {
  async getNotes(filters = {}) {
    const params = {};
    if (filters.pinned !== undefined) params.pinned = filters.pinned;
    if (filters.tag) params.tag = filters.tag;
    if (filters.search) params.search = filters.search;
    
    const { data } = await api.get('/notes', { params });
    return data.data.notes.map(normalize);
  },

  async getNote(id) {
    const { data } = await api.get(`/notes/${id}`);
    return normalize(data.data.note);
  },

  async createNote(noteData) {
    const { data } = await api.post('/notes', noteData);
    return normalize(data.data.note);
  },

  async updateNote(id, noteData) {
    const { data } = await api.put(`/notes/${id}`, noteData);
    return normalize(data.data.note);
  },

  async deleteNote(id) {
    const { data } = await api.delete(`/notes/${id}`);
    return data;
  },

  async togglePin(id) {
    const { data } = await api.patch(`/notes/${id}/pin`);
    return normalize(data.data.note);
  },

  async addTag(id, tag) {
    const { data } = await api.post(`/notes/${id}/tags`, { tag });
    return normalize(data.data.note);
  },

  async removeTag(id, tag) {
    const { data } = await api.delete(`/notes/${id}/tags/${tag}`);
    return normalize(data.data.note);
  }
};

export default noteService;
