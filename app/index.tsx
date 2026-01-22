import React, { Fragment } from 'react';
import { render } from 'react-dom';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import App from './components/App';
import ErrorBoundary from './components/ErrorBoundary';
import './app.global.css';
import loadTheme from './utils/theme';

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

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
