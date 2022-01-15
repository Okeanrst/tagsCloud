import { Component } from 'react';
import './globalStyles.css';
import 'sanitize.css';
import 'sanitize.css/forms.css';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import Router from './Router';
import { store } from './store/store';
import { loadFont } from './store/actions/loadFont';

loadFont()(store.dispatch, store.getState);

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Provider store={store}>
          <Router />
        </Provider>
      </BrowserRouter>
    );
  }
}
export default App;
