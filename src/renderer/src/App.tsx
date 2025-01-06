import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { ToastContainer } from 'react-toastify';
import Nav from 'react-bootstrap/Nav';
import { LinkContainer } from 'react-router-bootstrap';
import { BsPeopleFill, BsListCheck, BsDiscord } from 'react-icons/bs';
import 'react-toastify/dist/ReactToastify.css';

import HomeQueue from './home/Queue';
import Purge from './platform';
import HomeAccounts from './home/Accounts';
import Queue from './Queue';
import { platforms } from './platforms';

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
            {Object.values(platforms).map((platform) => (
              <LinkContainer to={`${platform.key}`} key={platform.key}>
                <Nav.Link>
                  {platform.icon} {platform.name}
                </Nav.Link>
              </LinkContainer>
            ))}
          </Nav>
        </div>
        <div>
          <Routes>
            {Object.values(platforms).map((platform) => (
              <Route
                key={platform.key}
                path={`${platform.key}`}
                element={<Purge platform={platform} />}
              />
            ))}
            <Route path="/accounts" element={<HomeAccounts />} />
            <Route path="/queue" element={<HomeQueue />} />
          </Routes>
        </div>
      </div>
      <ToastContainer />
    </Router>
  );
}

export default observer(App);
