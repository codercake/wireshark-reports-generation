import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Line, Pie, Bar } from 'react-chartjs-2';
import ExportButton from './ExportButton';
import { Chart as ChartJS } from 'chart.js/auto';

const Dashboard = () => {
    const [packets, setPackets] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [stats, setStats] = useState({
        totalPackets: '1.2K',
        totalBytes: '156KB',
        packetsPerSec: '45'
    });

    const trafficData = {
        labels: Array.from({length: 10}, (_, i) => `${i}s ago`),
        datasets: [{
            label: 'Network Traffic',
            data: Array.from({length: 10}, () => Math.floor(Math.random() * 1000)),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    const protocolData = {
        labels: ['TCP', 'UDP', 'ICMP', 'HTTP', 'DNS'],
        datasets: [{
            data: [45, 25, 10, 15, 5],
            backgroundColor: [
                '#0ea5e9',
                '#6366f1',
                '#8b5cf6',
                '#ec4899',
                '#f43f5e'
            ]
        }]
    };

    const packetSizeData = {
        labels: ['0-64', '65-128', '129-256', '257-512', '513+'],
        datasets: [{
            label: 'Packet Size Distribution',
            data: [30, 25, 20, 15, 10],
            backgroundColor: 'rgba(14, 165, 233, 0.6)'
        }]
    };

    return (
        <Container fluid className="p-4" style={{ backgroundColor: '#f8fafc' }}>
            <Row className="mb-4">
                <Col>
                    <h1 style={{ color: '#1e293b' }}>Wireshark Report Generator</h1>
                    <div className="d-flex gap-2">
                        <Button 
                            style={{ 
                                backgroundColor: isCapturing ? '#ef4444' : '#0ea5e9',
                                border: 'none',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                            }}
                            onClick={() => setIsCapturing(!isCapturing)}
                        >
                            {isCapturing ? 'Stop Capture' : 'Start Capture'}
                        </Button>
                        <ExportButton packets={packets} stats={stats} />
                    </div>
                </Col>
            </Row>

            <Row>
                <Col md={8}>
                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            <Card.Title style={{ color: '#334155' }}>Live Network Traffic</Card.Title>
                            <Line data={trafficData} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            <Card.Title style={{ color: '#334155' }}>Protocol Distribution</Card.Title>
                            <Pie data={protocolData} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            <Card.Title style={{ color: '#334155' }}>Packet Size Distribution</Card.Title>
                            <Bar data={packetSizeData} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            <Card.Title style={{ color: '#334155' }}>Capture Statistics</Card.Title>
                            <div className="d-flex justify-content-around">
                                <div className="text-center">
                                    <h3 style={{ color: '#0ea5e9' }}>{stats.totalPackets}</h3>
                                    <p style={{ color: '#64748b' }}>Total Packets</p>
                                </div>
                                <div className="text-center">
                                    <h3 style={{ color: '#0ea5e9' }}>{stats.totalBytes}</h3>
                                    <p style={{ color: '#64748b' }}>Total Bytes</p>
                                </div>
                                <div className="text-center">
                                    <h3 style={{ color: '#0ea5e9' }}>{stats.packetsPerSec}</h3>
                                    <p style={{ color: '#64748b' }}>Packets/sec</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Dashboard;
