'use strict';

import React from 'react'
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import {withRouter} from 'react-router-dom';

const Layout = ({children, location}) => {
  const { useCanvas = false } = queryString.parse(location.search);
  let to = '/';
  if (useCanvas) {
    to += '?' + queryString.stringify({useCanvas: true});
  }
  return (
    <div className="row" >
      <div><Link to={to} >HomePage</Link></div>
      {children}
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.object.isRequired
}

export default withRouter(Layout);