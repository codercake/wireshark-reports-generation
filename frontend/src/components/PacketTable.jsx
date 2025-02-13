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
    TablePagination,
    Button
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

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

    const downloadPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [['Time', 'Protocol', 'Source', 'Destination', 'Length', 'Severity']],
            body: packets.map(packet => [
                new Date(packet.timestamp).toLocaleString(),
                packet.protocol,
                `${packet.source_ip}:${packet.source_port}`,
                `${packet.dest_ip}:${packet.dest_port}`,
                packet.length,
                packet.severity
            ]),
        });
        doc.save('packets_report.pdf');
    };

    const downloadCSV = () => {
        const csv = Papa.unparse(packets.map(packet => ({
            Time: new Date(packet.timestamp).toLocaleString(),
            Protocol: packet.protocol,
            Source: `${packet.source_ip}:${packet.source_port}`,
            Destination: `${packet.dest_ip}:${packet.dest_port}`,
            Length: packet.length,
            Severity: packet.severity
        })));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'packets_report.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Box p={3}>
            <Button variant="contained" color="primary" onClick={downloadPDF}>Download PDF</Button>
            <Button variant="contained" color="secondary" onClick={downloadCSV} style={{ marginLeft: 10 }}>Download CSV</Button>
            <TableContainer component={Paper} style={{ marginTop: 20 }}>
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
