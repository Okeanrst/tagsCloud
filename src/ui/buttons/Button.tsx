import React from 'react';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';

export type PropsT = {
  children: React.ReactNode;
  tabIndex?: number;
  onClick?: () => void;
  disabled?: boolean;
  classes?: {
    root?: string;
  },
  type?: 'submit' | 'reset' | 'button';
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
    backgroundColor: 'transparent',
    appearance: 'none',
    cursor: 'pointer',
    '&:disabled': {
      cursor: 'default',
    }
  }
});

export const Button = ({ children, tabIndex, disabled, onClick, classes, type = 'button' }: PropsT) => {
  const ownClasses = useStyles();
  return (
    <button
      className={cx(classes?.root, ownClasses.root)}
      disabled={disabled}
      tabIndex={tabIndex}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
