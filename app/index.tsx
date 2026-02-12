import React, { Fragment } from 'react';
import { render } from 'react-dom';
import App from './components/App';
import ErrorBoundary from './components/ErrorBoundary';
import './app.global.css';
import loadTheme from './utils/theme';

let AppContainer = Fragment;
if (process.env.NODE_ENV === 'development') {
  try {
    const { AppContainer: HotContainer } = require('react-hot-loader');
    AppContainer = HotContainer;
  } catch (e) {
    // react-hot-loader not available in production
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();

  render(
    <AppContainer>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </AppContainer>,
    document.getElementById('root')
  )
});
