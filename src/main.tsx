import React from 'react';
import ReactDOM from 'react-dom/client';

// Fontsource — ships the @font-face declarations for Rubik + Arvo.
// `embed.css` then wires `--font-rubik` / `--font-arvo` to the loaded
// families. Weights match `RUBIK_CONFIG` / `ARVO_CONFIG` in
// `@vox-pop/design-tokens/fonts`.
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/arvo/400.css';
import '@fontsource/arvo/700.css';

import './embed.css';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
