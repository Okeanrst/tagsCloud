import defaultDataSet from './defaultDataSet.json';
import { DATA_SETS } from 'constants/index';

import { TagDataT } from 'types/types';

const LOADERS_BY_DATA_SET: Partial<Record<DATA_SETS, () => Promise<{ default: ReadonlyArray<TagDataT> }>>> = {
  [DATA_SETS.SMALL_200]: () => import('./200tags.json'),
  [DATA_SETS.BIG_500]: () => import('./500tags.json'),
};

export async function getData(dataSet: DATA_SETS): Promise<ReadonlyArray<TagDataT>> {
  if (!Object.values(DATA_SETS).includes(dataSet)) {
    throw new Error('invalid data set name');
  }
  if (dataSet === DATA_SETS.DEFAULT) {
    return Promise.resolve(defaultDataSet);
  }

  const loader = LOADERS_BY_DATA_SET[dataSet];
  if (!loader) {
    throw new Error('invalid data set name');
  }
  const { default: jsonData } = await loader();
  return jsonData;
}
