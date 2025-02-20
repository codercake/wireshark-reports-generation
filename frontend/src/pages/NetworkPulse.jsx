import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Grid, Typography, Button, Card, TextField,
    Select, MenuItem, IconButton, Tooltip, Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Pie, Line } from 'react-chartjs-2';
import { PictureAsPdf, TableChart, Code, Refresh } from '@mui/icons-material';
import { Chart as ChartJS } from 'chart.js/auto';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CSVDownload } from 'react-csv';
import { toast } from "sonner";

const API_ENDPOINT = 'http://localhost:5002';

// Styled Components
const PageContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.default
}));

const StyledCard = styled(Card)(({ theme }) => ({
    padding: theme.spacing(2),
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
}));

const ExportButton = styled(IconButton)(({ theme }) => ({
    color: theme.palette.common.white,
    backgroundColor: theme.palette.primary.main + '20',
    marginLeft: theme.spacing(1),
    '&:hover': {
        backgroundColor: theme.palette.primary.main + '40'
    }
}));

const ChartContainer = styled(Box)({
    height: 300,
    marginBottom: 20,
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px'
});

const NetworkPulse = () => {
    // State Management
    const [captureStatus, setCaptureStatus] = useState('stopped');
    const [networkData, setNetworkData] = useState({
        packets: [],
        protocols: {},
        timeSeriesData: [],
        anomalies: []
    });
    const [filters, setFilters] = useState({
        ipRange: '',
        portRange: '',
        protocol: 'all',
        timeRange: '1h'
    });
    const [isFiltersValid, setIsFiltersValid] = useState(true);
    const [showCSV, setShowCSV] = useState(false);

    // Chart Data
    const protocolChartData = {
        labels: Object.keys(networkData.protocols),
        datasets: [{
            data: Object.values(networkData.protocols),
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', 
                '#4BC0C0', '#9966FF', '#FF9F40'
            ]
        }]
    };

    const timeSeriesData = {
        labels: networkData.timeSeriesData.map(d => new Date(d.timestamp).toLocaleTimeString()),
        datasets: [{
            label: 'Traffic Volume',
            data: networkData.timeSeriesData.map(d => d.value),
            borderColor: '#36A2EB',
            fill: false,
            tension: 0.4
        }]
    };

    // Functions
    const validateFilters = () => {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
        const portRegex = /^\d+(-\d+)?$/;

        if (filters.ipRange && !ipRegex.test(filters.ipRange)) {
            toast.error("Invalid IP range format (e.g., 192.168.1.0/24)");
            setIsFiltersValid(false);
            return false;
        }

        if (filters.portRange && !portRegex.test(filters.portRange)) {
            toast.error("Invalid port range format (e.g., 80-443)");
            setIsFiltersValid(false);
            return false;
        }

        setIsFiltersValid(true);
        return true;
    };

    const exportToPDF = async () => {
        try {
            // Create PDF in landscape mode for better chart visibility
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
    
            // Set background and improve quality
            const options = {
                scale: 3, // Increase quality
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: 1200, // Fixed width for consistent rendering
                windowHeight: 800
            };
    
            // Capture protocol chart
            const protocolChart = document.getElementById('protocol-chart');
            const protocolCanvas = await html2canvas(protocolChart, options);
            const protocolImgData = protocolCanvas.toDataURL('image/png');
    
            // Capture time series chart
            const timeSeriesChart = document.getElementById('timeseries-chart');
            const timeSeriesCanvas = await html2canvas(timeSeriesChart, options);
            const timeSeriesImgData = timeSeriesCanvas.toDataURL('image/png');
    
            // Add title and metadata
            pdf.setFontSize(20);
            pdf.text('Network Traffic Analysis Report', 15, 15);
            pdf.setFontSize(10);
            pdf.text(`Generated: ${new Date().toLocaleString()}`, 15, 22);
    
            // Calculate dimensions for charts
            const chartWidth = pageWidth / 2 - 20;
            const chartHeight = 70;
    
            // Add protocol chart
            pdf.addImage(protocolImgData, 'PNG', 15, 30, chartWidth, chartHeight);
            pdf.setFontSize(12);
            pdf.text('Protocol Distribution', 15, 25);
    
            // Add time series chart
            pdf.addImage(timeSeriesImgData, 'PNG', pageWidth/2 + 5, 30, chartWidth, chartHeight);
            pdf.text('Traffic Over Time', pageWidth/2 + 5, 25);
    
            // Add statistics
            pdf.setFontSize(14);
            pdf.text('Network Statistics', 15, 120);
            
            const stats = [
                `Total Packets: ${networkData.packets.length}`,
                `Active Protocols: ${Object.keys(networkData.protocols).length}`,
                `Anomalies Detected: ${networkData.anomalies.length}`
            ];
    
            stats.forEach((stat, index) => {
                pdf.setFontSize(11);
                pdf.text(stat, 20, 130 + (index * 8));
            });
    
            // Save PDF
            pdf.save(`network_analysis_${Date.now()}.pdf`);
            toast.success("PDF exported successfully");
        } catch (error) {
            toast.error("PDF export failed: " + error.message);
        }
    };
    

    const handleExport = async (format) => {
        try {
            if (format === 'pdf') {
                await exportToPDF();
            } else {
                const response = await axios.get(`${API_ENDPOINT}/export/${format}`, {
                    params: filters,
                    responseType: 'blob'
                });

                const blob = new Blob([response.data], {
                    type: format === 'csv' ? 'text/csv' : 'text/html'
                });

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `network_analysis_${Date.now()}.${format}`;
                link.click();
                window.URL.revokeObjectURL(url);
                toast.success(`${format.toUpperCase()} exported successfully`);
            }
        } catch (error) {
            toast.error(`Failed to export ${format}`);
        }
    };

    const handleCaptureToggle = async () => {
        if (!validateFilters()) return;

        try {
            const newStatus = captureStatus === 'capturing' ? 'stopped' : 'capturing';
            await axios.post(`${API_ENDPOINT}/${newStatus === 'capturing' ? 'start' : 'stop'}_capture`, filters);
            setCaptureStatus(newStatus);
        } catch (error) {
            toast.error(`Failed to ${captureStatus === 'capturing' ? 'stop' : 'start'} capture`);
        }
    };

    const handleApplyFilters = () => {
        if (validateFilters()) {
            toast.success("Filters applied successfully");
            if (captureStatus === 'capturing') {
                fetchData();
            }
        }
    };

    const fetchData = async () => {
        try {
            const response = await axios.get(`${API_ENDPOINT}/network_data`, {
                params: filters
            });
            setNetworkData(response.data);
        } catch (error) {
            toast.error("Failed to fetch network data");
        }
    };

    useEffect(() => {
        let interval;
        if (captureStatus === 'capturing') {
            interval = setInterval(fetchData, 1000);
        }
        return () => clearInterval(interval);
    }, [captureStatus, filters]);

    // Render Component
    return (
        <PageContainer>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <StyledCard>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h5">Network Protocol Analyzer</Typography>
                            <Box>
                                <Button
                                    variant="contained"
                                    color={captureStatus === 'capturing' ? 'error' : 'success'}
                                    onClick={handleCaptureToggle}
                                    sx={{ mr: 2 }}
                                >
                                    {captureStatus === 'capturing' ? 'Stop Capture' : 'Start Capture'}
                                </Button>
                                
                                <Tooltip title="Export as PDF">
                                    <ExportButton onClick={() => handleExport('pdf')}>
                                        <PictureAsPdf />
                                    </ExportButton>
                                </Tooltip>
                                <Tooltip title="Export as CSV">
                                    <ExportButton onClick={() => handleExport('csv')}>
                                        <TableChart />
                                    </ExportButton>
                                </Tooltip>
                                <Tooltip title="Export as HTML">
                                    <ExportButton onClick={() => handleExport('html')}>
                                        <Code />
                                    </ExportButton>
                                </Tooltip>
                                <Tooltip title="Refresh Data">
                                    <ExportButton onClick={fetchData}>
                                        <Refresh />
                                    </ExportButton>
                                </Tooltip>
                            </Box>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <StyledCard>
                                    <Typography variant="h6" gutterBottom>Filters</Typography>
                                    <TextField
                                        fullWidth
                                        label="IP Range"
                                        value={filters.ipRange}
                                        onChange={(e) => setFilters({ ...filters, ipRange: e.target.value })}
                                        placeholder="192.168.1.0/24"
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Port Range"
                                        value={filters.portRange}
                                        onChange={(e) => setFilters({ ...filters, portRange: e.target.value })}
                                        placeholder="80-443"
                                        sx={{ mb: 2 }}
                                    />
                                    <Select
                                        fullWidth
                                        value={filters.protocol}
                                        onChange={(e) => setFilters({ ...filters, protocol: e.target.value })}
                                        sx={{ mb: 2 }}
                                    >
                                        <MenuItem value="all">All Protocols</MenuItem>
                                        <MenuItem value="tcp">TCP</MenuItem>
                                        <MenuItem value="udp">UDP</MenuItem>
                                        <MenuItem value="icmp">ICMP</MenuItem>
                                        <MenuItem value="http">HTTP</MenuItem>
                                        <MenuItem value="https">HTTPS</MenuItem>
                                        <MenuItem value="dns">DNS</MenuItem>
                                    </Select>
                                    <Select
                                        fullWidth
                                        value={filters.timeRange}
                                        onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
                                        sx={{ mb: 2 }}
                                    >
                                        <MenuItem value="1h">Last Hour</MenuItem>
                                        <MenuItem value="6h">Last 6 Hours</MenuItem>
                                        <MenuItem value="24h">Last 24 Hours</MenuItem>
                                        <MenuItem value="7d">Last 7 Days</MenuItem>
                                    </Select>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        color="primary"
                                        onClick={handleApplyFilters}
                                    >
                                        Apply Filters
                                    </Button>
                                </StyledCard>
                            </Grid>

                            <Grid item xs={12} md={9}>
                                <div id="visualization-section">
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <ChartContainer>
                                                <Typography variant="h6" gutterBottom>
                                                    Protocol Distribution
                                                </Typography>
                                                <div id="protocol-chart">
                                                    <Pie 
                                                        data={protocolChartData} 
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: {
                                                                    position: 'bottom'
                                                                }
                                                            }
                                                        }} 
                                                    />
                                                </div>
                                            </ChartContainer>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <ChartContainer>
                                                <Typography variant="h6" gutterBottom>
                                                    Traffic Over Time
                                                </Typography>
                                                <div id="timeseries-chart">
                                                    <Line 
                                                        data={timeSeriesData} 
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            scales: {
                                                                y: {
                                                                    beginAtZero: true
                                                                }
                                                            },
                                                            plugins: {
                                                                legend: {
                                                                    position: 'bottom'
                                                                }
                                                            }
                                                        }} 
                                                    />
                                                </div>
                                            </ChartContainer>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <ChartContainer>
                                                <Typography variant="h6" gutterBottom>
                                                    Network Statistics
                                                </Typography>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={4}>
                                                        <StyledCard>
                                                            <Typography variant="h4">
                                                                {networkData.packets.length}
                                                            </Typography>
                                                            <Typography>Total Packets</Typography>
                                                        </StyledCard>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <StyledCard>
                                                            <Typography variant="h4">
                                                                {Object.keys(networkData.protocols).length}
                                                            </Typography>
                                                            <Typography>Active Protocols</Typography>
                                                        </StyledCard>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <StyledCard>
                                                            <Typography variant="h4">
                                                                {networkData.anomalies.length}
                                                            </Typography>
                                                            <Typography>Anomalies Detected</Typography>
                                                        </StyledCard>
                                                    </Grid>
                                                </Grid>
                                            </ChartContainer>
                                        </Grid>
                                    </Grid>
                                </div>
                            </Grid>
                        </Grid>
                    </StyledCard>
                </Grid>
            </Grid>
            {showCSV && (
                <CSVDownload
                    data={networkData}
                    filename={`network_analysis_${Date.now()}.csv`}
                    target="_blank"
                />
            )}
        </PageContainer>
    );
};

export default NetworkPulse;
