import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Button } from '@mui/material';

const ReportDisplay = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/reports`);
                setReports(response.data);
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    if (loading) {
        return <Typography>Loading reports...</Typography>;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Generated Reports
            </Typography>
            {reports.length === 0 ? (
                <Typography>No reports available.</Typography>
            ) : (
                reports.map((report, index) => (
                    <Box key={index} mb={2}>
                        <Typography variant="h6">Report generated on: {report.timestamp}</Typography>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            href={report.report_path} 
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View Report
                        </Button>
                    </Box>
                ))
            )}
        </Box>
    );
};

export default ReportDisplay;
