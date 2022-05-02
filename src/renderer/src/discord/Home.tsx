import React from 'react';
import Button from 'react-bootstrap/Button';
import { LinkContainer } from 'react-router-bootstrap';

function Home() {
  return (
    <>
      <div>
        <h1>Discord</h1>
        <p>Perform actions on Discord.</p>
        <p>
          <LinkContainer to="/discord/purge">
            <Button variant="primary">Purge</Button>
          </LinkContainer>
          <LinkContainer to="/discord/dump">
            <Button variant="primary">Dump</Button>
          </LinkContainer>
        </p>
      </div>
    </>
  );
}

export default Home;
