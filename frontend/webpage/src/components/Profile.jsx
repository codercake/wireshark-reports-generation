import React from 'react';
import { Box, Container, Paper, Typography, TextField, Button, Grid, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    backgroundColor: '#ffffff',
    borderRadius: theme.spacing(2),
    transition: 'transform 0.3s ease',
    '&:hover': {
        transform: 'translateY(-5px)',
    },
}));

const StatBox = styled(Box)({
    textAlign: 'center',
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: '#f5f5f5',
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: '#e0e0e0',
        transform: 'scale(1.05)',
    },
});

const Profile = () => {
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Typography variant="h4" sx={{ mb: 4, color: '#ffffff' }}>
                    Profile Settings
                </Typography>

                <Grid container spacing={4}>
                    {/* Profile Card */}
                    <Grid item xs={12} md={4}>
                        <StyledPaper elevation={3}>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Avatar
                                    src="https://via.placeholder.com/150"
                                    sx={{
                                        width: 150,
                                        height: 150,
                                        margin: '0 auto',
                                        mb: 2,
                                        border: '4px solid #000000',
                                    }}
                                />
                                <Button
                                    variant="outlined"
                                    sx={{
                                        color: '#000000',
                                        borderColor: '#000000',
                                        '&:hover': {
                                            borderColor: '#333333',
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                        },
                                    }}
                                >
                                    Change Photo
                                </Button>
                            </Box>

                            <Typography variant="h5" sx={{ textAlign: 'center', mb: 1 }}>
                                Ishitha C
                            </Typography>
                            <Typography variant="body1" sx={{ textAlign: 'center', mb: 3, color: 'text.secondary' }}>
                                Network Administrator
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <StatBox>
                                        <Typography variant="h4">150</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Reports Generated
                                        </Typography>
                                    </StatBox>
                                </Grid>
                                <Grid item xs={6}>
                                    <StatBox>
                                        <Typography variant="h4">45</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Days Active
                                        </Typography>
                                    </StatBox>
                                </Grid>
                            </Grid>
                        </StyledPaper>
                    </Grid>

                    {/* Settings Card */}
                    <Grid item xs={12} md={8}>
                        <StyledPaper elevation={3}>
                            <Typography variant="h5" sx={{ mb: 4 }}>
                                Account Settings
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="First Name"
                                        defaultValue="Ishitha"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#000000',
                                                },
                                            },
                                            '& label.Mui-focused': {
                                                color: '#000000',
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Last Name"
                                        defaultValue="C"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#000000',
                                                },
                                            },
                                            '& label.Mui-focused': {
                                                color: '#000000',
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        defaultValue="ishitha25e@example.com"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#000000',
                                                },
                                            },
                                            '& label.Mui-focused': {
                                                color: '#000000',
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Role"
                                        defaultValue="Network Administrator"
                                        InputProps={{ readOnly: true }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#000000',
                                                },
                                            },
                                            '& label.Mui-focused': {
                                                color: '#000000',
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Bio"
                                        multiline
                                        rows={4}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#000000',
                                                },
                                            },
                                            '& label.Mui-focused': {
                                                color: '#000000',
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        sx={{
                                            backgroundColor: '#000000',
                                            '&:hover': {
                                                backgroundColor: '#333333',
                                            },
                                        }}
                                    >
                                        Save Changes
                                    </Button>
                                </Grid>
                            </Grid>
                        </StyledPaper>
                    </Grid>
                </Grid>
            </motion.div>
        </Container>
    );
};

export default Profile;
