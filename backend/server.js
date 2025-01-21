const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const WebSocket = require('ws');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

// Import models and utilities
const Packet = require('./models/packet');
const { calculateNetworkStats } = require('./utils/networkStats');

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

    // Send initial data
    sendInitialData(ws);

    // Handle incoming messages
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            handleWebSocketMessage(ws, data);
        } catch (error) {
            console.error('WebSocket message handling error:', error);
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
    });

    // Handle client disconnect
    ws.on('close', () => {
        console.log('Client disconnected');
        connectedClients.delete(ws);
        stopCaptureForClient(ws);
    });
});

// WebSocket Message Handler
async function handleWebSocketMessage(ws, data) {
    switch (data.action) {
        case 'startCapture':
            await startCapture(ws, data.interface);
            break;
        case 'stopCapture':
            await stopCapture(ws);
            break;
        case 'getStats':
            await sendNetworkStats(ws);
            break;
        default:
            ws.send(JSON.stringify({ error: 'Unknown action' }));
    }
}

// Capture Management Functions
async function startCapture(ws, interface = 'any') {
    if (activeCaptures.has(ws)) {
        return;
    }

    const tsharkProcess = spawn('tshark', [
        '-i', interface,
        '-T', 'ek',
        '-l'
    ]);

    activeCaptures.set(ws, tsharkProcess);

    tsharkProcess.stdout.on('data', async (data) => {
        try {
            const packetData = JSON.parse(data);
            await processPacketData(ws, packetData);
        } catch (error) {
            console.error('Error processing packet:', error);
        }
    });

    tsharkProcess.stderr.on('data', (data) => {
        console.error(`tshark error: ${data}`);
    });

    ws.send(JSON.stringify({ 
        type: 'captureStatus', 
        status: 'started',
        interface 
    }));
}

async function stopCapture(ws) {
    const process = activeCaptures.get(ws);
    if (process) {
        process.kill();
        activeCaptures.delete(ws);
        ws.send(JSON.stringify({ 
            type: 'captureStatus', 
            status: 'stopped' 
        }));
    }
}

async function processPacketData(ws, packetData) {
    try {
        // Save to MongoDB
        const packet = new Packet({
            timestamp: new Date(),
            sourceIP: packetData.source,
            destinationIP: packetData.destination,
            protocol: packetData.protocol,
            length: packetData.length,
            info: packetData.info
        });
        await packet.save();

        // Calculate statistics
        const stats = await calculateNetworkStats();
        
        // Send updated data to client
        ws.send(JSON.stringify({
            type: 'packetData',
            packet: packetData,
            stats: stats
        }));

        // Check for threats
        const threats = detectThreats(stats);
        if (threats.length > 0) {
            ws.send(JSON.stringify({
                type: 'threats',
                threats: threats
            }));
        }
    } catch (error) {
        console.error('Error processing packet data:', error);
    }
}

// Threat Detection
function detectThreats(stats) {
    const threats = [];
    const DDOS_THRESHOLD = 1000;
    const SUSPICIOUS_IP_THRESHOLD = 50;

    if (stats.packetsPerSecond > DDOS_THRESHOLD) {
        threats.push({
            type: 'DDoS',
            severity: 'high',
            message: `High packet rate detected: ${stats.packetsPerSecond} packets/sec`
        });
    }

    if (stats.uniqueIPs > SUSPICIOUS_IP_THRESHOLD) {
        threats.push({
            type: 'PotentialScan',
            severity: 'medium',
            message: `Unusual number of unique IPs: ${stats.uniqueIPs}`
        });
    }

    return threats;
}

// API Routes
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        activeCaptures: activeCaptures.size,
        connectedClients: connectedClients.size
    });
});

app.post('/api/capture/start', async (req, res) => {
    try {
        const { interface } = req.body;
        await axios.post(`${FLASK_URL}/start_capture`, { interface });
        res.json({ status: 'success', message: 'Capture started' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start capture' });
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
    
    // Close all WebSocket connections
    wss.clients.forEach(client => {
        client.close();
    });

    // Stop all active captures
    for (const [ws, process] of activeCaptures) {
        process.kill();
    }
    activeCaptures.clear();

    // Close MongoDB connection
    await mongoose.connection.close();
    
    // Close HTTP server
    server.close(() => {
        console.log('Server shut down complete');
        process.exit(0);
    });
}

module.exports = app;
