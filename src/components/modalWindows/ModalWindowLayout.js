import React from 'react';
import RootModal from './RootModal';
import PropTypes from 'prop-types';
import cx from 'classnames';

const ModalWindowLayout = ({children, className, style}) => (
  <RootModal>
    <div
      className={cx('modalWindowLayout', {[className]: !!className})}
      onClick={e => e.stopPropagation()}
      style={style}
    >
      {children}
    </div>
  </RootModal>
)

ModalWindowLayout.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
};

ModalWindowLayout.defaultProps = {
  style: {},
};

export default ModalWindowLayout;