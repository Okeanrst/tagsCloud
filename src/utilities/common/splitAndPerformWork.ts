const delay0 = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, 0);
  });

export function splitAndPerformWork<T>(
  workGenerator: () => Generator<T>,
  { allowedDuration = 50, onProgress }: { allowedDuration: number; onProgress?: () => void },
): Promise<T[]> {
  return new Promise(async (resolve, reject) => {
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
      while (!done) {
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
    } catch (e) {
      reject(e);
    }
  });
}
