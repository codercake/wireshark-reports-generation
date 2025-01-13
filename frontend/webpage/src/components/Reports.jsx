import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';

const Reports = () => {
  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Network Traffic',
      data: [65, 59, 80, 81, 56, 55],
      borderColor: '#4f46e5',
      tension: 0.4
    }]
  };

  return (
    <Container fluid className="p-4">
      <h1 className="mb-4">Network Analysis Reports</h1>
      
      <Row className="mb-4">
        <Col md={6}>
          <Card className="report-card h-100">
            <Card.Body>
              <Card.Title>Monthly Traffic Overview</Card.Title>
              <Line data={monthlyData} />
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="report-card h-100">
            <Card.Body>
              <Card.Title>Key Metrics</Card.Title>
              <div className="metrics-grid">
                <div className="metric-item">
                  <h3>2.4TB</h3>
                  <p>Total Data Transferred</p>
                </div>
                <div className="metric-item">
                  <h3>45K</h3>
                  <p>Total Packets</p>
                </div>
                <div className="metric-item">
                  <h3>99.9%</h3>
                  <p>Network Uptime</p>
                </div>
                <div className="metric-item">
                  <h3>12ms</h3>
                  <p>Average Latency</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="report-card">
            <Card.Body>
              <Card.Title>Recent Reports</Card.Title>
              <div className="reports-list">
                {[1, 2, 3].map((report) => (
                  <div key={report} className="report-item">
                    <div className="report-info">
                      <h4>Network Analysis Report #{report}</h4>
                      <p>Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                    <button className="download-btn">Download PDF</button>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Reports;
