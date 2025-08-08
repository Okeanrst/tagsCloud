import './globalStyles.css';
import 'sanitize.css';
import 'sanitize.css/forms.css';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Notifications } from 'components/Notifications';
import { store } from 'store/store';
import { loadFont } from 'store/actions/loadFont';
import { ThemeProvider } from 'contexts/ThemeContext';
import Router from './Router';

loadFont()(store.dispatch, store.getState);

export const App = () => {
  return (
    <BrowserRouter>
      <Provider store={store}>
        <ThemeProvider>
          <Router />
          <Notifications />
        </ThemeProvider>
      </Provider>
    </BrowserRouter>
  );
};
