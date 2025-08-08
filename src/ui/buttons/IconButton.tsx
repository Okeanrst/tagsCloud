import React from 'react';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';

type PropsT = {
  children: React.ReactNode;
  tabIndex?: number;
  onClick?: () => void;
  disabled?: boolean;
  classes?: {
    root?: string;
  };
  type?: 'submit' | 'reset' | 'button';
};

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    outline: 0,
    border: 0,
    userSelect: 'none',
    verticalAlign: 'middle',
    backgroundColor: 'transparent',
    appearance: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    '&:disabled': {
      cursor: 'default',
    },
  },
});

export const IconButton = ({ children, tabIndex, disabled, onClick, classes, type = 'button' }: PropsT) => {
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
