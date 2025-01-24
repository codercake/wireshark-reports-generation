import React, { useState } from 'react';
import { Box, Grid, Card, Typography, Button, IconButton, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { Line, Doughnut } from 'react-chartjs-2';
import { Download, Refresh, TrendingUp, Speed, Cloud, Timer } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const PageContainer = styled(Box)`
  min-height: 100vh;
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  position: relative;
  overflow: hidden;
  color: white;
`;

const StyledCard = styled(motion(Card))`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  height: 100%;
  color: white;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MetricBox = styled(motion.div)`
  padding: 20px;
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

const Reports = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Network Traffic',
      data: [65, 59, 80, 81, 56, 55],
      borderColor: '#2196f3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      tension: 0.4,
      fill: true,
    }]
  };

  const metrics = [
    { icon: <Cloud />, value: '2.4TB', label: 'Total Data', color: '#2196f3' },
    { icon: <Speed />, value: '45K', label: 'Total Packets', color: '#21cbf3' },
    { icon: <TrendingUp />, value: '99.9%', label: 'Network Uptime', color: '#64b5f6' },
    { icon: <Timer />, value: '12ms', label: 'Avg Latency', color: '#90caf9' },
  ];

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <PageContainer>
      <Box
        component={motion.div}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        sx={{ p: 4 }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <IconButton onClick={handleRefresh} sx={{ color: 'white' }}>
            <Refresh sx={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Box>

        <Grid container spacing={3}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <MetricBox
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Box sx={{ color: metric.color, mb: 1 }}>{metric.icon}</Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: metric.color }}>
                  {metric.value}
                </Typography>
                <Typography color="white" opacity={0.8}>{metric.label}</Typography>
              </MetricBox>
            </Grid>
          ))}

          <Grid item xs={12} md={8}>
            <StyledCard variants={itemVariants}>
              <Typography variant="h6" mb={3}>Traffic Overview</Typography>
              <Box height={400}>
                <Line data={monthlyData} options={chartOptions} />
              </Box>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <StyledCard variants={itemVariants}>
              <Typography variant="h6" mb={3}>Recent Reports</Typography>
              {[1, 2, 3].map((report) => (
                <Box
                  key={report}
                  component={motion.div}
                  whileHover={{ x: 10 }}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Network Analysis #{report}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      {new Date().toLocaleDateString()}
                    </Typography>
                  </Box>
                  <GradientButton
                    startIcon={<Download />}
                  >
                    Download
                  </GradientButton>
                </Box>
              ))}
            </StyledCard>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Reports;
