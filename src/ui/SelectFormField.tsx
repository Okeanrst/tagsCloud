import cx from 'classnames';
import { makeStyles } from '@material-ui/core';
import React, { useRef } from 'react';
import { FormControl } from './FormControl';

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

export const SelectFormField = ({ options, classes, label, helperText, ...restProps }: PropsT) => {
  const inputIdRef = useRef(`${Math.random()}`);
  const ownClasses = useStyles();
  return (
    <FormControl className={cx(ownClasses.root, classes?.root)}>
      {label ? (
        <label className={cx(ownClasses.label, classes?.label)} htmlFor={inputIdRef.current}>
          {label}
        </label>
      ) : null}
      <select className={cx(ownClasses.select, classes?.select)} id={inputIdRef.current} {...restProps}>
        {options.map(({ value, label: optionLabel }) => (
          <option className={cx(ownClasses.option, classes?.option)} key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
      <div className={cx(ownClasses.helperText, classes?.helperText)}>{helperText}</div>
    </FormControl>
  );
};
