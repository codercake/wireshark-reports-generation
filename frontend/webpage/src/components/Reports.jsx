import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';

const Reports = () => {
  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Network Traffic',
      data: [65, 59, 80, 81, 56, 55],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  return (
    <Container fluid className="p-4" style={{ backgroundColor: '#f8fafc' }}>
      <h1 className="mb-4" style={{ color: '#1e293b' }}>Network Analysis Reports</h1>
      
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title style={{ color: '#334155' }}>Monthly Traffic Overview</Card.Title>
              <Line data={monthlyData} />
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title style={{ color: '#334155' }}>Key Metrics</Card.Title>
              <div className="d-flex justify-content-around text-center">
                <div>
                  <h3 style={{ color: '#0ea5e9' }}>2.4TB</h3>
                  <p style={{ color: '#64748b' }}>Total Data</p>
                </div>
                <div>
                  <h3 style={{ color: '#0ea5e9' }}>45K</h3>
                  <p style={{ color: '#64748b' }}>Total Packets</p>
                </div>
                <div>
                  <h3 style={{ color: '#0ea5e9' }}>99.9%</h3>
                  <p style={{ color: '#64748b' }}>Network Uptime</p>
                </div>
                <div>
                  <h3 style={{ color: '#0ea5e9' }}>12ms</h3>
                  <p style={{ color: '#64748b' }}>Avg Latency</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title style={{ color: '#334155' }}>Recent Reports</Card.Title>
              {[1, 2, 3].map((report) => (
                <div key={report} className="d-flex justify-content-between align-items-center p-3 border-bottom">
                  <div>
                    <h5 style={{ color: '#334155' }}>Network Analysis Report #{report}</h5>
                    <p style={{ color: '#64748b' }}>{new Date().toLocaleDateString()}</p>
                  </div>
                  <button 
                    className="btn btn-primary"
                    style={{ 
                      backgroundColor: '#0ea5e9',
                      border: 'none',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    Download PDF
                  </button>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Reports;
