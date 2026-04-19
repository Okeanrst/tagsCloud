import { useEffect, useRef, type RefObject } from 'react';

export function useObjectRef<T>(value: T): RefObject<T> {
  const ref = useRef<T>(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
