import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button, Card, Alert, Badge, Spinner } from 'react-bootstrap';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { FaPlay, FaStop, FaExclamationTriangle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = () => {
    const [packets, setPackets] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState({
        totalPackets: 0,
        totalBytes: 0,
        packetsPerSec: 0,
        uniqueIPs: 0,
        suspiciousActivities: 0
    });

    const [trafficData, setTrafficData] = useState({
        labels: Array.from({length: 30}, (_, i) => `${i}s ago`),
        datasets: [{
            label: 'Network Traffic',
            data: Array(30).fill(0),
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.2)',
            fill: true,
            tension: 0.4
        }]
    });

    const [protocolData, setProtocolData] = useState({
        labels: ['TCP', 'UDP', 'ICMP', 'HTTP', 'DNS', 'Others'],
        datasets: [{
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: [
                '#0ea5e9',
                '#6366f1',
                '#8b5cf6',
                '#ec4899',
                '#f43f5e',
                '#64748b'
            ]
        }]
    });

    const [packetSizeData, setPacketSizeData] = useState({
        labels: ['0-64', '65-128', '129-256', '257-512', '513-1024', '1024+'],
        datasets: [{
            label: 'Packet Size Distribution',
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(14, 165, 233, 0.6)'
        }]
    });

    const lineChartRef = useRef(null);
    const pieChartRef = useRef(null);
    const barChartRef = useRef(null);
    const wsRef = useRef(null);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'category',
                display: true,
                grid: {
                    display: false
                }
            },
            y: {
                type: 'linear',
                display: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            }
        },
        plugins: {
            legend: {
                position: 'bottom'
            }
        },
        animation: {
            duration: 750
        }
    };

    useEffect(() => {
        initializeWebSocket();
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (lineChartRef.current) {
                lineChartRef.current.destroy();
            }
            if (pieChartRef.current) {
                pieChartRef.current.destroy();
            }
            if (barChartRef.current) {
                barChartRef.current.destroy();
            }
        };
    }, []);

    const initializeWebSocket = () => {
        const ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => {
            setIsLoading(false);
            console.log('WebSocket Connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            addAlert('error', 'Connection error occurred');
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setTimeout(initializeWebSocket, 5000);
        };

        wsRef.current = ws;
    };

    const handleWebSocketMessage = (data) => {
        switch (data.type) {
            case 'packetData':
                updatePacketData(data.packet);
                updateStats(data.stats);
                break;
            case 'threats':
                handleThreats(data.threats);
                break;
            case 'captureStatus':
                setIsCapturing(data.status === 'started');
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    };

    const updateStats = (newStats) => {
        setStats(newStats);
    };

    const handleThreats = (threats) => {
        threats.forEach(threat => {
            addAlert(threat.severity, threat.message);
        });
    };

    const updatePacketData = (packet) => {
        setPackets(prev => [...prev, packet].slice(-100));
        updateCharts(packet);
    };

    const updateCharts = (packet) => {
        setTrafficData(prev => ({
            ...prev,
            datasets: [{
                ...prev.datasets[0],
                data: [...prev.datasets[0].data.slice(1), packet.length]
            }]
        }));

        const protocolIndex = protocolData.labels.indexOf(packet.protocol);
        if (protocolIndex !== -1) {
            setProtocolData(prev => {
                const newData = [...prev.datasets[0].data];
                newData[protocolIndex]++;
                return {
                    ...prev,
                    datasets: [{
                        ...prev.datasets[0],
                        data: newData
                    }]
                };
            });
        }

        const sizeIndex = getPacketSizeIndex(packet.length);
        setPacketSizeData(prev => {
            const newData = [...prev.datasets[0].data];
            newData[sizeIndex]++;
            return {
                ...prev,
                datasets: [{
                    ...prev.datasets[0],
                    data: newData
                }]
            };
        });
    };

    const getPacketSizeIndex = (size) => {
        if (size <= 64) return 0;
        if (size <= 128) return 1;
        if (size <= 256) return 2;
        if (size <= 512) return 3;
        if (size <= 1024) return 4;
        return 5;
    };

    const toggleCapture = () => {
        if (wsRef.current) {
            wsRef.current.send(JSON.stringify({
                action: isCapturing ? 'stopCapture' : 'startCapture'
            }));
        }
    };

    const addAlert = (type, message) => {
        setAlerts(prev => [...prev, {
            id: Date.now(),
            type,
            message,
            timestamp: new Date()
        }]);
    };

    return (
        <Container fluid className="p-4">
            <Row className="mb-4">
                <Col>
                    {alerts.map(alert => (
                        <Alert 
                            key={alert.id}
                            variant={alert.type}
                            dismissible
                            onClose={() => setAlerts(alerts.filter(a => a.id !== alert.id))}
                            className="d-flex align-items-center"
                        >
                            <FaExclamationTriangle className="me-2" />
                            <div>
                                {alert.message}
                                <small className="ms-2 text-muted">
                                    {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                                </small>
                            </div>
                        </Alert>
                    ))}
                </Col>
            </Row>

            <Row className="mb-4">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <h4 className="mb-0">Network Capture Control</h4>
                                <small className="text-muted">
                                    {isCapturing ? 'Capturing packets...' : 'Capture stopped'}
                                </small>
                            </div>
                            <Button
                                variant={isCapturing ? 'danger' : 'primary'}
                                onClick={toggleCapture}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Spinner size="sm" animation="border" />
                                ) : isCapturing ? (
                                    <><FaStop className="me-2" /> Stop Capture</>
                                ) : (
                                    <><FaPlay className="me-2" /> Start Capture</>
                                )}
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mb-4">
                <Col md={3}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <h6 className="text-muted">Total Packets</h6>
                            <h3>{stats.totalPackets.toLocaleString()}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <h6 className="text-muted">Total Bytes</h6>
                            <h3>{formatBytes(stats.totalBytes)}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <h6 className="text-muted">Packets/Sec</h6>
                            <h3>{stats.packetsPerSec}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <h6 className="text-muted">Suspicious Activities</h6>
                            <h3>
                                {stats.suspiciousActivities}
                                {stats.suspiciousActivities > 0 && (
                                    <Badge bg="danger" className="ms-2">!</Badge>
                                )}
                            </h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={8}>
                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            <Card.Title>Live Network Traffic</Card.Title>
                            <div style={{ height: '300px' }}>
                                <Line
                                    ref={lineChartRef}
                                    data={trafficData}
                                    options={chartOptions}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            <Card.Title>Protocol Distribution</Card.Title>
                            <div style={{ height: '300px' }}>
                                <Pie
                                    ref={pieChartRef}
                                    data={protocolData}
                                    options={{
                                        ...chartOptions,
                                        scales: {}
                                    }}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            <Card.Title>Packet Size Distribution</Card.Title>
                            <div style={{ height: '300px' }}>
                                <Bar
                                    ref={barChartRef}
                                    data={packetSizeData}
                                    options={chartOptions}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default Dashboard;
