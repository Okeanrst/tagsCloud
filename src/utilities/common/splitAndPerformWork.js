// @flow

export default function(generateWorks: Generator, allowedDuration: number = 50) {
  return new Promise(async function(resolve, reject) {
    const iterable = generateWorks();
    const getAndPerformWork = () => {
      const {done, value} = iterable.next();
      if (done) {
        return {done: true};
      } else {
        const res = typeof value === 'function' ? value() : value;
        return {done: false, value: res};
      }
    };
    const withDelay = () => (new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(getAndPerformWork());
        } catch (err) {
          reject(err);
        }
      }, 0);
    }));

    let restTime = allowedDuration;
    const start = Date.now();
    const values = [];

    try {
      let {done, value} = getAndPerformWork();

      while(!done) {
        values.push(value);
        const spent = Date.now() - start;
        if (spent >= restTime) {
          restTime = allowedDuration;
          ({done, value} = await withDelay());
        } else {
          restTime = restTime - spent;
          ({done, value} = getAndPerformWork());
        }
      }
      resolve(values);
    } catch (e) {
      reject(e);
    }
  });
}