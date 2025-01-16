const Packet = require('../models/Packet');

//implementing pagination for the `getPackets` methods to handle large datasets
const { spawn } = require('child_process');
const path = require('path');

exports.startCapture = async (req, res) => {
    const { interface, duration } = req.body;
    
    const pythonProcess = spawn('python', [
        path.join(__dirname, '../utils/packet_capture.py'),
        interface || 'eth0',
        duration || '60'
    ]);

    pythonProcess.stdout.on('data', (data) => {
        console.log('Packet captured:', data.toString());
    });

    res.json({ message: 'Packet capture started' });
};

exports.generateReport = async (req, res) => {
    try {
        const response = await fetch('http://localhost:5000/api/generate_report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        
        const report = await response.json();
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
