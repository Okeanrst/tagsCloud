import React, { useState, useEffect, useRef, useCallback } from 'react';

export function withRestScreenHeight<T extends { restScreenHeight: number }>(
  WrappedComponent: React.ComponentType<T>,
): React.ComponentType<
  Omit<T, 'restScreenHeight'> & { restScreenHeight?: never }
> {
  return function (props) {
    const [height, setHeight] = useState<number>(0);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const resizeTaskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    const { children } = props;

    const calcRestScreenHeight = useCallback((): number => {
      if (!wrapperRef.current) {
        return 0;
      }

      const node = wrapperRef.current;

      const { top } = node.getBoundingClientRect();
      const scrollTop = document.documentElement.scrollTop;
      const screenHeight = document.documentElement.clientHeight;
      const restScreenHeight = screenHeight - (scrollTop + top);
      return restScreenHeight > 0 ? restScreenHeight : 0;
    }, []);

    const handleResize = useCallback((): void => {
      const recalculateState = () => {
        resizeTaskTimerRef.current = null;
        const nextHeight = calcRestScreenHeight();

        if (height !== nextHeight) {
          setHeight(nextHeight);
        }
      };

      const delay = 500;

      if (!resizeTaskTimerRef.current) {
        resizeTaskTimerRef.current = setTimeout(recalculateState, delay);
      }
    }, [height, calcRestScreenHeight]);

    useEffect(() => {
      setHeight(calcRestScreenHeight());

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);

        resizeTaskTimerRef.current && clearTimeout(resizeTaskTimerRef.current);
      };
    }, [handleResize, calcRestScreenHeight]);

    const nextProps = { ...props, restScreenHeight: height };
    return (
      <div ref={wrapperRef}>
        <WrappedComponent {...nextProps}>
          {children}
        </WrappedComponent>
      </div>
    );
  };
}
