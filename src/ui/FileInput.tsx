import React, { useRef } from 'react';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';

type PropsT = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  className?: string;
  placeholder?: string;
};

const useStyles = makeStyles({
  root: {
    position: 'relative',
    cursor: 'pointer',
  },
  input: {
    display: 'none',
  },
  button: {
    appearance: 'none',
    resize: 'none',
    display: 'block',
    width: '100%',
    height: 44,
    minHeight: 44,
    transition: 'border-color .1s ease',
    paddingTop: 0,
    paddingBottom: 0,
    paddingInlineEnd: '14px',
    paddingInlineStart: '14px',
    border: '1px solid var(--input-bd)',
    borderRadius: 4,
    textAlign: 'left',
    lineHeight: '40px',
    fontSize: 16,
    color: 'var(--input-color)',
    backgroundColor: 'var(--input-bg)',
    cursor: 'pointer',
    '-webkit-tap-highlight-color': 'transparent',
  },
  placeholder: {
    color: 'var(--input-placeholder-color)',
  },
});

export const FileInput = ({ className, placeholder, id, ...restProps }: PropsT) => {
  const ownClasses = useStyles();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={cx(ownClasses.root, className)}>
      <input {...restProps} className={ownClasses.input} ref={inputRef} type="file" />
      <button
        className={ownClasses.button}
        id={id}
        type="button"
        onClick={() => {
          if (!inputRef.current) {
            return;
          }
          // reset the value so same file can be picked again
          inputRef.current.value = '';
          inputRef.current.click();
        }}
      >
        {placeholder ? <span className={ownClasses.placeholder}>{placeholder}</span> : null}
      </button>
    </div>
  );
};
