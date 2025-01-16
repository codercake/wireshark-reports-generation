import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TextField, Button, Paper, Typography, Box, FormHelperText } from '@mui/material';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
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

    const [errors, setErrors] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        submit: ''
    });

    const validateField = (field, value) => {
        const newErrors = { ...errors };
        switch (field) {
            case 'username':
                newErrors.username = value.length >= 3 ? '' : 'Username must be at least 3 characters';
                break;
            case 'email':
                newErrors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Invalid email format';
                break;
            case 'password':
                newErrors.password = value.length >= 6 ? '' : 'Password must be at least 6 characters';
                if (formData.confirmPassword) {
                    newErrors.confirmPassword = value === formData.confirmPassword ? '' : 'Passwords do not match';
                }
                break;
            case 'confirmPassword':
                newErrors.confirmPassword = value === formData.password ? '' : 'Passwords do not match';
                break;
            default:
                break;
        }
        setErrors(newErrors);
    };

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        validateField(field, value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (Object.values(errors).some(error => error !== '')) {
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            navigate('/dashboard');
        } catch (error) {
            setErrors({ ...errors, submit: error.message });
        }
    };

    const handleGoogleSignup = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/dashboard');
        } catch (error) {
            setErrors({ ...errors, submit: error.message });
        }
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
                        Create Account
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ position: 'relative', mb: 3 }}>
                            <FaUser style={{ position: 'absolute', top: 12, left: 12, color: '#000000' }} />
                            <TextField
                                fullWidth
                                label="Username"
                                variant="outlined"
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                error={!!errors.username}
                                helperText={errors.username}
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
                            <FaEnvelope style={{ position: 'absolute', top: 12, left: 12, color: '#000000' }} />
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

                        <Box sx={{ position: 'relative', mb: 3 }}>
                            <FaLock style={{ position: 'absolute', top: 12, left: 12, color: '#000000' }} />
                            <TextField
                                fullWidth
                                label="Confirm Password"
                                type="password"
                                variant="outlined"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword}
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

                        {errors.submit && (
                            <FormHelperText error>{errors.submit}</FormHelperText>
                        )}

                        <Button
                            fullWidth
                            variant="contained"
                            type="submit"
                            sx={{ 
                                mb: 2, 
                                backgroundColor: '#000000', 
                                '&:hover': { 
                                    backgroundColor: '#333333' 
                                },
                            }}
                        >
                            Register
                        </Button>

                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={handleGoogleSignup}
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
                                Sign up with Google
                            </Button>
                        </Box>

                        <Typography align="center" sx={{ color: '#000000' }}>
                            Already have an account?{' '}
                            <Button 
                                onClick={() => navigate('/login')} 
                                sx={{ 
                                    color: '#000000',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
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
