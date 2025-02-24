import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BruteForceAlert = ({ pcapFile }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);

    const analyzePcap = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`http://localhost:5000/analyze/${pcapFile}`);
            setAlerts(response.data.alerts);
        } catch (error) {
            console.error('Error analyzing PCAP:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (pcapFile) {
            analyzePcap();
        }
    }, [pcapFile]);

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Brute Force Detection Results</h2>
            {loading ? (
                <div className="text-center">Analyzing packets...</div>
            ) : (
                <div className="space-y-4">
                    {alerts.map((alert, index) => (
                        <div key={index} className="bg-red-100 border-l-4 border-red-500 p-4">
                            <p className="font-bold">Attack Type: {alert.attack_type}</p>
                            <p>Source IP: {alert.source_ip}</p>
                            <p>Failed Attempts: {alert.attempts}</p>
                            <p>Timestamp: {new Date(alert.timestamp * 1000).toLocaleString()}</p>
                        </div>
                    ))}
                    {alerts.length === 0 && (
                        <div className="text-green-600">No brute force attempts detected</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BruteForceAlert;
