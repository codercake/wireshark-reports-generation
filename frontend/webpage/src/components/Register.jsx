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
    });

    const validateUsername = (username) => {
        return username.length >= 3;
    };

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
            case 'username':
                newErrors.username = validateUsername(value) ? '' : 'Username must be at least 3 characters';
                break;
            case 'email':
                newErrors.email = validateEmail(value) ? '' : 'Please enter a valid email address';
                break;
            case 'password':
                newErrors.password = validatePassword(value) ? '' : 'Password must be 8+ characters with letters, numbers, and special characters';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        //Validate all fields
        const validationErrors = {
            username: validateUsername(formData.username) ? '' : 'Username is required',
            email: validateEmail(formData.email) ? '' : 'Valid email is required',
            password: validatePassword(formData.password) ? '' : 'Valid password is required',
            confirmPassword: formData.password === formData.confirmPassword ? '' : 'Passwords must match'
        };

        setErrors(validationErrors);

        if (Object.values(validationErrors).some(error => error !== '')) {
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            navigate('/dashboard');
        } catch (error) {
            setErrors({
                ...errors,
                submit: error.message
            });
        }
    };

    const handleGoogleSignup = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/dashboard');
        } catch (error) {
            setErrors({
                ...errors,
                submit: error.message
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                }}>
                    <Typography variant="h4" align="center" gutterBottom>
                        Create Account
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ position: 'relative', mb: 3 }}>
                            <FaUser style={{ position: 'absolute', top: 12, left: 12, color: '#667eea' }} />
                            <TextField
                                fullWidth
                                label="Username"
                                variant="outlined"
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                error={!!errors.username}
                                helperText={errors.username}
                                sx={{ '& .MuiOutlinedInput-root': { pl: 5 } }}
                            />
                        </Box>

                        <Box sx={{ position: 'relative', mb: 3 }}>
                            <FaEnvelope style={{ position: 'absolute', top: 12, left: 12, color: '#667eea' }} />
                            <TextField
                                fullWidth
                                label="Email"
                                variant="outlined"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                error={!!errors.email}
                                helperText={errors.email}
                                sx={{ '& .MuiOutlinedInput-root': { pl: 5 } }}
                            />
                        </Box>

                        <Box sx={{ position: 'relative', mb: 3 }}>
                            <FaLock style={{ position: 'absolute', top: 12, left: 12, color: '#667eea' }} />
                            <TextField
                                fullWidth
                                label="Password"
                                type="password"
                                variant="outlined"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                error={!!errors.password}
                                helperText={errors.password}
                                sx={{ '& .MuiOutlinedInput-root': { pl: 5 } }}
                            />
                            {formData.password && (
                                <FormHelperText sx={{ color: passwordStrengthColor[passwordStrength] }}>
                                    Password Strength: {passwordStrength}
                                </FormHelperText>
                            )}
                        </Box>

                        <Box sx={{ position: 'relative', mb: 3 }}>
                            <FaLock style={{ position: 'absolute', top: 12, left: 12, color: '#667eea' }} />
                            <TextField
                                fullWidth
                                label="Confirm Password"
                                type="password"
                                variant="outlined"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword}
                                sx={{ '& .MuiOutlinedInput-root': { pl: 5 } }}
                            />
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            type="submit"
                            disabled={Object.values(errors).some(error => error !== '')}
                            sx={{ mb: 2, backgroundColor: '#764ba2', '&:hover': { backgroundColor: '#667eea' } }}
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
                                    borderColor: '#764ba2',
                                    color: '#764ba2',
                                    '&:hover': { borderColor: '#667eea', color: '#667eea' },
                                    display: 'flex',
                                    gap: 1,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                Sign up with Google
                            </Button>
                        </Box>

                        <Typography align="center">
                            Already have an account?{' '}
                            <Button onClick={() => navigate('/login')} sx={{ color: '#764ba2' }}>
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
