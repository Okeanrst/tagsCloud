import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="container">
      <h4>404 Page Not Found</h4>
      <Link to="/"> Go back to homepage </Link>
    </div>
  );
};
