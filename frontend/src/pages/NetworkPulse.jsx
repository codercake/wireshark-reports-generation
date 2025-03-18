import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container, Grid, Card, Box, Typography, Button,
    FormControl, InputLabel, Select, MenuItem,
    TextField, CircularProgress, styled, IconButton
} from '@mui/material';
import {
    PlayArrow, Stop, PictureAsPdf, TableChart,
    Code, Refresh, CloudUpload
} from '@mui/icons-material';
import { Pie, Line } from 'react-chartjs-2';
import { toast, Toaster } from 'sonner';
import { Chart as ChartJS } from 'chart.js/auto';
import { saveAs } from 'file-saver';  // Import file-saver

const API_ENDPOINT = 'http://localhost:5002';

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
    padding: theme.spacing(3),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    color: '#ffffff'
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
    color: '#ffffff'
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    margin: theme.spacing(0.5),
    color: 'rgba(255, 255, 255, 0.7)',
    '&:hover': {
        color: 'rgba(33, 150, 243, 0.5)',
    },
}));

const NetworkPulse = () => {
    const [captureStatus, setCaptureStatus] = useState('stopped');
    const [networkData, setNetworkData] = useState({
        totalPackets: 0,
        protocols: {},
        portDistribution: {},
        maxPorts: [],
        trafficAnalysis: {}
    });

    const [pcapData, setPcapData] = useState({
        protocols: {},
        portDistribution: {},
        trafficAnalysis: {}
    });

    const [filters, setFilters] = useState({
        interface: 'en0',
        ipRange: '',
        portRange: '',
        protocol: 'all'
    });

    const [loading, setLoading] = useState(false);
    const [pcapLoading, setPcapLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [pcapErrorMessage, setPcapErrorMessage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);  // Add upload progress state

    const pieChartData = {
        labels: networkData.protocols ? Object.keys(networkData.protocols) : [],
        datasets: [{
            data: networkData.protocols ? Object.values(networkData.protocols) : [],
            backgroundColor: [
                '#4CAF50', '#2196F3', '#FFC107',
                '#E91E63', '#9C27B0', '#FF5722'
            ]
        }]
    };

    const pcapPieChartData = {
        labels: pcapData.protocols ? Object.keys(pcapData.protocols) : [],
        datasets: [{
            data: pcapData.protocols ? Object.values(pcapData.protocols) : [],
            backgroundColor: [
                '#4CAF50', '#2196F3', '#FFC107',
                '#E91E63', '#9C27B0', '#FF5722'
            ]
        }]
    };

    const lineChartData = {
        labels: networkData.trafficAnalysis ? Object.keys(networkData.trafficAnalysis) : [],
        datasets: [{
            label: 'Traffic Volume',
            data: networkData.trafficAnalysis ? Object.values(networkData.trafficAnalysis) : [],
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const pcapLineChartData = {
        labels: pcapData.trafficAnalysis ? Object.keys(pcapData.trafficAnalysis) : [],
        datasets: [{
            label: 'Traffic Volume',
            data: pcapData.trafficAnalysis ? Object.values(pcapData.trafficAnalysis) : [],
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
                    color: '#fff',
                    fontSize: '16'
                }
            }
        },
        line: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, labels: { color: '#fff' } },
                title: {
                    display: true,
                    text: 'Traffic Over Time',
                    color: '#fff',
                    fontSize: '16'
                }
            },
            scales: {
                xAxes: [{
                    gridLines: { color: 'rgba(255 ,255 ,255 , .1)' },
                    ticks: { fontColor: '#fff' }
                }],
                yAxes: [{
                    gridLines: { color: 'rgba(255 ,255 ,255 , .1)' },
                    ticks: { fontColor: '#fff' }
                }]
            }
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_ENDPOINT}/api/packets`, { params: filters });


            const trafficAnalysisData = {};
            if (response.data) {
                response.data.forEach(packet => {
                    const timestamp = packet.timestamp;
                    if (timestamp) {
                        const minute = timestamp.substring(0, 16); // e.g., "2025-03-08T10"
                        trafficAnalysisData[minute] = (trafficAnalysisData[minute] || 0) + 1;
                    }
                });
            }

            setNetworkData({
                totalPackets: response.data ? response.data.length : 0,
                protocols: response.data ? response.data.protocols || {} : {},
                portDistribution: response.data ? response.data.portDistribution || {} : {},
                maxPorts: response.data ? response.data.maxPorts || [] : [],
                trafficAnalysis: trafficAnalysisData
            });

            setErrorMessage(null);
            toast.success("Live capture data updated successfully");
        } catch (err) {
            setErrorMessage(err.message);
            toast.error(`Error fetching live capture data : ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCaptureToggle = async () => {
        const newStatus = captureStatus === 'capturing' ? 'stop' : 'start';

        try {
            const response = await axios.post(`${API_ENDPOINT}/${newStatus}_capture`, { ...filters });

            setCaptureStatus(newStatus === 'start' ? 'capturing' : 'stopped');
            if (newStatus === 'start') {
                setNetworkData({
                    totalPackets: response.data.total_packets,
                    protocols: response.data.protocols || {},
                    portDistribution: {},
                    maxPorts: [],
                    trafficAnalysis: {}
                });
            }
            toast.success(`Capture ${newStatus}ed successfully`);
        } catch (err) {
            toast.error(`Failed to ${newStatus} capture : ${err.message}`);
        }
    };

    const handleApplyFilters = () => {
        fetchData();
        toast.info("Filters applied");
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            toast.error("Please select a file first");
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            setPcapLoading(true);
            setUploadProgress(0); // Reset progress

            const response = await axios.post(
                `${API_ENDPOINT}/upload_pcap`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    responseType: 'blob', // Ensure response is treated as a blob
                    onUploadProgress: (progressEvent) => {  // Track upload progress
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(progress);
                    },
                }
            );

            // Download the PDF
            saveAs(response.data, 'network_analysis_report.pdf');
            toast.success("PCAP file processed and downloaded successfully");

            // Optional: Reset PCAP data
            setPcapData({
                protocols: {},
                portDistribution: {},
                trafficAnalysis: {}
            });

        } catch (err) {
            setPcapErrorMessage(err.message);
            toast.error(`Upload failed: ${err.message}`);
        } finally {
            setPcapLoading(false);
            setSelectedFile(null);
            setUploadProgress(0);  // Reset upload progress
        }
    };

    const handleExport = async (format) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${API_ENDPOINT}/export/${format}`,
                { params: filters, responseType: format === 'pdf' ? 'blob' : undefined }
            );

            const blob = new Blob([response.data], {
                type:
                    format === 'pdf' ?
                        'application/pdf' :
                        format === 'csv' ?
                            'text/csv' :
                            format === 'html' ?
                                'text/html' :
                                ''
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `network_capture_${Date.now()}.${format}`;
            link.click();
            window.URL.revokeObjectURL(url);

            toast.success(`${format.toUpperCase()} exported successfully`);
        } catch (err) {
            toast.error(`Export failed : ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (captureStatus === "capturing") {
            const intervalId = setInterval(fetchData, 5000);
            return () => clearInterval(intervalId);
        }
    }, [captureStatus]);

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
                                <InputLabel sx={{ color: '#fff' }}>Interface</InputLabel>
                                <Select
                                    value={filters.interface}
                                    label="Interface"
                                    onChange={(e) => setFilters({ ...filters, interface: e.target.value })}
                                    sx={{ color: '#fff' }}
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
                                    onChange={(e) => setFilters({ ...filters, ipRange: e.target.value })}
                                    placeholder="e.g., 192.168.1.0/24"
                                    InputLabelProps={{ style: { color: '#fff' } }}
                                    InputProps={{ style: { color: '#fff' } }}
                                />
                            </FormControl>

                            <FormControl fullWidth margin="normal">
                                <TextField
                                    label="Port Range"
                                    value={filters.portRange}
                                    onChange={(e) => setFilters({ ...filters, portRange: e.target.value })}
                                    placeholder="e.g., 80,443"
                                    InputLabelProps={{ style: { color: '#fff' } }}
                                    InputProps={{ style: { color: '#fff' } }}
                                />
                            </FormControl>

                            <FormControl fullWidth margin="normal">
                                <InputLabel style={{ color: '#fff' }}>Protocol</InputLabel>
                                <Select
                                    value={filters.protocol}
                                    label="Protocol"
                                    onChange={(e) => setFilters({ ...filters, protocol: e.target.value })}
                                    sx={{ color: '#fff' }}
                                >
                                    <MenuItem value="all">All Protocols</MenuItem>
                                    <MenuItem value="tcp">TCP</MenuItem>
                                    <MenuItem value="udp">UDP</MenuItem>
                                    <MenuItem value="http">HTTP</MenuItem>
                                    <MenuItem value="https">HTTPS</MenuItem>
                                    <MenuItem value="dns">DNS</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Button to apply filters */}
                            <StyledButton variant="outlined" onClick={handleApplyFilters} fullWidth>
                                Apply Filters
                            </StyledButton>

                            {/* Button to toggle capture */}
                            {/* <StyledButton variant="contained"
                                            color={captureStatus === "capturing" ? "error" :"success"}
                                            startIcon={captureStatus === "capturing" ?<Stop />:<PlayArrow />}
                                            onClick={handleCaptureToggle}
                                            isCapturing={captureStatus === "capturing"}>
                                {captureStatus === "capturing" ?"Stop Capture":"Start Capture"}
                            </StyledButton> */}

                            {/* File upload button */}
                            <StyledButton component="label" variant="outlined" startIcon={<CloudUpload />} fullWidth>
                                Upload PCAP File
                                <input type="file" hidden accept=".pcap" onChange={(e) => setSelectedFile(e.target.files[0])} />
                            </StyledButton>

                            {/* Process file button */}
                            {selectedFile && (
                                <StyledButton onClick={handleFileUpload} variant="contained" fullWidth disabled={pcapLoading}> {/* Disable while loading */}
                                    Process File
                                </StyledButton>
                            )}

                            {/* Upload progress indicator */}
                            {pcapLoading && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    <CircularProgress variant="determinate" value={uploadProgress} size={24} />
                                    <Box sx={{ ml: 1 }}>
                                        <Typography variant="body2" color="text.secondary">{`${Math.round(uploadProgress)}%`}</Typography>
                                    </Box>
                                </Box>
                            )}

                        </StyledCard>
                    </Grid>

                  {/* Charts Section */}
                  <Grid item xs={12} md={9}>
                      <StyledCard>
                         
                          <Box sx={{ mb : 3 , display:'flex', justifyContent:'flex-end'}}>
                            
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
                            <Box sx={{ display:'flex', justifyContent:'center', p :3 }}>
                              
                                <CircularProgress color='secondary'/>
                            </Box>
                        ) : errorMessage ? (
                            
                            <Typography color='error' align='center'>
                                {errorMessage}
                            </Typography>
                        ) : (
                            <>

                          
                                {networkData.portDistribution && Object.keys(networkData.portDistribution).length > 0 && (
                                    <>
                                      
                                        <Typography variant='h6' align='center' gutterBottom>Top 10 Ports Visited</Typography> 
                                    
                                        {Object.entries(networkData.portDistribution)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0 ,10)
                                            .map(([port,count]) => (
                                                (<li key={port}>Port {port}: {count}</li>)
                                            ))}
                                    </>
                                )}

                               
                                {pcapLoading ? (
                                    <Box sx={{ display:'flex', justifyContent:'center', p :3 }}>
                                      
                                        <CircularProgress color='secondary'/>
                                    </Box>
                                ) : pcapErrorMessage ? (
                                   
                                    (<Typography color='error' align='center'>{pcapErrorMessage}</Typography>)
                                ) : (
                                    <>
                                        
                                        <Typography variant='h6' gutterBottom>PCAP File Analysis</Typography>

                                                                               
                                                                                {pcapPieChartData.labels.length > 0 && (
                                            <Grid item xs={12} md={6}>
                                                <Box sx={{ height: '400px', padding: '16px', marginBottom: '16px' }}>
                                                    <Typography variant='h6' align='center' gutterBottom>Protocol Distribution</Typography>
                                                    <Pie data={pcapPieChartData} options={chartOptions.pie} />
                                                </Box>
                                            </Grid>
                                        )}

                                      
                                        {pcapData.portDistribution && Object.keys(pcapData.portDistribution).length > 0 && (
                                            <>
                                                <Typography variant='h6' align='center' gutterBottom>Top 10 Ports Visited</Typography>
                                                <ul>
                                                    {Object.entries(pcapData.portDistribution)
                                                        .sort(([, a], [, b]) => b - a)
                                                        .slice(0, 10)
                                                        .map(([port, count]) => (
                                                            <li key={port}>Port {port}: {count}</li>
                                                        ))}
                                                </ul>
                                            </>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </StyledCard>
                </Grid>
            </Grid>
        </StyledCard>
    </Container>
);
};

export default NetworkPulse;

