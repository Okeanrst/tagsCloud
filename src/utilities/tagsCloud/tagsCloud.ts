import { FontFamilies } from 'constants/index';
import { getFontYFactor } from 'utilities/common/getFontYFactor';
import {
  TagDataT,
  PreparedTagDataT,
  PositionedTagRectT,
  PositionedTagSvgDataT,
} from 'types/types';

export type PrepareDataOptionsT = {
  minFontSize: number;
  maxFontSize: number;
  maxSentimentScore: number;
};

export type BorderCoordinatesT = {
  top: number;
  bottom: number;
  right: number;
  left: number;
};

export type ViewBoxT = [number, number, number, number];

type GetTagsSvgDataOptionsT = {fontFamily: FontFamilies};

export function prepareTagsData(
  tagsData: ReadonlyArray<TagDataT>,
  options: PrepareDataOptionsT,
): ReadonlyArray<PreparedTagDataT> {
  const { minFontSize, maxFontSize, maxSentimentScore } = options;

  const fontSizeRation = minFontSize / maxFontSize;
  const minSentimentScoreThreshold = maxSentimentScore * fontSizeRation;

  return tagsData.map(tagData => {
    const { sentimentScore } = tagData;
    const fontSize = sentimentScore <= minSentimentScoreThreshold ? minFontSize : Math.round(maxFontSize * sentimentScore / maxSentimentScore);

    return {
      ...tagData,
      fontSize,
    };
  });
}

export function getBorderCoordinates(
  tagsData: ReadonlyArray<PositionedTagRectT>,
): null | BorderCoordinatesT {
  const firstTagData = tagsData.find(tagData => Boolean(tagData));

  if (!firstTagData) {
    return null;
  }

  let maxTop: number;
  let minBottom: number;
  let maxRight: number;
  let minLeft: number;

  ({
    rectTop: maxTop,
    rectBottom: minBottom,
    rectLeft: minLeft,
    rectRight: maxRight,
  } = firstTagData);

  tagsData.forEach(tagData => {
    if (tagData.rectTop > maxTop || maxTop === undefined) {
      maxTop = tagData.rectTop;
    }

    if (minBottom > tagData.rectBottom || minBottom === undefined) {
      minBottom = tagData.rectBottom;
    }

    if (tagData.rectLeft < minLeft || minLeft === undefined) {
      minLeft = tagData.rectLeft;
    }

    if (maxRight < tagData.rectRight || maxRight === undefined) {
      maxRight = tagData.rectRight;
    }
  });

  return { top: maxTop, bottom: minBottom, right: maxRight, left: minLeft };
}

export function calcTagSvgData(tagData: PositionedTagRectT, yFactor: number) {
  const diffX = tagData.rectRight - tagData.rectLeft;
  const diffY = tagData.rectTop - tagData.rectBottom;
  const middleX = tagData.rectLeft + diffX / 2;
  const middleY = tagData.rectBottom + diffY / 2;
  const { glyphsXOffset, glyphsYOffset } = tagData;

  const rectTranslateX = tagData.rotate ? middleX - diffX * yFactor + glyphsYOffset : middleX + glyphsXOffset;
  const rectTranslateY = tagData.rotate ? -middleY + glyphsXOffset : -(middleY - diffY * yFactor) + glyphsYOffset;

  return {
    ...tagData,
    rectTranslateX,
    rectTranslateY,
  };
}

export function getTagsSvgData(data: ReadonlyArray<PositionedTagRectT>, { fontFamily }: GetTagsSvgDataOptionsT): {
  transform: string;
  viewBox: ViewBoxT;
  aspectRatio: number;
  data: ReadonlyArray<PositionedTagSvgDataT>;
} | null {
  const borderCoordinates = getBorderCoordinates(data);

  if (!borderCoordinates) {
    return null;
  }

  const yFactor = getFontYFactor(fontFamily) - 0.5;

  const positionedTagsSvgData = data.map(tagData => {
    return calcTagSvgData(tagData, yFactor);
  });

  const {
    top: borderTop,
    bottom: borderBottom,
    right: borderRight,
    left: borderLeft,
  } = borderCoordinates;

  const maxRight = borderRight;
  const minLeft = borderLeft;
  const minBottom = borderBottom;
  const maxTop = borderTop;

  const sceneWidth = maxRight - minLeft;
  const sceneHeight = maxTop - minBottom;

  return {
    transform: `translate(${-minLeft}, ${maxTop})`,
    viewBox: [0, 0, sceneWidth, sceneHeight],
    aspectRatio: sceneWidth / sceneHeight,
    data: positionedTagsSvgData,
  };
}
