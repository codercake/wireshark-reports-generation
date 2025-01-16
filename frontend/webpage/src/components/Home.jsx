import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Paper } from '@mui/material';
import styled from '@emotion/styled';

const MainContainer = styled.div`
  min-height: 100vh;
  background-color: #000000;
  position: relative;
  overflow: hidden;
  width: 100%;
`;

const BackgroundLogo = styled(motion.img)`
  position: fixed;
  width: 800px;
  height: auto;
  opacity: 0.05;
  right: -100px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 0;
`;

const ContentContainer = styled.div`
  position: relative;
  z-index: 1;
  padding: 2rem 4rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const StyledSection = styled(motion(Paper))`
  background-color: #ffffff;
  border-radius: 10px;
  padding: 2rem 3rem;
  margin: 2rem 0;
  width: 100%;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const ListItem = styled(motion.li)`
  color: #000000;
  margin-bottom: 0.5rem;
  line-height: 1.6;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateX(10px);
  }
`;

const Home = () => {
    return (
        <MainContainer>
            <BackgroundLogo
                src="https://cdn.britannica.com/79/65379-050-5CF52BAC/Shortfin-mako-shark-seas.jpg"
                animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            <ContentContainer>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Typography 
                        variant="h2" 
                        sx={{ 
                            color: '#ffffff',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            mb: 4,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                            fontSize: { xs: '2.5rem', md: '3.75rem' }
                        }}
                    >
                     A Wireshark Report Generator 🦈
                    </Typography>

                    <StyledSection elevation={3}>
                        <Typography variant="h4" sx={{ color: '#000000', mb: 2, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                            About Wireshark
                        </Typography>
                        <Typography sx={{ color: '#000000', mb: 2, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                            Wireshark is the world's foremost network protocol analyzer. It lets you see what's happening on your network at a microscopic level. As a de facto standard across many industries, Wireshark is an essential tool for network administrators, security engineers, developers, and communications protocol implementers.
                        </Typography>
                        <Typography sx={{ color: '#000000', fontSize: { xs: '1rem', md: '1.1rem' } }}>
                            Key features include deep inspection of hundreds of protocols, live capture and offline analysis, multi-platform support, and the most powerful display filters in the industry.
                        </Typography>
                    </StyledSection>

                    {/* Project Objective Section */}
                    <StyledSection elevation={3}>
                        <Typography variant="h4" sx={{ color: '#000000', mb: 2, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                            Project Objective
                        </Typography>
                        <Typography sx={{ color: '#000000', mb: 2, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                            Our mission is to streamline the process of generating comprehensive reports from Wireshark captures. This application bridges the gap between raw packet data and actionable insights by:
                        </Typography>
                        <Box component="ul" sx={{ pl: 3 }}>
                            <ListItem>Converting complex packet data into readable formats</ListItem>
                            <ListItem>Generating customizable professional reports</ListItem>
                            <ListItem>Providing detailed traffic analysis and statistics</ListItem>
                            <ListItem>Enabling easy sharing of network analysis findings</ListItem>
                            <ListItem>Supporting multiple export formats for versatility</ListItem>
                        </Box>
                    </StyledSection>

                    {/* Key Features Section */}
                    <StyledSection elevation={3}>
                        <Typography variant="h4" sx={{ color: '#000000', mb: 2, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                            Key Features
                        </Typography>
                        <Box component="ul" sx={{ pl: 3 }}>
                            <ListItem>Automated report generation from PCAP files</ListItem>
                            <ListItem>Customizable report templates</ListItem>
                            <ListItem>Detailed packet analysis summaries</ListItem>
                            <ListItem>Network traffic visualization</ListItem>
                            <ListItem>Security incident highlighting</ListItem>
                            <ListItem>Export to multiple formats (PDF, HTML, CSV)</ListItem>
                        </Box>
                    </StyledSection>

                    {/* Technology Stack Section */}
                    <StyledSection elevation={3}>
                        <Typography variant="h4" sx={{ color: '#000000', mb: 2, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                            Technology Stack
                        </Typography>
                        <Box component="ul" sx={{ pl: 3 }}>
                            <ListItem>Frontend: React.js with Material-UI</ListItem>
                            <ListItem>Backend: Node.js with Express</ListItem>
                            <ListItem>Analysis Tools: tshark, pyshark</ListItem>
                            <ListItem>Database: MongoDB</ListItem>
                            <ListItem>Authentication: JWT</ListItem>
                            <ListItem>File Processing: Python scripts</ListItem>
                        </Box>
                    </StyledSection>
                </motion.div>
            </ContentContainer>
        </MainContainer>
    );
};

export default Home;
