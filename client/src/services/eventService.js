import api from './api.js';

const normalize = (event) => ({
  ...event,
  id: event._id || event.id,
  // Convert string ISO dates back to actual Date objects for frontend compatibility
  start: new Date(event.start),
  end: new Date(event.end)
});

export const eventService = {
  async getEvents(filters = {}) {
    const params = {};
    if (filters.from && filters.to) {
      params.from = filters.from;
      params.to = filters.to;
    }
    const { data } = await api.get('/events', { params });
    return data.data.events.map(normalize);
  },

  async getEventsByRange(startIso, endIso) {
    const { data } = await api.get('/events/range', { params: { start: startIso, end: endIso } });
    return data.data.events.map(normalize);
  },

  async getEvent(id) {
    const { data } = await api.get(`/events/${id}`);
    return normalize(data.data.event);
  },

  async createEvent(eventData) {
    const { data } = await api.post('/events', eventData);
    return normalize(data.data.event);
  },

  async updateEvent(id, eventData) {
    const { data } = await api.put(`/events/${id}`, eventData);
    return normalize(data.data.event);
  },

  async deleteEvent(id) {
    const { data } = await api.delete(`/events/${id}`);
    return data;
  },

  async moveEvent(id, startIso, endIso) {
    const { data } = await api.patch(`/events/${id}/move`, { start: startIso, end: endIso });
    return normalize(data.data.event);
  }
};

export default eventService;
