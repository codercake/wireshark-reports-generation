 import React from 'react';
 import { motion } from 'framer-motion';
 import { Box, Typography, Paper, Container, Grid } from '@mui/material';
 import styled from '@emotion/styled';
 import AnalyticsIcon from '@mui/icons-material/Analytics';
 import SecurityIcon from '@mui/icons-material/Security';
 import SpeedIcon from '@mui/icons-material/Speed';
 import CloudUploadIcon from '@mui/icons-material/CloudUpload';
 import Navbar from '../pages/Navbar';
 import { Activity, GitGraph, Network, Zap } from "lucide-react";
 import { useNavigate } from 'react-router-dom';
 

 // Styled Components with Enhanced Styling
 const HeroSection = styled(Box)`
  min-height: 100vh;
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding-top: 64px; /* Height of Navbar */
 `;
 

 const FeatureCard = styled(motion(Paper))`
  padding: 2rem;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: white;
  transition: all 0.3s ease;
 

  &:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 20px rgba(33, 150, 243, 0.2);
  }
 `;
 

 const StyledButton = styled(motion.button)`
  background: linear-gradient(45deg, #2196f3, #21cbf3);
  color: white;
  padding: 12px 32px;
  border-radius: 30px;
  border: none;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
 

  &:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(33, 150, 243, 0.3);
  }
 `;
 

 // Feature Data
 const features = [
  {
  icon: <AnalyticsIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
  title: "Advanced Analytics",
  description: "Deep packet inspection and comprehensive traffic analysis with detailed visualizations."
  },
  {
  icon: <SecurityIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
  title: "Security Analysis",
  description: "Identify potential security threats and anomalies in your network traffic."
  },
  {
  icon: <Activity size={40} color="#2196f3" />,
  title: "Real-time Analysis",
  description: "Monitor network traffic in real-time with advanced packet inspection."
  },
  {
  icon: <GitGraph size={40} color="#2196f3" />,
  title: "Protocol Breakdown",
  description: "Detailed insights into network protocols and traffic patterns."
  },
  {
  icon: <SpeedIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
  title: "Real-time Processing",
  description: "Process and analyze network captures in real-time with minimal latency."
  },
  {
  icon: <Network size={40} color="#2196f3" />,
  title: "Network Mapping",
  description: "Visualize your network topology and understand connection patterns."
  },
  {
  icon: <Zap size={40} color="#2196f3" />,
  title: "Threat Detection",
  description: "Advanced security threat detection and anomaly identification."
  },
  {
  icon: <CloudUploadIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
  title: "Cloud Integration",
  description: "Seamlessly store and access your captures and reports from anywhere."
  }
 ];
 

 // Home Component
 const Home = () => {
  const navigate = useNavigate();
 

  const handleGetStarted = () => {
  navigate('/network-pulse'); // Programmatic navigation
  };
 

  return (
  <Box sx={{ background: '#000000' }}>
  <Navbar />
  <HeroSection>
  <Container maxWidth="lg">
  <Grid container spacing={6}>
  <Grid item xs={12} md={6}>
  {/* Motion Wrappers for Entrance Animation */}
  <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
  >
  <Typography
  variant="h2"
  sx={{
  mb: 3,
  fontWeight: 700,
  background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent'
  }}
  >
  Network Analysis, Simplified
  </Typography>
  <Typography variant="h5" sx={{ color: 'white', mb: 4, opacity: 0.9 }}>
  Generate comprehensive reports from your Wireshark captures with powerful analytics and insights.
  </Typography>
  <StyledButton
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={handleGetStarted}
  >
  Get Started
  <motion.span
  animate={{ x: [0, 5, 0] }}
  transition={{ repeat: Infinity, duration: 1.5 }}
  >
  →
  </motion.span>
  </StyledButton>
  </motion.div>
  </Grid>
  </Grid>
 

  {/* Features Grid */}
  <Grid container spacing={4} sx={{ mt: 8 }}>
  {features.map((feature, index) => (
  <Grid item xs={12} sm={6} md={3} key={index}>
  <motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
  >
  <FeatureCard elevation={3}>
  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
  {feature.icon}
  </Box>
  <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}>
  {feature.title}
  </Typography>
  <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.8 }}>
  {feature.description}
  </Typography>
  </FeatureCard>
  </motion.div>
  </Grid>
  ))}
  </Grid>
  </Container>
  </HeroSection>
  </Box>
  );
 };
 

 export default Home
