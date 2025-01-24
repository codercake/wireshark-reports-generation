import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Paper, Container, Grid, Button } from '@mui/material';
import styled from '@emotion/styled';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const HeroSection = styled(Box)`
  min-height: 100vh;
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding-top: 64px;
`;

const BackgroundAnimation = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, transparent 0%, #000000 70%);
  opacity: 0.6;
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
  }
`;

const GradientText = styled(Typography)`
  background: linear-gradient(45deg, #2196f3, #21cbf3);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  display: inline-block;
`;

const StyledButton = styled(Button)`
  background: linear-gradient(45deg, #2196f3, #21cbf3);
  color: white;
  padding: 12px 32px;
  border-radius: 30px;
  text-transform: none;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(33, 150, 243, 0.3);
  }
`;

const features = [
  {
    icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
    title: "Advanced Analytics",
    description: "Deep packet inspection and comprehensive traffic analysis with detailed visualizations."
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    title: "Security Analysis",
    description: "Identify potential security threats and anomalies in your network traffic."
  },
  {
    icon: <SpeedIcon sx={{ fontSize: 40 }} />,
    title: "Real-time Processing",
    description: "Process and analyze network captures in real-time with minimal latency."
  },
  {
    icon: <CloudUploadIcon sx={{ fontSize: 40 }} />,
    title: "Cloud Integration",
    description: "Seamlessly store and access your captures and reports from anywhere."
  }
];

const Home = () => {
  return (
    <Box>
      <HeroSection>
        <BackgroundAnimation
          animate={{
            background: [
              "radial-gradient(circle at 0% 0%, transparent 0%, #000000 70%)",
              "radial-gradient(circle at 100% 100%, transparent 0%, #000000 70%)"
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
        />
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <GradientText variant="h2" sx={{ mb: 3, fontWeight: 700 }}>
                  Transform Network Analysis
                </GradientText>
                <Typography variant="h5" sx={{ color: 'white', mb: 4, opacity: 0.9 }}>
                  Generate comprehensive reports from your Wireshark captures with powerful analytics and insights.
                </Typography>
                <StyledButton
                  variant="contained"
                  size="large"
                  endIcon={<motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.div>}
                >
                  Get Started
                </StyledButton>
              </motion.div>
            </Grid>
          </Grid>

          <Grid container spacing={4} sx={{ mt: 8 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <FeatureCard elevation={0}>
                    {feature.icon}
                    <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.8 }}>
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

export default Home;
