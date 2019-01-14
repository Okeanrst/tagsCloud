'use strict';

import React from 'react'
import PropTypes from 'prop-types'

const Layout = ({children}) => (
  <div className="row" >
    {children}
  </div>
)

Layout.propTypes = {
  children: PropTypes.node.isRequired
}

export default Layout;