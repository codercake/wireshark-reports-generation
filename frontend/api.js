import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

export const api = {
    startCapture: () => axios.get(`${API_BASE_URL}/packets/capture/start`),
    stopCapture: () => axios.get(`${API_BASE_URL}/packets/capture/stop`),
    getPackets: () => axios.get(`${API_BASE_URL}/packets`),
    getStats: () => axios.get(`${API_BASE_URL}/packets/stats`),
    getProtocols: () => axios.get(`${API_BASE_URL}/packets/protocols`)
};
