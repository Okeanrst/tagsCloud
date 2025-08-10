import React from 'react';
import cx from 'classnames';
import { makeStyles } from '@material-ui/core';

export type MainButtonPropsT = {
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
    minWidth: 64,
    userSelect: 'none',
    verticalAlign: 'middle',
    fontSize: 16,
    lineHeight: 1.75,
    borderRadius: '4px',
    appearance: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    '&:disabled': {
      cursor: 'not-allowed',
    },
  },
});

export const MainButton = ({ children, tabIndex, disabled, onClick, classes, type = 'button' }: MainButtonPropsT) => {
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
