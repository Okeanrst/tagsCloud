import { AbortError } from '../errors/AbortError';

const delay0 = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, 0);
  });

export function splitAndPerformWork<T>(
  workGenerator: () => Generator<T>,
  {
    allowedDuration = 50,
    onProgress,
    signal,
  }: { allowedDuration: number; onProgress?: () => void; signal?: AbortSignal },
): Promise<T[]> {
  if (signal?.aborted) {
    return Promise.reject(new AbortError());
  }

  let abortListener: () => void;
  return new Promise(async (resolve, reject) => {
    if (signal) {
      abortListener = () => {
        reject(new AbortError());
      };

      signal.addEventListener('abort', abortListener, { once: true });
    }

    const iterable = workGenerator();
    const getAndPerformWork = (prevValue?: T): { done: false; value: T } | { done: true } => {
      const { done, value } = iterable.next(prevValue);
      if (done) {
        return { done: true };
      } else {
        const res = typeof value === 'function' ? value() : value;
        if (onProgress) {
          onProgress();
        }
        return { done: false, value: res };
      }
    };

    let restTime = allowedDuration;
    const start = Date.now();
    const values = [];

    try {
      let done = false;

      let result;
      while (!done && (!signal || !signal.aborted)) {
        const spent = Date.now() - start;

        let prevCallReturnValue;
        if (result && !result?.done) {
          prevCallReturnValue = result.value;
        }

        if (spent >= restTime) {
          restTime = allowedDuration;

          await delay0();
          result = getAndPerformWork(prevCallReturnValue);
        } else {
          restTime = restTime - spent;

          result = getAndPerformWork(prevCallReturnValue);
        }

        ({ done } = result);

        if (!result.done) {
          values.push(result.value);
        }
      }
      resolve(values);
    } catch (ex) {
      reject(ex);
    }
  }).finally(() => {
    if (signal) {
      signal.removeEventListener('abort', abortListener);
    }
  }) as Promise<T[]>;
}
