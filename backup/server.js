require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const WebSocket = require('ws');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 5001;

// Basic middleware
app.use(express.json());
app.use(cors());

// Root endpoint
// Add this after app.use(cors());
app.get('/', (req, res) => {
    res.send(`
        <h1>Wireshark Analysis Server</h1>
        <p>Status: Active</p>
        <p>Time: ${new Date().toLocaleString()}</p>
    `);
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection error:', err));

// Create server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// WebSocket setup
const wss = new WebSocket.Server({ server });
let activeCaptures = new Map();

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'start_capture') {
            const captureProcess = spawn('tshark', [
                '-i', data.interface || 'any',
                '-T', 'json',
                '-l'
            ]);

            activeCaptures.set(ws, captureProcess);

            captureProcess.stdout.on('data', (data) => {
                ws.send(JSON.stringify({
                    type: 'packet_data',
                    data: JSON.parse(data)
                }));
            });
        }

        if (data.type === 'stop_capture') {
            const process = activeCaptures.get(ws);
            if (process) {
                process.kill();
                activeCaptures.delete(ws);
            }
        }
    });

    ws.on('close', () => {
        const process = activeCaptures.get(ws);
        if (process) {
            process.kill();
            activeCaptures.delete(ws);
        }
        console.log('Client disconnected');
    });
});

// API endpoints
app.post('/api/capture/start', async (req, res) => {
    try {
        const response = await axios.post(`${process.env.FLASK_URL}/start_capture`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Capture failed' });
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        activeCaptures: activeCaptures.size,
        connectedClients: wss.clients.size
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        mongoose.connection.close();
        process.exit(0);
    });
});

module.exports = app;
