import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Paper, Container, Grid } from '@mui/material';
import styled from '@emotion/styled';
import { 
    Analytics, 
    Security, 
    Speed, 
    CloudUpload 
} from '@mui/icons-material';
import { Activity, GitGraph, Network, Zap } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import Navbar from '../pages/Navbar';

const AnimatedBackground = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
`;

const NetworkCanvas = styled.canvas`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
`;

const HeroSection = styled(Box)`
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    padding-top: 64px;
    z-index: 1;
`;

const GlassCard = styled(motion(Paper))`
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
        box-shadow: 0 8px 32px rgba(33, 150, 243, 0.3);
    }
`;

const PulseButton = styled(motion.button)`
    background: linear-gradient(45deg, #2196f3, #21cbf3);
    color: white;
    padding: 15px 40px;
    border-radius: 30px;
    border: none;
    font-size: 1.2rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &:before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
    }

    &:hover:before {
        width: 300px;
        height: 300px;
    }
`;

const features = [
    {
        icon: <Analytics sx={{ fontSize: 40, color: '#2196f3' }} />,
        title: "Real-time Analytics",
        description: "Advanced packet inspection with ML-driven insights and live traffic analysis."
    },
    {
        icon: <Security sx={{ fontSize: 40, color: '#2196f3' }} />,
        title: "Threat Detection",
        description: "Instant identification of security threats and network anomalies."
    },
    {
        icon: <Activity size={40} color="#2196f3" />,
        title: "Performance Metrics",
        description: "Comprehensive network performance monitoring and benchmarking."
    },
    {
        icon: <GitGraph size={40} color="#2196f3" />,
        title: "Protocol Analysis",
        description: "Deep inspection of network protocols and traffic patterns."
    },
    {
        icon: <Speed sx={{ fontSize: 40, color: '#2196f3' }} />,
        title: "Latency Tracking",
        description: "Monitor network latency and performance bottlenecks in real-time."
    },
    {
        icon: <Network size={40} color="#2196f3" />,
        title: "Network Topology",
        description: "Visual mapping of network connections and data flow patterns."
    },
    {
        icon: <Zap size={40} color="#2196f3" />,
        title: "Smart Alerts",
        description: "Intelligent notification system for network anomalies and threats."
    },
    {
        icon: <CloudUpload sx={{ fontSize: 40, color: '#2196f3' }} />,
        title: "Cloud Reports",
        description: "Automated report generation with cloud storage integration."
    }
];

const Home = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];

        const initCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        class NetworkParticle {
            constructor() {
                this.reset();
                this.speed = Math.random() * 2 + 1;
                this.size = Math.random() * 3 + 1;
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.dx = (Math.random() - 0.5) * this.speed;
                this.dy = (Math.random() - 0.5) * this.speed;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = '#2196f3';
                ctx.fill();
            }

            update() {
                if (this.x < 0 || this.x > canvas.width) this.dx = -this.dx;
                if (this.y < 0 || this.y > canvas.height) this.dy = -this.dy;
                
                this.x += this.dx;
                this.y += this.dy;
                this.draw();
            }
        }

        const createParticles = () => {
            particles = [];
            const numberOfParticles = Math.floor((canvas.width * canvas.height) / 15000);
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new NetworkParticle());
            }
        };

        const drawConnections = () => {
            particles.forEach((p1, i) => {
                particles.slice(i + 1).forEach(p2 => {
                    const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(33, 150, 243, ${1 - distance / 150})`;
                        ctx.lineWidth = 0.6;
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                });
            });
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(particle => particle.update());
            drawConnections();
            animationFrameId = requestAnimationFrame(animate);
        };

        initCanvas();
        createParticles();
        animate();

        window.addEventListener('resize', () => {
            initCanvas();
            createParticles();
        });

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', initCanvas);
        };
    }, []);

    return (
        <Box sx={{ background: '#000000', minHeight: '100vh' }}>
            <Navbar />
            <HeroSection>
                <NetworkCanvas ref={canvasRef} />
                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
                    <Grid container spacing={6}>
                        <Grid item xs={12} md={6}>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <Typography
                                    variant="h2"
                                    sx={{
                                        mb: 3,
                                        fontWeight: 800,
                                        background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        color: 'transparent',
                                        textShadow: '0 0 20px rgba(33, 150, 243, 0.3)'
                                    }}
                                >
                                    Wireshark Analytics Platform
                                </Typography>
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        mb: 4,
                                        lineHeight: 1.6
                                    }}
                                >
                                    Transform your network captures into actionable insights with ML-powered analysis and real-time monitoring.
                                </Typography>
                                <PulseButton
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/network-pulse')}
                                >
                                    Launch Analyzer
                                    <motion.span
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        style={{ marginLeft: '10px', display: 'inline-block' }}
                                    >
                                        →
                                    </motion.span>
                                </PulseButton>
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
                                    <GlassCard elevation={0}>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                            {feature.icon}
                                        </Box>
                                        <Typography 
                                            variant="h6" 
                                            sx={{ 
                                                fontWeight: 600, 
                                                textAlign: 'center', 
                                                mb: 1,
                                                color: '#2196f3'
                                            }}
                                        >
                                            {feature.title}
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                textAlign: 'center', 
                                                opacity: 0.8,
                                                lineHeight: 1.6
                                            }}
                                        >
                                            {feature.description}
                                        </Typography>
                                    </GlassCard>
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
