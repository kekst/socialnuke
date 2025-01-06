import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { LinkContainer } from 'react-router-bootstrap';
import { BsPlus, BsPeopleFill } from 'react-icons/bs';
import { useStore } from '../../Store';
import { Platform, PlatformTarget } from '../platforms/types';
import TargetList from './TargetList';

export interface Channel {
  id: string;
  name: string;
  type: number;
  accountId: string;
}

function TargetSelector({
  onTargetSelected,
  platform,
}: {
  onTargetSelected: (target?: PlatformTarget) => void;
  platform: Platform;
}) {
  const store = useStore();

  const [selected, setSelected] = useState<string>();
  const [selectedFirst, setSelectedFirst] = useState<PlatformTarget>();
  const [selectedSecond, setSelectedSecond] = useState<PlatformTarget>();

  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<string>(platform.targetTypes[0].key);
  const [targets, setTargets] = useState<PlatformTarget[]>([]);
  const [children, setChildren] = useState<PlatformTarget[]>();
  const [error, setError] = useState<string | undefined>();

  const changeType = (type: 'channel' | 'guild') => {
    setSelectedFirst(undefined);
    setSelectedSecond(undefined);
    setType(type);
  };

  useEffect(() => {
    if (!selected || !type) {
      setTargets([]);
      return;
    }

    const acc = store.accounts.find(
      (acc) => acc.platform === platform.key && acc.id === selected
    );
    if (acc) {
      platform
        .withToken(acc.token)
        .then((actor) => actor.targets(type))
        .then((res) => {
          if (res.type === 'ok') {
            setTargets(res.result);
          }
        })
        .catch(() => {});
    }
  }, [selected, type, platform, store, setTargets]);

  useEffect(() => {
    setSelectedSecond(undefined);
    setChildren([]);
    if (!selectedFirst?.children || !selected) {
      return;
    }

    const acc = store.accounts.find(
      (acc) => acc.platform === platform.key && acc.id === selected
    );
    if (acc) {
      selectedFirst
        .children()
        .then((res) => {
          if (res.type === 'ok') {
            setChildren(res.result);
          }
        })
        .catch(() => {});
    }
  }, [selectedFirst, selected, store, setChildren, platform]);

  useEffect(() => {
    onTargetSelected(selectedSecond || selectedFirst);
  }, [selectedFirst, selectedSecond, onTargetSelected]);

  const accounts = store.accounts.filter(
    (account) => account.platform === platform.key
  );

  return (
    <>
      <Col xs={6}>
        <div className="accounts">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => {
                setSelectedFirst(undefined);
                setSelected(acc.id);
              }}
              className={`account ${acc.id === selected ? 'active' : ''}`}
            >
              {acc.iconUrl && (
                <img src={acc.iconUrl} className="target-icon" alt={acc.name} />
              )}
              {acc.name}
            </button>
          ))}
          {accounts.length > 0 || <p>No accounts added.</p>}
          <button onClick={() => store.openLogin(platform.key)}>
            <BsPlus />
            Add
          </button>
          <LinkContainer to="/accounts">
            <button>
              <BsPeopleFill />
              Manage
            </button>
          </LinkContainer>
        </div>
        <Tabs activeKey={type} onSelect={(k) => changeType(k as any)}>
          {platform.targetTypes.map((type) => (
            <Tab key={type.key} eventKey={type.key} title={type.name} />
          ))}
        </Tabs>
        {loading ? <Alert variant="info">Loading...</Alert> : null}
        {!selected ? (
          <Alert variant="info">Select an account first.</Alert>
        ) : null}
        {error ? (
          <Alert variant="danger">
            <b>Error:</b> {error}
          </Alert>
        ) : null}

        <Container style={{ padding: 0 }}>
          <Row>
            <Col xs={selectedFirst?.children ? 6 : 12}>
              <TargetList
                targets={targets}
                onTargetSelected={setSelectedFirst}
                selectedTarget={selectedFirst}
              />
            </Col>
            {selectedFirst?.children && children && (
              <Col xs={6}>
                <TargetList
                  targets={children}
                  onTargetSelected={setSelectedSecond}
                  selectedTarget={selectedSecond}
                />
              </Col>
            )}
          </Row>
        </Container>
      </Col>
    </>
  );
}

export default observer(TargetSelector);
