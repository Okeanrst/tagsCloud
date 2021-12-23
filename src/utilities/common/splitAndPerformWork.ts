export function splitAndPerformWork<T>(
  workGenerator: () => Generator<T>,
  allowedDuration: number = 50,
): Promise<T[]> {
  return new Promise(async (resolve, reject) => {
    const iterable = workGenerator();
    const getAndPerformWork = (prevValue?: T): ({ done: false; value: T } | { done: true }) => {
      const { done, value } = iterable.next(prevValue);
      if (done) {
        return { done: true };
      } else {
        const res = typeof value === 'function' ? value() : value;
        return { done: false, value: res };
      }
    };

    const withDelay = (prevValue?: T): Promise<ReturnType<typeof getAndPerformWork>> => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            resolve(getAndPerformWork(prevValue));
          } catch (err) {
            reject(err);
          }
        }, 0);
      });
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

          result = await withDelay(prevCallReturnValue);
          ({ done } = result);
        } else {
          restTime = restTime - spent;

          result = getAndPerformWork(prevCallReturnValue);
          ({ done } = result);
        }
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
