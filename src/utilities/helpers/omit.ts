export function omit<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K>;
export function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K>;
export function omit<T extends object, K extends keyof T>(obj: T, ...keysOrArr: [readonly K[]] | K[]): Omit<T, K> {
  const keys = (Array.isArray(keysOrArr[0]) ? keysOrArr[0] : keysOrArr) as readonly K[];
  const result = {} as Omit<T, K>;

  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (!keys.includes(key as K)) {
      Object.assign(result, { [key]: obj[key] });
    }
  }

  return result;
}
