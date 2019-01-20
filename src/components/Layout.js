'use strict';

import React from 'react'
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const Layout = ({ children }) => (
  <div className="row" >
    <div><Link to="/" >HomePage</Link></div>
    {children}
  </div>
);

Layout.propTypes = {
  children: PropTypes.node.isRequired,  
}

export default Layout;