const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const WebSocket = require('ws'); 
require('dotenv').config();

const connectDB = require('./config/db');
const packetRoutes = require('./routes/packetRoutes');

const PORT = process.env.PORT || 5001;
const WS_PORT = 8080; // WebSocket port

const app = express();

//Middleware
app.use(cors());
app.use(express.json());

connectDB().catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); 
});

// Routes
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

wss.on('connection', (ws) => {
    console.log('Client connected');

    const sendPacketData = (packet) => {
        ws.send(JSON.stringify(packet));
    };

    setInterval(() => {
        const packet = {
            time: new Date().toISOString(),
            protocol: 'TCP',
            source: '192.168.1.100',
            destination: '10.0.0.1',
            length: Math.floor(Math.random() * 1500),
            info: 'Sample Packet'
        };
        sendPacketData(packet);
    }, 1000);
});

//Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const server = app.listen(PORT, () => {
    console.log(`Server running successfully on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
    console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
});
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
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});