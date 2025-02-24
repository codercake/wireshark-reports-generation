import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Grid, Typography, Button, Card, TextField,
    Select, MenuItem, IconButton, Tooltip, Alert, Snackbar
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
    const [alert, setAlert] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

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

    const showAlert = (message, severity = 'error') => {
        setAlert({
            open: true,
            message,
            severity
        });
    };

    const handleCloseAlert = () => {
        setAlert({ ...alert, open: false });
    };

    const validateFilters = () => {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{2})?$/;
        const portRegex = /^\d+(-\d+)?$/;
    
        if (filters.ipRange && !ipRegex.test(filters.ipRange)) {
            showAlert("Invalid IP Range. Please use format: 192.168.1.0/24");
            return false;
        }
    
        if (filters.portRange && !portRegex.test(filters.portRange)) {
            showAlert("Invalid Port Range. Please use format: 80-443");
            return false;
        }
    
        if (filters.protocol === '') {
            showAlert("Protocol Required. Please select a protocol", "warning");
            return false;
        }
    
        return true;
    };

    const exportToPDF = async () => {
        try {
            toast.info("Generating PDF report...", { 
                duration: 2000,
                id: "pdf-export-loading" 
            });
            
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
    
            pdf.setFontSize(24);
            pdf.setTextColor(44, 62, 80);
            pdf.text('Network Traffic Analysis Report', 15, 20);
    
            pdf.setFontSize(12);
            pdf.setTextColor(52, 73, 94);
            const currentDate = new Date().toLocaleString();
            pdf.text(`Generated: ${currentDate}`, 15, 30);
            pdf.text(`Time Range: ${filters.timeRange}`, 15, 35);
            pdf.text(`Protocol Filter: ${filters.protocol}`, 15, 40);
            pdf.text(`IP Range: ${filters.ipRange || 'All'}`, 15, 45);
            pdf.text(`Port Range: ${filters.portRange || 'All'}`, 15, 50);
            
            pdf.setDrawColor(200, 200, 200);
            pdf.line(15, 55, pageWidth - 15, 55);
            
            const protocolChart = document.getElementById('protocol-chart');
            const timeSeriesChart = document.getElementById('timeseries-chart');
            const statsSection = document.getElementById('stats-section');
            
            const protocolCanvas = await html2canvas(protocolChart, {
                scale: 3,
                backgroundColor: '#ffffff',
                logging: false
            });
            
            const chartWidth = pageWidth / 2 - 25;
            const chartHeight = 80;
            
            pdf.text('Protocol Distribution', 15, 65);
            pdf.addImage(
                protocolCanvas.toDataURL('image/png'),
                'PNG',
                15,
                70,
                chartWidth,
                chartHeight
            );
            
            const timeSeriesCanvas = await html2canvas(timeSeriesChart, {
                scale: 3,
                backgroundColor: '#ffffff',
                logging: false
            });
            
            pdf.text('Traffic Over Time', pageWidth / 2 + 5, 65);
            pdf.addImage(
                timeSeriesCanvas.toDataURL('image/png'),
                'PNG',
                pageWidth / 2 + 5,
                70,
                chartWidth,
                chartHeight
            );
    
            pdf.setFontSize(18);
            pdf.text('Network Statistics Summary', 15, 165);
            
            pdf.setDrawColor(100, 100, 100);
            pdf.setFillColor(250, 250, 250);
            pdf.roundedRect(15, 170, pageWidth - 30, 40, 3, 3, 'FD');
            
            const stats = [
                `Total Packets: ${networkData.packets.length}`,
                `Active Protocols: ${Object.keys(networkData.protocols).length}`,
                `Anomalies Detected: ${networkData.anomalies.length}`
            ];
    
            pdf.setFontSize(14);
            stats.forEach((stat, index) => {
                const colWidth = (pageWidth - 30) / stats.length;
                pdf.text(stat, 25 + (colWidth * index), 190);
            });
            
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Network Protocol Analyzer - Report generated on ${currentDate}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
            pdf.save(`network_analysis_${Date.now()}.pdf`);
            toast.success("PDF report exported successfully");
        } catch (error) {
            console.error("PDF export error:", error);
            toast.error("Failed to export PDF: " + error.message);
        }
    };

    const handleExport = async (format) => {
        if (!validateFilters()) {
            showAlert("Please correct filter errors before exporting");
            return;
        }
        
        if (networkData.packets.length === 0) {
            showAlert("No data available to export. Start a capture first or refresh data.", "warning");
            return;
        }
        
        try {
            if (format === 'pdf') {
                await exportToPDF();
            } else {
                toast.loading(`Preparing ${format.toUpperCase()} export...`);
                
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
                
                toast.dismiss();
                toast.success(`${format.toUpperCase()} exported successfully`);
            }
        } catch (error) {
            console.error(`Export error (${format}):`, error);
            toast.dismiss();
            toast.error(`Failed to export ${format}: ${error.message || 'Unknown error'}`);
        }
    };

    const handleCaptureToggle = async () => {
        if (!validateFilters()) {
            showAlert("Please correct filter errors before starting capture");
            return;
        }

        try {
            const newStatus = captureStatus === 'capturing' ? 'stopped' : 'capturing';
            await axios.post(`${API_ENDPOINT}/${newStatus === 'capturing' ? 'start' : 'stop'}_capture`, filters);
            setCaptureStatus(newStatus);
            
            if (newStatus === 'capturing') {
                showAlert("Network capture started successfully", "success");
                fetchData();
            } else {
                showAlert("Network capture stopped", "info");
            }
        } catch (error) {
            console.error("Capture toggle error:", error);
            showAlert(`Failed to ${captureStatus === 'capturing' ? 'stop' : 'start'} capture: ${error.message || 'Unknown error'}`);
        }
    };

    const handleApplyFilters = () => {
        if (validateFilters()) {
            showAlert("Filters applied successfully", "success");
            setIsFiltersValid(true);
            if (captureStatus === 'capturing') {
                fetchData();
            }
        } else {
            setIsFiltersValid(false);
        }
    };

    const fetchData = async () => {
        try {
            toast.loading("Fetching network data...", { id: "fetch-data" });
            const response = await axios.get(`${API_ENDPOINT}/network_data`, {
                params: filters
            });
            setNetworkData(response.data);
            toast.success("Network data updated", { id: "fetch-data" });
        } catch (error) {
            console.error("Data fetch error:", error);
            toast.error("Failed to fetch network data: " + (error.message || 'Unknown error'), { id: "fetch-data" });
        }
    };

    useEffect(() => {
        const debouncedValidation = setTimeout(() => {
            if (filters.ipRange || filters.portRange) {
                const isValid = validateFilters();
                setIsFiltersValid(isValid);
            }
        }, 500);
    
        return () => clearTimeout(debouncedValidation);
    }, [filters.ipRange, filters.portRange]);
    

    return (
        <PageContainer>
            <Snackbar 
                open={alert.open} 
                autoHideDuration={5000} 
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseAlert} 
                    severity={alert.severity} 
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {alert.message}
                </Alert>
            </Snackbar>
            
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <StyledCard>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h5">Network Protocol Analyzer</Typography>
                            <Box>
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

                        {!isFiltersValid && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                Please correct the filter errors before proceeding
                            </Alert>
                        )}

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
                                        error={filters.ipRange && !isFiltersValid}
                                        helperText={filters.ipRange && !isFiltersValid ? "Invalid format (use: 192.168.1.0/24)" : ""}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Port Range"
                                        value={filters.portRange}
                                        onChange={(e) => setFilters({ ...filters, portRange: e.target.value })}
                                        placeholder="80-443"
                                        sx={{ mb: 2 }}
                                        error={filters.portRange && !isFiltersValid}
                                        helperText={filters.portRange && !isFiltersValid ? "Invalid format (use: 80-443)" : ""}
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
                                        sx={{ mb: 2 }}
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
                                                <div id="stats-section">
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
                                                </div>
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