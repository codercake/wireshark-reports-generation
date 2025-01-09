const mongoose = require('mongoose');

const PacketSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
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
  }
});

module.exports = mongoose.model('Packet', PacketSchema);
