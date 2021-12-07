import React from 'react';
import RootModal from './RootModal';
import cx from 'classnames';

type PropsT = {
  children?: React.ReactNode;
  className: string;
  style?: React.CSSProperties;
};

const ModalWindowLayout = ({ children, className, style }: PropsT) => (
  <RootModal>
    <div
      className={cx('modalWindowLayout', { [className]: !!className })}
      onClick={e => e.stopPropagation()}
      style={style}
    >
      {children}
    </div>
  </RootModal>
);

export default ModalWindowLayout;
