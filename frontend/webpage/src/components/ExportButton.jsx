import React, { useState } from 'react';
import { Button, Dropdown, Modal } from 'react-bootstrap';
import { saveAs } from 'file-saver';
import { convertToCSV, generatePDF } from '../utils/exportUtils';


const ExportButton = ({ packets, stats }) => {
    const [showModal, setShowModal] = useState(false);
    const [exportFormat, setExportFormat] = useState('csv');

    const generateReport = async (format) => {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `wireshark-report-${timestamp}`;

        switch (format) {
            case 'csv':
                const csvContent = convertToCSV(packets);
                const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
                saveAs(csvBlob, `${filename}.csv`);
                break;
            case 'pdf':
                const pdfContent = await generatePDF(packets, stats);
                saveAs(pdfContent, `${filename}.pdf`);
                break;
            case 'json':
                const jsonContent = JSON.stringify({ packets, stats }, null, 2);
                const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
                saveAs(jsonBlob, `${filename}.json`);
                break;
        }
        setShowModal(false);
    };

    return (
        <>
            <Dropdown>
                <Dropdown.Toggle variant="success">
                    Export Report
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    <Dropdown.Item onClick={() => generateReport('csv')}>CSV</Dropdown.Item>
                    <Dropdown.Item onClick={() => generateReport('pdf')}>PDF</Dropdown.Item>
                    <Dropdown.Item onClick={() => generateReport('json')}>JSON</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Export Report</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Select export format and customize report options</p>
                    {/* Add customization options here */}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => generateReport(exportFormat)}>
                        Export
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ExportButton;
