import React, { useCallback, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { observer } from 'mobx-react-lite';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Alert from 'react-bootstrap/Alert';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { v4 } from 'uuid';
import Modal from 'react-bootstrap/Modal';
import TargetSelector from './TargetSelector';
import { Platform, PlatformTarget } from '../platforms/types';
import { defaultValues, waitFor } from '../platforms/utils';
import Filter from './filter';
import { Task, useStore } from '../../Store';

interface PurgeProps {
  platform: Platform;
}

function Purge({ platform }: PurgeProps) {
  const form = useForm<any>({
    defaultValues: defaultValues(platform),
  });

  const [target, setTarget] = useState<PlatformTarget>();
  const store = useStore();

  const [preparing, setPreparing] = useState(false);
  const [numberOfMessages, setNumberOfMessages] = useState(-1);
  const preparePurge = useCallback(
    async (values: any) => {
      if (preparing || !target?.estimate) return;

      setNumberOfMessages(-1);
      setPreparing(true);

      const estimate = await waitFor(() => target.estimate!(values));
      setNumberOfMessages(estimate);
      setPreparing(false);
    },
    [preparing, setPreparing, setNumberOfMessages, target]
  );

  const confirmPurge = () => {
    if (!target) return;

    const task: Task = {
      id: v4(),
      type: 'purge',
      generator: target.query(form.getValues()),
      userName: target.user.name,
      iconUrl: target.user.iconUrl,
      description: `${target.type}: ${target.name}`,
      platform: platform.key,
      state: 'queued',
      total: numberOfMessages,
    };

    store.addTask(task);
    setNumberOfMessages(-1);
  };

  return (
    <>
      <Container style={{ padding: 0 }}>
        <Row>
          <TargetSelector platform={platform} onTargetSelected={setTarget} />
          <Col xs={6}>
            <Form
              onSubmit={form.handleSubmit((values) => {
                preparePurge(values);
              })}
            >
              <FormProvider {...form}>
                {platform.filters.map((filter) => (
                  <Filter key={filter.key} filter={filter} />
                ))}
              </FormProvider>
              <p>
                Deleting only <b>own</b> messages.
              </p>
              <Button variant="primary" disabled={!target} type="submit">
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
          <Modal.Title>Confirm purge</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            This action will remove <b>{numberOfMessages}</b> messages.
          </p>
          {numberOfMessages > 0 && (
            <Alert variant="info">
              Due to caching, the count reflected above might be inaccurate.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setNumberOfMessages(-1)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => confirmPurge()}>
            Purge
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default observer(Purge);
