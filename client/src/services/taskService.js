import api from './api.js';

// Normalize a Mongoose task (_id → id) so it matches the frontend shape
const normalize = (task) => ({
  ...task,
  id: task._id || task.id,
});

export const taskService = {
  async getTasks(filters = {}) {
    const params = {};
    if (filters.status   && filters.status   !== 'all') params.status   = filters.status;
    if (filters.priority && filters.priority !== 'all') params.priority = filters.priority;
    if (filters.category && filters.category !== 'all') params.category = filters.category;
    if (filters.search   && filters.search.trim())      params.search   = filters.search.trim();

    const { data } = await api.get('/tasks', { params });
    return data.data.tasks.map(normalize);
  },

  async getTask(id) {
    const { data } = await api.get(`/tasks/${id}`);
    return normalize(data.data.task);
  },

  async createTask(taskData) {
    const { data } = await api.post('/tasks', taskData);
    return normalize(data.data.task);
  },

  async updateTask(id, taskData) {
    const { data } = await api.put(`/tasks/${id}`, taskData);
    return normalize(data.data.task);
  },

  async deleteTask(id) {
    const { data } = await api.delete(`/tasks/${id}`);
    return data;
  },

  async scheduleTask(id, start, end) {
    const { data } = await api.post(`/tasks/${id}/schedule`, { start, end });
    return normalize(data.data.task);
  },
};

export default taskService;
