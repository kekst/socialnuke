import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Container from 'react-bootstrap/Container';
import { useStore } from '../../Store';

function Accounts() {
  const store = useStore();

  return (
    <>
      <Container fluid>
        <Row style={{ paddingBottom: 20 }}>
          <Col xs={12}>
            <Button variant="primary" onClick={store.openDiscordLogin}>
              Add Discord account
            </Button>
            <Button variant="primary" onClick={store.refreshAccounts}>
              Refresh accounts
            </Button>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Name</th>
                  <th>Token</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {store.accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td>{acc.platform}</td>
                    <td>
                      {acc.iconUrl && (
                        <img src={acc.iconUrl} className="target-icon" />
                      )}
                      {acc.name}
                    </td>
                    <td>
                      <pre>{acc.token}</pre>
                    </td>
                    <td>
                      <Button variant="primary">Remove from socialnuke</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default observer(Accounts);
