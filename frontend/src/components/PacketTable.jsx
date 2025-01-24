import React from 'react';
import { 
    Box,
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper,
    TablePagination 
} from '@mui/material';

const PacketTable = ({ packets }) => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box p={3}>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>Protocol</TableCell>
                            <TableCell>Source</TableCell>
                            <TableCell>Destination</TableCell>
                            <TableCell>Length</TableCell>
                            <TableCell>Severity</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {packets
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((packet, index) => (
                                <TableRow key={index}>
                                    <TableCell>{new Date(packet.timestamp).toLocaleString()}</TableCell>
                                    <TableCell>{packet.protocol}</TableCell>
                                    <TableCell>{`${packet.source_ip}:${packet.source_port}`}</TableCell>
                                    <TableCell>{`${packet.dest_ip}:${packet.dest_port}`}</TableCell>
                                    <TableCell>{packet.length}</TableCell>
                                    <TableCell>{packet.severity}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 100]}
                    component="div"
                    count={packets.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
        </Box>
    );
};

export default PacketTable;
