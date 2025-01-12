//added regex for ip address
const mongoose = require('mongoose');

const PacketSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
    },
    protocol: {
        type: String,
        required: true,
    },
    source_ip: {
        type: String,
        required: true,
        match: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, // Simple IP regex
    },
    dest_ip: {
        type: String,
        required: true,
        match: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, // Simple IP regex
    },
    length: {
        type: Number,
        required: true,
    },
});

module.exports = mongoose.model('Packet', PacketSchema);