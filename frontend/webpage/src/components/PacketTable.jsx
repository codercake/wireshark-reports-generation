import React from 'react';
import { Table, Card } from 'react-bootstrap';

const PacketTable = () => {
    // Dummy packet data
    const dummyPackets = [
        {
            id: 1,
            time: '10:45:23.456',
            protocol: 'TCP',
            source: '192.168.1.100',
            destination: '10.0.0.1',
            length: 64,
            info: 'SYN Packet'
        },
        {
            id: 2,
            time: '10:45:23.458',
            protocol: 'UDP',
            source: '192.168.1.101',
            destination: '8.8.8.8',
            length: 128,
            info: 'DNS Query'
        },
        // Add more dummy packets as needed
    ];

    return (
        <Card>
            <Card.Body>
                <Card.Title>Captured Packets</Card.Title>
                <Table responsive striped bordered hover>
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Time</th>
                            <th>Protocol</th>
                            <th>Source</th>
                            <th>Destination</th>
                            <th>Length</th>
                            <th>Info</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dummyPackets.map(packet => (
                            <tr key={packet.id}>
                                <td>{packet.id}</td>
                                <td>{packet.time}</td>
                                <td>{packet.protocol}</td>
                                <td>{packet.source}</td>
                                <td>{packet.destination}</td>
                                <td>{packet.length}</td>
                                <td>{packet.info}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
};

export default PacketTable;
