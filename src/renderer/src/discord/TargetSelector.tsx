import React, { useEffect, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { LinkContainer } from 'react-router-bootstrap';
import {
  BsPlus,
  BsPeopleFill,
  BsVolumeUpFill,
  BsHash,
  BsShieldShaded,
} from 'react-icons/bs';
import { useStore } from '../../Store';
import {
  Target,
  getGuildChannels,
  getOfType,
  getUserName,
} from '../../DiscordAPI';

export interface Channel {
  id: string;
  name: string;
  type: number;
  accountId: string;
}

function TargetSelector({
  onTargetSelected,
}: {
  onTargetSelected: (target: Target) => void;
}) {
  const store = useStore();

  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [selectedTarget, setSelectedTarget] = useState<string>();
  const [selectedChannel, setSelectedChannel] = useState<string>();
  const [type, setType] = useState<'channel' | 'guild'>('channel');
  const [targets, setTargets] = useState<Target[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [search, setSearch] = useState<string>('');
  const [searchChannel, setSearchChannel] = useState<string>('');
  const [error, setError] = useState<string | undefined>();

  const getTargets = useCallback(
    async (token: string, type: 'channel' | 'guild') => {
      setLoading(true);
      setError(undefined);

      try {
        const targets = (await getOfType(token, type)).map((x) => {
          if (type === 'channel') {
            const count = x.recipients?.length || 0;
            const recipients =
              x.recipients?.map(getUserName).join(', ') || '(empty)';
            if (count > 1) {
              x.name = `Group DM: ${x.name} - ${recipients}`;
            } else {
              x.name = recipients;
            }

            x.canDeleteAll = false;
          } else {
            x.canDeleteAll = !x.permissions
              ? false
              : (parseInt(x.permissions) & 0x2000) === 0x2000;
          }

          x.type = type;
          x.accountId = selected;

          return x;
        });

        setTargets(targets as Target[]);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Unknwon error occured.');
        }

        setTargets([]);
      }

      setLoading(false);
    },
    [setLoading, setTargets, selected]
  );

  const getGC = useCallback(
    async (token: string, guildId: string) => {
      setLoading(true);
      setSelectedChannel(undefined);

      try {
        const channels = await getGuildChannels(token, guildId);
        setChannels(channels);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Unknwon error occured.');
        }

        setChannels([]);
      }

      setLoading(false);
    },
    [setLoading, setChannels, setSelectedChannel]
  );

  const changeType = (type: 'channel' | 'guild') => {
    setSelectedTarget(undefined);
    setSelectedChannel(undefined);
    setType(type);
  };

  useEffect(() => {
    if (!selected || !type) {
      setTargets([]);
      return;
    }

    const acc = store.discordAccounts.find((acc) => acc.id === selected);
    if (acc) {
      getTargets(acc.token, type);
    }
  }, [selected, type, getTargets, store]);

  useEffect(() => {
    setSelectedChannel(undefined);
    setChannels([]);
    if (!selectedTarget || !selected || type !== 'guild') {
      return;
    }

    const acc = store.discordAccounts.find((acc) => acc.id === selected);
    if (acc) {
      getGC(acc.token, selectedTarget);
    }
  }, [
    setSelectedChannel,
    setChannels,
    store,
    getGC,
    type,
    selected,
    selectedTarget,
  ]);

  return (
    <>
      <Col xs={6}>
        <div className="accounts">
          {store.discordAccounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => {
                setSelectedTarget(undefined);
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
          {store.discordAccounts.length > 0 || <p>No accounts added.</p>}
          <button onClick={() => store.openDiscordLogin()}>
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
          <Tab eventKey="channel" title="DMs" />
          <Tab eventKey="guild" title="Guild messages" />
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
            <Col xs={type === 'guild' ? 6 : 12}>
              <Form.Control
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
              />
              <ListGroup>
                {targets
                  .filter((target) => {
                    const trim = search.trim().toLowerCase();
                    if (!trim) {
                      return true;
                    }

                    return (
                      target.id.includes(trim) ||
                      target.name.toLowerCase().includes(trim)
                    );
                  })
                  .map((target) => (
                    <ListGroup.Item
                      action
                      className="item-guild"
                      key={target.id}
                      onClick={() => {
                        setSelectedTarget(target.id);
                        onTargetSelected(target);
                      }}
                      active={target.id === selectedTarget}
                      disabled={loading}
                    >
                      {target.iconUrl && (
                        <img
                          src={target.iconUrl}
                          className="target-icon"
                          alt={target.name}
                        />
                      )}
                      <span className="item-name">{target.name}</span>
                      <span className="item-flags">
                        {target.canDeleteAll ? <BsShieldShaded /> : ''}
                      </span>
                    </ListGroup.Item>
                  ))}
              </ListGroup>
            </Col>
            {type === 'guild' && (
              <Col xs={6}>
                <Form.Control
                  type="text"
                  value={searchChannel}
                  onChange={(e) => setSearchChannel(e.target.value)}
                  placeholder="Search"
                />
                <ListGroup>
                  <ListGroup.Item
                    action
                    className="item-channel"
                    onClick={() => {
                      setSelectedChannel(undefined);
                      onTargetSelected({
                        ...targets.find(
                          (target) => target.id === selectedTarget
                        )!,
                        channelId: undefined,
                      });
                    }}
                    active={!selectedChannel}
                    disabled={loading}
                  >
                    <span className="item-name">
                      <b>ALL CHANNELS</b>
                    </span>
                  </ListGroup.Item>
                  {channels
                    .filter((channel) => {
                      const trim = searchChannel.trim().toLowerCase();
                      if (!trim) {
                        return true;
                      }

                      return (
                        channel.id.includes(trim) ||
                        channel.name.toLowerCase().includes(trim)
                      );
                    })
                    .map((channel) => (
                      <ListGroup.Item
                        action
                        className="item-channel"
                        key={channel.id}
                        onClick={() => {
                          setSelectedChannel(channel.id);
                          onTargetSelected({
                            ...targets.find(
                              (target) => target.id === selectedTarget
                            )!,
                            channelId: channel.id,
                          });
                        }}
                        active={channel.id === selectedChannel}
                        disabled={loading || channel.type === 4}
                      >
                        {channel.type === 0 && <BsHash />}
                        {channel.type === 2 && <BsVolumeUpFill />}
                        <span className="item-name">{channel.name}</span>
                      </ListGroup.Item>
                    ))}
                </ListGroup>
              </Col>
            )}
          </Row>
        </Container>
      </Col>
    </>
  );
}

export default observer(TargetSelector);
