import React, { forwardRef, useRef, SyntheticEvent } from 'react';
import { makeStyles } from '@material-ui/core';
import cx from 'classnames';
import { Input } from './Input';

type PropsT = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  className?: string;
};

const UP_CONTROL_DIRECTION = 'up';
const DOWN_CONTROL_DIRECTION = 'down';

const useStyles = makeStyles({
  root: {
    position: 'relative',
  },
  controlsWrapper: {
    position: 'absolute',
    zIndex: 1,
    insetInlineEnd: 1,
    bottom: 1,
    top: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    borderRadius: '4px 4px 0 0',
    color: 'var(--dimmed-color)',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: 42,
    maxWidth: 23.8,
    marginInlineStart: 'auto',
  },
  control: {
    appearance: 'none',
    display: 'flex',
    flex: '0 0 50%',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 21,
    padding: 0,
    border: 0,
    borderInlineStart: 'var(--control-border)',
    color: 'var(--primary-text-color)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    touchAction: 'manipulation',
    '-webkit-tap-highlight-color': 'transparent',
    '&:where(:first-of-type)': {
      borderRadius: 0,
      borderStartEndRadius: 3,
    },
    '&:disabled': {
      color: 'var(--input-disabled-color)',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },
  chevronIcon: {
    width: 14,
    height: 14,
  },
  chevronIconRotated: {
    transform: 'rotate(180deg)',
  },
});

const ChevronIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const valueToInteger = (value?: any) => {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : 0;
  }
  if (typeof value !== 'string') {
    return 0;
  }
  const parsedValue = Number.parseInt(value);
  return (Number.isInteger(parsedValue) && parsedValue) || 0;
};

const getIsChangeDisabled = (value: number, { min, max }: Pick<PropsT, 'min' | 'max'>) => ({
  isDecreaseDisabled: (['number', 'string'].includes(typeof min) && valueToInteger(min) >= value) || false,
  isIncreaseDisabled: (['number', 'string'].includes(typeof max) && value >= valueToInteger(max)) || false,
});

export const NumberInput = forwardRef<HTMLInputElement, PropsT>(({ className, ...restProps }, ref) => {
  const { value, min, max, onChange } = restProps;

  const ownClasses = useStyles();
  const inputRef = useRef<HTMLInputElement>(null);

  const { isDecreaseDisabled, isIncreaseDisabled } = getIsChangeDisabled(valueToInteger(value), { min, max });

  const handleControlClick = (e: SyntheticEvent<HTMLButtonElement>) => {
    if (!onChange || !inputRef.current) {
      return;
    }
    const direction = e.currentTarget.dataset.direction ?? UP_CONTROL_DIRECTION;

    inputRef.current.value = String(valueToInteger(value) + (direction === UP_CONTROL_DIRECTION ? 1 : -1));
    const event = new Event('input', { bubbles: true });
    Object.defineProperty(event, 'target', { value: inputRef.current, enumerable: true });
    onChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className={ownClasses.root}>
      <Input {...restProps} inputMode="numeric" ref={inputRef} style={{ paddingInlineEnd: '24px' }} type="text" />
      <div className={ownClasses.controlsWrapper}>
        <div className={ownClasses.controls}>
          <button
            aria-hidden="true"
            className={ownClasses.control}
            data-direction={UP_CONTROL_DIRECTION}
            disabled={isIncreaseDisabled}
            tabIndex={-1}
            type="button"
            onClick={handleControlClick}
          >
            <ChevronIcon className={cx(ownClasses.chevronIcon, ownClasses.chevronIconRotated)} />
          </button>
          <button
            aria-hidden="true"
            className={ownClasses.control}
            data-direction={DOWN_CONTROL_DIRECTION}
            disabled={isDecreaseDisabled}
            tabIndex={-1}
            type="button"
            onClick={handleControlClick}
          >
            <ChevronIcon className={ownClasses.chevronIcon} />
          </button>
        </div>
      </div>
    </div>
  );
});
