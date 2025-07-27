/**
 * Mocking client-server processing
 */

import data from './data.json';

import { TagDataT } from 'types/types';

const TIMEOUT = 0;

export function getData(): Promise<ReadonlyArray<TagDataT>> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), TIMEOUT);
  });
}
