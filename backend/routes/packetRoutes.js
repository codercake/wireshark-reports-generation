const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const Packet = require('../models/Packet');

// Handle starting the packet capture
let captureProcess = null;

router.post('/capture/start', (req, res) => {
    if (!captureProcess) {
        captureProcess = spawn('python3', ['utils/packet_capture.py']);
        
        captureProcess.stdout.on('data', (data) => {
            console.log(`Capture Output: ${data}`);
        });

        captureProcess.stderr.on('data', (data) => {
            console.error(`Capture Error: ${data}`);
        });

        res.json({ success: true, message: 'Capture started' });
    } else {
        res.json({ success: false, message: 'Capture already running' });
    }
});

// Handle stopping the packet capture
router.post('/capture/stop', (req, res) => {
    if (captureProcess) {
        captureProcess.kill();
        captureProcess = null;
        res.json({ success: true, message: 'Capture stopped' });
    } else {
        res.json({ success: false, message: 'No capture running' });
    }
});

// Stats route with optional pagination
router.get('/stats', async (req, res) => {
    const { page = 1, limit = 10, paginate = 'true' } = req.query;

    try {
        if (paginate === 'false') {
            // Retrieve all packets without pagination
            const packets = await Packet.find();
            return res.json({
                success: true,
                data: { packets, totalPackets: packets.length },
            });
        }

        // Paginated retrieval
        const totalPackets = await Packet.countDocuments();
        const packets = await Packet.find()
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            data: {
                packets,
                totalPackets,
                currentPage: Number(page),
                totalPages: Math.ceil(totalPackets / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fetch protocol statistics (group packets by protocol)
router.get('/protocols', async (req, res) => {
    try {
        const protocolStats = await Packet.aggregate([
            { $group: { _id: '$protocol', count: { $sum: 1 } } },
        ]);
        res.json({ success: true, data: protocolStats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// CRUD: Fetch all packets
router.get('/packets', async (req, res) => {
    try {
        const packets = await Packet.find();
        res.json({ success: true, data: packets });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// CRUD: Fetch packets by source IP
router.get('/packets/source/:ip', async (req, res) => {
    const { ip } = req.params;
    try {
        const packets = await Packet.find({ source_ip: ip });
        res.json({ success: true, data: packets });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// CRUD: Delete a packet by ID
router.delete('/packets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Packet.findByIdAndDelete(id);
        if (!result) return res.status(404).json({ success: false, message: 'Packet not found' });
        res.json({ success: true, message: 'Packet deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// CRUD: Update a packet by ID
router.put('/packets/:id', async (req, res) => {
    const { id } = req.params;
    const { protocol, source_ip, dest_ip, length } = req.body;
    try {
        const packet = await Packet.findByIdAndUpdate(id, { protocol, source_ip, dest_ip, length }, { new: true });
        if (!packet) return res.status(404).json({ success: false, message: 'Packet not found' });
        res.json({ success: true, data: packet });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Export the router
module.exports = router;
