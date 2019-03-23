import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import {Provider} from 'react-redux';
import {BrowserRouter} from 'react-router-dom';
import Router from './Router';
import configureStore from './redux/store/configureStore';
import loadFont from './redux/actions/loadFont';

const store = configureStore();

store.dispatch(loadFont());

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Provider store={store}>
          <Router/>
        </Provider>
      </BrowserRouter>
    );
  }
}
export default App;
