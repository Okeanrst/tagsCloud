import React from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

import HomePage from 'containers/HomePage';
import { NotFoundPage } from 'components/NotFoundPage';
import TagInformation from 'containers/TagInformation';
import TagsListEditor from 'containers/tagsListEditor/TagsListEditor';
import { Layout } from 'components/Layout';

const Router = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          element={<HomePage navigate={navigate} />}
          path="/"
        />
        <Route
          element={<NotFoundPage />}
          path="/notFound"
        />
        <Route
          element={<TagsListEditor />}
          path="/tagsListEditor"
        />
        <Route
          element={<TagInformation />}
          path="/tag/:id"
        />
      </Route>
      <Route element={<NotFoundPage />} />
    </Routes>
  );
};

export default Router;
