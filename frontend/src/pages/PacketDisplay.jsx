import React from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper 
} from '@mui/material';

const PacketDisplay = ({ packets }) => {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Protocol</TableCell>
                        <TableCell>Source</TableCell>
                        <TableCell>Destination</TableCell>
                        <TableCell>Length</TableCell>
                        <TableCell>Type</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {packets.map((packet, index) => (
                        <TableRow key={index}>
                            <TableCell>{new Date(packet.timestamp).toLocaleTimeString()}</TableCell>
                            <TableCell>{packet.protocol}</TableCell>
                            <TableCell>{`${packet.source_ip}:${packet.source_port}`}</TableCell>
                            <TableCell>{`${packet.dest_ip}:${packet.dest_port}`}</TableCell>
                            <TableCell>{packet.length}</TableCell>
                            <TableCell>{packet.packet_type}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default PacketDisplay;
