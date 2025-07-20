import React, { useState, useEffect, useRef, useCallback } from 'react';
import { makeStyles } from '@material-ui/core';
import throttle from 'lodash.throttle';

const useStyles = makeStyles({
  wrapper: {
    width: '100%',
    flexGrow: 12,
  },
});

export function withRestScreenHeight<T extends { restScreenHeight: number }>(
  WrappedComponent: React.ComponentType<T>,
): React.ComponentType<
  Omit<T, 'restScreenHeight'> & { restScreenHeight?: never }
> {
  return function (props) {
    const [height, setHeight] = useState<number>(0);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const classes = useStyles();

    const { children } = props;

    const calcRestScreenHeight = useCallback((): number => {
      if (!wrapperRef.current) {
        return 0;
      }

      const { top, bottom } = wrapperRef.current.getBoundingClientRect();
      return bottom - top;
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleResize = useCallback(throttle((): void => {
      setHeight(calcRestScreenHeight());
    }, 500), [calcRestScreenHeight]);

    useEffect(() => {
      setHeight(calcRestScreenHeight());
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        handleResize.cancel();
      };
    }, [handleResize, calcRestScreenHeight]);

    const nextProps = { ...props, restScreenHeight: height } as T;
    return (
      <div
        className={classes.wrapper}
        ref={wrapperRef}
      >
        <WrappedComponent {...nextProps}>
          {children}
        </WrappedComponent>
      </div>
    );
  };
}
