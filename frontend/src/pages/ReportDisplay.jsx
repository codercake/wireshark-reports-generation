import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Container,
    Grid,
    Button,
    TextField,
    Paper
} from '@mui/material';
import PacketTable from '../components/PacketTable';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReportContext } from '../context/ReportContext';
import axios from 'axios';
import { styled } from '@mui/material/styles';

// Styled components for improved visual appeal
const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
}));

const ReportDisplay = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { setCurrentReport, currentReport } = useReportContext();
    const [realTimeData, setRealTimeData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userNotes, setUserNotes] = useState(''); // State for user notes

    const fetchRealTimeData = async () => {
        try {
            setLoading(true);
            const [packetsResponse, trafficResponse, analysisResponse] = await Promise.all([
                axios.get('http://localhost:5002/api/packets/live'),
                axios.get('http://localhost:5002/api/traffic/current'),
                axios.get('http://localhost:5002/api/analysis/current')
            ]);

            setRealTimeData({
                packets: packetsResponse.data,
                traffic: trafficResponse.data,
                analysis: analysisResponse.data
            });
        } catch (error) {
            console.error('Error fetching real-time data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (location.state) {
            setCurrentReport(location.state);
        } else if (!currentReport) {
            navigate('/reports');
        }

        const interval = setInterval(fetchRealTimeData, 1000);
        return () => clearInterval(interval);
    }, [location.state, currentReport, navigate, setCurrentReport]);

    const reportData = currentReport || location.state;

    if (!reportData && !realTimeData) {
        return (
            <Box p={3} display="flex" justifyContent="center" alignItems="center">
                <CircularProgress />
            </Box>
        );
    }

    const { report_data, packet_data, report_path, traffic } = reportData || {};
    const { packets, analysis } = realTimeData || {};

    // Function to handle saving user notes
    const handleSaveNotes = () => {
        // Implement your logic to save userNotes to backend or local storage
        console.log('Saving notes:', userNotes);
    };

    return (
        <Container maxWidth="lg">
            <Box p={3}>
                <Typography variant="h4" gutterBottom>
                    Network Analysis Report
                </Typography>

                {loading && (
                    <Box mb={2} display="flex" alignItems="center">
                        <CircularProgress size={20} />
                        <Typography variant="body2" ml={1}>
                            Updating real-time data...
                        </Typography>
                    </Box>
                )}

                <StyledPaper>
                    <Typography variant="h6">
                        Report Generated: {report_data?.timestamp || new Date().toISOString()}
                    </Typography>
                    {report_path && (
                        <Typography>
                            Report Path: {report_path}
                        </Typography>
                    )}
                </StyledPaper>

                {analysis?.threats && analysis.threats.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        <Typography variant="h6">Security Threats Detected</Typography>
                        {analysis.threats.map((threat, index) => (
                            <Typography key={index}>
                                • {threat.type}: {threat.description}
                            </Typography>
                        ))}
                    </Alert>
                )}

                {(report_data?.dos_attacks || analysis?.dos_attacks) && (
                    <StyledPaper>
                        <Typography variant="h6">DoS/DDoS Attack Analysis</Typography>
                        <ul>
                            {(report_data?.dos_attacks || analysis?.dos_attacks)?.map((attack, index) => (
                                <li key={index}>
                                    <Typography>
                                        Source IP: {attack.ip}
                                        <br />
                                        Attack Type: {attack.type}
                                        <br />
                                        Packet Count: {attack.count}
                                        <br />
                                        Duration: {attack.start_time} - {attack.end_time}
                                    </Typography>
                                </li>
                            ))}
                        </ul>
                    </StyledPaper>
                )}

                <StyledPaper>
                    <Typography variant="h5">
                        Network Traffic Analysis
                    </Typography>
                    <Typography>
                        Total Packets: {traffic?.total_packets || 'N/A'}
                        <br />
                        Average Packet Size: {traffic?.avg_packet_size || 'N/A'} bytes
                        <br />
                        Bandwidth Usage: {traffic?.bandwidth || 'N/A'} Mbps
                    </Typography>
                </StyledPaper>

                {/* User Notes Section */}
                <StyledPaper>
                    <Typography variant="h6">User Notes</Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Add your notes here..."
                        value={userNotes}
                        onChange={(e) => setUserNotes(e.target.value)}
                        variant="outlined"
                    />
                    <Box mt={2} display="flex" justifyContent="flex-end">
                        <Button variant="contained" color="primary" onClick={handleSaveNotes}>
                            Save Notes
                        </Button>
                    </Box>
                </StyledPaper>

                <Typography variant="h5" gutterBottom>
                    Captured Packets:
                </Typography>
                <PacketTable packets={packets || packet_data || []} />
            </Box>
        </Container>
    );
};

export default ReportDisplay;
