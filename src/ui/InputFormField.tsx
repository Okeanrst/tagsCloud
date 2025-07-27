import React, { useRef } from 'react';
import cx from 'classnames';
import { makeStyles } from '@material-ui/core';
import { FormControl } from './FormControl';

const useStyles = makeStyles({
  root: {},
  label: {
    marginBottom: '4px',
  },
  input: {},
  helperText: {},
});

type PropsT = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  classes?: Partial<ReturnType<typeof useStyles>>;
  label?: string;
  helperText?: string | null;
};

export const InputFormField = ({ classes, label, helperText, ...restProps }: PropsT) => {
  const inputIdRef = useRef(`${Math.random()}`);
  const ownClassed = useStyles();
  return (
    <FormControl className={cx(ownClassed.root, classes?.root)}>
      {label ? (
        <label className={cx(ownClassed.label, classes?.label)} htmlFor={inputIdRef.current}>
          {label}
        </label>
      ) : null}
      <input className={cx(ownClassed.input, classes?.input)} id={inputIdRef.current} {...restProps} />
      <div className={cx(ownClassed.helperText, classes?.helperText)}>{helperText}</div>
    </FormControl>
  );
};
