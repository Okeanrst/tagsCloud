import defaultDataSet from './defaultDataSet.json';
import { DATA_SETS } from 'constants/index';

import { TagDataT } from 'types/types';

const FILE_NAME_BY_DATA_SET = {
  [DATA_SETS.SMALL_200]: '200tags.json',
  [DATA_SETS.BIG_500]: '500tags.json',
};

export async function getData(dataSet: DATA_SETS): Promise<ReadonlyArray<TagDataT>> {
  if (!Object.values(DATA_SETS).includes(dataSet)) {
    throw new Error('invalid data set name');
  }
  if (dataSet === DATA_SETS.DEFAULT) {
    return Promise.resolve(defaultDataSet);
  }
  const { default: jsonData } = await import(`./${FILE_NAME_BY_DATA_SET[dataSet]}`);
  return jsonData;
}
