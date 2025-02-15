import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import styled from '@emotion/styled';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import './styles/global.css';

// Chart.js imports
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NetworkPulse from './pages/NetworkPulse';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Navbar from './pages/Navbar';
import PacketDisplay from './pages/PacketDisplay';
import PacketStats from './pages/PacketStats';
import ReportDisplay from './pages/ReportDisplay';
import Logout from './pages/Logout';

// Components
import { AuthProvider, useAuth } from './context/AuthContext';
import Footer from './components/Footer';
import PacketTable from './components/PacketTable';

ChartJS.register(
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
`;

const MainContent = styled.main`
  flex: 1;
  padding-top: ${(props) => (props.isAuthenticated ? '64px' : '0')};
`;

const theme = createTheme({
    typography: {
        fontFamily: '"Inter", sans-serif',
        button: {
            textTransform: 'none',
        },
    },
    palette: {
        primary: {
            main: '#2196f3',
        },
        secondary: {
            main: '#21cbf3',
        },
        background: {
            default: '#000000',
            paper: '#121212',
        },
        text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.7)',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 30,
                    padding: '10px 24px',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                    },
                },
            },
        },
    },
});

const AppContent = () => {
    const { user, logout } = useAuth();
    const [packets, setPackets] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [stats, setStats] = useState({
        totalPackets: 0,
        totalBytes: 0,
        packetsPerSec: 0,
        protocols: {},
        topSources: {},
        topDestinations: {},
    });

    const handleLogout = async () => {
        try {
            setIsCapturing(false);
            setPackets([]);
            setStats({
                totalPackets: 0,
                totalBytes: 0,
                packetsPerSec: 0,
                protocols: {},
                topSources: {},
                topDestinations: {},
            });
            await logout();
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const startCapture = async () => {
        try {
            const token = await user.getIdToken();
            await axios.post(`${process.env.REACT_APP_API_URL}/start_capture`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setIsCapturing(true);
        } catch (error) {
            console.error('Error starting capture:', error);
        }
    };

    useEffect(() => {
        let interval;
        if (user && isCapturing) {
            interval = setInterval(async () => {
                try {
                    const token = await user.getIdToken();
                    const [statsResponse, packetsResponse] = await Promise.all([
                        axios.get(`${process.env.REACT_APP_API_URL}/api/stats`, {
                            headers: { Authorization: `Bearer ${token}` },
                        }),
                        axios.get(`${process.env.REACT_APP_API_URL}/api/packets/live`, {
                            headers: { Authorization: `Bearer ${token}` },
                        }),
                    ]);
                    setStats(statsResponse.data);
                    setPackets(packetsResponse.data);
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [user, isCapturing]);

    return (
        <Router>
            <AppWrapper>
                <Navbar onLogout={handleLogout} />
                <MainContent isAuthenticated={!!user}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" />} />
                        <Route path="/register" element={!user ? <Register /> : <Navigate to="/home" />} />
                        <Route path="/logout" element={<Logout onLogout={handleLogout} />} />

                        {/* Protected Routes */}
                        <Route path="/home" element={user ? <Home /> : <Navigate to="/login" />} />
                        <Route
                            path="/network-pulse"
                            element={
                                user ? (
                                    <>
                                        <NetworkPulse
                                            packets={packets}
                                            stats={stats}
                                            isCapturing={isCapturing}
                                            startCapture={startCapture}
                                        />
                                        <PacketDisplay packets={packets} />
                                        <PacketStats stats={stats} />
                                    </>
                                ) : (
                                    <Navigate to="/login" />
                                )
                            }
                        />
                        <Route path="/reports" element={user ? <Reports /> : <Navigate to="/login" />} />
                        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
                        <Route path="/packets" element={user ? <PacketTable packets={packets} /> : <Navigate to="/login" />} />
                        <Route path="/report-display" element={user ? <ReportDisplay /> : <Navigate to="/login" />} />

                        {/* Default Routes */}
                        <Route path="/" element={<Navigate to={user ? "/home" : "/login"} />} />
                        <Route path="*" element={<Navigate to={user ? "/home" : "/login"} />} />
                    </Routes>
                </MainContent>
                <Footer />
            </AppWrapper>
        </Router>
    );
};

function App() {
    return (
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </ThemeProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
