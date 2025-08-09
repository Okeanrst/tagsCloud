import React from 'react';
import cx from 'classnames';
import { MainButton, MainButtonPropsT } from './MainButton';
import { useContainedButtonStyles } from './buttonStyles';

export const Button = ({ children, classes, ...restProps }: MainButtonPropsT) => {
  const containedButtonClasses = useContainedButtonStyles();
  return (
    <MainButton {...restProps} classes={{ root: cx(classes?.root, containedButtonClasses.root) }}>
      {children}
    </MainButton>
  );
};
