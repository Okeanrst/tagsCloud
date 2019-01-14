import {createStore, applyMiddleware, compose} from 'redux';
import thunk from 'redux-thunk';
import {createLogger} from 'redux-logger';
import rootReducer from '../reducers';

const configureStore = preloadedState => {
  const middleware = [thunk, createLogger()];
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  const store = createStore(
  	rootReducer,
  	preloadedState,
  	composeEnhancers(applyMiddleware(...middleware))
  );  

  return store;
}

export default configureStore;
