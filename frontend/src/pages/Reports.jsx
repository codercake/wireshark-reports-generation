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
    useMediaQuery // Import useMediaQuery
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

// Register ChartJS components
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
  width: 100vw; /* Make it span the entire viewport width */
  margin: 0; /* Reset any default margins */
  padding: 0; /* Reset any default padding */
`;

const StyledCard = styled(motion(Card))`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: ${props => props.isSmallScreen ? '16px' : '24px'}; /* Reduced padding on smaller screens */
  height: 100%;
  color: white;
  transition: all 0.3s ease;
  margin: 0; /* Reset card margins */

  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MetricBox = styled(motion.div)`
  padding: ${props => props.isSmallScreen ? '10px' : '20px'}; /* Reduced padding on smaller screens */
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
    const [anomalyThreshold, setAnomalyThreshold] = useState(10000); // Configurable threshold
    const [timeRange, setTimeRange] = useState('all'); // Filtering
    const [sortBy, setSortBy] = useState('timestamp'); // Sorting
    const [sortOrder, setSortOrder] = useState('desc');
    const [trafficChartImage, setTrafficChartImage] = useState(null);

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
            const response = await axios.get('http://localhost:5002/api/reports');
            let data = response.data;

            // Apply Time Range Filter
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

            // Apply Sorting
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
            calculateNetworkStats(data);
            detectAnomalies(data);
        } catch (error) {
            console.error('Error fetching reports:', error);
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
        const potentialAnomalies = reportData.filter(report => report.total_packets > anomalyThreshold);
        setAnomalies(potentialAnomalies);
    };

    useEffect(() => {
        fetchReports();
        const interval = setInterval(fetchReports, 30000);
        return () => clearInterval(interval);
    }, []);

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
        maintainAspectRatio: !isSmallScreen, // Disable aspect ratio on smaller screens
        responsive: true, // Ensure the chart is responsive
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

        // Add network statistics
        let yOffset = 20;
        doc.text(`Total Data: ${networkStats.totalData}`, 10, yOffset);
        yOffset += 10;
        doc.text(`Total Packets: ${networkStats.totalPackets}`, 10, yOffset);
        yOffset += 10;
        doc.text(`Average Latency: ${networkStats.avgLatency}`, 10, yOffset);
        yOffset += 10;

        // Anomaly/Threat Alerts
        doc.text("Threat Alerts:", 10, yOffset);
        yOffset += 10;
        if (anomalies.length > 0) {
            anomalies.forEach((anomaly, index) => {
                doc.text(`Potential Threat ${index + 1}: High traffic detected on ${new Date(anomaly.timestamp).toLocaleString()} (Packets: ${anomaly.total_packets}, Latency: ${anomaly.average_latency}ms)`, 15, yOffset);
                yOffset += 10;
            });
        } else {
            doc.text("No immediate threats detected.", 15, yOffset);
            yOffset += 10;
        }

        // Traffic Chart
        if (trafficChartImage) {
            doc.addImage(trafficChartImage, 'PNG', 10, yOffset, 180, 100); // Adjust position and size as needed
            yOffset += 110;
        }

        // Traffic Data Table
        const tableColumn = ["Timestamp", "Total Packets", "Average Latency"];
        const tableRows = reports.map(report => [
            new Date(report.timestamp).toLocaleString(),
            report.total_packets,
            report.average_latency
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: yOffset + 10, // Add some space after anomalies
            columnStyles: { // Added this
                0: { cellWidth: 50 }, // Timestamp column
                1: { cellWidth: 30 },  // Total Packets
                2: { cellWidth: 30 },   // Average Latency
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
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        const captureChart = async () => {
            if (!trafficData?.datasets?.[0]?.data?.length) return; // Ensure there is data

            const chartContainer = document.querySelector('.traffic-chart-container'); // Add this className to the chart container
            if (chartContainer) {
                const dataUrl = await toPng(chartContainer);
                setTrafficChartImage(dataUrl);
            } else {
                console.warn('Traffic chart container not found.');
            }
        };

        captureChart();
    }, [trafficData]);  //Re-capture when trafficData updates

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
                        </Box>
                    </Box>

                    <Grid container spacing={3}>
                        {/* Configuration Options */}
                        <Grid item xs={12} md={12} lg={12}>
                            <StyledCard isSmallScreen={isSmallScreen}> {/* Pass screen size prop */}
                                <Typography variant="h6" mb={2}>Configuration Options</Typography>
                                <Box display="flex" flexDirection={isSmallScreen ? 'column' : 'row'} gap={2} alignItems="center">
                                    {/* Anomaly Threshold */}
                                    <TextField
                                        label="Anomaly Threshold (Packets)"
                                        type="number"
                                        value={anomalyThreshold}
                                        onChange={(e) => setAnomalyThreshold(parseInt(e.target.value))}
                                        size="small"
                                        sx={{backgroundColor: 'rgba(255, 255, 255, 0.05)'}}
                                        InputProps={{
                                            style: { color: 'white' }
                                        }}
                                        InputLabelProps={{
                                            style: { color: 'white' }
                                        }}
                                    />
                                    {/* Time Range Filter */}
                                    <FormControl variant="outlined" size="small" sx={{ minWidth: 150, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                                        <InputLabel id="time-range-label" style={{ color: 'white' }}>Time Range</InputLabel>
                                        <Select
                                            labelId="time-range-label"
                                            id="time-range-select"
                                            value={timeRange}
                                            onChange={(e) => setTimeRange(e.target.value)}
                                            label="Time Range"
                                            style={{ color: 'white' }}
                                        >
                                            <MenuItem value="all">All Time</MenuItem>
                                            <MenuItem value="lastHour">Last Hour</MenuItem>
                                            <MenuItem value="last24Hours">Last 24 Hours</MenuItem>
                                            <MenuItem value="last7Days">Last 7 Days</MenuItem>
                                        </Select>
                                    </FormControl>
                                    {/* Sort By */}
                                    <FormControl variant="outlined" size="small" sx={{ minWidth: 150, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                                        <InputLabel id="sort-by-label" style={{ color: 'white' }}>Sort By</InputLabel>
                                        <Select
                                            labelId="sort-by-label"
                                            id="sort-by-select"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            label="Sort By"
                                            style={{ color: 'white' }}
                                        >
                                            <MenuItem value="timestamp">Timestamp</MenuItem>
                                            <MenuItem value="total_packets">Total Packets</MenuItem>
                                            <MenuItem value="average_latency">Average Latency</MenuItem>
                                        </Select>
                                    </FormControl>
                                    {/* Sort Order */}
                                    <FormControl variant="outlined" size="small" sx={{ minWidth: 120, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                                        <InputLabel id="sort-order-label" style={{ color: 'white' }}>Sort Order</InputLabel>
                                        <Select
                                            labelId="sort-order-label"
                                            id="sort-order-select"
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value)}
                                            label="Sort Order"
                                            style={{ color: 'white' }}
                                        >
                                            <MenuItem value="asc">Ascending</MenuItem>
                                            <MenuItem value="desc">Descending</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </StyledCard>
                        </Grid>

                        {/* Metrics Overview */}
                        {metrics.map((metric, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <MetricBox isSmallScreen={isSmallScreen} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}> {/* Pass screen size prop */}
                                    {metric.icon}
                                    <Typography variant="h6">{metric.value}</Typography>
                                    <Typography variant="body2" color="textSecondary">{metric.label}</Typography>
                                </MetricBox>
                            </Grid>
                        ))}

                        {/* Traffic Analysis Chart */}
                        <Grid item xs={12} md={8}>
                            <StyledCard isSmallScreen={isSmallScreen}> {/* Pass screen size prop */}
                                <Typography variant="h6" mb={2}>Network Traffic Analysis</Typography>
                                <div className="traffic-chart-container" style={{ height: isSmallScreen ? '300px' : '400px' }}>
                                    <Line data={trafficData} options={chartOptions}/>
                                </div>
                            </StyledCard>
                        </Grid>

                        {/* Threat Radar Chart */}
                        <Grid item xs={12} md={4}>
                            <StyledCard isSmallScreen={isSmallScreen}> {/* Pass screen size prop */}
                                <Typography variant="h6" mb={2}>Threat Distribution</Typography>
                                <div style={{ height: isSmallScreen ? '300px' : '400px' }}>
                                    <Radar data={threatRadarChart} options={radarOptions}/>
                                </div>
                            </StyledCard>
                        </Grid>

                        {/* Real-Time Anomaly/Threat Alerts */}
                        <Grid item xs={12}>
                            <StyledCard isSmallScreen={isSmallScreen}> {/* Pass screen size prop */}
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6">Anomaly/Threat Alerts</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Threshold: {anomalyThreshold} packets
                                    </Typography>
                                </Box>
                                {anomalies.length > 0 ? (
                                    anomalies.map((anomaly, index) => (
                                        <AnomalyItem key={index}>
                                            <Warning sx={{ marginRight: 1 }}/>
                                            Potential Threat: High traffic detected on {new Date(anomaly.timestamp).toLocaleString()} (Packets: {anomaly.total_packets}, Latency: {anomaly.average_latency}ms)
                                        </AnomalyItem>
                                    ))
                                ) : (
                                    <Typography variant="body2">No anomalies detected.</Typography>
                                )}
                            </StyledCard>
                        </Grid>

                        {/* Data Table */}
                        <Grid item xs={12}>
                            <StyledCard isSmallScreen={isSmallScreen}> {/* Pass screen size prop */}
                                <Typography variant="h6" mb={2}>Traffic Data</Typography>
                                {reports.length > 0 ? (
                                    <div style={{ overflowX: 'auto' }}> {/* Horizontal scroll on small screens */}
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                            <tr>
                                                <th style={{ padding: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>Timestamp</th>
                                                <th style={{ padding: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>Total Packets</th>
                                                <th style={{ padding: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>Average Latency</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {reports.map((report, index) => (
                                                <tr key={index}>
                                                    <td style={{ padding: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>{new Date(report.timestamp).toLocaleString()}</td>
                                                    <td style={{ padding: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>{report.total_packets}</td>
                                                    <td style={{ padding: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>{report.average_latency}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <Typography variant="body2">No data available.</Typography>
                                )}
                            </StyledCard>
                        </Grid>
                    </Grid>
                </Box>
        </PageContainer>
    );
};

export default Reports;