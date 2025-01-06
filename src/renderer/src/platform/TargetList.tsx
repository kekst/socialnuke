import React, { useState } from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import { PlatformTarget } from '../platforms/types';

export interface Channel {
  id: string;
  name: string;
  type: number;
  accountId: string;
}

export default function TargetList({
  targets,
  selectedTarget,
  onTargetSelected,
}: {
  targets: PlatformTarget[];
  selectedTarget?: PlatformTarget;
  onTargetSelected: (target: PlatformTarget) => void;
}) {
  //todo on loading
  const [search, setSearch] = useState<string>('');

  return (
    <>
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
              className="item-target"
              key={target.id}
              onClick={() => {
                onTargetSelected(target);
              }}
              active={target.id === selectedTarget?.id}
              disabled={target.disabled}
            >
              {target.icon}
              {target.iconUrl && (
                <img
                  src={target.iconUrl}
                  className="target-icon"
                  alt={target.name}
                />
              )}
              <span className="item-name">{target.name}</span>
              {/* <span className="item-flags">
                {target.canDeleteAll ? <BsShieldShaded /> : ''}
              </span> */}
            </ListGroup.Item>
          ))}
      </ListGroup>
    </>
  );
}
