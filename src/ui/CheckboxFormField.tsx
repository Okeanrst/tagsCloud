import React from 'react';
import cx from 'classnames';
import { makeStyles } from '@material-ui/core';
import { Checkbox, PropsT as CheckboxPropsT } from './checkbox/Checkbox';
import { FormControl } from './FormControl';

const useStyles = makeStyles({
  root: {},
  helperText: {},
});

type PropsT = CheckboxPropsT & {
  classes?: Partial<ReturnType<typeof useStyles>>;
  helperText?: string | null;
};

export const CheckboxFormField = ({ classes, helperText, ...restProps }: PropsT) => {
  const ownClassed = useStyles();
  return (
    <FormControl className={cx(ownClassed.root, classes?.root)}>
      <Checkbox {...restProps} />
      <div className={cx(ownClassed.helperText, classes?.helperText)}>{helperText}</div>
    </FormControl>
  );
};
