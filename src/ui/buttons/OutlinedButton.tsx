import React from 'react';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';
import { Button, PropsT as ButtonPropsT } from './Button';

const useStyles = makeStyles({
  root: {
    border: '1px solid var(--primary-main-color)',
    color: 'var(--primary-main-color)',
  }
});

export const OutlinedButton = ({ children, classes, ...restProps }: ButtonPropsT) => {
  const ownClasses = useStyles();
  return (
    <Button
      classes={{ root: cx(classes?.root, ownClasses.root) }}
      {...restProps}
    >
      {children}
    </Button>
  );
};
