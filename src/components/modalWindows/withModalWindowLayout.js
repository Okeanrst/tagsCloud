import React from 'react';
import ModalWindowLayout from './ModalWindowLayout';
import cx from 'classnames';
import getDisplayName from 'react-display-name';

export default function withModalWindowLayout({layoutStyle, layoutClassName} = {}) {
  return (Component) => {
    const WrappedComponent = ({children, ...props}) => (
      <React.Fragment>
        <ModalWindowLayout
          key="layout"
          className={cx('smallModalWindowLayout', {[layoutClassName]: !!layoutClassName})}
          style={layoutStyle}
        />
        <Component {...props} >{children}</Component>
      </React.Fragment>
    );
    if (process.env.NODE_ENV !== 'production') {
      WrappedComponent.displayName = `withModalWindowLayout(${getDisplayName(Component)})`;
    }
    return WrappedComponent;
  };
}
