import React from 'react';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';

export type PropsT = {
  children: React.ReactNode;
  tabIndex?: number;
  onClick: () => void;
  disabled?: boolean;
  classes?: {
    root?: string;
  },
};

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '64px',
    padding: '6px 8px',
    outline: 0,
    border: 0,
    userSelect: 'none',
    verticalAlign: 'middle',
    lineHeight: 1.75,
    borderRadius: '4px',
    backgroundColor: 'transparent'
  }
});

export const Button = ({ children, tabIndex, disabled, onClick, classes }: PropsT) => {
  const ownClasses = useStyles();
  return (
    <button
      className={cx(classes?.root, ownClasses.root)}
      disabled={disabled}
      tabIndex={tabIndex}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
