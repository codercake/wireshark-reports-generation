import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container, Grid, Card, Box, Typography, Button, TextField,
    Select, MenuItem, FormControl, InputLabel, CircularProgress,
    styled, IconButton, Tooltip
} from '@mui/material';
import {
    PlayArrow, Stop, PictureAsPdf, TableChart, Code, Refresh, CloudUpload
} from '@mui/icons-material';
import { Pie, Line } from 'react-chartjs-2';
import { toast, Toaster } from 'sonner';
import { Chart as ChartJS } from 'chart.js/auto';

const API_ENDPOINT = 'http://localhost:5002';

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
    padding: theme.spacing(3),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
}));

const StyledButton = styled(Button)(({ theme }) => ({
    margin: theme.spacing(1),
    textTransform: 'none',
    borderRadius: '8px',
    backgroundColor: props =>
        props.isCapturing ? theme.palette.error.main : theme.palette.success.main,
    '&:hover': {
        backgroundColor: props =>
            props.isCapturing ? theme.palette.error.dark : theme.palette.success.dark,
    },
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    margin: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    '&:hover': {
        color: theme.palette.primary.light,
    },
}));

const NetworkPulse = () => {
    const [captureStatus, setCaptureStatus] = useState('stopped');
    const [networkData, setNetworkData] = useState({
        totalPackets: 0,  // Added
        protocols: {},      // Added
        portDistribution: {},
        maxPorts: []
    });
    const [filters, setFilters] = useState({
        interface: 'en0',
        ipRange: '',
        portRange: '',
        protocol: 'all',
        timeRange: '1h'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const pieChartData = {
        labels: Object.keys(networkData.protocols),
        datasets: [{
            data: Object.values(networkData.protocols),
            backgroundColor: [
                '#4CAF50', '#2196F3', '#FFC107',
                '#E91E63', '#9C27B0', '#FF5722'
            ]
        }]
    };

    const lineChartData = {
        labels: Array.from({ length: 10 }, (_, i) => `Time ${i}`),
        datasets: [{
            label: 'Traffic Volume',
            data: Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)),
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const chartOptions = {
        pie: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#fff' }
                },
                title: {
                    display: true,
                    text: 'Protocol Distribution',
                    color: '#fff'
                }
            }
        },
        line: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                title: {
                    display: true,
                    text: 'Traffic Over Time',
                    color: '#fff'
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#fff' }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#fff' }
                }
            }
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_ENDPOINT}/api/packets`, { params: filters });
            const { protocols, portDistribution, maxPorts } = response.data;
            setNetworkData({ protocols, portDistribution, maxPorts });
            setError(null);
            toast.success("Data updated successfully");
        } catch (err) {
            setError(err.message);
            toast.error(`Error fetching data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCaptureToggle = async () => {
        const newStatus = captureStatus === 'capturing' ? 'stop' : 'start';
        try {
            const response = await axios.post(`${API_ENDPOINT}/${newStatus}_capture`, { ...filters });

            setCaptureStatus(newStatus === 'start' ? 'capturing' : 'stopped');
            toast.success(`Capture ${newStatus}ed successfully`);

            if (newStatus === 'start') {
                // Update network data with initial data from the backend
                setNetworkData({
                    totalPackets: response.data.total_packets,
                    protocols: response.data.protocols,
                });
            }
        } catch (err) {
            toast.error(`Failed to ${newStatus} capture: ${err.message}`);
        }
    };

    const handleApplyFilters = () => {
        fetchData();
        toast.info("Filters applied");
    };

    const handleExport = async (format) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${API_ENDPOINT}/export/${format}`,
                {
                    params: filters,
                    responseType: format === 'pdf' ? 'blob' : 'json'
                }
            );

            const blob = new Blob([response.data], {
                type: format === 'pdf' ? 'application/pdf' :
                    format === 'csv' ? 'text/csv' : 'text/html'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `network_capture_${Date.now()}.${format}`;
            link.click();
            window.URL.revokeObjectURL(url);

            toast.success(`${format.toUpperCase()} exported successfully`);
        } catch (err) {
            toast.error(`Export failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            toast.error("Please select a file first");
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            setLoading(true);
            const response = await axios.post(
                `${API_ENDPOINT}/upload_pcap`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );

            const { portDistribution, maxPorts, protocols } = response.data;

            setNetworkData({ protocols, portDistribution, maxPorts });

            toast.success("File processed successfully");
        } catch (err) {
            toast.error(`Upload failed: ${err.message}`);
        } finally {
            setLoading(false);
            setSelectedFile(null);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Toaster position="top-center" richColors />
            <StyledCard>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" gutterBottom>
                        Network Protocol Analyzer
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Real-time network traffic analysis and visualization
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                        <StyledCard>
                            <Typography variant="h6" gutterBottom>
                                Capture Controls
                            </Typography>

    

                            <FormControl fullWidth margin="normal">
                                <InputLabel>Interface</InputLabel>
                                <Select
                                    value={filters.interface}
                                    label="Interface"
                                    onChange={(e) => setFilters({
                                        ...filters,
                                        interface: e.target.value
                                    })}
                                >
                                    <MenuItem value="en0">en0</MenuItem>
                                    <MenuItem value="en1">en1</MenuItem>
                                    <MenuItem value="lo0">lo0</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth margin="normal">
                                <TextField
                                    label="IP Range"
                                    value={filters.ipRange}
                                    onChange={(e) => setFilters({
                                        ...filters,
                                        ipRange: e.target.value
                                    })}
                                    placeholder="e.g., 192.168.1.0/24"
                                />
                            </FormControl>

                            <FormControl fullWidth margin="normal">
                                <TextField
                                    label="Port Range"
                                    value={filters.portRange}
                                    onChange={(e) => setFilters({
                                        ...filters,
                                        portRange: e.target.value
                                    })}
                                    placeholder="e.g., 80,443,8080"
                                />
                            </FormControl>

                            <FormControl fullWidth margin="normal">
                                <InputLabel>Protocol</InputLabel>
                                <Select
                                    value={filters.protocol}
                                    label="Protocol"
                                    onChange={(e) => setFilters({
                                        ...filters,
                                        protocol: e.target.value
                                    })}
                                >
                                    <MenuItem value="all">All Protocols</MenuItem>
                                    <MenuItem value="tcp">TCP</MenuItem>
                                    <MenuItem value="udp">UDP</MenuItem>
                                    <MenuItem value="http">HTTP</MenuItem>
                                    <MenuItem value="https">HTTPS</MenuItem>
                                    <MenuItem value="dns">DNS</MenuItem>
                                </Select>
                            </FormControl>

                            <StyledButton
                                variant="outlined"
                                onClick={handleApplyFilters}
                                fullWidth
                            >
                                Apply Filters
                            </StyledButton>

                            <StyledButton
                                component="label"
                                variant="outlined"
                                startIcon={<CloudUpload />}
                                fullWidth
                            >
                                Upload PCAP
                                <input
                                    type="file"
                                    hidden
                                    accept=".pcap"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                />
                            </StyledButton>

                            {selectedFile && (
                                <StyledButton
                                    onClick={handleFileUpload}
                                    variant="contained"
                                    fullWidth
                                >
                                    Process File
                                </StyledButton>
                            )}
                        </StyledCard>
                    </Grid>

                    <Grid item xs={12} md={9}>
                        <StyledCard>
                            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                <StyledIconButton onClick={() => handleExport('pdf')}>
                                    <PictureAsPdf />
                                </StyledIconButton>
                                <StyledIconButton onClick={() => handleExport('csv')}>
                                    <TableChart />
                                </StyledIconButton>
                                <StyledIconButton onClick={() => handleExport('html')}>
                                    <Code />
                                </StyledIconButton>
                                <StyledIconButton onClick={fetchData}>
                                    <Refresh />
                                </StyledIconButton>
                            </Box>

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : error ? (
                                <Typography color="error" align="center">
                                    {error}
                                </Typography>
                            ) : (
                                <>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ height: 300, padding: 16, marginBottom: 16 }}>
                                                {/* Protocol Distribution Pie Chart */}
                                                <Pie
                                                    data={pieChartData}
                                                    options={chartOptions.pie}
                                                />
                                            </Box>
                                            <Box mt={3}>
                                                <Typography variant="h6" gutterBottom>
                                                    Maximum Ports
                                                </Typography>
                                                {networkData.maxPorts.length > 0 ? (
                                                    <Typography>
                                                        {networkData.maxPorts.join(', ')}
                                                    </Typography>
                                                ) : (
                                                    <Typography>No maximum ports found.</Typography>
                                                )}
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ height: 300, padding: 16, marginBottom: 16 }}>
                                                {/* Traffic Over Time Line Chart */}
                                                <Line
                                                    data={lineChartData}
                                                    options={chartOptions.line}
                                                />
                                            </Box>
                                            <Box mt={3}>
                                                <Typography variant="h6" gutterBottom>
                                                    Port Distribution
                                                </Typography>
                                                {Object.keys(networkData.portDistribution).length > 0 ? (
                                                    <Box>
                                                        {Object.entries(networkData.portDistribution).map(([port, count]) => (
                                                            <Typography key={port}>
                                                                Port {port}: {count} packets
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Typography>No port distribution data available.</Typography>
                                                )}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </>
                            )}
                        </StyledCard>
                    </Grid>
                </Grid>
                {/* Display other statistics */}
                <Box mt={2} p={2} border="1px solid #ccc" borderRadius="4px">
                    <Typography variant="h6">
                        Network Statistics
                    </Typography>
                    <Typography variant="body1">
                        Total Packets: {networkData.totalPackets}
                    </Typography>
                    {/* Add other statistics here */}
                </Box>
            </StyledCard>
        </Container>
    );
};

export default NetworkPulse;
