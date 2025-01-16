const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const { startCapture, generateReport } = require('../controllers/packetController');
const Packet = require('../models/Packet');

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

router.post('/capture/stop', (req, res) => {
    if (captureProcess) {
        captureProcess.kill();
        captureProcess = null;
        res.json({ success: true, message: 'Capture stopped' });
    } else {
        res .json({ success: false, message: 'No capture running' });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const totalPackets = await Packet.countDocuments();
        const protocols = await Packet.distinct('protocol');
        res.json({
            success: true,
            data: {
                totalPackets,
                protocols,
                lastUpdated: new Date(),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

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

router.post('/capture', startCapture);
router.post('/report', generateReport);

module.exports = router;
