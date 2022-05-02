import { createRoot } from 'react-dom/client';
import { configure } from 'mobx';
import App from './src/App';
import { StoreProvider } from './Store';
import './index.scss';
configure({
  enforceActions: 'never',
});

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <StoreProvider>
    <App />
  </StoreProvider>
);
