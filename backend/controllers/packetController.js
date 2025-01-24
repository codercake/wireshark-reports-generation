const Packet = require('../models/packet');
const { spawn } = require('child_process');
const path = require('path');

const packetController = {
    // Capture Control
    startCapture: async (req, res) => {
        const { interface = 'eth0', duration = '60' } = req.body;
        try {
            const pythonProcess = spawn('python3', [
                path.join(__dirname, '../utils/packet_capture.py'),
                interface,
                duration,
            ]);

            pythonProcess.stdout.on('data', (data) => {
                console.log(`Capture Data: ${data.toString()}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error(`Capture Error: ${data.toString()}`);
            });

            res.json({ success: true, message: 'Packet capture started' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    stopCapture: async (req, res) => {
        try {
            // Add logic to stop capture
            res.json({ success: true, message: 'Capture stopped' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Report Generation
    generateReport: async (req, res) => {
        try {
            const { protocol, dateRange } = req.body;
            const filter = {};

            if (protocol) filter.protocol = protocol;
            if (dateRange) {
                filter.timestamp = {
                    $gte: new Date(dateRange.start),
                    $lte: new Date(dateRange.end),
                };
            }

            const packets = await Packet.find(filter);
            res.json({ success: true, data: packets });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // CRUD Operations
    createPacket: async (req, res) => {
        try {
            const packet = new Packet(req.body);
            const savedPacket = await packet.save();
            res.status(201).json({ success: true, data: savedPacket });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    getAllPackets: async (req, res) => {
        try {
            const { page = 1, limit = 10, protocol } = req.query;
            const query = protocol ? { protocol } : {};

            const packets = await Packet.find(query)
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const count = await Packet.countDocuments(query);

            res.json({
                success: true,
                data: packets,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page)
            });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    getPacketById: async (req, res) => {
        try {
            const packet = await Packet.findById(req.params.id);
            if (!packet) {
                return res.status(404).json({ success: false, error: 'Packet not found' });
            }
            res.json({ success: true, data: packet });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    updatePacket: async (req, res) => {
        try {
            const packet = await Packet.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!packet) {
                return res.status(404).json({ success: false, error: 'Packet not found' });
            }
            res.json({ success: true, data: packet });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    deletePacket: async (req, res) => {
        try {
            const packet = await Packet.findByIdAndDelete(req.params.id);
            if (!packet) {
                return res.status(404).json({ success: false, error: 'Packet not found' });
            }
            res.json({ success: true, data: {} });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    // Analysis
    getProtocolStats: async (req, res) => {
        try {
            const stats = await Packet.aggregate([
                { $group: { _id: '$protocol', count: { $sum: 1 } } }
            ]);
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    getTrafficAnalysis: async (req, res) => {
        try {
            const analysis = await Packet.aggregate([
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                        },
                        totalPackets: { $sum: 1 },
                        averageLength: { $avg: '$length' }
                    }
                }
            ]);
            res.json({ success: true, data: analysis });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
};

module.exports = packetController;
