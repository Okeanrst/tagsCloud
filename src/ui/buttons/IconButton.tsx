import React from 'react';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';
import { MainButton, MainButtonPropsT } from './MainButton';

const useStyles = makeStyles({
  root: {
    minWidth: 'initial!important',
    padding: 0,
    border: 0,
  },
});

export const IconButton = ({ children, classes, ...restProps }: MainButtonPropsT) => {
  const ownClasses = useStyles();
  return (
    <MainButton classes={{ root: cx(classes?.root, ownClasses.root) }} {...restProps}>
      {children}
    </MainButton>
  );
};
