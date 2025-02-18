import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Grid, Typography, Button, Switch, FormControlLabel, Card, CardContent,
    LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { NetworkCheck, Speed, Timeline } from '@mui/icons-material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, ArcElement, RadialLinearScale, BarElement
} from 'chart.js';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, ArcElement, RadialLinearScale, BarElement
);

const PageContainer = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
    position: 'relative',
    overflow: 'hidden',
    color: 'white',
    padding: theme.spacing(3)
}));

const StyledCard = styled(Card)`
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    color: white;
    transition: all 0.3s ease;
    height: 100%;

    &:hover {
        transform: translateY(-5px);
        background: rgba(255, 255, 255, 0.1);
    }
`;

const GradientButton = styled(Button)`
    background: linear-gradient(45deg, #2196f3, #21cbf3);
    color: white;
    padding: 8px 24px;
    border-radius: 30px;
    text-transform: none;
    font-weight: 600;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(33, 150, 243, 0.3);
        background: linear-gradient(45deg, #2196f3, #21cbf3);
    }
`;

const StyledTableCell = styled(TableCell)`
    color: white;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const StyledTableRow = styled(TableRow)`
    &:hover {
        background: rgba(255, 255, 255, 0.05);
    }
`;

const NetworkPulse = () => {
    const [isCapturing, setIsCapturing] = useState(false);
    const [packets, setPackets] = useState([]);
    const [stats, setStats] = useState({
        totalPackets: 0,
        packetsPerSecond: 0,
        bandwidth: '0 KB/s',
        activeConnections: 0
    });
    const [realTimeUpdates, setRealTimeUpdates] = useState(true);

    const getProtocolDistribution = (packetData) => {
        const protocols = {};
        packetData.forEach(packet => {
            protocols[packet.protocol] = (protocols[packet.protocol] || 0) + 1;
        });
        
        return {
            labels: Object.keys(protocols),
            datasets: [{
                data: Object.values(protocols),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
                ],
                borderWidth: 1
            }]
        };
    };

    const getTopDestinationPorts = (packetData) => {
        const portCounts = {};
        packetData.forEach(packet => {
            portCounts[packet.dest_port] = (portCounts[packet.dest_port] || 0) + 1;
        });
        
        const sortedPorts = Object.entries(portCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        return {
            labels: sortedPorts.map(([port]) => port),
            datasets: [{
                label: 'Packet Count',
                data: sortedPorts.map(([,count]) => count),
                backgroundColor: 'rgba(33, 150, 243, 0.6)',
                borderColor: '#2196f3',
                borderWidth: 1
            }]
        };
    };

    const fetchPackets = async () => {
        try {
            const response = await axios.get('http://localhost:5002/api/packets');
            setPackets(response.data);
            updateStats(response.data);
        } catch (error) {
            console.log('Fetch error:', error.response || error);
        }
    };

    const startCapture = async () => {
        try {
            const response = await axios.post('http://localhost:5002/start_capture', {
                interface: 'en0'
            });
            if (response.data.status === 'success') {
                setIsCapturing(true);
            }
        } catch (error) {
            console.error('Capture start error:', error);
        }
    };

    const stopCapture = async () => {
        try {
            await axios.post('http://localhost:5002/stop_capture');
            setIsCapturing(false);
        } catch (error) {
            console.error('Capture stop error:', error);
        }
    };

    useEffect(() => {
        let intervalId;
        if (isCapturing && realTimeUpdates) {
            fetchPackets();
            intervalId = setInterval(fetchPackets, 1000);
        }
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isCapturing, realTimeUpdates]);

    const updateStats = (packetData) => {
        const totalBytes = packetData.reduce((sum, packet) => sum + packet.length, 0);
        const connections = new Set(packetData.map(p => 
            `${p.source_ip}:${p.source_port}-${p.dest_ip}:${p.dest_port}`
        ));
        
        setStats({
            totalPackets: packetData.length,
            packetsPerSecond: Math.round(packetData.length / 10),
            bandwidth: `${((totalBytes * 8) / (1024 * 10)).toFixed(2)} Kb/s`,
            activeConnections: connections.size
        });
    };

    const chartData = {
        labels: packets.slice(-20).map(p => format(new Date(p.timestamp), 'HH:mm:ss')),
        datasets: [{
            label: 'Packet Size',
            data: packets.slice(-20).map(p => p.length),
            borderColor: '#2196f3',
            backgroundColor: 'rgba(33, 150, 243, 0.2)',
            fill: true
        }]
    };

    return (
        <PageContainer>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <StyledCard>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h4">Network Packet Analyzer</Typography>
                                <Box>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={realTimeUpdates}
                                                onChange={(e) => setRealTimeUpdates(e.target.checked)}
                                            />
                                        }
                                        label="Real-time Updates"
                                    />
                                    <GradientButton
                                        onClick={isCapturing ? stopCapture : startCapture}
                                        startIcon={isCapturing ? <Speed /> : <Timeline />}
                                    >
                                        {isCapturing ? 'Stop Capture' : 'Start Capture'}
                                    </GradientButton>
                                </Box>
                            </Box>
                        </CardContent>
                    </StyledCard>
                </Grid>

                {Object.entries(stats).map(([key, value]) => (
                    <Grid item xs={12} sm={6} md={3} key={key}>
                        <StyledCard>
                            <CardContent>
                                <Typography variant="h6">
                                    {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                                </Typography>
                                <Typography variant="h4">{value}</Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={70}
                                    sx={{
                                        mt: 2,
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        '& .MuiLinearProgress-bar': {
                                            background: 'linear-gradient(45deg, #2196f3, #21cbf3)'
                                        }
                                    }}
                                />
                            </CardContent>
                        </StyledCard>
                    </Grid>
                ))}

                <Grid item xs={12} md={6}>
                    <StyledCard>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Protocol Distribution</Typography>
                            <Box height={300}>
                                <Pie
                                    data={getProtocolDistribution(packets)}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'right',
                                                labels: { color: 'white' }
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        </CardContent>
                    </StyledCard>
                </Grid>

                <Grid item xs={12} md={6}>
                    <StyledCard>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Top 10 Destination Ports</Typography>
                            <Box height={300}>
                                <Bar
                                    data={getTopDestinationPorts(packets)}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                                ticks: { color: 'white' }
                                            },
                                            x: {
                                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                                ticks: { 
                                                    color: 'white',
                                                    maxRotation: 45,
                                                    minRotation: 45
                                                }
                                            }
                                        },
                                        plugins: {
                                            legend: { 
                                                display: false 
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        </CardContent>
                    </StyledCard>
                </Grid>

                <Grid item xs={12}>
                    <StyledCard>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Network Traffic Analysis</Typography>
                            <Box height={400}>
                                <Line
                                    data={chartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                                ticks: { color: 'white' }
                                            },
                                            x: {
                                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                                ticks: { color: 'white' }
                                            }
                                        },
                                        plugins: {
                                            legend: { labels: { color: 'white' } }
                                        }
                                    }}
                                />
                            </Box>
                        </CardContent>
                    </StyledCard>
                </Grid>
            </Grid>
        </PageContainer>
    );
};

export default NetworkPulse;
