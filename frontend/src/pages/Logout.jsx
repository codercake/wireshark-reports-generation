import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import styled from '@emotion/styled';

const LogoutContainer = styled(Box)`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  color: white;
`;

const LogoutMessage = styled(motion.div)`
  text-align: center;
  padding: 2rem;
`;

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      await logout();
      navigate('/login');
    };

    handleLogout();
  }, [logout, navigate]);

  return (
    <LogoutContainer>
      <LogoutMessage
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          Logging you out...
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8 }}>
          Thank you for using Packet2Page
        </Typography>
      </LogoutMessage>
    </LogoutContainer>
  );
};

export default Logout;
