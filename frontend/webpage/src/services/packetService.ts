import axios from 'axios';

const API_URL = 'http://localhost:5002/api';

export interface PacketData {
  timestamp: string;
  protocol: string;
  source: string;
  destination: string;
  length: number;
  info: string;
}

export interface CaptureStats {
  totalPackets: number;
  totalBytes: number;
  packetsPerSec: number;
  protocols: { [key: string]: number };
  packetSizes: { [key: string]: number };
}

export const startCapture = async () => {
  try {
    const response = await axios.post(`${API_URL}/capture`);
    return response.data;
  } catch (error) {
    console.error('Error starting capture:', error);
    throw error;
  }
};

export const getStats = async (): Promise<CaptureStats> => {
  try {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};
