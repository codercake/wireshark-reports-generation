import React from 'react';

const Footer = () => {
    return (
        <footer className="text-center mt-4">
            <p>&copy; {new Date().getFullYear()} Wireshark Report Generator. All rights reserved.</p>
        </footer>
    );
};

export default Footer;