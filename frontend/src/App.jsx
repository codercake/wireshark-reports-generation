import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import styled from '@emotion/styled';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

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

ChartJS.register(CategoryScale, LinearScale, RadialLinearScale, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

// Styled Components
const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  padding-top: ${(props) => (props.isAuthenticated ? '64px' : '0')};
`;

// Theme Context
const ThemeContext = createContext();

export const useThemeContext = () => useContext(ThemeContext);

// Custom Hook for Packet Capture
const usePacketCapture = (user) => {
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

    const toggleCapture = async () => {
        try {
            const token = await user.getIdToken();
            if (!isCapturing) {
                await axios.post(`${process.env.REACT_APP_API_URL}/start_capture`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            setIsCapturing(!isCapturing);
        } catch (error) {
            console.error('Error toggling capture:', error);
        }
    };

    return { packets, stats, isCapturing, toggleCapture };
};

// Theme Configuration
const getTheme = (mode) =>
    createTheme({
        palette: {
            mode,
            primary: { main: '#2196f3' },
            secondary: { main: '#21cbf3' },
            background: { default: mode === 'dark' ? '#000' : '#fff', paper: mode === 'dark' ? '#121212' : '#f5f5f5' },
            text: { primary: mode === 'dark' ? '#fff' : '#000' },
        },
        typography: { fontFamily: '"Inter", sans-serif' },
    });

const AppRoutes = ({ user, packets, stats, isCapturing, toggleCapture }) => (
    <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/home" />} />
        <Route path="/logout" element={<Logout />} />

        {/* Protected Routes */}
        <Route path="/home" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route
            path="/network-pulse"
            element={
                user ? (
                    <>
                        <NetworkPulse packets={packets} stats={stats} isCapturing={isCapturing} toggleCapture={toggleCapture} />
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

        {/* Default Route */}
        <Route path="/" element={<Navigate to={user ? "/home" : "/login"} />} />
        <Route path="*" element={<Navigate to={user ? "/home" : "/login"} />} />
    </Routes>
);

const AppContent = () => {
    const { user } = useAuth();
    const { packets, stats, isCapturing, toggleCapture } = usePacketCapture(user);
    const [themeMode, setThemeMode] = useState('dark');

    const theme = useMemo(() => getTheme(themeMode), [themeMode]);

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Router>
                    <AppWrapper>
                        <Navbar />
                        <MainContent isAuthenticated={!!user}>
                            <AppRoutes user={user} packets={packets} stats={stats} isCapturing={isCapturing} toggleCapture={toggleCapture} />
                        </MainContent>
                        <Footer />
                    </AppWrapper>
                </Router>
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

function App() {
    return (
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
