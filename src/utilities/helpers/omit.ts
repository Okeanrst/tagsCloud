export function omit<T, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K>;
export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
export function omit(obj: any, ...keysOrArr: any[]): any {
  const keys = Array.isArray(keysOrArr[0]) ? keysOrArr[0] : keysOrArr;
  const result: any = {};

  for (const key of Object.keys(obj) as Array<keyof typeof obj>) {
    if (!keys.includes(key)) {
      result[key] = obj[key];
    }
  }

  return result;
}
