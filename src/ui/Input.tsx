import React, { forwardRef } from 'react';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';

type PropsT = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  className?: string;
};

const useStyles = makeStyles({
  root: {
    '-webkit-tap-highlight-color': 'transparent',
    appearance: 'none',
    resize: 'none',
    display: 'block',
    width: '100%',
    transition: 'border-color .1s ease',
    textAlign: 'left',
    color: 'var(--input-color)',
    border: '1px solid var(--input-bd)',
    backgroundColor: 'var(--input-bg)',
    height: 44,
    minHeight: 44,
    lineHeight: '40px',
    fontSize: '16px',
    borderRadius: '4px',
    paddingInlineStart: '14px',
    paddingInlineEnd: '14px',
    paddingTop: 0,
    paddingBottom: 0,
    cursor: 'text',
    overflow: 'clip',
    '&:focus': {
      outline: 'none',
      borderColor: '#228be6',
    },
  },
});

export const Input = forwardRef<HTMLInputElement, PropsT>(({ className, ...restProps }, ref) => {
  const ownClasses = useStyles();
  return <input className={cx(ownClasses.root, className)} ref={ref} {...restProps} />;
});
