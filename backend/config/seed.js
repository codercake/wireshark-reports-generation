const mongoose = require('mongoose');
const Packet = require('./models/Packet');
require('dotenv').config();

const seedData = async () => {
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    const packets = [
        { protocol: 'TCP', source_ip: '192.168.0.1', dest_ip: '10.0.0.1', length: 500, info: 'Sample TCP packet' },
        { protocol: 'UDP', source_ip: '192.168.0.2', dest_ip: '10.0.0.2', length: 300, info: 'Sample UDP packet' },
        { protocol: 'ICMP', source_ip: '192.168.0.3', dest_ip: '10.0.0.3', length: 100, info: 'Sample ICMP packet' },
    ];

    await Packet.deleteMany();
    await Packet.insertMany(packets);
    console.log('Sample data seeded!');
    process.exit(0);
};

seedData().catch((err) => console.error(err));
