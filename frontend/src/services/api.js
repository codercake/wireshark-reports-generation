import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const packetService = {
  startCapture: (interfaceName = 'eth0') => api.post('/capture/start', { interface: interfaceName }),
  stopCapture: () => api.post('/capture/stop'),
  getStats: () => api.get('/stats'),
  getPackets: (page = 1, limit = 10) => api.get(`/packets?page=${page}&limit=${limit}`),
  getProtocolStats: () => api.get('/protocols')
};

export default api;
