import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Wrapper from './wrapper';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MantineProvider >
      <Wrapper />
    </MantineProvider>
  </React.StrictMode>
);

