import { useEffect, useRef, MutableRefObject } from 'react';

export function useObjectRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef<T>(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
