import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import PacketTable from '../components/PacketTable';
import { useLocation } from 'react-router-dom';

const ReportDisplay = () => {
  const location = useLocation();
  const { report_data, packet_data, report_path } = location.state || {};

  if (!report_data || !packet_data) {
    return (
      <Box p={3}>
        <Typography variant="h6">
          No report data available. Please generate a report first.
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Report Details
      </Typography>
      <Typography variant="h6">
        Report Generated: {report_data.timestamp}
      </Typography>
      <Typography>
        Report Path: {report_path}
      </Typography>
      {/* Display other report details here */}
      <Typography variant="h5" mt={3}>
        Extracted Packets:
      </Typography>
      <PacketTable packets={packet_data} />
    </Box>
  );
};

export default ReportDisplay;
