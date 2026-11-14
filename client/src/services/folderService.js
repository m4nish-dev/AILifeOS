import api from './api.js';

const normalize = (folder) => ({
  ...folder,
  id: folder._id || folder.id
});

export const folderService = {
  async getFolders() {
    const { data } = await api.get('/folders');
    return data.data.folders.map(normalize);
  },

  async createFolder(folderData) {
    const { data } = await api.post('/folders', folderData);
    return normalize(data.data.folder);
  },

  async updateFolder(id, folderData) {
    const { data } = await api.put(`/folders/${id}`, folderData);
    return normalize(data.data.folder);
  },

  async deleteFolder(id) {
    const { data } = await api.delete(`/folders/${id}`);
    return data;
  }
};

export default folderService;
