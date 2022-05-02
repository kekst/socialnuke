import React from 'react';
import { observer } from 'mobx-react-lite';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { LinkContainer } from 'react-router-bootstrap';

function Home() {
  return (
    <Container fluid>
      <Row>
        <Col>
          <h1>Pick your poison</h1>
          <p>
            <LinkContainer to="/discord">
              <Button variant="primary">Discord</Button>
            </LinkContainer>
            <LinkContainer to="/queue">
              <Button variant="primary">Queue</Button>
            </LinkContainer>
            <LinkContainer to="/accounts">
              <Button variant="primary">Manage accounts</Button>
            </LinkContainer>
          </p>
        </Col>
      </Row>
    </Container>
  );
}

export default observer(Home);
