import { TagDataT } from 'types/types';

export const getMaxSentimentScore = (tagsData: ReadonlyArray<TagDataT>) => {
  let maxSentimentScore: number = -Infinity;

  tagsData.forEach(tagData => {
    if (tagData.sentimentScore > maxSentimentScore) {
      maxSentimentScore = tagData.sentimentScore;
    }
  });

  return maxSentimentScore;
};
