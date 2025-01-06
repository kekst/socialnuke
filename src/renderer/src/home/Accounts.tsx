import React from 'react';
import { observer } from 'mobx-react-lite';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Container from 'react-bootstrap/Container';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import { BsFillTrashFill } from 'react-icons/bs';
import { useStore } from '../../Store';

function Accounts() {
  const store = useStore();

  return (
    <>
      <Container>
        <Row>
          <Col xs={12}>
            <h2>Accounts:</h2>
          </Col>
        </Row>
        <Row style={{ paddingBottom: 20 }}>
          <Col xs={12}>
            <ButtonToolbar>
              <Button
                variant="primary"
                onClick={() => store.openLogin('discord')}
              >
                Add Discord account
              </Button>
              <Button variant="primary" onClick={() => store.refreshAccounts()}>
                Refresh accounts
              </Button>
            </ButtonToolbar>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <Table striped hover>
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
                        <img
                          src={acc.iconUrl}
                          className="target-icon"
                          alt={acc.name}
                        />
                      )}
                      {acc.name}
                    </td>
                    <td>
                      <pre>{acc.token}</pre>
                    </td>
                    <td>
                      <Button variant="primary">
                        <BsFillTrashFill />
                      </Button>
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
