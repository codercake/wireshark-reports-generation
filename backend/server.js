const express = require('express');
const { spawn } = require('child_process');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const packetRoutes = require('./routes/packetRoutes');

// Environment variables
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/packets', packetRoutes);

// Main API diagnostic route
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

// Start server
app.listen(PORT, () => {
    console.log(`Server running successfully on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

// Error handling
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});
