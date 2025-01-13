import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Container } from '@mui/material';
import styled from '@emotion/styled';

const MainContainer = styled.div`
  min-height: 100vh;
  background-color: #1a1a2e;
  position: relative;
  overflow: hidden;
`;

const BackgroundLogo = styled(motion.img)`
  position: fixed;
  width: 800px;
  height: auto;
  opacity: 0.15;
  right: -100px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 0;
`;

const ContentContainer = styled(Container)`
  position: relative;
  z-index: 1;
  padding: 2rem;
`;

const Section = styled(Box)`
  background-color: #0f3460;
  border-radius: 10px;
  padding: 2rem;
  margin: 2rem 0;
  border-left: 5px solid #e94560;
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

            <ContentContainer maxWidth="lg">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Typography 
                        variant="h2" 
                        sx={{ 
                            color: '#00ff95',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            mb: 4,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                        }}
                    >
                        Packet2Page - A Wireshark Report Generator
                    </Typography>

                    <Section>
                        <Typography variant="h4" sx={{ color: '#00ff95', mb: 2 }}>
                            About Wireshark
                        </Typography>
                        <Typography sx={{ color: '#fff', mb: 2 }}>
                            Wireshark is the world's foremost network protocol analyzer. It lets you see what's happening on your network at a microscopic level. As a de facto standard across many industries, Wireshark is an essential tool for network administrators, security engineers, developers, and communications protocol implementers.
                        </Typography>
                        <Typography sx={{ color: '#fff' }}>
                            Key features include deep inspection of hundreds of protocols, live capture and offline analysis, multi-platform support, and the most powerful display filters in the industry.
                        </Typography>
                    </Section>

                    <Section>
                        <Typography variant="h4" sx={{ color: '#00ff95', mb: 2 }}>
                            Project Objective
                        </Typography>
                        <Typography sx={{ color: '#fff', mb: 2 }}>
                            Our mission is to streamline the process of generating comprehensive reports from Wireshark captures. This application bridges the gap between raw packet data and actionable insights by:
                        </Typography>
                        <Box component="ul" sx={{ color: '#fff', pl: 3 }}>
                            <li>Converting complex packet data into readable formats</li>
                            <li>Generating customizable professional reports</li>
                            <li>Providing detailed traffic analysis and statistics</li>
                            <li>Enabling easy sharing of network analysis findings</li>
                            <li>Supporting multiple export formats for versatility</li>
                        </Box>
                    </Section>

                    <Section>
                        <Typography variant="h4" sx={{ color: '#00ff95', mb: 2 }}>
                            Key Features
                        </Typography>
                        <Box component="ul" sx={{ color: '#fff', pl: 3 }}>
                            <li>Automated report generation from PCAP files</li>
                            <li>Customizable report templates</li>
                            <li>Detailed packet analysis summaries</li>
                            <li>Network traffic visualization</li>
                            <li>Security incident highlighting</li>
                            <li>Export to multiple formats (PDF, HTML, CSV)</li>
                        </Box>
                    </Section>
                </motion.div>
            </ContentContainer>
        </MainContainer>
    );
};

export default Home;
