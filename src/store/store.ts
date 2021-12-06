import configureProdStore from './configureStore.prod';
import configureDevStore from './configureStore.dev';

const configureStore =
  process.env.NODE_ENV === 'production'
    ? configureProdStore
    : configureDevStore;

export const store = configureStore();
