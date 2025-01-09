import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import PacketTable from './components/PacketTable';

function App() {
    const [packets, setPackets] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [stats, setStats] = useState({
        totalPackets: 0,
        protocols: []
    });

    const startCapture = async () => {
        try {
            await axios.get('http://localhost:5001/api/start-capture');
            setIsCapturing(true);
        } catch (error) {
            console.error('Error starting capture:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        const fetchPackets = async () => {
            if (isCapturing) {
                try {
                    const response = await axios.get('http://localhost:5001/api/reports');
                    setPackets(response.data);
                    fetchStats();
                } catch (error) {
                    console.error('Error fetching packets:', error);
                }
            }
        };

        const interval = setInterval(fetchPackets, 5000);
        return () => clearInterval(interval);
    }, [isCapturing]);

    return (
        <div className="App">
            <Dashboard 
                stats={stats}
                isCapturing={isCapturing}
                startCapture={startCapture}
            />
            <PacketTable packets={packets} />
        </div>
    );
}

export default App;
