import React, { useState } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Button,
    Switch,
    FormControlLabel,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    SpeedDial,
    SpeedDialAction,
    Snackbar,
    Alert,
    LinearProgress
} from '@mui/material';
import {
    NetworkCheck,
    Speed,
    Timeline,
    Security,
    Warning,
    CloudDownload,
    PictureAsPdf,
    TableChart
} from '@mui/icons-material';
import { Line, Doughnut, Radar } from 'react-chartjs-2';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';
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
    RadialLinearScale
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
    RadialLinearScale
);

const PageContainer = styled(Box)`
    min-height: 100vh;
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
    position: relative;
    overflow: hidden;
    color: white;
`;

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

const StyledPaper = styled(Paper)`
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
`;

const LimitModal = styled(Dialog)({
    '& .MuiDialog-paper': {
        borderRadius: '12px',
        padding: '24px',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: 'white'
    }
});

const NetworkPulse = () => {
    const [isCapturing, setIsCapturing] = useState(false);
    const [realTimeUpdates, setRealTimeUpdates] = useState(true);
    const [reportCount, setReportCount] = useState(0);
    const [limitModalOpen, setLimitModalOpen] = useState(false);
    const [successSnackbar, setSuccessSnackbar] = useState(false);

    const dummyStats = {
        totalPackets: 1234567,
        packetsPerSecond: 856,
        bandwidth: '1.2 GB/s',
        activeConnections: 432,
        protocols: {
            'TCP': 45,
            'UDP': 30,
            'HTTP': 15,
            'HTTPS': 8,
            'DNS': 2
        },
        threats: [
            { severity: 'high', count: 23, type: 'DDoS Attack' },
            { severity: 'medium', count: 45, type: 'Port Scan' },
            { severity: 'low', count: 12, type: 'Suspicious Traffic' }
        ],
        timeSeries: Array(24).fill().map(() => Math.floor(Math.random() * 1000))
    };

    const chartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'white'
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'white'
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'white'
                }
            }
        }
    };

    const protocolChart = {
        labels: Object.keys(dummyStats.protocols),
        datasets: [{
            data: Object.values(dummyStats.protocols),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            borderWidth: 1
        }]
    };

    const networkLoadChart = {
        labels: Array(24).fill().map((_, i) => format(new Date().setHours(i), 'HH:mm')),
        datasets: [{
            label: 'Network Load',
            data: dummyStats.timeSeries,
            fill: true,
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.4
        }]
    };

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

    const handleReportGeneration = (type) => {
        if (reportCount < 2) {
            setReportCount(reportCount + 1);
            setSuccessSnackbar(true);
        } else {
            setLimitModalOpen(true);
        }
    };

    return (
        <PageContainer>
            <Box p={3}>
                {/* Header Section */}
                <Grid container spacing={3} mb={3}>
                    <Grid item xs={12}>
                        <StyledPaper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box display="flex" alignItems="center">
                                <NetworkCheck sx={{ mr: 1, color: '#2196f3' }} />
                                <Typography variant="h5">Network Monitoring Dashboard</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={2}>
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={realTimeUpdates} 
                                            onChange={() => setRealTimeUpdates(!realTimeUpdates)}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: '#2196f3'
                                                }
                                            }}
                                        />
                                    }
                                    label="Real-time Updates"
                                />
                                <GradientButton
                                    variant="contained"
                                    onClick={() => setIsCapturing(!isCapturing)}
                                    startIcon={isCapturing ? <Speed /> : <Timeline />}
                                >
                                    {isCapturing ? "Stop Capture" : "Start Capture"}
                                </GradientButton>
                            </Box>
                        </StyledPaper>
                    </Grid>
                </Grid>

                {/* Stats Cards */}
                <Grid container spacing={3} mb={3}>
                    {[
                        { icon: <Speed />, title: 'Packets/Sec', value: dummyStats.packetsPerSecond },
                        { icon: <NetworkCheck />, title: 'Total Packets', value: dummyStats.totalPackets },
                        { icon: <Timeline />, title: 'Bandwidth', value: dummyStats.bandwidth },
                        { icon: <Security />, title: 'Active Connections', value: dummyStats.activeConnections }
                    ].map((stat, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <StyledCard>
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        {stat.icon}
                                        <Typography variant="h6" ml={1}>{stat.title}</Typography>
                                    </Box>
                                    <Typography variant="h4">{stat.value}</Typography>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={75} 
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
                </Grid>

                {/* Charts Section */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <StyledCard>
                            <CardContent>
                                <Typography variant="h6" mb={2}>Network Traffic Analysis</Typography>
                                <Box height={400}>
                                    <Line data={networkLoadChart} options={chartOptions} />
                                </Box>
                            </CardContent>
                        </StyledCard>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <StyledCard>
                            <CardContent>
                                <Typography variant="h6" mb={2}>Protocol Distribution</Typography>
                                <Box height={400}>
                                    <Doughnut data={protocolChart} options={{ ...chartOptions, scales: undefined }} />
                                </Box>
                            </CardContent>
                        </StyledCard>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <StyledCard>
                            <CardContent>
                                <Typography variant="h6" mb={2}>Threat Analysis</Typography>
                                <Box height={400}>
                                    <Radar data={threatRadarChart} options={{ ...chartOptions, scales: undefined }} />
                                </Box>
                            </CardContent>
                        </StyledCard>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <StyledCard>
                            <CardContent>
                                <Typography variant="h6" mb={2}>Active Threats</Typography>
                                <Box display="flex" flexDirection="column" gap={2}>
                                    {dummyStats.threats.map((threat, index) => (
                                        <StyledPaper key={index} sx={{ p: 2 }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Warning color="error" />
                                                    <Typography>{threat.type}</Typography>
                                                </Box>
                                                <Chip
                                                    label={`${threat.count} incidents`}
                                                    sx={{
                                                        background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
                                                        color: 'white'
                                                    }}
                                                />
                                            </Box>
                                        </StyledPaper>
                                    ))}
                                </Box>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                </Grid>

                {/* Report Generation SpeedDial */}
                <Box position="fixed" bottom={20} right={20}>
                    <SpeedDial
                        ariaLabel="Export Options"
                        icon={<CloudDownload />}
                        direction="up"
                        sx={{
                            '& .MuiFab-primary': {
                                background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
                                }
                            }
                        }}
                    >
                        <SpeedDialAction
                            icon={<PictureAsPdf />}
                            tooltipTitle={`Export as PDF (${reportCount}/2)`}
                            onClick={() => handleReportGeneration('PDF')}
                        />
                        <SpeedDialAction
                            icon={<TableChart />}
                            tooltipTitle={`Export as CSV (${reportCount}/2)`}
                            onClick={() => handleReportGeneration('CSV')}
                        />
                    </SpeedDial>
                </Box>

                {/* Report Limit Modal */}
                <LimitModal 
                    open={limitModalOpen} 
                    onClose={() => setLimitModalOpen(false)}
                >
                    <DialogTitle>
                        <Typography variant="h6">Report Generation Limit</Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Typography>You can only generate 2 reports per day.</Typography>
                    </DialogContent>
                    <DialogActions>
                        <GradientButton onClick={() => setLimitModalOpen(false)}>
                            Got it
                        </GradientButton>
                    </DialogActions>
                </LimitModal>

                {/* Success Snackbar */}
                <Snackbar
                    open={successSnackbar}
                    autoHideDuration={3000}
                    onClose={() => setSuccessSnackbar(false)}
                >
                    <Alert 
                        onClose={() => setSuccessSnackbar(false)} 
                        severity="success"
                        sx={{ 
                            width: '100%',
                            background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
                            color: 'white'
                        }}
                    >
                        Report generated successfully! ({reportCount}/2 for today)
                    </Alert>
                </Snackbar>
            </Box>
        </PageContainer>
    );
};

export default NetworkPulse;