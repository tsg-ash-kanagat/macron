import darkMode from 'antd/dist/antd.dark.css?url';
import lightMode from 'antd/dist/antd.css?url';
import store from './store';

const styleSheet = () => document.getElementById('theme');

export const getTheme = () => store.get('theme', 'dark');

const getStyleSheet = theme => (theme === 'dark' ? darkMode : lightMode);

export const applyTheme = theme => {
  store.set('theme', theme);
  if (typeof document !== 'undefined') {
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }
  const tag = styleSheet();
  if (tag) {
    tag.setAttribute('href', getStyleSheet(theme));
  }
};

export default () => applyTheme(getTheme());
