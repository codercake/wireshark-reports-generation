const mongoose = require('mongoose');

const packetSchema = new mongoose.Schema({
    protocol: {
        type: String,
        required: true
    },
    source_ip: {
        type: String,
        required: true
    },
    dest_ip: {
        type: String,
        required: true
    },
    length: {
        type: Number,
        required: true
    },
    packet_type: {
        type: String,
        required: true
    },
    source_port: {
        type: Number
    },
    dest_port: {
        type: Number
    },
    suspicious: {
        type: Boolean,
        default: false
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Packet', packetSchema);
