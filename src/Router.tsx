import React from 'react';
import { Route, Switch } from 'react-router-dom';

import HomePage from 'containers/HomePage';
import { NotFoundPage } from 'components/NotFoundPage';
import TagInformation from 'containers/TagInformation';
import TagsListEditor from 'containers/tagsListEditor/TagsListEditor';
import Layout from 'components/Layout';

const Router = () => {
  return (
    <div>
      <Switch>
        <Layout>
          <Route exact path="/" component={HomePage} />
          <Route exact path="/notFound" component={NotFoundPage} />
          <Route exact path="/tagsListEditor" component={TagsListEditor} />
          <Route path="/tag/:id" component={TagInformation} />
        </Layout>
        <Route component={NotFoundPage} />
      </Switch>
    </div>
  );
};

export default Router;
