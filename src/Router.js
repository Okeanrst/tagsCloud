import React from 'react';
import { Route, Switch } from 'react-router-dom';

import HomePage from './containers/HomePage';
import NotFoundPage from './components/NotFoundPage';
import TagInformation from './containers/TagInformation';
import Layout from './components/Layout';


const Router = () => {
  return (
    <div>
      <Switch>
        <Route exact path="/" component={HomePage}/>
        <Route exact path="/notFound" component={NotFoundPage}/>
        <Route
          path='/:id'
          render={(props) => <Layout><TagInformation {...props} /></Layout>}
        />
        <Route component={NotFoundPage}/>
      </Switch>
    </div>
  )
}

export default Router
