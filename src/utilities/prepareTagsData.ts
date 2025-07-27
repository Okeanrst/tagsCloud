import { PreparedTagDataT, TagDataT } from 'types/types';

type PrepareDataOptionsT = {
  minFontSize: number;
  maxFontSize: number;
  maxSentimentScore: number;
};

export function prepareTagsData(
  tagsData: ReadonlyArray<TagDataT>,
  options: PrepareDataOptionsT,
): ReadonlyArray<PreparedTagDataT> {
  const { minFontSize, maxFontSize, maxSentimentScore } = options;

  const fontSizeRation = minFontSize / maxFontSize;
  const minSentimentScoreThreshold = maxSentimentScore * fontSizeRation;

  return tagsData.map((tagData) => {
    const { sentimentScore } = tagData;
    const fontSize =
      sentimentScore <= minSentimentScoreThreshold
        ? minFontSize
        : Math.round((maxFontSize * sentimentScore) / maxSentimentScore);

    return {
      ...tagData,
      fontSize,
    };
  });
}
