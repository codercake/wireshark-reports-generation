const mongoose = require('mongoose');

const PacketSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        index: true  
    },
    protocol: {
        type: String,
        required: true,
        index: true
    },
    source_ip: {
        type: String,
        required: true,
        match: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        index: true
    },
    dest_ip: {
        type: String,
        required: true,
        match: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        index: true
    },
    length: {
        type: Number,
        required: true
    },
    // Additional useful fields
    source_port: {
        type: Number,
        min: 0,
        max: 65535
    },
    dest_port: {
        type: Number,
        min: 0,
        max: 65535
    },
    flags: {
        type: Map,
        of: Boolean,
        default: {}
    },
    payload: {
        type: Buffer
    },
    suspicious: {
        type: Boolean,
        default: false,
        index: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    packet_type: {
        type: String,
        enum: ['TCP', 'UDP', 'ICMP', 'Other'],
        required: true
    },
    metadata: {
        type: Map,
        of: String,
        default: {}
    }
}, {
    timestamps: true,  // Adds createdAt and updatedAt fields
    collection: 'packets'
});

// Add compound indexes for common queries
PacketSchema.index({ timestamp: 1, suspicious: 1 });
PacketSchema.index({ source_ip: 1, dest_ip: 1 });

// Add a method to check if packet is suspicious
PacketSchema.methods.isSuspicious = function() {
    return this.suspicious;
};

// Add static method for bulk operations
PacketSchema.statics.bulkSavePackets = async function(packets) {
    return await this.insertMany(packets);
};

module.exports = mongoose.model('Packet', PacketSchema);
