import React, { useRef } from 'react';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';

type PropsT = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  className?: string;
  label?: string;
  placeholder?: string;
};

const useStyles = makeStyles({
  input: {
    display: 'none',
  },
  label: {
    display: 'inline-block',
    fontSize: 14,
    fontWeight: 500,
    wordBreak: 'break-word',
    cursor: 'default',
    '-webkit-tap-highlight-color': 'transparent',
  },
  buttonWrapper: {
    position: 'relative',
    cursor: 'pointer',
  },
  buttonWrapperMarginTop: {
    marginTop: 5,
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

export const FileInput = ({ className, label, placeholder, ...restProps }: PropsT) => {
  const ownClasses = useStyles();
  const { current: buttonId } = useRef(`${Math.random()}`);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={className}>
      <input {...restProps} className={ownClasses.input} ref={inputRef} type="file" />
      <div>
        {label ? (
          <label className={ownClasses.label} htmlFor={buttonId}>
            {label}
          </label>
        ) : null}
        <div className={cx(ownClasses.buttonWrapper, { [ownClasses.buttonWrapperMarginTop]: label })}>
          <button
            className={ownClasses.button}
            id={buttonId}
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
      </div>
    </div>
  );
};
