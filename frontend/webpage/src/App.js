import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import styled from '@emotion/styled';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import PacketTable from './components/PacketTable';
import Reports from './components/Reports';
import Profile from './components/Profile';

const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  padding-top: 64px; // Height of navbar
`;

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
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

function App() {
    const [packets, setPackets] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [stats, setStats] = useState({
        totalPackets: 0,
        totalBytes: 0,
        packetsPerSec: 0
    });

    const startCapture = async () => {
        try {
            await axios.get('http://localhost:5001/api/start-capture');
            setIsCapturing(true);
        } catch (error) {
            console.error('Error starting capture:', error);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, [isCapturing]);

    return (
        <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Router>
                    <AppWrapper>
                        <Navbar />
                        <MainContent>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route 
                                    path="/dashboard" 
                                    element={
                                        <Dashboard 
                                            packets={packets} 
                                            stats={stats}
                                            isCapturing={isCapturing}
                                            startCapture={startCapture}
                                        />
                                    } 
                                />
                                <Route path="/reports" element={<Reports />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/packets" element={<PacketTable packets={packets} />} />
                            </Routes>
                        </MainContent>
                        <Footer />
                    </AppWrapper>
                </Router>
            </ThemeProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
