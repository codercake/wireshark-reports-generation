import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TextField, Button, Paper, Typography, Box } from '@mui/material';
import { FaUser , FaLock } from 'react-icons/fa';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
            console.log('Login successful');
            navigate('/dashboard');
        } catch (error) {
            console.error('Login failed:', error.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            console.log('Google login successful');
            navigate('/dashboard');
        } catch (error) {
            console.error('Google login failed:', error.message);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Paper
                    elevation={10}
                    sx={{
                        padding: 4,
                        borderRadius: 2,
                        width: '100%',
                        maxWidth: 400,
                    }}
                >
                    <Typography variant="h4" align="center" gutterBottom>
                        Login
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ position: 'relative', mb: 3 }}>
                            <FaUser  style={{ position: 'absolute', top: 12, left: 12 }} />
                            <TextField
                                fullWidth
                                label="Email"
                                variant="outlined"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                sx={{ '& .MuiOutlinedInput-root': { pl: 5 } }}
                            />
                        </Box>
                        <Box sx={{ position: 'relative', mb: 3 }}>
                            <FaLock style={{ position: 'absolute', top: 12, left: 12 }} />
                            <TextField
                                fullWidth
                                label="Password"
                                type="password" // Fixed the closing quote here
                                variant="outlined"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                sx={{ '& .MuiOutlinedInput-root': { pl: 5 } }}
                            />
                        </Box>
                        <Button
                            fullWidth
                            variant="contained"
                            type="submit"
                            sx={{ mb: 2 }}
                        >
                            Login
                        </Button>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={handleGoogleLogin}
                                fullWidth
                            >
                                Login with Google
                            </Button>
                        </Box>
                        <Typography align="center">
                            Don't have an account?{' '}
                            <Button onClick={() => navigate('/register')}>
                                Register
                            </Button>
                        </Typography>
                    </form>
                </Paper>
            </motion.div>
        </Box>
    );
};

export default Login;