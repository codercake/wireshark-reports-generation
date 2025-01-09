import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Line, Pie, Bar } from 'react-chartjs-2';
import ExportButton from './ExportButton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const Dashboard = () => {
    const [packets, setPackets] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [stats, setStats] = useState({
        totalPackets: '1.2K',
        totalBytes: '156KB',
        packetsPerSec: '45'
    });

    // Dummy data for traffic graph
    const trafficData = {
        labels: Array.from({length: 10}, (_, i) => `${i}s ago`),
        datasets: [{
            label: 'Network Traffic',
            data: Array.from({length: 10}, () => Math.floor(Math.random() * 1000)),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    // Dummy data for protocol distribution
    const protocolData = {
        labels: ['TCP', 'UDP', 'ICMP', 'HTTP', 'DNS'],
        datasets: [{
            data: [45, 25, 10, 15, 5],
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF'
            ]
        }]
    };

    // Dummy data for packet size distribution
    const packetSizeData = {
        labels: ['0-64', '65-128', '129-256', '257-512', '513+'],
        datasets: [{
            label: 'Packet Size Distribution',
            data: [30, 25, 20, 15, 10],
            backgroundColor: 'rgba(54, 162, 235, 0.5)'
        }]
    };

    return (
        <Container fluid className="p-4">
            <Row className="mb-4">
                <Col>
                    <h1>Wireshark Report Generator</h1>
                    <div className="d-flex gap-2">
                        <Button 
                            variant={isCapturing ? "danger" : "primary"}
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
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Live Network Traffic</Card.Title>
                            <Line data={trafficData} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Protocol Distribution</Card.Title>
                            <Pie data={protocolData} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Packet Size Distribution</Card.Title>
                            <Bar data={packetSizeData} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Capture Statistics</Card.Title>
                            <div className="d-flex justify-content-around">
                                <div className="text-center">
                                    <h3>{stats.totalPackets}</h3>
                                    <p>Total Packets</p>
                                </div>
                                <div className="text-center">
                                    <h3>{stats.totalBytes}</h3>
                                    <p>Total Bytes</p>
                                </div>
                                <div className="text-center">
                                    <h3>{stats.packetsPerSec}</h3>
                                    <p>Packets/sec</p>
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
