import React from 'react';
import cx from 'classnames';
import getDisplayName from 'react-display-name';
import ModalWindowLayout from './ModalWindowLayout';

type PropsT = {
  layoutClassName?: string;
  layoutStyle?: React.CSSProperties;
};

export function withModalWindowLayout<P>({
  layoutStyle,
  layoutClassName,
}: PropsT = {}) {
  return (WrappedComponent: React.ComponentType<P>) => {
    const EnhancedComponent = (props: P) => (
      <React.Fragment>
        <ModalWindowLayout
          className={cx('smallModalWindowLayout', {
            [layoutClassName ?? '']: !!layoutClassName,
          })}
          key="layout"
          style={layoutStyle}
        />
        <WrappedComponent {...props} />
      </React.Fragment>
    );
    if (process.env.NODE_ENV !== 'production') {
      EnhancedComponent.displayName = `withModalWindowLayout(${getDisplayName(
        WrappedComponent,
      )})`;
    }
    return EnhancedComponent;
  };
}
