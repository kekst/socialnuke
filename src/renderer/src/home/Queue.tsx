import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Container from 'react-bootstrap/Container';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useStore } from '../../Store';

function Queue() {
  const store = useStore();

  return (
    <>
      <Container fluid>
        <Row>
          <Col xs={12}>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Account</th>
                  <th>Details</th>
                  <th>State</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {store.queue.map((task) => (
                  <tr key={task.id}>
                    <td>{task.platform}</td>
                    <td>{task.account}</td>
                    <td>{task.description}</td>
                    <td>
                      {task.total && task.current && (
                        <ProgressBar now={(task.current / task.total) * 100} />
                      )}
                      <div>
                        {task.state + ' '}
                        {task.total && task.current && (
                          <>
                            {task.current} / {task.total}
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <Button
                        variant="primary"
                        onClick={() => store.cancelTask(task.id)}
                      >
                        Cancel
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

export default observer(Queue);
