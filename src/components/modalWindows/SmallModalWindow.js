import React from 'react';
import ModalWindowLayout from './ModalWindowLayout';
import cx from 'classnames';

const SmallModalWindow = (props) => {
  const { layoutStyle, style, className, children } = props;
  return [
    <ModalWindowLayout
      key="layout"
      className={cx('smallModalWindowLayout', {[className]: !!className})}
      style={layoutStyle}
    />,
    <div key="modalWindowContainer" className="modalWindowContainer" >
      <div key="modalWindow" className="smallModalWindow" style={style}>
        {children}
      </div>
    </div>
  ];
}

export default SmallModalWindow;