import React from 'react';
import { makeStyles, Theme } from '@material-ui/core';
import cx from 'classnames';
import { Button, PropsT as ButtonPropsT } from './Button';

type PropsT = ButtonPropsT & {
  borderColor?: string;
  color?: string;
};

type OptionsT = {
  borderColor?: string;
  color?: string;
};

const useStyles = makeStyles<Theme, OptionsT>({
  root: {
    border: ({ borderColor = 'var(--primary-main-color)' }) => `1px solid ${borderColor}`,
    color: ({ color = 'var(--primary-main-color)' }) => color,
  }
});

export const OutlinedButton = ({ children, classes, borderColor, color, ...restProps }: PropsT) => {
  const ownClasses = useStyles({ borderColor, color });
  return (
    <Button
      classes={{ root: cx(classes?.root, ownClasses.root) }}
      {...restProps}
    >
      {children}
    </Button>
  );
};
