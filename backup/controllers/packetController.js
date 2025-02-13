const Packet = require('../models/packet');
const { spawn } = require('child_process');
const path = require('path');
const WebSocket = require('ws');
const axios = require('axios');

const packetController = {
    // Capture Management
    startCapture: async (req, res) => {
        const { interface = 'en0', duration = '60' } = req.body;
        try {
            const response = await axios.post('http://localhost:5002/start_capture', {
                interface,
                duration
            });

            // Start local packet monitoring
            const pythonProcess = spawn('python3', [
                path.join(__dirname, '../services/packet_capture.py'),
                interface,
                duration,
            ]);

            pythonProcess.stdout.on('data', (data) => {
                if (global.wss) {
                    global.wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'capture_data',
                                data: data.toString()
                            }));
                        }
                    });
                }
            });

            res.json({ 
                success: true, 
                message: 'Packet capture started',
                data: response.data 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    stopCapture: async (req, res) => {
        try {
            const response = await axios.post('http://localhost:5002/stop_capture');
            res.json({ 
                success: true, 
                message: 'Capture stopped',
                data: response.data 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // Packet Management
    batchCreatePackets: async (req, res) => {
        try {
            const packets = await Packet.insertMany(req.body);
            
            if (global.wss) {
                global.wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'new_packets',
                            data: packets
                        }));
                    }
                });
            }

            res.status(201).json({ 
                success: true, 
                message: `${packets.length} packets stored`,
                data: packets 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    createPacket: async (req, res) => {
        try {
            const packet = new Packet(req.body);
            const savedPacket = await packet.save();
            res.status(201).json({ 
                success: true, 
                data: savedPacket 
            });
        } catch (error) {
            res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    getAllPackets: async (req, res) => {
        try {
            const { 
                page = 1, 
                limit = 10, 
                protocol, 
                startDate, 
                endDate 
            } = req.query;

            const query = {};
            if (protocol) query.protocol = protocol;
            if (startDate && endDate) {
                query.timestamp = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

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
            res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    getPacketById: async (req, res) => {
        try {
            const packet = await Packet.findById(req.params.id);
            if (!packet) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Packet not found' 
                });
            }
            res.json({ 
                success: true, 
                data: packet 
            });
        } catch (error) {
            res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // Analysis and Statistics
    getProtocolStats: async (req, res) => {
        try {
            const stats = await Packet.aggregate([
                {
                    $group: {
                        _id: '$protocol',
                        count: { $sum: 1 },
                        averageLength: { $avg: '$length' },
                        totalBytes: { $sum: '$length' }
                    }
                },
                {
                    $sort: { count: -1 }
                }
            ]);
            res.json({ 
                success: true, 
                data: stats 
            });
        } catch (error) {
            res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    getTrafficAnalysis: async (req, res) => {
        try {
            const analysis = await Packet.aggregate([
                {
                    $group: {
                        _id: {
                            $dateToString: { 
                                format: '%Y-%m-%d %H:%M', 
                                date: '$timestamp' 
                            }
                        },
                        totalPackets: { $sum: 1 },
                        averageLength: { $avg: '$length' },
                        totalBytes: { $sum: '$length' }
                    }
                },
                {
                    $sort: { '_id': -1 }
                }
            ]);
            res.json({ 
                success: true, 
                data: analysis 
            });
        } catch (error) {
            res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    getSecurityAlerts: async (req, res) => {
        try {
            const alerts = await Packet.aggregate([
                {
                    $match: {
                        $or: [
                            { suspicious: true },
                            { severity: { $in: ['high', 'critical'] } }
                        ]
                    }
                },
                {
                    $sort: { timestamp: -1 }
                },
                {
                    $limit: 100
                }
            ]);
            res.json({ 
                success: true, 
                data: alerts 
            });
        } catch (error) {
            res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    }
};

module.exports = packetController;
