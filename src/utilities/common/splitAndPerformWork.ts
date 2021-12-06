export function splitAndPerformWork<T>(
  workGenerator: () => Generator<T>,
  allowedDuration: number = 50,
): Promise<T[]> {
  return new Promise(async (resolve, reject) => {
    const iterable = workGenerator();
    const getAndPerformWork = ():
      | { done: false; value: T }
      | { done: true } => {
      const { done, value } = iterable.next();
      if (done) {
        return { done: true };
      } else {
        const res = typeof value === 'function' ? value() : value;
        return { done: false, value: res };
      }
    };

    const withDelay = (): Promise<ReturnType<typeof getAndPerformWork>> =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            resolve(getAndPerformWork());
          } catch (err) {
            reject(err);
          }
        }, 0);
      });

    let restTime = allowedDuration;
    const start = Date.now();
    const values = [];

    try {
      let done = false;

      while (!done) {
        let result;
        const spent = Date.now() - start;
        if (spent >= restTime) {
          restTime = allowedDuration;
          result = await withDelay();
          ({ done } = result);
        } else {
          restTime = restTime - spent;
          result = getAndPerformWork();
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
