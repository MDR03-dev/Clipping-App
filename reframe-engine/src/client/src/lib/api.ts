import axios from 'axios';

export const api = {
  importVideo: async (url: string) => {
    const response = await axios.post('/api/ai/analyze', { url });
    return response.data;
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post('/api/ai/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};