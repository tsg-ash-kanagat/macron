import React from 'react';
import { render } from 'react-dom';
import App from './components/App';
import ErrorBoundary from './components/ErrorBoundary';
import './app.global.css';
import loadTheme from './utils/theme';

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();

  render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
    document.getElementById('root')
  );
});
