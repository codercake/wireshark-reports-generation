const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const WebSocket = require('ws'); 
const axios = require('axios'); 
require('dotenv').config();

const connectDB = require('./config/db'); 
const packetRoutes = require('./routes/packetRoutes'); 

const PORT = process.env.PORT || 5001;
const WS_PORT = 8080; // WebSocket port
const FLASK_URL = 'http://localhost:5001/api';

const app = express();
app.use(express.json());

//Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'], 
}));

//Connect to MongoDB
connectDB().catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); 
});

//Routes
app.use('/api/packets', packetRoutes);

//Main API diagnostic route
app.get('/api', (req, res) => {
    res.json({
        status: 'online',
        version: '1.0',
        endpoints: [
            '/api/packets/stats',
            '/api/packets/capture/start',
            '/api/packets/capture/stop',
            '/api/packets/protocols'
        ]
    });
});

//WebSocket server setup
const wss = new WebSocket.Server({ port: WS_PORT });
let capturing = false; //Flag to indicate if capturing is active

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        if (data.action === 'startCapture') {
            if (!capturing) {
                capturing = true;
                console.log('Starting packet capture...');
                try {
                    //Send request to Flask server to start capturing packets
                    await axios.post(`${FLASK_URL}/start_capture`, {
                        interface: 'eth0' 
                    });
                    ws.send(JSON.stringify({ message: 'Packet capture started' }));
                } catch (error) {
                    console.error('Error starting capture:', error);
                    ws.send(JSON.stringify({ error: 'Failed to start capture' }));
                }
            } else {
                ws.send(JSON.stringify({ error: 'Capture already in progress' }));
            }
        } else if (data.action === 'stopCapture') {
            if (capturing) {
                capturing = false;
                console.log('Stopping packet capture...');
                ws.send(JSON.stringify({ message: 'Packet capture stopped' }));
            } else {
                ws.send(JSON.stringify({ error: 'No capture in progress' }));
            }
        }
    });

    const sendPacketData = (packet) => {
        ws.send(JSON.stringify(packet));
    };

    const intervalId = setInterval(() => {
        if (capturing) {
            const packet = {
                time: new Date().toISOString(),
                protocol: 'TCP',
                source: '192.168.1.100',
                destination: '10.0.0.1',
                length: Math.floor(Math.random() * 1500),
                info: 'Sample Packet'
            };
            sendPacketData(packet);
        }
    }, 1000);

    ws.on('close', () => {
        clearInterval(intervalId);
        console.log('Client disconnected');
    });
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start the Express server
const server = app.listen(PORT, () => {
    console.log(`Server running successfully on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
    console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        mongoose.connection.close(() => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});

//Error handling for unhandled rejections
process.on('unhandled Rejection', (err) => {
    console.error('Unhandled Rejection:', err);
});