import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';

const NavBar = styled.nav`
  background-color: #000000;
  padding: 1rem 0;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 0.8rem 0;
  }
`;

const NavContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;

  @media (max-width: 480px) {
    padding: 0 1rem;
  }
`;

const LogoContainer = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  gap: 1rem;

  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const RotatingLogo = styled.span`
  font-size: 2.5rem;
  line-height: 1;
  transition: transform 0.6s ease;
  cursor: pointer;

  &:hover {
    transform: rotate(360deg);
  }

  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const LogoText = styled.span`
  font-size: 1.8rem;
  font-weight: bold;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 2px;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;

  @media (max-width: 768px) {
    display: none;
  }
`;

const StyledNavLink = styled(NavLink)`
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  padding: 0.5rem 1rem;
  white-space: nowrap;

  &:hover {
    color: #2196f3;
    transform: translateY(-2px);
  }

  &.active {
    color: #2196f3;
    position: relative;
    
    &:after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(45deg, #2196f3, #21cbf3);
      border-radius: 2px;
    }
  }

  @media (max-width: 768px) {
    font-size: 1.2rem;
    padding: 1rem;
  }
`;

const AuthButton = styled(NavLink)`
  padding: 0.8rem 1.5rem;
  border-radius: 30px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 1rem;
  
  ${props => props.$primary ? `
    background: linear-gradient(45deg, #2196f3, #21cbf3);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
    }
  ` : `
    color: white;
    border: 2px solid #2196f3;
    
    &:hover {
      background: rgba(33, 150, 243, 0.1);
    }
  `}

  @media (max-width: 768px) {
    width: 100%;
    text-align: center;
    margin: 0.5rem 0;
  }
`;

const MobileMenu = styled(motion.div)`
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  max-width: 300px;
  height: 100vh;
  background-color: #000000;
  padding: 5rem 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 1001;
  overflow-y: auto;

  @media (max-width: 480px) {
    width: 100%;
    max-width: none;
  }
`;

const MenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 0.5rem;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const menuVariants = {
    open: { x: 0 },
    closed: { x: '100%' },
  };

  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 },
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const renderAuthLinks = () => {
    if (user) {
      return (
        <>
          <StyledNavLink to="/profile">Profile</StyledNavLink>
          <AuthButton to="/login" onClick={handleLogout}>
            Logout
          </AuthButton>
        </>
      );
    }
    return (
      <>
        <AuthButton to="/login">Sign In</AuthButton>
        <AuthButton to="/register" $primary>
          Register
        </AuthButton>
      </>
    );
  };

  return (
    <>
      <NavBar>
        <NavContainer>
          <LogoContainer to="/">
            <RotatingLogo>🦈</RotatingLogo>
            <LogoText>Packet2Page</LogoText>
          </LogoContainer>
          
          <NavLinks>
            <StyledNavLink to="/home">Home</StyledNavLink>
            {user && (
              <>
                <StyledNavLink to="/network-pulse">Network Pulse</StyledNavLink>
                <StyledNavLink to="/reports">Reports</StyledNavLink>
              </>
            )}
            {renderAuthLinks()}
          </NavLinks>

          <MenuButton onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <CloseIcon sx={{ fontSize: '2rem' }} /> : <MenuIcon sx={{ fontSize: '2rem' }} />}
          </MenuButton>
        </NavContainer>
      </NavBar>

      {isOpen && (
        <Overlay
          initial="closed"
          animate="open"
          exit="closed"
          variants={overlayVariants}
          onClick={() => setIsOpen(false)}
        />
      )}

      <MobileMenu
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        variants={menuVariants}
      >
        <StyledNavLink to="/home" onClick={() => setIsOpen(false)}>
          Home
        </StyledNavLink>
        
        {user && (
          <>
            <StyledNavLink to="/network-pulse" onClick={() => setIsOpen(false)}>
              Network Pulse
            </StyledNavLink>
            <StyledNavLink to="/reports" onClick={() => setIsOpen(false)}>
              Reports
            </StyledNavLink>
          </>
        )}
        
        {user ? (
          <>
            <StyledNavLink to="/profile" onClick={() => setIsOpen(false)}>
              Profile
            </StyledNavLink>
            <AuthButton to="/login" onClick={handleLogout}>
              Logout
            </AuthButton>
          </>
        ) : (
          <>
            <AuthButton to="/login" onClick={() => setIsOpen(false)}>
              Sign In
            </AuthButton>
            <AuthButton to="/register" $primary onClick={() => setIsOpen(false)}>
              Register
            </AuthButton>
          </>
        )}
      </MobileMenu>
    </>
  );
};

export default Navbar;
