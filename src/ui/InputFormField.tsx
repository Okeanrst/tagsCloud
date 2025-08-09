import React, { useRef } from 'react';
import cx from 'classnames';
import { makeStyles } from '@material-ui/core';
import { FormControl } from './FormControl';
import { Input } from './Input';

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
  const ownClasses = useStyles();
  return (
    <FormControl className={cx(ownClasses.root, classes?.root)}>
      {label ? (
        <label className={cx(ownClasses.label, classes?.label)} htmlFor={inputIdRef.current}>
          {label}
        </label>
      ) : null}
      <Input className={cx(ownClasses.input, classes?.input)} id={inputIdRef.current} {...restProps} ref={null} />
      <div className={cx(ownClasses.helperText, classes?.helperText)}>{helperText}</div>
    </FormControl>
  );
};
