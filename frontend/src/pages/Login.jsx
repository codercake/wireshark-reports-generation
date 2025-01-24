import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TextField, Button, Paper, Typography, Box, FormHelperText } from '@mui/material';
import { FaUser, FaLock } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [errors, setErrors] = useState({
        email: '',
        password: '',
        submit: '',
    });

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        return passwordRegex.test(password);
    };

    const getPasswordStrength = (password) => {
        if (password.length === 0) return '';
        if (password.length < 8) return 'Too Short';
        
        let strength = 0;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[@$!%*#?&]/.test(password)) strength++;

        if (strength === 4) return 'Strong';
        if (strength === 3) return 'Medium';
        return 'Weak';
    };

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        
        const newErrors = { ...errors };
        switch (field) {
            case 'email':
                newErrors.email = validateEmail(value) ? '' : 'Please enter a valid email address';
                break;
            case 'password':
                newErrors.password = value.length >= 8 ? '' : 'Password must be at least 8 characters';
                break;
            default:
                break;
        }
        setErrors(newErrors);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationErrors = {
            email: validateEmail(formData.email) ? '' : 'Valid email is required',
            password: formData.password.length >= 8 ? '' : 'Valid password is required',
        };

        setErrors(validationErrors);

        if (validationErrors.email || validationErrors.password) {
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
            navigate('/dashboard');
        } catch (error) {
            setErrors({
                ...errors,
                submit: 'Invalid email or password'
            });
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/dashboard');
        } catch (error) {
            setErrors({
                ...errors,
                submit: 'Google login failed'
            });
        }
    };

    const passwordStrength = getPasswordStrength(formData.password);
    const passwordStrengthColor = {
        'Strong': 'green',
        'Medium': 'orange',
        'Weak': 'red',
        'Too Short': 'red'
    };

    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#000000',
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Paper elevation={10} sx={{
                    padding: 4,
                    borderRadius: 2,
                    width: '100%',
                    maxWidth: 400,
                    boxShadow: '0 4px 20px rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#ffffff',
                }}>
                    <Typography variant="h4" align="center" gutterBottom sx={{ color: '#000000' }}>
                        Welcome Back
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ position: 'relative', mb: 3 }}>
                            <FaUser style={{ position: 'absolute', top: 12, left: 12, color: '#000000' }} />
                            <TextField
                                fullWidth
                                label="Email"
                                variant="outlined"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                error={!!errors.email}
                                helperText={errors.email}
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        pl: 5,
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#000000',
                                        },
                                    },
                                    '& label.Mui-focused': {
                                        color: '#000000',
                                    },
                                }}
                            />
                        </Box>

                        <Box sx={{ position: 'relative', mb: 3 }}>
                            <FaLock style={{ position: 'absolute', top: 12, left: 12, color: '#000000' }} />
                            <TextField
                                fullWidth
                                label="Password"
                                type="password"
                                variant="outlined"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                error={!!errors.password}
                                helperText={errors.password}
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        pl: 5,
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#000000',
                                        },
                                    },
                                    '& label.Mui-focused': {
                                        color: '#000000',
                                    },
                                }}
                            />
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            type="submit"
                            disabled={!!errors.email || !!errors.password}
                            sx={{ 
                                mb: 2, 
                                backgroundColor: '#000000', 
                                '&:hover': { 
                                    backgroundColor: '#333333' 
                                },
                                '&:disabled': {
                                    backgroundColor: '#cccccc',
                                }
                            }}
                        >
                            Login
                        </Button>

                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={handleGoogleLogin}
                                fullWidth
                                startIcon={<FcGoogle size={20} />}
                                sx={{
                                    borderColor: '#000000',
                                    color: '#000000',
                                    '&:hover': { 
                                        borderColor: '#333333', 
                                        color: '#333333',
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    },
                                }}
                            >
                                Login with Google
                            </Button>
                        </Box>

                        <Typography align="center" sx={{ color: '#000000' }}>
                            Don't have an account?{' '}
                            <Button 
                                onClick={() => navigate('/register')} 
                                sx={{ 
                                    color: '#000000',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
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

