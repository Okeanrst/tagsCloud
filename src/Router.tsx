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
    <div>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage navigate={navigate} />} />
          <Route path="/notFound" element={<NotFoundPage />} />
          <Route path="/tagsListEditor" element={<TagsListEditor />} />
          <Route path="/tag/:id" element={<TagInformation />} />
        </Route>
        <Route element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};

export default Router;
