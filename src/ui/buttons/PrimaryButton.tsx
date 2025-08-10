import React from 'react';
import cx from 'classnames';
import { makeStyles } from '@material-ui/core';
import { MainButton, MainButtonPropsT } from './MainButton';
import { useContainedButtonStyles } from './buttonStyles';

const useStyles = makeStyles({
  root: {
    color: 'var(--white-color)',
    backgroundColor: 'var(--primary-main-color)',
    '&:disabled': {
      color: 'var(--input-disabled-color)',
      backgroundColor: 'var(--disabled-bg)',
    },
  },
});

export const PrimaryButton = ({ children, classes, ...restProps }: MainButtonPropsT) => {
  const containedButtonClasses = useContainedButtonStyles();
  const primaryButtonClasses = useStyles();
  return (
    <MainButton
      classes={{ root: cx(classes?.root, primaryButtonClasses.root, containedButtonClasses.root) }}
      {...restProps}
    >
      {children}
    </MainButton>
  );
};
