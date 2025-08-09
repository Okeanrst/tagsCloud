import React from 'react';
import cx from 'classnames';
import { makeStyles, Theme } from '@material-ui/core';
import { MainButton, MainButtonPropsT } from './MainButton';

type PropsT = MainButtonPropsT & {
  borderColor?: string;
  color?: string;
};

const useStyles = makeStyles<
  Theme,
  {
    borderColor?: string;
    color?: string;
  }
>({
  root: {
    padding: '7px 21px',
    border: ({ borderColor = 'var(--primary-main-color)' }) => `1px solid ${borderColor}`,
    color: ({ color = 'var(--primary-main-color)' }) => color,
  },
});

export const OutlinedButton = ({ children, classes, borderColor, color, ...restProps }: PropsT) => {
  const ownClasses = useStyles({ borderColor, color });
  return (
    <MainButton {...restProps} classes={{ root: cx(classes?.root, ownClasses.root) }}>
      {children}
    </MainButton>
  );
};
