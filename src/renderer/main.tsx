import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';
import { installOperatorInput, installOutputInput } from './input';
import { Output } from './Output';
import { startSync, useStore } from './store';

const root = createRoot(document.getElementById('root')!);
const isOutput = new URLSearchParams(location.search).get('view') === 'output';

if (isOutput) {
  document.body.classList.add('output');
  installOutputInput();
  root.render(<Output />);
} else {
  useStore.getState().init().then(() => {
    const { info, settings } = useStore.getState();
    document.documentElement.lang = settings.language;
    document.body.classList.add(`platform-${info.platform}`);
    document.title = `CariPrompt ${info.version}`;
    installOperatorInput();
    startSync();
    window.cari.onFlushRequest(async () => {
      try {
        await useStore.getState().flush();
      } finally {
        window.cari.flushDone();
      }
    });
    root.render(<App />);
  });
}
