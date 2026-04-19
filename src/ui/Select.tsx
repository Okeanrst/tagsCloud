import cx from 'classnames';
import React from 'react';
import { makeStyles } from '@material-ui/core';

type PropsT = React.ComponentPropsWithoutRef<'select'> & {
  ref?: React.Ref<HTMLSelectElement>;
  classes?: Partial<ReturnType<typeof useStyles>>;
  options: { value: string; label: string }[];
};

const useStyles = makeStyles({
  root: {
    appearance: 'none',
    width: '100%',
    height: 44,
    border: '1px solid var(--input-bd)',
    borderRadius: 4,
    paddingInlineStart: 14,
    paddingInlineEnd: 14,
    paddingTop: 0,
    paddingBottom: 0,
    lineHeight: '40px',
    fontSize: '16px',
    color: 'var(--input-color)',
    textAlign: 'left',
    backgroundColor: 'var(--input-bg)',
    outline: 'none',
    transition: 'border-color .1s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#228be6',
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.6,
      backgroundColor: 'var(--disabled-bg)',
      color: 'var(--input-disabled-color)',
    },
  },
  option: {},
});

export function Select({ classes, options, ref, ...restProps }: PropsT) {
  const ownClasses = useStyles();
  return (
    <select className={cx(ownClasses.root, classes?.root)} ref={ref} {...restProps}>
      {options.map(({ value, label: optionLabel }) => (
        <option className={cx(ownClasses.option, classes?.option)} key={value} value={value}>
          {optionLabel}
        </option>
      ))}
    </select>
  );
}
