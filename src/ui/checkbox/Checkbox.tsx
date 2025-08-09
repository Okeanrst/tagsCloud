import React, { ChangeEventHandler, useRef } from 'react';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    '-webkit-tap-highlight-color': 'transparent',
  },
  checkboxInner: {
    position: 'relative',
    width: 20,
    height: 20,
    order: 1,
  },
  input: {
    appearance: 'none',
    display: 'block',
    width: 20,
    height: 20,
    margin: 0,
    padding: 0,
    border: '1px solid var(--checkbox-bd)',
    borderRadius: 4,
    backgroundColor: 'var(--checkbox-bg)',
    transition: 'border-color .1s ease, background-color .1s ease',
    cursor: 'default',
    '&:checked': {
      borderColor: 'var(--checkbox-color)',
      backgroundColor: 'var(--checkbox-color)',
    },
    '&:disabled': {
      cursor: 'not-allowed',
      borderColor: 'var(--disabled-bd)',
      backgroundColor: 'var(--disabled-bg)',
    },
  },
  labelWrapper: {
    display: 'inline-flex',
    flexDirection: 'column',
    fontSize: 14,
    lineHeight: '20px',
    cursor: 'default',
    order: 2,
  },
  label: {
    cursor: 'default',
    color: 'inherit',
    paddingInlineStart: 12,
    paddingInlineEnd: 12,
  },
  checkMarkIcon: {
    position: 'absolute',
    inset: 0,
    width: '60%',
    margin: 'auto',
    color: 'var(--checkbox-icon-color)',
    pointerEvents: 'none',
    transform: 'matrix(0.5, 0, 0, 0.5, 0, 5)',
    opacity: 0,
    transition: 'transform .1s ease, opacity .1s ease',
  },
  checkMarkIconChecked: {
    opacity: 1,
    transform: 'none',
  },
});

export type PropsT = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  name?: string;
  label?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  classes?: Partial<ReturnType<typeof useStyles>>;
};

export const Checkbox = ({ label = '', classes, ...restProps }: PropsT) => {
  const { current: inputId } = useRef(`${Math.random()}`);
  const ownClasses = useStyles();
  const { checked } = restProps;
  return (
    <div className={ownClasses.root}>
      <div className={ownClasses.checkboxInner} data-label-position="right">
        <input {...restProps} className={ownClasses.input} id={inputId} type="checkbox" />
        <svg
          aria-hidden="true"
          className={cx(ownClasses.checkMarkIcon, { [ownClasses.checkMarkIconChecked]: checked })}
          fill="none"
          viewBox="0 0 10 7"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="M4 4.586L1.707 2.293A1 1 0 1 0 .293 3.707l3 3a.997.997 0 0 0 1.414 0l5-5A1 1 0 1 0 8.293.293L4 4.586z"
            fill="currentColor"
            fillRule="evenodd"
          />
        </svg>
      </div>
      <div className={ownClasses.labelWrapper}>
        <label className={ownClasses.label} htmlFor={inputId}>
          {label}
        </label>
      </div>
    </div>
  );
};
