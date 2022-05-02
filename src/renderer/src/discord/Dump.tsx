import React, { useMemo, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Modal from 'react-bootstrap/Modal';
import { v4 } from 'uuid';
import { useStore, Task } from '../../Store';
import { waitForSearch, Filters } from '../../DiscordAPI';
import TargetSelector, { Target } from './TargetSelector';

function Dump() {
  const store = useStore();

  const [target, setTarget] = useState<Target>();

  const [has, setHas] = useState<
    'link' | 'embed' | 'file' | 'video' | 'image' | 'sound' | undefined
  >('file');
  const [contains, setContains] = useState('');
  const [oldest, setOldest] = useState(false);
  const filters = useMemo(() => {
    return {
      type: target?.type,
      target: target?.id,
      has,
      contains: contains === '' || !contains ? undefined : contains,
      sort: oldest ? 'oldest' : 'newest',
    } as Filters;
  }, [target, has, contains, oldest]);

  const [preparing, setPreparing] = useState(false);
  const [numberOfMessages, setNumberOfMessages] = useState(-1);
  const preparePurge = useCallback(async () => {
    if (preparing) return;

    const acc = store.discordAccounts.find(
      (acc) => acc.id === target?.accountId
    );
    if (!acc) return;

    setNumberOfMessages(-1);
    setPreparing(true);

    const messages = await waitForSearch(acc.token, filters);
    let nom = messages?.total_results || 0;
    if (nom < 0) {
      nom = 0;
    }

    setNumberOfMessages(nom);
    setPreparing(false);
  }, [preparing, setPreparing, setNumberOfMessages, store, target, filters]);

  const confirmPurge = useCallback(() => {
    const acc = store.discordAccounts.find(
      (acc) => acc.id === target?.accountId
    );
    if (!acc || !target) return;

    const task: Task = {
      id: v4(),
      type: 'dump',
      account: acc.name,
      token: acc.token,
      description:
        (target.type === 'channel' ? 'DMs' : 'Guild') + ': ' + target.name,
      platform: 'discord',
      state: 'queued',
      data: filters,
    };

    store.addTask(task);
    setNumberOfMessages(-1);
  }, [target, store, setNumberOfMessages, filters]);

  return (
    <>
      <Container fluid>
        <Row>
          <TargetSelector onTargetSelected={setTarget} />
          <Col xs={3}>
            <h3>Filters:</h3>
            <Form>
              <Form.Group controlId="oldest">
                <Form.Check
                  type="checkbox"
                  label="Start from oldest"
                  checked={oldest}
                  onChange={(e: React.ChangeEvent) =>
                    setOldest((e.target as any).checked)
                  }
                />
              </Form.Group>
              <Form.Group controlId="containsText">
                <Form.Label>Contains text</Form.Label>
                <Form.Control
                  type="text"
                  value={contains}
                  onChange={(e) => setContains(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="contains">
                <Form.Label>Contains</Form.Label>
                <Form.Check
                  type="radio"
                  label="File"
                  id="file"
                  checked={has === 'file'}
                  onChange={() => setHas('file')}
                />
                <Form.Check
                  type="radio"
                  label="Image"
                  id="image"
                  checked={has === 'image'}
                  onChange={() => setHas('image')}
                />
                <Form.Check
                  type="radio"
                  label="Embed"
                  id="embed"
                  checked={has === 'embed'}
                  onChange={() => setHas('embed')}
                />
                <Form.Check
                  type="radio"
                  label="Sound"
                  id="sound"
                  checked={has === 'sound'}
                  onChange={() => setHas('sound')}
                />
                <Form.Check
                  type="radio"
                  label="Video"
                  id="video"
                  checked={has === 'video'}
                  onChange={() => setHas('video')}
                />
              </Form.Group>
              <Button
                variant="primary"
                disabled={!target}
                onClick={preparePurge}
              >
                Purge
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
      {preparing && (
        <div className="block">
          <Spinner animation="border" variant="light" />
        </div>
      )}
      <Modal
        show={numberOfMessages !== -1}
        onHide={() => setNumberOfMessages(-1)}
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm dump</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This action will save <b>{numberOfMessages}</b> files.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setNumberOfMessages(-1)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmPurge}>
            Dump
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default observer(Dump);
