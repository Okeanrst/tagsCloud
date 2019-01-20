export function iterateAsync(iterable, allowedDuration = 50) {
  return new Promise(function(resolve, reject) {
    const values = [];
    let iterationsCount = 0;
    const iterate = (restTime) => {
      const start = Date.now();

      const {done, value} = iterable.next();

      const spent = Date.now() - start;
      if (!done) {
        values.push(value);

        iterationsCount++;

        if (spent >= restTime) {
          setTimeout(iterate, 0, allowedDuration);
        } else {
          iterate(restTime - spent);
        }
      } else if (iterationsCount > 999) {
        reject(new Error('Maximum number of iterations reached'));
      } else {
        resolve(values);
      }
    };

    iterate(allowedDuration);
  });
}