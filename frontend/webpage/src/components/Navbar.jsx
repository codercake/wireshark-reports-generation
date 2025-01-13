import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const NavBar = styled.nav`
  background-color: #16213e;
  padding: 1rem 0;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
`;

const LogoContainer = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  gap: 0.5rem;
  z-index: 1002;
`;

const LogoIcon = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00ff95 0%, #0066ff 100%);
  width: 40px;
  height: 40px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    background: #fff;
    transform: rotate(45deg);
    border-radius: 2px;
  }
`;

const LogoText = styled.span`
  font-size: 1.8rem;
  font-weight: bold;
  background: linear-gradient(135deg, #00ff95 0%, #0066ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;

  @media (max-width: 768px) {
    display: none;
  }

  a {
    color: #e94560;
    text-decoration: none;
    font-weight: 500;
    font-size: 1.1rem;
    transition: color 0.3s ease;

    &:hover {
      color: #00ff95;
    }
  }
`;

const MenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: #e94560;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 1002;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled(motion.div)`
  position: fixed;
  top: 0;
  right: 0;
  width: 250px;
  height: 100vh;
  background-color: #16213e;
  padding: 5rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  z-index: 1001;
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

const Logo = () => {
  return (
    <LogoContainer to="/">
      <LogoIcon
        whileHover={{ rotate: 180 }}
        transition={{ duration: 0.3 }}
      />
      <LogoText>Packet2Page</LogoText>
    </LogoContainer>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuVariants = {
    open: { x: 0 },
    closed: { x: "100%" }
  };

  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 }
  };

  return (
    <>
      <NavBar>
        <NavContainer>
          <Logo />
          <NavLinks>
            <Link to="/">Home</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/reports">Reports</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/profile">Profile</Link>
          </NavLinks>
          <MenuButton onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <CloseIcon /> : <MenuIcon />}
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
        animate={isOpen ? "open" : "closed"}
        variants={menuVariants}
        transition={{ type: "tween" }}
      >
        <Link to="/" onClick={() => setIsOpen(false)}>Home</Link>
        <Link to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
        <Link to="/reports" onClick={() => setIsOpen(false)}>Reports</Link>
        <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
        <Link to="/register" onClick={() => setIsOpen(false)}>Register</Link>
        <Link to="/profile" onClick={() => setIsOpen(false)}>Profile</Link>
      </MobileMenu>
    </>
  );
};

export default Navbar;
