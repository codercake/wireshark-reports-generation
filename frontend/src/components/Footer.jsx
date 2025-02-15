import React from 'react';

const Footer = () => {
    return (
        <footer className="text-center mt-4">
            <p>&copy; {new Date().getFullYear()} - Packet2Page, Wireshark Report Generator. All rights reserved.</p>
        </footer>
    );
};

export default Footer;