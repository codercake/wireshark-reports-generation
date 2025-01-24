const express = require('express');
const router = express.Router();
const Packet = require('../models/packet');
const packetController = require('../controllers/packetController');
const { analyzeSecurityThreats } = require('../utils/analyzer');

router.get('/packets/live', async (req, res) => {
    try {
        const packets = await Packet.find()
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(packets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/packets/batch', async (req, res) => {
    try {
        const packets = await Packet.insertMany(req.body);
        res.status(201).json(packets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/capture/start', packetController.startCapture);
router.post('/capture/stop', packetController.stopCapture);
router.post('/reports/generate', packetController.generateReport);

router.route('/packets')
    .post(packetController.createPacket)
    .get(packetController.getAllPackets);

router.route('/packets/:id')
    .get(packetController.getPacketById)
    .put(packetController.updatePacket)
    .delete(packetController.deletePacket);

router.get('/stats/protocols', packetController.getProtocolStats);
router.get('/stats/traffic', packetController.getTrafficAnalysis);

module.exports = router;

/**integration enables:
-live packet monitoring
- batch packet insertion
- full CRUD operations
- statistical analysis  
- real-time capture control**/