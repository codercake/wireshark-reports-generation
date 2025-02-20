const BASE_URL = 'http://localhost:5002';

export const endpoints = {
    startCapture: `${BASE_URL}/start_capture`,
    stopCapture: `${BASE_URL}/stop_capture`,
    getPackets: `${BASE_URL}/packets`,
    exportPDF: `${BASE_URL}/export/pdf`,
    exportCSV: `${BASE_URL}/export/csv`,
    exportHTML: `${BASE_URL}/export/html`
};
