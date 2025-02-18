import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Box, Grid, Typography, Button, Card, ButtonGroup, TextField, Select, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Pie, Bar } from 'react-chartjs-2';
import { FileDownload, FilterList, PlayArrow, Stop } from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import autoTable for table generation
import { toast } from "sonner";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const PageContainer = styled(Box)({
    minHeight: '100vh',
    backgroundColor: '#000000',
    color: 'white',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
});

const StyledCard = styled(Card)`
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    color: white;
    padding: 16px;
    height: 100%;
    margin-bottom: 0;
`;

const CaptureButton = styled(Button)(({ isCapturing }) => ({
    backgroundColor: isCapturing ? '#ff4444' : '#4CAF50',
    color: 'white',
    padding: '12px 32px',
    borderRadius: '30px',
    textTransform: 'none',
    fontWeight: 600,
    width: '180px',
    '&:hover': {
        backgroundColor: isCapturing ? '#ff0000' : '#45a049',
    },
}));

const ExportButton = styled(Button)({
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '12px 32px',
    borderRadius: '30px',
    textTransform: 'none',
    fontWeight: 600,
    width: '180px',
    '&:hover': {
        backgroundColor: '#1976D2',
    },
});

const StyledSelect = styled(Select)`
    width: 100%;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
`;

const StyledTextField = styled(TextField)`
    background-color: rgba(255, 255, 255, 0.1);
`;

const FilterButton = styled(Button)({
    backgroundColor: '#FFCE56',
    color: 'black',
    padding: '12px 32px',
    borderRadius: '30px',
    textTransform: 'none',
    fontWeight: 600,
    width: '100%',
});

const NetworkPulse = () => {
    const contentRef = useRef(null);
    
    const [isCapturing, setIsCapturing] = useState(false);
    
    const [protocolData] = useState({ datasets: [{ data: [] }] }); // Placeholder for protocol data
    
    const [filters, setFilters] = useState({
        protocol: 'all',
        portRange: '',
        ipAddress: '',
    });

   const [capturedData] = useState([]); // Placeholder for captured data

   // Function to start capturing packets
   const startCapture = async () => {
       try {
           const response = await axios.post('http://localhost:5002/start_capture');
           setIsCapturing(true);
           toast.success("Capture started");
       } catch (error) {
           console.error('Start capture error:', error);
           toast.error("Failed to toggle capture");
       }
   };

   // Function to stop capturing packets
   const stopCapture = async () => {
       try {
           await axios.post('http://localhost:5002/stop_capture');
           setIsCapturing(false);
           toast.success("Capture stopped");
       } catch (error) {
           console.error('Stop capture error:', error);
           toast.error("Failed to toggle capture");
       }
   };

   // Function to validate filters
   const validateFilters = () => {
       if (filters.ipAddress) {
           const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
           if (!ipRegex.test(filters.ipAddress)) {
               toast.error("Invalid IP address format");
               return false;
           }
       }

       if (filters.portRange) {
           const portRangeRegex = /^\d+(-\d+)?$/;
           if (!portRangeRegex.test(filters.portRange)) {
               toast.error("Invalid port range format (e.g., 80 or 80-443)");
               return false;
           }
       }
       return true;
   };

   // Function to apply filters
   const applyFilters = () => {
       if (!validateFilters()) {
           toast.error("Failed to apply filters");
           return;
       }
       // Your filtering logic here...
       toast.success("Filters applied successfully!");
   };

   // Function to generate PDF
   const generatePDF = async () => {
       const pdf = new jsPDF('p', 'mm', 'a4');
       const pageWidth = pdf.internal.pageSize.getWidth();
       let yPosition = 10;

       // Add Header
       pdf.setFillColor(33, 33, 33);
       pdf.rect(0, 0, pageWidth, 30, 'F');
       pdf.setTextColor(255, 255, 255);
       pdf.setFontSize(20);
       pdf.text('Network Packet Analysis Report', 10, 20);

       // Add Timestamp
       pdf.setFontSize(12);
       pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, 40);
       yPosition = 60;

       // Protocol Distribution Chart
       if (contentRef.current) {
           const canvas = await html2canvas(contentRef.current);
           const chartImage = canvas.toDataURL('image/png');
           pdf.addImage(chartImage, 'PNG', 10, yPosition, pageWidth - 20, 80);
           yPosition += 90;
       }

       // Network Statistics
       pdf.setFontSize(16);
       pdf.setTextColor(0, 0, 0);
       pdf.text('Network Statistics', 10, yPosition);
       yPosition += 10;

       // Create statistics table
       const statsData = [
           ['Protocol', 'Count', 'Percentage'],
           ...Object.entries(protocolData?.datasets?.[0]?.data || {}).map(([protocol,count]) => {
               const total = protocolData.datasets[0].data.reduce((a,b) => a + b ,0 );
               const percentage = ((count / total) * 100).toFixed(2) + '%';
               return [protocol,count.toString(),percentage];
           })
       ];

       autoTable(pdf,{
            startY:yPosition,
            head:[statsData[0]],
            body:statsData.slice(1),
            theme:'grid',
            styles:{fontSize :10},
            headStyles:{fillColor:[33 ,150 ,243]}
        });

        yPosition=pdf.lastAutoTable.finalY +20;

        // Port Analysis
        pdf.setFontSize(16);
        pdf.text('Port Analysis',10,yPosition);
        yPosition +=10;

        // Add captured data summary
        if (capturedData.length >0){
            const portData=capturedData.reduce((acc,data)=>{
                if(data.port){
                    acc[data.port]=(acc[data.port] ||0)+1;
                }
                return acc;
            },{});

            const topPorts=Object.entries(portData)
                .sort(([,a],[ ,b])=>b-a)
                .slice(0 ,5);

            autoTable(pdf,{
                startY:yPosition,
                head:[['Port','Frequency']],
                body : topPorts.map(([port,count])=>[port,count]),
                theme:'grid',
                styles:{fontSize :10},
                headStyles:{fillColor:[33 ,150 ,243]}
            });
        }

        // Add footer
        const pageCount=pdf.internal.getNumberOfPages();
        for(let i=1;i<=pageCount;i++){
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(100);
            pdf.text(
                `Page ${i} of ${pageCount}`,
                pdf.internal.pageSize.getWidth()/2,
                pdf.internal.pageSize.getHeight()-10,
                {align:'center'}
            );
        }

        return pdf.save('Network_Analysis_Report.pdf');
   };

   return (
      <PageContainer>
          <Grid container spacing={0}>
              <Grid item xs={12}>
                  <StyledCard>
                      <Typography variant="h5" gutterBottom>
                          Network Analysis Capture
                      </Typography>
                      <ButtonGroup fullWidth>
                          <CaptureButton onClick={isCapturing ? stopCapture : startCapture} isCapturing={isCapturing}>
                              {isCapturing ? <Stop /> : <PlayArrow />}
                              {isCapturing ? 'Stop Capture' : 'Start Capture'}
                          </CaptureButton>
                          <ExportButton onClick={generatePDF}>
                              <FileDownload />
                              Export to PDF
                          </ExportButton>
                      </ButtonGroup>
                  </StyledCard>
              </Grid>
              
              <Grid item xs={12} md={4}>
                  <StyledCard>
                      <Typography variant="h6">Filter Settings</Typography>
                      <Box mb={1}>
                          <StyledSelect
                              value={filters.protocol}
                              onChange={(e) => setFilters({ ...filters, protocol: e.target.value })}
                          >
                              <MenuItem value="all">All Protocols</MenuItem>
                              <MenuItem value="http">HTTP</MenuItem>
                              <MenuItem value="https">HTTPS</MenuItem>
                              <MenuItem value="dns">DNS</MenuItem>
                          </StyledSelect>
                      </Box>
                      <Box mb={1}>
                          <StyledTextField
                              label="IP Address"
                              value={filters.ipAddress}
                              onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
                              fullWidth
                          />
                      </Box>
                      <Box mb={1}>
                          <StyledTextField
                              label="Port Range"
                              value={filters.portRange}
                              onChange={(e) => setFilters({ ...filters, portRange: e.target.value })}
                              fullWidth
                          />
                      </Box>
                      <FilterButton onClick={applyFilters} variant="contained" fullWidth>
                          Apply Filters
                      </FilterButton>
                  </StyledCard>
              </Grid>

                           {/* Additional Cards for Charts and Data Display */}
                           <Grid item xs={12} md={8}>
                  <StyledCard ref={contentRef}>
                      <Typography variant="h6">Analysis Report</Typography>

                      {/* Example Pie Chart for Protocol Distribution */}
                      {protocolData.datasets[0].data.length > 0 && (
                          <Box mb={3}>
                              <Typography variant="subtitle1">Protocol Distribution</Typography>
                              <Pie data={protocolData} />
                          </Box>
                      )}

                      {/* Example Bar Chart for Packet Sizes */}
                      {capturedData.length > 0 && (
                          <Box mb={3}>
                              <Typography variant="subtitle1">Packet Sizes</Typography>
                              <Bar
                                  data={{
                                      labels: capturedData.map((_, index) => `Packet ${index + 1}`),
                                      datasets: [
                                          {
                                              label: 'Packet Size (Bytes)',
                                              data: capturedData.map(packet => packet.size), // Assuming each packet has a size property
                                              backgroundColor: 'rgba(75, 192, 192, 0.6)',
                                              borderColor: 'rgba(75, 192, 192, 1)',
                                              borderWidth: 1,
                                          },
                                      ],
                                  }}
                              />
                          </Box>
                      )}

                      {/* Raw Packet Data Display */}
                      {capturedData.length > 0 && (
                          <Box>
                              <Typography variant="subtitle1">Raw Packet Data</Typography>
                              <Box sx={{ overflowX: 'auto', marginTop: '10px' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                      <thead>
                                          <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                                              <th style={{ padding: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Packet No.</th>
                                              <th style={{ padding: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Size (Bytes)</th>
                                              <th style={{ padding: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Protocol</th>
                                              {/* Add more columns as needed */}
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {capturedData.map((packet, index) => (
                                              <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                                  <td style={{ padding: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>{index + 1}</td>
                                                  <td style={{ padding: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>{packet.size}</td> {/* Assuming packet has a size property */}
                                                  <td style={{ padding: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>{packet.protocol}</td> {/* Assuming packet has a protocol property */}
                                                  {/* Add more cells as needed */}
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </Box>
                          </Box>
                      )}
                  </StyledCard>
              </Grid>

          </Grid>
      </PageContainer>
   );
};

export default NetworkPulse;
