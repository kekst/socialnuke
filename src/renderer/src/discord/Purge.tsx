import React, { useState, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { observer } from 'mobx-react-lite';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Alert from 'react-bootstrap/Alert';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Modal from 'react-bootstrap/Modal';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ReactDatePicker from 'react-datepicker';
import {
  BsAsterisk,
  BsFillFileEarmarkFill,
  BsCardImage,
  BsListColumnsReverse,
  BsMusicNoteBeamed,
  BsFilm,
  BsStickyFill,
} from 'react-icons/bs';
import { v4 } from 'uuid';
import { useStore, Task } from '../../Store';
import { waitForSearch, Filters, Target } from '../../DiscordAPI';
import TargetSelector from './TargetSelector';
import { dateSnowflake } from '../../common';

interface Values {
  has: 'any' | 'link' | 'embed' | 'file' | 'video' | 'image' | 'sound';
  contains?: string;
  oldest: boolean;
  recheck: boolean;
  keepLast: number;
  after: Date | null;
  before: Date | null;
}

const hasValues = [
  { label: 'Anything', value: 'any', icon: <BsAsterisk /> },
  { label: 'File', value: 'file', icon: <BsFillFileEarmarkFill /> },
  { label: 'Image', value: 'image', icon: <BsCardImage /> },
  { label: 'Embed', value: 'embed', icon: <BsListColumnsReverse /> },
  { label: 'Sound', value: 'sound', icon: <BsMusicNoteBeamed /> },
  { label: 'Video', value: 'video', icon: <BsFilm /> },
  { label: 'Sticker', value: 'sticker', icon: <BsStickyFill /> },
];

function buildFilters(target: Target, values: Values): Filters {
  const { after, before, keepLast, has, contains, oldest, recheck } = values;
  return {
    author_id: target.accountId,
    type: target.type,
    target: target.id,
    channel_id: target.channelId,
    min_id: after ? dateSnowflake(after) : undefined,
    max_id: before ? dateSnowflake(before) : undefined,
    has: has === 'any' ? undefined : has,
    keep_last: keepLast,
    recheck,
    content: !contains ? undefined : contains,
    sort: oldest ? 'oldest' : 'newest',
  };
}

function Purge() {
  const { control, register, handleSubmit, setValue } = useForm<{
    has: 'any' | 'link' | 'embed' | 'file' | 'video' | 'image' | 'sound';
    contains?: string;
    oldest: boolean;
    recheck: boolean;
    keepLast: number;
    after: Date | null;
    before: Date | null;
  }>({
    defaultValues: {
      has: 'any',
      oldest: true,
      recheck: true,
      keepLast: 0,
      after: null,
      before: null,
    },
  });
  const store = useStore();

  const [target, setTarget] = useState<Target>();
  const [prepareFilters, setPrepareFilters] = useState<Filters>();

  const [preparing, setPreparing] = useState(false);
  const [numberOfMessages, setNumberOfMessages] = useState(-1);
  const preparePurge = useCallback(
    async (values: Values) => {
      if (preparing || !target) return;

      const filters = buildFilters(target, values);
      const acc = store.discordAccounts.find(
        (acc) => acc.id === target?.accountId
      );
      if (!acc) return;

      setNumberOfMessages(-1);
      setPreparing(true);
      setPrepareFilters(filters);

      const messages = await waitForSearch(acc.token, filters);
      if (!messages) {
        setNumberOfMessages(0);
        setPreparing(false);
        return;
      }

      if (!messages.messages?.length) {
        setNumberOfMessages(0);
        setPreparing(false);
        return;
      }

      let count = (messages.total_results || 0) - values.keepLast;
      if (count < 0) {
        count = 0;
      }

      setNumberOfMessages(count);
      setPreparing(false);
    },
    [preparing, setPreparing, setNumberOfMessages, store, target]
  );

  const confirmPurge = useCallback(() => {
    const acc = store.discordAccounts.find(
      (acc) => acc.id === target?.accountId
    );
    if (!acc || !target) return;

    const typeName = target.type === 'channel' ? 'DMs' : 'Guild';
    const task: Task = {
      id: v4(),
      type: 'purge',
      account: acc.name,
      token: acc.token,
      description: `${typeName}: ${target.name}`,
      platform: 'discord',
      state: 'queued',
      data: prepareFilters,
    };

    store.addTask(task);
    setNumberOfMessages(-1);
  }, [target, store, setNumberOfMessages, prepareFilters]);

  return (
    <>
      <Container style={{ padding: 0 }}>
        <Row>
          <TargetSelector onTargetSelected={setTarget} />
          <Col xs={6}>
            <Form
              onSubmit={handleSubmit((values) => {
                preparePurge(values);
              })}
            >
              <Form.Group className="form-group">
                <Form.Label>Options</Form.Label>
                <Form.Check
                  type="switch"
                  label="Start from oldest"
                  {...register('oldest')}
                />
              </Form.Group>
              <Form.Group className="form-group">
                <Form.Label>Contains text</Form.Label>
                <Form.Control type="text" {...register('contains')} />
              </Form.Group>
              <Form.Group className="form-group">
                <Form.Label>Date range</Form.Label>
                <ButtonGroup>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const after = new Date();
                      after.setHours(0, 0, 0);
                      const before = new Date();
                      before.setHours(23, 59, 59);

                      setValue('after', after);
                      setValue('before', before);
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const after = new Date();
                      after.setHours(0, 0, 0);
                      after.setDate(after.getDate() - after.getDay());
                      const before = new Date(after);
                      before.setHours(23, 59, 59);
                      before.setDate(after.getDate() + 7);

                      setValue('after', after);
                      setValue('before', before);
                    }}
                  >
                    Week
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const after = new Date();
                      after.setHours(0, 0, 0);
                      after.setDate(1);
                      const before = new Date();
                      before.setHours(23, 59, 59);
                      before.setMonth(before.getMonth() + 1, 0);

                      setValue('after', after);
                      setValue('before', before);
                    }}
                  >
                    Month
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const after = new Date();
                      after.setHours(0, 0, 0);
                      after.setMonth(0);
                      after.setDate(1);
                      const before = new Date();
                      before.setHours(23, 59, 59);
                      before.setFullYear(before.getFullYear() + 1);
                      before.setMonth(0, 0);

                      setValue('after', after);
                      setValue('before', before);
                    }}
                  >
                    Year
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setValue('after', null);
                      setValue('before', null);
                    }}
                  >
                    All
                  </Button>
                </ButtonGroup>
                <div className="date-range">
                  <div>
                    <label htmlFor="after">Start date</label>
                    <Controller
                      control={control}
                      name="after"
                      render={({ field }) => (
                        <ReactDatePicker
                          isClearable
                          showTimeSelect
                          timeFormat="p"
                          timeIntervals={15}
                          dateFormat="Pp"
                          onChange={(date) => field.onChange(date)}
                          selected={field.value}
                          id="after"
                          placeholderText="Click to select date..."
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label htmlFor="before">End date</label>
                    <Controller
                      control={control}
                      name="before"
                      render={({ field }) => (
                        <ReactDatePicker
                          isClearable
                          showTimeSelect
                          timeFormat="p"
                          timeIntervals={15}
                          dateFormat="Pp"
                          onChange={(date) => field.onChange(date)}
                          selected={field.value}
                          id="before"
                          placeholderText="Click to select date..."
                        />
                      )}
                    />
                  </div>
                </div>
              </Form.Group>
              <Form.Group className="form-group form-group-contains">
                <Form.Label>Contains</Form.Label>
                <Controller
                  control={control}
                  name="has"
                  render={({ field }) => (
                    <ButtonGroup>
                      {hasValues.map((v) => (
                        <Button
                          active={field.value === v.value}
                          key={v.value}
                          variant="secondary"
                          className="ibtn"
                          size="sm"
                          onClick={() => {
                            field.onChange(v.value);
                          }}
                        >
                          {v.icon} {v.label}
                        </Button>
                      ))}
                    </ButtonGroup>
                  )}
                />
              </Form.Group>
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
          <Button variant="primary" onClick={confirmPurge}>
            Purge
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default observer(Purge);
