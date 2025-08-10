import React, { useRef } from 'react';
import cx from 'classnames';
import { makeStyles } from '@material-ui/core';
import { FormControl } from './FormControl';
import { Input } from './Input';
import { NumberInput } from './NumberInput';

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

export const InputFormField = ({ classes, label, helperText, ref, ...restProps }: PropsT) => {
  const inputIdRef = useRef(`${Math.random()}`);
  const ownClasses = useStyles();
  const { type } = restProps;
  const InputComponent = type === 'number' ? NumberInput : Input;
  return (
    <FormControl className={cx(ownClasses.root, classes?.root)}>
      {label ? (
        <label className={cx(ownClasses.label, classes?.label)} htmlFor={inputIdRef.current}>
          {label}
        </label>
      ) : null}
      <InputComponent className={cx(ownClasses.input, classes?.input)} id={inputIdRef.current} {...restProps} />
      <div className={cx(ownClasses.helperText, classes?.helperText)}>{helperText}</div>
    </FormControl>
  );
};
