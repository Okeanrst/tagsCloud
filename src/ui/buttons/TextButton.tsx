import React from 'react';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';
import { MainButton, MainButtonPropsT } from './MainButton';
import { useContainedButtonStyles } from './buttonStyles';

const useStyles = makeStyles({
  root: {
    color: 'var(--primary-main-color)',
  },
});

export const TextButton = ({ children, classes, ...restProps }: MainButtonPropsT) => {
  const ownClasses = useStyles();
  const containedButtonClasses = useContainedButtonStyles();
  return (
    <MainButton classes={{ root: cx(classes?.root, containedButtonClasses.root, ownClasses.root) }} {...restProps}>
      {children}
    </MainButton>
  );
};
