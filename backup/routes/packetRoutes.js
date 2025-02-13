const express = require('express');
const router = express.Router();
const axios = require('axios');
const Packet = require('../models/packet');
const os = require('os');

// Helper function to get network interfaces
const getNetworkInterfaces = () => {
    const interfaces = os.networkInterfaces();
    const validInterfaces = [];
    
    for (const [name, details] of Object.entries(interfaces)) {
        const active = details.find(d => !d.internal && d.family === 'IPv4');
        if (active) {
            validInterfaces.push(name);
        }
    }
    return validInterfaces;
};

// Get available network interfaces
router.get('/interfaces', (req, res) => {
    const interfaces = getNetworkInterfaces();
    res.json({ interfaces });
});

// Status route with interface information
router.get('/status', (req, res) => {
    res.json({
        status: 'online',
        activeCaptures: global.activeCaptures?.size || 0,
        connectedClients: global.connectedClients?.size || 0,
        availableInterfaces: getNetworkInterfaces()
    });
});

// Updated capture start route
router.post('/capture/start', async (req, res) => {
    try {
        const interfaces = getNetworkInterfaces();
        const defaultInterface = interfaces[0];
        const { interface = defaultInterface } = req.body;
        
        if (!interfaces.includes(interface)) {
            return res.status(400).json({
                error: 'Invalid interface',
                availableInterfaces: interfaces
            });
        }

        const response = await axios.post(`${process.env.FLASK_URL}/start_capture`, {
            interface
        }, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Capture started on interface:', interface);
        res.json({
            status: 'success',
            interface,
            ...response.data
        });
    } catch (error) {
        console.error('Capture error:', error.message);
        res.status(500).json({ 
            error: 'Capture failed',
            details: error.response?.data?.message || error.message
        });
    }
});

router.post('/capture/stop', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:5002/stop_capture');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to stop capture' });
    }
});

// Packet routes
router.post('/packets/batch', async (req, res) => {
    try {
        const packets = await Packet.insertMany(req.body);
        res.status(201).json({ 
            success: true, 
            message: `${packets.length} packets stored`,
            data: packets 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/packets', async (req, res) => {
    try {
        const { page = 1, limit = 10, protocol } = req.query;
        const query = protocol ? { protocol } : {};

        const packets = await Packet.find(query)
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Packet.countDocuments(query);

        res.json({
            success: true,
            data: packets,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            total: count
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Analysis routes
router.get('/analysis/protocols', async (req, res) => {
    try {
        const stats = await Packet.aggregate([
            { $group: { _id: '$protocol', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.get('/analysis/traffic', async (req, res) => {
    try {
        const analysis = await Packet.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d %H:%M', date: '$timestamp' }
                    },
                    totalPackets: { $sum: 1 },
                    averageLength: { $avg: '$length' },
                    totalBytes: { $sum: '$length' }
                }
            },
            { $sort: { '_id': -1 } }
        ]);
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = router;
