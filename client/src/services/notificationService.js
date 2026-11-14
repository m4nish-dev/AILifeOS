import api from './api.js';

// Normalize a Mongoose notification (_id → id) so it matches the frontend shape
const normalize = (notification) => ({
  ...notification,
  id: notification._id || notification.id,
});

export const notificationService = {
  async getNotifications() {
    const { data } = await api.get('/notifications');
    return {
      notifications: (data.data.notifications || []).map(normalize),
      unreadCount: data.data.unreadCount || 0,
    };
  },

  async markRead(id) {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data.data ? normalize(data.data) : null;
  },

  async markAllRead() {
    const { data } = await api.put('/notifications/read-all');
    return data;
  },

  async deleteNotification(id) {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },
};

export default notificationService;
