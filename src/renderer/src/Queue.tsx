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
          {task.userName}
        </p>
        <p>{task.description}</p>
        {!!(task.total && task.current) && (
          <ProgressBar now={(task.current / task.total) * 100} />
        )}
        <div className="queue-item-progress">
          <div>
            {task.state !== 'progress' && task.state}
            {task.state === 'progress' && !!(task.total && task.current) && (
              <>
                {task.current} / {task.total}
              </>
            )}
          </div>
          <Button variant="primary" onClick={() => store.cancelTask(task.id)}>
            Cancel
          </Button>
        </div>
      </ListGroup.Item>
      {store.queue.length > 1 && (
        <ListGroup.Item>
          <div className="queue-item-progress">
            <div>
              <strong>{store.queue.length - 1} more items</strong>
            </div>
            <div>
              <Link to="/queue">View queue</Link>
            </div>
          </div>
        </ListGroup.Item>
      )}
    </ListGroup>
  );
}

export default observer(Queue);
