import { AbortError } from '../errors/AbortError';

const delay0 = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, 0);
  });

export async function splitAndPerformWork<T>(
  workGenerator: () => Generator<T>,
  {
    allowedDuration = 50,
    onProgress,
    signal,
  }: { allowedDuration: number; onProgress?: () => void; signal?: AbortSignal },
): Promise<T[]> {
  signal?.throwIfAborted();

  const iterable = workGenerator();
  const values: T[] = [];

  let lastYieldTime = Date.now();
  let nextValue: T | undefined = undefined;

  while (true) {
    if (signal?.aborted) {
      throw new AbortError();
    }

    const { done, value } = iterable.next(nextValue);

    if (done) break;

    const result = typeof value === 'function' ? value() : value;
    onProgress?.();
    values.push(result);

    nextValue = result;

    if (Date.now() - lastYieldTime >= allowedDuration) {
      await delay0();
      lastYieldTime = Date.now();
    }
  }

  return values;
}
