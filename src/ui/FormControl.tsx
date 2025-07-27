import React from 'react';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';

export type PropsT = {
  children: React.ReactNode;
  className?: string;
};

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
});

export const FormControl = ({ children, className }: PropsT) => {
  const ownClasses = useStyles();
  return <div className={cx(ownClasses.root, className)}>{children}</div>;
};
