import cx from 'classnames';
import { makeStyles } from '@material-ui/core';
import React, { useId } from 'react';
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

type PropsT = Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>, 'ref'> & {
  classes?: Partial<ReturnType<typeof useStyles>>;
  options: { value: string; label: string }[];
  label?: string;
  helperText?: string | null;
};

export const SelectFormField = ({ options, classes, label, helperText, id: idProp, ...restProps }: PropsT) => {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;
  const ownClasses = useStyles();
  return (
    <FormControl className={cx(ownClasses.root, classes?.root)}>
      {label ? (
        <label className={cx(ownClasses.label, classes?.label)} htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <Select {...restProps} classes={{ root: classes?.select }} id={inputId} options={options} />
      <div className={cx(ownClasses.helperText, classes?.helperText)}>{helperText}</div>
    </FormControl>
  );
};
