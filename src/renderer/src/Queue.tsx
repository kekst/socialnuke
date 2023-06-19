import React from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { observer } from 'mobx-react-lite';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import { useStore } from '../Store';

function Queue() {
  const store = useStore();

  if (store.queue.length === 0) {
    return null;
  }

  const task = store.queue[0];

  return (
    <ListGroup className="queue">
      <ListGroup.Item>
        <p>
          <b>{task.platform}:&nbsp;</b>
          {task.account}
        </p>
        <p>{task.description}</p>
        {task.total && task.current && (
          <ProgressBar now={(task.current / task.total) * 100} />
        )}
        {task.state}{' '}
        {task.total && task.current && (
          <>
            {task.current} / {task.total}
          </>
        )}
        <Button variant="primary" onClick={() => store.cancelTask(task.id)}>
          Cancel
        </Button>
      </ListGroup.Item>
      {store.queue.length > 1 && (
        <ListGroup.Item>
          <p>
            <strong>{store.queue.length - 1} more items</strong>
          </p>
          <p>
            <Link to="/queue">View queue</Link>
          </p>
        </ListGroup.Item>
      )}
    </ListGroup>
  );
}

export default observer(Queue);
