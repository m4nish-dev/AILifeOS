import api from './api.js';

const normalize = (goal) => ({
  ...goal,
  id: goal._id || goal.id,
  milestones: goal.milestones ? goal.milestones.map(m => ({ ...m, id: m._id || m.id })) : []
});

export const goalService = {
  async getGoals(filters = {}) {
    const params = {};
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    const { data } = await api.get('/goals', { params });
    return data.data.goals.map(normalize);
  },

  async getGoal(id) {
    const { data } = await api.get(`/goals/${id}`);
    return normalize(data.data.goal);
  },

  async createGoal(goalData) {
    const { data } = await api.post('/goals', goalData);
    return normalize(data.data.goal);
  },

  async updateGoal(id, goalData) {
    const { data } = await api.put(`/goals/${id}`, goalData);
    return normalize(data.data.goal);
  },

  async deleteGoal(id) {
    const { data } = await api.delete(`/goals/${id}`);
    return data;
  },

  async toggleMilestone(goalId, milestoneId) {
    const { data } = await api.patch(`/goals/${goalId}/milestones/${milestoneId}`);
    return normalize(data.data.goal);
  },

  async addMilestone(goalId, milestoneData) {
    const { data } = await api.post(`/goals/${goalId}/milestones`, milestoneData);
    return normalize(data.data.goal);
  },

  async removeMilestone(goalId, milestoneId) {
    const { data } = await api.delete(`/goals/${goalId}/milestones/${milestoneId}`);
    return normalize(data.data.goal);
  }
};

export default goalService;
