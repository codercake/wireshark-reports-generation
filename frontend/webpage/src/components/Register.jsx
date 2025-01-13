import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TextField, Button, Paper, Typography, Box } from '@mui/material';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';
import { auth, googleProvider } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            console.error('Passwords do not match');
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            console.log('Registration successful');
            navigate('/login');
        } catch (error) {
            console.error('Registration failed:', error.message);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            console.log('Google signup successful');
            navigate('/dashboard');
        } catch (error) {
            console.error('Google signup failed:', error.message);
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
                        Register
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ position: 'relative', mb: 3 }}>
                            <FaUser style={{ position: 'absolute', top: 12, left: 12 }} />
                            <TextField
                                fullWidth
                                label="Username"
                                variant="outlined"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                sx={{ '& .MuiOutlinedInput-root': { pl: 5 } }}
                            />
                        </Box>
                        <Box sx={{ position: 'relative', mb: 3 }}>
                            <FaEnvelope style={{ position: 'absolute', top: 12, left: 12 }} />
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
                                type="password"
                                variant="outlined"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                sx={{ '& .MuiOutlinedInput-root': { pl: 5 } }}
                            />
                        </Box>
                        <Box sx={{ position: 'relative', mb: 3 }}>
                            <FaLock style={{ position: 'absolute', top: 12, left: 12 }} />
                            <TextField
                                fullWidth
                                label="Confirm Password"
                                type="password"
                                variant="outlined"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                sx={{ '& .MuiOutlinedInput-root': { pl: 5 } }}
                            />
                        </Box>
                        <Button
                            fullWidth
                            variant="contained"
                            type="submit"
                            sx={{ mb: 2 }}
                        >
                            Register
                        </Button>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={handleGoogleSignup}
                                fullWidth
                            >
                                Sign up with Google
                            </Button>
                        </Box>
                        <Typography align="center">
                            Already have an account?{' '}
                            <Button onClick={() => navigate('/login')}>
                                Login
                            </Button>
                        </Typography>
                    </form>
                </Paper>
            </motion.div>
        </Box>
    );
};

export default Register;
