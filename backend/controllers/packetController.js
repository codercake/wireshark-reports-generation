const Packet = require('../models/Packet');

exports.getPackets = async (req, res) => {
    try {
        const packets = await Packet.find().sort('-timestamp').limit(100);
        res.json(packets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const totalPackets = await Packet.countDocuments();
        const protocols = await Packet.distinct('protocol');
        res.json({
            totalPackets,
            protocols,
            lastUpdated: new Date()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
