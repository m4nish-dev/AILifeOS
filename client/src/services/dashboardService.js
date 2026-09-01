import api from './api.js';

export const dashboardService = {
  async getDashboardSummary() {
    const { data } = await api.get('/dashboard/summary');
    return data.data;
  }
};

export default dashboardService;
