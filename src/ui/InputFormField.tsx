import React, { useId } from 'react';
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

type PropsT = Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'ref'> & {
  classes?: Partial<ReturnType<typeof useStyles>>;
  label?: string;
  helperText?: string | null;
};

export const InputFormField = ({ classes, label, helperText, id: idProp, ...restProps }: PropsT) => {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;
  const ownClasses = useStyles();
  const { type } = restProps;
  const InputComponent = type === 'number' ? NumberInput : Input;
  return (
    <FormControl className={cx(ownClasses.root, classes?.root)}>
      {label ? (
        <label className={cx(ownClasses.label, classes?.label)} htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <InputComponent className={cx(ownClasses.input, classes?.input)} id={inputId} {...restProps} />
      <div className={cx(ownClasses.helperText, classes?.helperText)}>{helperText}</div>
    </FormControl>
  );
};
