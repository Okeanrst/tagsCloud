import React from 'react';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';
import { Button, PropsT as ButtonPropsT } from './Button';

const useStyles = makeStyles({
  root: {
    color: 'var(--primary-main)',
  }
});

export const LinkButton = ({ children, classes, ...restProps }: ButtonPropsT) => {
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
