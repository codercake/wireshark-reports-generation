import React from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';

const Profile = () => {
  return (
    <Container fluid className="p-4">
      <h1 className="mb-4">Profile Settings</h1>

      <Row>
        <Col lg={4}>
          <Card className="profile-card mb-4">
            <Card.Body className="text-center">
              <div className="profile-avatar">
                <img 
                  src="https://via.placeholder.com/150" 
                  alt="Profile"
                  className="rounded-circle mb-3"
                />
                <button className="change-avatar-btn">Change Photo</button>
              </div>
              <h3>Ishitha C</h3>
              <p className="text-muted">Network Administrator</p>
              <div className="profile-stats">
                <div className="stat-item">
                  <h4>150</h4>
                  <p>Reports Generated</p>
                </div>
                <div className="stat-item">
                  <h4>45</h4>
                  <p>Days Active</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="profile-card">
            <Card.Body>
              <h3 className="mb-4">Account Settings</h3>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control type="text" defaultValue="Ishitha" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control type="text" defaultValue="C" />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" defaultValue="ishitha25e@example.com" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Control type="text" defaultValue="Network Administrator" readOnly />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Bio</Form.Label>
                  <Form.Control as="textarea" rows={3} />
                </Form.Group>

                <Button variant="primary" type="submit">Save Changes</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
