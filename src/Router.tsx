import React from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

import TagsCloud from 'pages/TagsCloud';
import { NotFoundPage } from 'components/NotFoundPage';
import TagInformation from 'pages/TagInformation';
import TagsListEditor from 'pages/tagsListEditor/TagsListEditor';
import { Layout } from 'components/Layout';

const Router = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          element={<TagsCloud navigate={navigate} />}
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
        <Route
          element={<NotFoundPage />}
          path="*"
        />
      </Route>
    </Routes>
  );
};

export default Router;
