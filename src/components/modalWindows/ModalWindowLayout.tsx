import React, { useCallback, useRef } from 'react';
import cx from 'classnames';
import { makeStyles } from '@material-ui/core';
import RootModal from './RootModal';

type PropsT = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onBackdropClick?: (e: React.SyntheticEvent<EventTarget>) => void;
};

const useStyles = makeStyles({
  root: {
    width: '100%',
    height: '100%',
    position: 'fixed',
    left: 0,
    top: 0,
    backgroundColor: '#80808080',
    zIndex: 1001,
  }
});

const ModalWindowLayout = ({ children, className, style, onBackdropClick }: PropsT) => {
  const classes = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  const onClick = useCallback(
    (e: React.SyntheticEvent<EventTarget>) => {
      if (!onBackdropClick) {
        return;
      }
      if (!(e.target instanceof HTMLElement)) {
        return;
      }
      if (e.target !== containerRef.current) {
        return;
      }
      onBackdropClick(e);
    },
    [onBackdropClick],
  );
  return (
    <RootModal>
      <div
        className={cx(classes.root, className)}
        ref={containerRef}
        style={style}
        onClick={onClick}
      >
        {children}
      </div>
    </RootModal>
  );
};

export default ModalWindowLayout;
