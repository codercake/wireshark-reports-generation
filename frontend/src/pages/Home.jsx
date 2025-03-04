import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Paper, Container, Grid } from '@mui/material';
import styled from '@emotion/styled';
import { Analytics, Security, Speed, CloudUpload } from '@mui/icons-material';
import { Activity, GitGraph, Network, Zap } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import Navbar from '../pages/Navbar';
import Lottie from 'lottie-react';
import networkAnimation from '../assets/network-animation.json';

const AnimatedBackground = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
    &:after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at center, transparent 0%, #000000 70%);
    }
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
    cursor: pointer;
    transform-style: preserve-3d;
    perspective: 1000px;

    &:hover {
        transform: translateY(-5px) rotateX(10deg) rotateY(10deg);
        background: rgba(255, 255, 255, 0.1);
        box-shadow: 
            0 8px 32px rgba(33, 150, 243, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1);
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
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);

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

const FloatingIcon = styled(motion.div)`
    position: absolute;
    pointer-events: none;
`;

const PulsingCircle = styled(motion.div)`
    position: absolute;
    border-radius: 50%;
    background: rgba(33, 150, 243, 0.2);
`;

const FloatingShape = styled(motion.div)`
    position: absolute;
    width: ${props => props.size}px;
    height: ${props => props.size}px;
    background: ${props => props.color};
    clip-path: ${props => props.shape};
    opacity: 0.15;
    pointer-events: none;
`;

const GradientText = styled(Typography)`
    background: linear-gradient(
        45deg,
        #2196f3 0%,
        #21cbf3 25%,
        #2196f3 50%,
        #21cbf3 75%,
        #2196f3 100%
    );
    background-size: 200% auto;
    animation: gradient 3s linear infinite;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    text-shadow: 0 0 30px rgba(33, 150, 243, 0.3);
    
    @keyframes gradient {
        to {
            background-position: 200% center;
        }
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

const shapes = [
    {
        size: 100,
        color: '#2196f3',
        shape: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
        initial: { x: -100, y: -100, rotate: 0 },
        animate: { x: -80, y: -80, rotate: 360 },
    },
    {
        size: 80,
        color: '#21cbf3',
        shape: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
        initial: { x: window.innerWidth - 100, y: -50, rotate: 0 },
        animate: { x: window.innerWidth - 120, y: -30, rotate: -360 },
    },
    {
        size: 120,
        color: '#2196f3',
        shape: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
        initial: { x: -50, y: window.innerHeight - 100, rotate: 0 },
        animate: { x: -30, y: window.innerHeight - 120, rotate: 360 },
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
        <Box sx={{ background: '#000000', minHeight: '100vh', overflow: 'hidden' }}>
            <Navbar />
            <HeroSection>
                <NetworkCanvas ref={canvasRef} />
                <AnimatedBackground />
                
                {/* Floating network icons */}
                <AnimatePresence>
                    {[...Array(5)].map((_, i) => (
                        <FloatingIcon
                            key={i}
                            initial={{ x: Math.random() * window.innerWidth, y: -100 }}
                            animate={{
                                y: window.innerHeight + 100,
                                rotate: Math.random() * 360,
                                x: Math.random() * window.innerWidth
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 10,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        >
                            <Network size={20} color="#2196f3" opacity={0.3} />
                        </FloatingIcon>
                    ))}
                </AnimatePresence>

                {/* Pulsing circles */}
                {[...Array(3)].map((_, i) => (
                    <PulsingCircle
                        key={i}
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.6
                        }}
                        style={{
                            width: 100,
                            height: 100,
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                ))}
                
                {shapes.map((shape, index) => (
                    <FloatingShape
                        key={index}
                        size={shape.size}
                        color={shape.color}
                        shape={shape.shape}
                        initial={shape.initial}
                        animate={shape.animate}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "linear"
                        }}
                    />
                ))}

                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
                    <Grid container spacing={6}>
                        <Grid item xs={12} md={6}>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <GradientText variant="h2" sx={{ mb: 3, fontWeight: 800 }}>
                                    Wireshark Analytics Platform
                                </GradientText>
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
                        <Grid item xs={12} md={6}>
                            <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                <Lottie 
                                    animationData={networkAnimation}
                                    loop={true}
                                    style={{ opacity: 0.8 }}
                                />
                            </Box>
                        </Grid>
                    </Grid>

                    <Grid container spacing={4} sx={{ mt: 8 }}>
                        {features.map((feature, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    whileHover={{
                                        scale: 1.05,
                                        rotateX: 10,
                                        rotateY: 10,
                                        transition: { duration: 0.3 }
                                    }}
                                    style={{
                                        perspective: '1000px',
                                        transformStyle: 'preserve-3d'
                                    }}
                                >
                                    <GlassCard>
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

