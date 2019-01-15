'use strict';

import React, { Component } from 'react';
//import 'bootstrap/dist/css/bootstrap.css'
import {Provider} from 'react-redux';
import {BrowserRouter} from 'react-router-dom';
import Router from './Router';
import configureStore from './redux/store/configureStore';

const store = configureStore();

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

export default App