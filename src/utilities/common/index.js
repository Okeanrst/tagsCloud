export function iterateAsync(iterable, allowedDuration = 50) {
  return new Promise(async function(resolve, reject) {
    const withDelay = () => (new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const res = iterable.next();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      }, 0);
    }));

    let restTime = allowedDuration;
    const start = Date.now();
    const values = [];

    let {done, value} = iterable.next();

    while(!done) {
      values.push(value);
      const spent = Date.now() - start;
      if (spent >= restTime) {
        restTime = allowedDuration;
        ({done, value} = await withDelay());        
      } else {
        restTime = restTime - spent;
        ({done, value} = iterable.next());        
      }
    }
    resolve(values);    
  });
}