import React, { useEffect, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import { LinkContainer } from 'react-router-bootstrap';
import { useStore } from '../../Store';
import { getGuildChannels, getOfType } from '../../DiscordAPI';

export interface Target {
  id: string;
  name: string;
  accountId: string;
  canDeleteAll: boolean;
  iconUrl?: string;
  channelId?: string; //for guilds only
  type: 'channel' | 'guild';
}

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

  const getTargets = useCallback(
    async (token: string, type: 'channel' | 'guild') => {
      setLoading(true);
      const targets = (await getOfType(token, type)).map((x) => {
        if (type === 'channel') {
          x.name = x.recipients.reduce(
            (acc: string, y: any, i: number) =>
              (i != 0 ? acc + ', ' : '') + y.username + '#' + y.discriminator,
            ''
          );
          x.canDeleteAll = false;
        } else {
          x.canDeleteAll = (parseInt(x.permissions) & 0x2000) === 0x2000;
        }

        x.type = type;
        x.accountId = selected;

        return x;
      });

      setTargets(targets);
      setLoading(false);
    },
    [setLoading, setTargets, selected]
  );

  const getGC = useCallback(
    async (token: string, guildId: string) => {
      setLoading(true);
      setSelectedChannel(undefined);

      const channels = await getGuildChannels(token, guildId);

      setChannels(channels);
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
      <Col xs={2}>
        <h3>Account:</h3>
        <ListGroup>
          {store.discordAccounts.map((acc) => (
            <ListGroup.Item
              action
              key={acc.id}
              onClick={() => setSelected(acc.id)}
              active={acc.id === selected}
              disabled={loading}
            >
              {acc.iconUrl && <img src={acc.iconUrl} className="target-icon" />}
              {acc.name}
            </ListGroup.Item>
          ))}
          {store.discordAccounts.length > 0 || <p>No accounts added.</p>}
        </ListGroup>
        <p style={{ paddingTop: '10px' }}>
          <Button variant="primary" onClick={() => store.openDiscordLogin()}>
            Add
          </Button>
          <LinkContainer to="/accounts">
            <Button variant="primary">Manage</Button>
          </LinkContainer>
        </p>
      </Col>
      <Col xs={2}>
        <h3>Type:</h3>
        <ListGroup>
          <ListGroup.Item
            action
            onClick={() => changeType('channel')}
            active={type === 'channel'}
            disabled={loading}
          >
            DMs
          </ListGroup.Item>
          <ListGroup.Item
            action
            onClick={() => changeType('guild')}
            active={type === 'guild'}
            disabled={loading}
          >
            Guild messages
          </ListGroup.Item>
        </ListGroup>
      </Col>
      <Col xs={type === 'guild' ? 3 : 6}>
        <h3>{type === 'guild' ? 'Guild' : 'User'}:</h3>
        {!selected ? <p>Select an account first.</p> : null}
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
                key={target.id}
                onClick={() => {
                  setSelectedTarget(target.id);
                  onTargetSelected(target);
                }}
                active={target.id === selectedTarget}
                disabled={loading}
              >
                {target.iconUrl && (
                  <img src={target.iconUrl} className="target-icon" />
                )}
                {target.name} {target.canDeleteAll ? <b>(M)</b> : ''}
              </ListGroup.Item>
            ))}
        </ListGroup>
      </Col>
      {type === 'guild' && (
        <Col xs={3}>
          <h3>Channel:</h3>
          <Form.Control
            type="text"
            value={searchChannel}
            onChange={(e) => setSearchChannel(e.target.value)}
            placeholder="Search"
          />
          <ListGroup>
            <ListGroup.Item
              action
              onClick={() => {
                setSelectedChannel(undefined);
                onTargetSelected({
                  ...targets.find((target) => target.id === selectedTarget)!,
                  channelId: undefined,
                });
              }}
              active={!selectedChannel}
              disabled={loading}
            >
              <b>ALL CHANNELS</b>
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
                  {channel.name}
                </ListGroup.Item>
              ))}
          </ListGroup>
        </Col>
      )}
    </>
  );
}

export default observer(TargetSelector);
