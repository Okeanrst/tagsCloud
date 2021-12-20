import {
  TagDataT,
  PreparedTagDataT,
  PositionedTagRectT,
  PositionedTagSvgDataT,
} from 'types/types';

export type PrepareDataOptionsT = {
  minFontSize?: number;
  maxFontSize?: number;
  fontFamily?: string;
};

export type BorderCoordinatesT = {
  top: number;
  bottom: number;
  right: number;
  left: number;
};

export type ViewBoxT = [number, number, number, number];

const DEFAULT_MIN_FONT_SIZE = 6;
const DEFAULT_MAX_FONT_SIZE = 36;

export function prepareData(
  data: ReadonlyArray<TagDataT>,
  options: PrepareDataOptionsT = {},
): ReadonlyArray<PreparedTagDataT> {
  const {
    minFontSize = DEFAULT_MIN_FONT_SIZE,
    maxFontSize = DEFAULT_MAX_FONT_SIZE,
  } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return [];
  }

  let minSentimentScore: number = Infinity;
  let maxSentimentScore: number = -Infinity;
  data.forEach(item => {
    if (
      minSentimentScore > item.sentimentScore ||
      minSentimentScore === undefined
    ) {
      minSentimentScore = item.sentimentScore;
    }
    if (
      maxSentimentScore < item.sentimentScore ||
      maxSentimentScore === undefined
    ) {
      maxSentimentScore = item.sentimentScore;
    }
  });

  const fontSizeToSentimentScoreRatio =
    (maxFontSize - minFontSize) / (maxSentimentScore - minSentimentScore);

  return data.map(item => {
    const fontSize = Number.isFinite(fontSizeToSentimentScoreRatio)
      ? minFontSize +
        Math.round(
          (item.sentimentScore - minSentimentScore) *
            fontSizeToSentimentScoreRatio,
        )
      : minFontSize + (maxFontSize - minFontSize) / 2;

    return {
      ...item,
      fontSize,
      color: getRandomRGBColor(),
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

export function getTagsSvgData(
  data: ReadonlyArray<PositionedTagRectT>,
): {
  transform: string;
  viewBox: ViewBoxT;
  aspectRatio: number;
  data: ReadonlyArray<PositionedTagSvgDataT>;
} | null {
  const borderCoordinates = getBorderCoordinates(data);

  if (!borderCoordinates) {
    return null;
  }

  const {
    top: borderTop,
    bottom: borderBottom,
    right: borderRight,
    left: borderLeft,
  } = borderCoordinates;

  const positionedTagSvgData = data.map(tagData => {
    const diffX = tagData.rectRight - tagData.rectLeft;
    const diffY = tagData.rectTop - tagData.rectBottom;
    const middleX = tagData.rectLeft + diffX / 2;
    const middleY = tagData.rectBottom + diffY / 2;

    const rectTranslateX = tagData.rotate
      ? (middleX - diffX * 0.3)
      : middleX;
    const rectTranslateY = tagData.rotate
      ? -middleY
      : -(middleY - diffY * 0.3);

    return {
      ...tagData,
      rectTranslateX,
      rectTranslateY,
      adaptFontSize: tagData.fontSize,
    };
  });

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
    data: positionedTagSvgData,
  };
}

function getRandomRGBColor(): string {
  let r = Math.round(Math.random() * 0xff);
  let g = Math.round(Math.random() * 0xff);
  let b = Math.round(Math.random() * 0xff);
  return `rgb(${r}, ${g}, ${b})`;
}
