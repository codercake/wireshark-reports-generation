import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    Typography,
    Button,
    IconButton,
    Container,
    Tooltip,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    useMediaQuery
} from '@mui/material';
import { motion } from 'framer-motion';
import { Line, Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    RadialLinearScale,
    Filler,
    Tooltip as ChartTooltip,
    Legend
} from 'chart.js';
import {
    Download,
    Refresh,
    FileDownload,
    Warning,
    Security,
    TrendingUp,
    Speed,
    Cloud,
    Timer
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    RadialLinearScale,
    Filler,
    ChartTooltip,
    Legend
);

const PageContainer = styled(Box)`
    min-height: 100vh;
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
    position: relative;
    overflow: auto;
    color: white;
    width: 100vw;
    margin: 0;
    padding: 0;
`;

const StyledCard = styled(motion(Card))`
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: ${props => props.isSmallScreen ? '16px' : '24px'};
    height: 100%;
    color: white;
    transition: all 0.3s ease;
    margin: 0;

    &:hover {
        transform: translateY(-5px);
        background: rgba(255, 255, 255, 0.1);
    }
`;

const ThreatCard = styled(StyledCard)`
    border-left: 4px solid;
    border-left-color: ${props => {
        switch (props.severity) {
            case 'critical': return '#ff0000';
            case 'high': return '#ff9800';
            case 'medium': return '#ffeb3b';
            default: return '#4caf50';
        }
    }};
`;

const MetricBox = styled(motion.div)`
    padding: ${props => props.isSmallScreen ? '10px' : '20px'};
    text-align: center;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
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

const AnomalyItem = styled(Box)`
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 8px;
    background-color: rgba(255, 165, 0, 0.1);
    border: 1px solid rgba(255, 165, 0, 0.3);
    display: flex;
    align-items: center;
    color: #FFa500;
`;

const ExportButton = styled(Button)`
    background: linear-gradient(45deg, #2196f3, #21cbf3);
    color: white;
    padding: 8px 24px;
    margin: 0 5px;
    border-radius: 30px;
    text-transform: none;
    font-weight: 600;

    &:hover {
        background: linear-gradient(45deg, #1976d2, #1bb8e0);
    }
`;

const ThreatMetric = ({ type, data }) => (
    <Box sx={{ mb: 2 }}>
        <Typography variant="h6" color={data.severity === 'critical' ? 'error' : 'inherit'}>
            {type} Attacks
        </Typography>
        <Typography variant="body1">Detected: {data.count}</Typography>
        <Typography variant="body2" color="textSecondary">
            Last Detection: {data.lastDetected ? new Date(data.lastDetected).toLocaleString() : 'N/A'}
        </Typography>
        <Typography variant="body2" 
            sx={{ 
                color: data.severity === 'critical' ? '#ff0000' : 
                       data.severity === 'high' ? '#ff9800' : '#ffeb3b' 
            }}>
            Severity: {data.severity.toUpperCase()}
        </Typography>
    </Box>
);

const Reports = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [reports, setReports] = useState([]);
    const [networkStats, setNetworkStats] = useState({
        totalData: 0,
        totalPackets: 0,
        networkUptime: 100,
        avgLatency: 0
    });

    const [anomalies, setAnomalies] = useState([]);
    const [anomalyThreshold, setAnomalyThreshold] = useState(10000);
    const [timeRange, setTimeRange] = useState('all');
    const [sortBy, setSortBy] = useState('timestamp');
    const [sortOrder, setSortOrder] = useState('desc');
    const [trafficChartImage, setTrafficChartImage] = useState(null);
    const [threatStats, setThreatStats] = useState({
        mitm: { count: 0, severity: 'medium', lastDetected: null },
        bruteForce: { count: 0, severity: 'high', lastDetected: null },
        ddos: { count: 0, severity: 'critical', lastDetected: null },
        dos: { count: 0, severity: 'high', lastDetected: null },
        sqlInjection: { count: 0, severity: 'critical', lastDetected: null }
    });
    const [activeMitigations, setActiveMitigations] = useState([]);

    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const threatRadarChart = {
        labels: ['DDoS', 'Port Scan', 'Malware', 'Data Leak', 'Intrusion'],
        datasets: [{
            label: 'Threat Distribution',
            data: [65, 59, 90, 81, 56],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
            pointBackgroundColor: 'rgb(255, 99, 132)',
        }]
    };

    const radarOptions = {
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
                grid: { color: 'rgba(255, 255, 255, 0.2)' },
                pointLabels: { color: 'white' },
                ticks: { color: 'white', backdropColor: 'transparent' }
            }
        },
        plugins: {
            legend: {
                labels: { color: 'white' }
            }
        }
    };

    const fetchReports = async () => {
        setIsRefreshing(true);
        try {
            const [reportsResponse, threatsResponse] = await Promise.all([
                axios.get('http://localhost:5002/api/reports'),
                axios.get('http://localhost:5002/api/threats')
            ]);

            let data = reportsResponse.data;

            if (timeRange !== 'all') {
                const now = new Date();
                let startTime;

                switch (timeRange) {
                    case 'lastHour':
                        startTime = new Date(now.getTime() - 60 * 60 * 1000);
                        break;
                    case 'last24Hours':
                        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                        break;
                    case 'last7Days':
                        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        startTime = null;
                }

                if (startTime) {
                    data = data.filter(report => new Date(report.timestamp) >= startTime);
                }
            }

            data.sort((a, b) => {
                const order = sortOrder === 'asc' ? 1 : -1;
                if (sortBy === 'timestamp') {
                    return order * (new Date(a.timestamp) - new Date(b.timestamp));
                } else if (sortBy === 'total_packets') {
                    return order * (a.total_packets - b.total_packets);
                } else if (sortBy === 'average_latency') {
                    return order * (a.average_latency - b.average_latency);
                }
                return 0;
            });

            setReports(data);
            
            // Update threatStats based on severity
            const updatedThreatStats = {
                mitm: { count: 0, severity: 'medium', lastDetected: null },
                bruteForce: { count: 0, severity: 'high', lastDetected: null },
                ddos: { count: 0, severity: 'critical', lastDetected: null },
                dos: { count: 0, severity: 'high', lastDetected: null },
                sqlInjection: { count: 0, severity: 'critical', lastDetected: null }
            };

            if (threatsResponse.data && threatsResponse.data.threats) {
                Object.keys(threatsResponse.data.threats).forEach(threatType => {
                    updatedThreatStats[threatType] = threatsResponse.data.threats[threatType];
                });
            }
            
            setThreatStats(updatedThreatStats);
            setActiveMitigations(threatsResponse.data.mitigations);
            calculateNetworkStats(data);
            detectAnomalies(data);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error(`Error fetching data: ${error.message}`); 
        } finally {
            setIsRefreshing(false);
        }
    };
    
    const calculateNetworkStats = (reportData) => {
        const stats = reportData.reduce((acc, report) => ({
            totalData: acc.totalData + (report.total_bytes || 0),
            totalPackets: acc.totalPackets + (report.total_packets || 0),
            avgLatency: acc.avgLatency + (report.average_latency || 0)
        }), { totalData: 0, totalPackets: 0, avgLatency: 0 });

        setNetworkStats({
            totalData: `${(stats.totalData / (1024 * 1024)).toFixed(2)} MB`,
            totalPackets: stats.totalPackets.toLocaleString(),
            networkUptime: '99.9%',
            avgLatency: `${(stats.avgLatency / reportData.length || 0).toFixed(2)}ms`
        });
    };

    const detectAnomalies = (reportData) => {
        const potentialAnomalies = reportData.filter(report => 
            report.total_packets > anomalyThreshold
        );
        setAnomalies(potentialAnomalies);
    };

    const metrics = [
        { icon: <Cloud/>, value: networkStats.totalData, label: 'Total Data', color: '#2196f3' },
        { icon: <Speed/>, value: networkStats.totalPackets, label: 'Total Packets', color: '#21cbf3' },
        { icon: <TrendingUp/>, value: networkStats.networkUptime, label: 'Network Uptime', color: '#64b5f6' },
        { icon: <Timer/>, value: networkStats.avgLatency, label: 'Avg Latency', color: '#90caf9' }
    ];

    const trafficData = {
        labels: reports.map(report => new Date(report.timestamp).toLocaleTimeString()),
        datasets: [{
            label: 'Network Traffic',
            data: reports.map(report => report.total_packets),
            borderColor: '#2196f3',
            backgroundColor: 'rgba(33, 150, 243, 0.2)',
            fill: true
        }]
    };

    const chartOptions = {
        maintainAspectRatio: !isSmallScreen,
        responsive: true,
        plugins: {
            legend: {
                labels: { color: 'white' }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: 'white' }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: 'white' }
            }
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchReports();
        setIsRefreshing(false);
    };

    const exportToPdf = async () => {
        const doc = new jsPDF();
        doc.text("Network Analysis Report", 10, 10);

        //add network statistics
        let yOffset = 20;
        doc.text(`Total Data: ${networkStats.totalData}`, 10, yOffset);
        yOffset += 10;
        doc.text(`Total Packets: ${networkStats.totalPackets}`, 10, yOffset);
        yOffset += 10;
        doc.text(`Average Latency: ${networkStats.avgLatency}`, 10, yOffset);
        yOffset += 10;

        doc.text("Threat Alerts:", 10, yOffset);
        yOffset += 10;
        if (anomalies.length > 0) {
            anomalies.forEach((anomaly, index) => {
                doc.text(
                    `Potential Threat ${index + 1}: High traffic detected on ${new Date(anomaly.timestamp).toLocaleString()} (Packets: ${anomaly.total_packets}, Latency: ${anomaly.average_latency}ms)`,
                    15,
                    yOffset
                );
                yOffset += 10;
            });
        } else {
            doc.text("No immediate threats detected.", 15, yOffset);
            yOffset += 10;
        }

        if (trafficChartImage) {
            doc.addImage(trafficChartImage, 'PNG', 10, yOffset, 180, 100);
            yOffset += 110;
        }

        const tableColumn = ["Timestamp", "Total Packets", "Average Latency"];
        const tableRows = reports.map(report => [
            new Date(report.timestamp).toLocaleString(),
            report.total_packets,
            report.average_latency
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: yOffset + 10,
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 30 },
                2: { cellWidth: 30 },
            },
        });

        doc.save("network_report.pdf");
    };

    const handleExport = async (format) => {
        setIsRefreshing(true);
        try {
            const response = await axios.get(`http://localhost:5002/export/${format}`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], {
                type: format === 'pdf' ? 'application/pdf' :
                    format === 'csv' ? 'text/csv' : 'text/html'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `network_report.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(`Export error (${format}):`, error);
            toast.error(`Export error (${format}): ${error.message}`);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchReports();
        const interval = setInterval(fetchReports, 30000);
        return () => clearInterval(interval);
    }, [timeRange, sortBy, sortOrder]);

    useEffect(() => {
        const captureChart = async () => {
            if (!trafficData?.datasets?.[0]?.data?.length) return;

            const chartContainer = document.querySelector('.traffic-chart-container');
            if (chartContainer) {
                const dataUrl = await toPng(chartContainer);
                setTrafficChartImage(dataUrl);
            }
        };

        captureChart();
    }, [trafficData]);

    return (
        <PageContainer>
            <Box sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexDirection={isSmallScreen ? 'column' : 'row'}>
                    <Typography variant="h4">Network Reports</Typography>
                    <Box>
                        <IconButton onClick={handleRefresh} sx={{ color: 'white' }}>
                            <Refresh sx={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}/>
                        </IconButton>
                        <Tooltip title="Export to PDF">
                            <IconButton onClick={exportToPdf} sx={{ color: 'white' }}>
                                <FileDownload/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Export to HTML">
                            <IconButton onClick={() => handleExport('html')} sx={{ color: 'white' }}>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Export to CSV">
                            <IconButton onClick={() => handleExport('csv')} sx={{ color: 'white' }}>
                                <Download/>
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

       
                <Grid container spacing={3}>
                    
                    <Grid item xs={12} md={6} lg={3}>
                        <StyledCard isSmallScreen={isSmallScreen}>
                            <Typography variant="h6" mb={2}>Network Metrics</Typography>
                            {metrics.map(metric => (
                                <MetricBox key={metric.label} isSmallScreen={isSmallScreen}>
                                    {metric.icon}
                                    <Typography variant="h5" color={metric.color}>{metric.value}</Typography>
                                    <Typography variant="body2">{metric.label}</Typography>
                                </MetricBox>
                            ))}
                        </StyledCard>
                    </Grid>

                   
                    <Grid item xs={12} md={6} lg={3}>
                        <StyledCard isSmallScreen={isSmallScreen}>
                            <Typography variant="h6" mb={2}>Threat Stats</Typography>
                            <ThreatMetric type="DDoS" data={threatStats.ddos} />
                            <ThreatMetric type="Brute Force" data={threatStats.bruteForce} />
                            <ThreatMetric type="SQL Injection" data={threatStats.sqlInjection} />
                        </StyledCard>
                    </Grid>

                 
                    <Grid item xs={12} md={6} lg={3}>
                        <StyledCard isSmallScreen={isSmallScreen}>
                            <Typography variant="h6" mb={2}>Active Mitigations</Typography>
                            {activeMitigations.length > 0 ? (
                                activeMitigations.map((mitigation, index) => (
                                    <AnomalyItem key={index}>
                                        <Security sx={{ mr: 1 }}/>
                                        {mitigation.description}
                                    </AnomalyItem>
                                ))
                            ) : (
                                <Typography variant="body2">No active mitigations.</Typography>
                            )}
                        </StyledCard>
                    </Grid>

                
                    <Grid item xs={12} md={6} lg={3}>
                        <StyledCard isSmallScreen={isSmallScreen}>
                            <Typography variant="h6" mb={2}>Configuration Options</Typography>
                            <Box display="flex" flexDirection={isSmallScreen ? 'column' : 'row'} gap={2} alignItems="center">
                                <TextField
                                    label="Anomaly Threshold (Packets)"
                                    type="number"
                                    value={anomalyThreshold}
                                    onChange={(e) => setAnomalyThreshold(parseInt(e.target.value))}
                                    sx={{ width: '100%', mb: 2 }}
                                    InputLabelProps={{ style: { color: 'white' } }}
                                    InputProps={{ style: { color: 'white' } }}
                                />
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel id="time-range-label" style={{ color: 'white' }}>Time Range</InputLabel>
                                    <Select
                                        labelId="time-range-label"
                                        id="time-range-select"
                                        value={timeRange}
                                        label="Time Range"
                                        onChange={(e) => setTimeRange(e.target.value)}
                                        sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.23)' } }}
                                    >
                                        <MenuItem value="all">All Time</MenuItem>
                                        <MenuItem value="lastHour">Last Hour</MenuItem>
                                        <MenuItem value="last24Hours">Last 24 Hours</MenuItem>
                                        <MenuItem value="last7Days">Last 7 Days</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box display="flex" flexDirection={isSmallScreen ? 'column' : 'row'} gap={2} alignItems="center">
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel id="sort-by-label" style={{ color: 'white' }}>Sort By</InputLabel>
                                    <Select
                                        labelId="sort-by-label"
                                        id="sort-by-select"
                                        value={sortBy}
                                        label="Sort By"
                                        onChange={(e) => setSortBy(e.target.value)}
                                        sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.23)' } }}
                                    >
                                        <MenuItem value="timestamp">Timestamp</MenuItem>
                                        <MenuItem value="total_packets">Total Packets</MenuItem>
                                        <MenuItem value="average_latency">Average Latency</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel id="sort-order-label" style={{ color: 'white' }}>Sort Order</InputLabel>
                                    <Select
                                        labelId="sort-order-label"
                                        id="sort-order-select"
                                        value={sortOrder}
                                        label="Sort Order"
                                        onChange={(e) => setSortOrder(e.target.value)}
                                        sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.23)' } }}
                                    >
                                        <MenuItem value="asc">Ascending</MenuItem>
                                        <MenuItem value="desc">Descending</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </StyledCard>
                    </Grid>

                   
                    <Grid item xs={12}>
                        <StyledCard isSmallScreen={isSmallScreen} className="traffic-chart-container">
                            <Typography variant="h6" gutterBottom>
                                Network Traffic
                            </Typography>
                            <Line data={trafficData} options={chartOptions}/>
                        </StyledCard>
                    </Grid>

              
                    <Grid item xs={12}>
                        <StyledCard isSmallScreen={isSmallScreen}>
                            <Typography variant="h6" gutterBottom>
                                Potential Anomalies
                            </Typography>
                            {anomalies.length > 0 ? (
                                anomalies.map((anomaly, index) => (
                                    <AnomalyItem key={index}>
                                        <Warning sx={{ mr: 1 }}/>
                                        {`High traffic detected on ${new Date(anomaly.timestamp).toLocaleString()} (Packets: ${anomaly.total_packets}, Latency: ${anomaly.average_latency}ms)`}
                                    </AnomalyItem>
                                ))
                            ) : (
                                <Typography variant="body2">No immediate threats detected.</Typography>
                            )}
                        </StyledCard>
                    </Grid>
                </Grid>
            </Box>
        </PageContainer>
    );
};

export default Reports;
