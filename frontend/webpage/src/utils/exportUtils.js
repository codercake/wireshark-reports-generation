export const convertToCSV = (packets) => {
    const headers = ['Time', 'Protocol', 'Source IP', 'Destination IP', 'Length', 'Info'];
    const rows = packets.map(packet => [
        new Date(packet.timestamp).toLocaleString(),
        packet.protocol,
        packet.source_ip,
        packet.dest_ip,
        packet.length,
        packet.info
    ]);
    
    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
};

export const generatePDF = async (packets, stats) => {
    // Implement PDF generation using a library like jsPDF
    // Return PDF blob
};
