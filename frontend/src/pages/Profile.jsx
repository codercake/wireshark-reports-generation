import React from 'react';
import { Box, Container, Paper, Typography, TextField, Button, Grid, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const PageContainer = styled(Box)`
  min-height: 100vh;
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  position: relative;
  overflow: hidden;
  color: white;
  padding: 2rem 0;
`;

const StyledPaper = styled(Paper)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  color: white;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.1);
  }
`;

const StatBox = styled(Box)`
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    background: rgba(255, 255, 255, 0.1);
  }
`;

const GradientButton = styled(Button)`
  background: linear-gradient(45deg, #2196f3, #21cbf3);
  color: white;
  padding: 8px 24px;
  border-radius: 30px;
  text-transform: none;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(33, 150, 243, 0.3);
    background: linear-gradient(45deg, #2196f3, #21cbf3);
  }
`;

const StyledTextField = styled(TextField)`
  & .MuiOutlinedInput-root {
    color: white;
    & fieldset {
      border-color: rgba(255, 255, 255, 0.3);
    }
    &:hover fieldset {
      border-color: rgba(255, 255, 255, 0.5);
    }
    &.Mui-focused fieldset {
      border-color: #2196f3;
    }
  }
  & .MuiInputLabel-root {
    color: rgba(255, 255, 255, 0.7);
    &.Mui-focused {
      color: #2196f3;
    }
  }
`;

const Profile = () => {
    return (
        <PageContainer>
            <Container maxWidth="lg">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
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
                                            border: '4px solid #2196f3',
                                        }}
                                    />
                                    <GradientButton>
                                        Change Photo
                                    </GradientButton>
                                </Box>

                                <Typography variant="h5" sx={{ textAlign: 'center', mb: 1 }}>
                                    Ishitha C
                                </Typography>
                                <Typography variant="body1" sx={{ textAlign: 'center', mb: 3, opacity: 0.7 }}>
                                    Network Administrator
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <StatBox>
                                            <Typography variant="h4">150</Typography>
                                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                                Reports Generated
                                            </Typography>
                                        </StatBox>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <StatBox>
                                            <Typography variant="h4">45</Typography>
                                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
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
                                        <StyledTextField
                                            fullWidth
                                            label="First Name"
                                            defaultValue="Ishitha"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Last Name"
                                            defaultValue="C"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <StyledTextField
                                            fullWidth
                                            label="Email"
                                            defaultValue="ishitha25e@example.com"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <StyledTextField
                                            fullWidth
                                            label="Role"
                                            defaultValue="Network Administrator"
                                            InputProps={{ readOnly: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <StyledTextField
                                            fullWidth
                                            label="Bio"
                                            multiline
                                            rows={4}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <GradientButton>
                                            Save Changes
                                        </GradientButton>
                                    </Grid>
                                </Grid>
                            </StyledPaper>
                        </Grid>
                    </Grid>
                </motion.div>
            </Container>
        </PageContainer>
    );
};

export default Profile;
