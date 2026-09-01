import api from './api.js';

export const analyticsService = {
  async getOverviewStats() {
    const { data } = await api.get('/analytics/overview');
    return data.data;
  },
  
  async getWeeklyProductivity() {
    const { data } = await api.get('/analytics/weekly-productivity');
    return data.data;
  },

  async getCategoryBreakdown() {
    const { data } = await api.get('/analytics/category-breakdown');
    return data.data;
  },

  async getGoalsProgress() {
    const { data } = await api.get('/analytics/goals-progress');
    return data.data;
  },

  async getActivityHeatmap(days = 84) {
    const { data } = await api.get('/analytics/heatmap', { params: { days } });
    return data.data;
  },

  async getAIInsights() {
    const { data } = await api.get('/analytics/insights');
    return data.data;
  }
};

export default analyticsService;
