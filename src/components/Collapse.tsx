import React, { useRef, useState, useEffect } from 'react';
import { makeStyles, Theme } from '@material-ui/core';
import cx from 'classnames';

type OptionsT = { height: number };

type PropsT = {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
};

const useStyles = makeStyles<Theme, OptionsT>({
  root: {
    position: 'relative',
    height: '0px',
    overflow: 'hidden',
    transitionProperty: 'height',
    transitionDuration: '0.5s',
    transitionTimingFunction: 'linear',
  },
  openRoot: {
    transitionDuration: '0.5s',
    height: ({ height }) => `${height}px`,
  },
});

export const Collapse = ({ isOpen, children, className }: PropsT) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);
  const classes = useStyles({ height: isOpen ? height : 0 });

  useEffect(() => {
    const { scrollHeight = 0, offsetTop = 0 } = contentRef.current ?? {};

    setHeight(scrollHeight + offsetTop);
  }, [isOpen]);

  return (
    <div className={cx(className, classes.root, { [classes.openRoot]: isOpen })}>
      <div ref={contentRef}>{children}</div>
    </div>
  );
};
