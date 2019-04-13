import React from 'react';
import PropTypes from 'prop-types';

const ModalWindowContainer = ({ children, onClick }) => (
  <div key="modalWindowContainer" className="modalWindowContainer" onClick={onClick} >
    {children}
  </div>
);

ModalWindowContainer.propTypes = {
  onClick: PropTypes.func,
};

export default ModalWindowContainer;