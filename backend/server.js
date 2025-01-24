const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const WebSocket = require('ws');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

// Import models and utilities
const Packet = require('./models/packet');
const { generateWiresharkReport, getReportPath, listReports } = require('./utils/reportGenerator');
const { analyzeTrafficPatterns, analyzeSecurityThreats } = require('./utils/analyzer');

// Environment variables
const PORT = process.env.PORT || 5001;
const WS_PORT = process.env.WS_PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wireshark_reports';
const FLASK_URL = process.env.FLASK_URL || 'http://localhost:5002';

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

const packetRoutes = require('./routes/packetRoutes');
app.use('/api', packetRoutes);

// MongoDB Connection
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB Connected Successfully');
}).catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
});

// WebSocket Server Setup
const wss = new WebSocket.Server({ port: WS_PORT });

// Track active captures and clients
let activeCaptures = new Map();
let connectedClients = new Set();

// WebSocket Connection Handler
wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    connectedClients.add(ws);

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            handleWebSocketMessage(ws, data);
        } catch (error) {
            console.error('WebSocket message handling error:', error);
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        connectedClients.delete(ws);
        stopCaptureForClient(ws);
    });
});

// API Routes
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        activeCaptures: activeCaptures.size,
        connectedClients: connectedClients.size
    });
});

// Report Generation Routes
app.get('/api/reports/generate', async (req, res) => {
    try {
        const report = await generateWiresharkReport();
        res.json({ status: 'success', report });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

app.get('/api/reports/download/:id', async (req, res) => {
    try {
        const reportPath = await getReportPath(req.params.id);
        res.download(reportPath);
    } catch (error) {
        res.status(500).json({ error: 'Failed to download report' });
    }
});

app.get('/api/reports/list', async (req, res) => {
    try {
        const reports = await listReports();
        res.json({ status: 'success', reports });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list reports' });
    }
});

// Capture Control Routes
app.post('/api/capture/start', async (req, res) => {
    try {
        const { interface = 'en0' } = req.body;
        console.log('Starting capture on interface:', interface);
        
        const response = await axios.post('http://localhost:5002/start_capture', { 
            interface 
        });
        
        console.log('Flask response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.log('Capture error:', error.message);
        res.status(500).json({ 
            error: 'Failed to start capture',
            details: error.message 
        });
    }
});

app.post('/api/capture/stop', async (req, res) => {
    try {
        await axios.post(`${FLASK_URL}/stop_capture`);
        res.json({ status: 'success', message: 'Capture stopped' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to stop capture' });
    }
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start Server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server running on port ${WS_PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
    console.log('Starting graceful shutdown...');
    wss.clients.forEach(client => {
        client.close();
    });
    
    for (const [ws, process] of activeCaptures) {
        process.kill();
    }
    activeCaptures.clear();
    
    await mongoose.connection.close();
    
    server.close(() => {
        console.log('Server shut down complete');
        process.exit(0);
    });
}

module.exports = app;
