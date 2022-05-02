import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Bar from './Bar';
import { observer } from 'mobx-react-lite';
import HomeQueue from './home/Queue';
import HomeHome from './home/Home';
import DiscordHome from './discord/Home';
import DiscordPurge from './discord/Purge';
import HomeAccounts from './home/Accounts';
import Queue from './Queue';

function App() {
  return (
    <Router>
      <Bar />
      <Queue />
      <Routes>
        <Route path="/discord/purge" element={<DiscordPurge />} />
        <Route path="/discord" element={<DiscordHome />} />
        <Route path="/accounts" element={<HomeAccounts />} />
        <Route path="/queue" element={<HomeQueue />} />
        {/* <Route path="/" element={<HomeHome />} /> */}
        <Route index element={<DiscordPurge />} />
      </Routes>
    </Router>
  );
}

export default observer(App);
