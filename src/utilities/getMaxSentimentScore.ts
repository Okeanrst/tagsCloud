import { TagDataT } from 'types/types';

export const getMaxSentimentScore = (tagsData: ReadonlyArray<TagDataT>) => {
  return Math.max(-Infinity, ...tagsData.map(({ sentimentScore }) => sentimentScore));
};
