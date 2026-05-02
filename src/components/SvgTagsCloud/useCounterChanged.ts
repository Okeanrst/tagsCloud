import { RefObject, useEffect, useRef } from 'react';

export const useCounterChanged = ({
  counter,
  callbackRef,
}: {
  counter: number;
  callbackRef: RefObject<() => void>;
}) => {
  const counterRef = useRef(counter);

  useEffect(() => {
    if (counter !== counterRef.current) {
      counterRef.current = counter;
      callbackRef.current();
    }
  }, [counter, callbackRef]);
};
