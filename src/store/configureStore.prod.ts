import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers';

import { RootStateT } from './types';

const configureStore = (preloadedState?: RootStateT) =>
  createStore(rootReducer, preloadedState, applyMiddleware(thunk));

export default configureStore;
