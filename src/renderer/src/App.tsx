import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { ToastContainer } from 'react-toastify';
import Nav from 'react-bootstrap/Nav';
import { LinkContainer } from 'react-router-bootstrap';
import { BsPeopleFill, BsListCheck, BsDiscord } from 'react-icons/bs';
import 'react-toastify/dist/ReactToastify.css';

import HomeQueue from './home/Queue';
import DiscordPurge from './discord/Purge';
import HomeAccounts from './home/Accounts';
import Queue from './Queue';

function App() {
  return (
    <Router>
      <Queue />
      <div className="main">
        <div className="main-nav">
          <h3>socialnuke</h3>
          <Nav variant="pills" className="flex-column">
            <LinkContainer to="/accounts">
              <Nav.Link>
                <BsPeopleFill /> Accounts
              </Nav.Link>
            </LinkContainer>
            <LinkContainer to="/queue">
              <Nav.Link>
                <BsListCheck /> Queue
              </Nav.Link>
            </LinkContainer>

            <Nav.Item className="nav-section">
              <span>Purge</span>
            </Nav.Item>
            <LinkContainer to="/discord/purge">
              <Nav.Link>
                <BsDiscord /> Discord
              </Nav.Link>
            </LinkContainer>
          </Nav>
        </div>
        <div>
          <Routes>
            <Route path="/discord/purge" element={<DiscordPurge />} />
            <Route path="/accounts" element={<HomeAccounts />} />
            <Route path="/queue" element={<HomeQueue />} />
            <Route index element={<DiscordPurge />} />
          </Routes>
        </div>
      </div>
      <ToastContainer />
    </Router>
  );
}

export default observer(App);
