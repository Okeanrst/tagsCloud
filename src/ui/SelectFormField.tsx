import cx from 'classnames';
import { makeStyles } from '@material-ui/core';
import React, { useRef } from 'react';
import { FormControl } from './FormControl';
import { Select } from './Select';

const useStyles = makeStyles({
  root: {},
  label: {
    marginBottom: '4px',
  },
  select: {},
  option: {},
  helperText: {},
});

type PropsT = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLSelectElement>, HTMLSelectElement> & {
  classes?: Partial<ReturnType<typeof useStyles>>;
  options: { value: string; label: string }[];
  label?: string;
  helperText?: string | null;
};

export const SelectFormField = ({ options, classes, label, helperText, ref, ...restProps }: PropsT) => {
  const inputIdRef = useRef(`${Math.random()}`);
  const ownClasses = useStyles();
  return (
    <FormControl className={cx(ownClasses.root, classes?.root)}>
      {label ? (
        <label className={cx(ownClasses.label, classes?.label)} htmlFor={inputIdRef.current}>
          {label}
        </label>
      ) : null}
      <Select {...restProps} classes={{ root: classes?.select }} id={inputIdRef.current} options={options} />
      <div className={cx(ownClasses.helperText, classes?.helperText)}>{helperText}</div>
    </FormControl>
  );
};
