import { FONT_FAMILY } from 'constants/index';

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

const DEFAULT_MIN_FONT_SIZE = 6;
const DEFAULT_MAX_FONT_SIZE = 36;

export function prepareData(
  data: ReadonlyArray<TagDataT>,
  options: PrepareDataOptionsT = {},
): ReadonlyArray<PreparedTagDataT> {
  const {
    minFontSize = DEFAULT_MIN_FONT_SIZE,
    maxFontSize = DEFAULT_MAX_FONT_SIZE,
    fontFamily = FONT_FAMILY,
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

  const ratio =
    (maxFontSize - minFontSize) / (maxSentimentScore - minSentimentScore);

  //TODO use opentype.js
  const fontSizeFactor = 1.1;

  return data.map(item => {
    const fontSize =
      minFontSize +
      Math.round((item.sentimentScore - minSentimentScore) * ratio);

    ctx.font = `${fontSize}px "${fontFamily}"`;
    const measure = ctx.measureText(item.label);

    return {
      ...item,
      fontSize,
      width: measure.width,
      height: fontSize * fontSizeFactor,
      fill: getRandomRGBColor(),
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
  allowedWidth: number,
): {
  transform: string;
  viewBox: string;
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

  const scale = allowedWidth / (borderRight - borderLeft);

  /*data.forEach(item => {
    item.rectTranslateX = (item.rectLeft) * scale;
    if (item.rotate) {
      item.rectTranslateY = -(item.rectBottom + item.height) * scale
    } else {
      item.rectTranslateY = -(item.rectBottom ) * scale;
    }

    item.adaptFontSize = item.fontSize * scale;
  });*/

  const positionedTagSvgData = data.map(tagData => {
    const diffX = tagData.rectRight - tagData.rectLeft;
    const diffY = tagData.rectTop - tagData.rectBottom;
    const middleX = tagData.rectLeft + diffX / 2;
    const middleY = tagData.rectBottom + diffY / 2;

    const rectTranslateX = tagData.rotate
      ? (middleX - diffX * 0.3) * scale
      : middleX * scale;
    const rectTranslateY = tagData.rotate
      ? -middleY * scale
      : -(middleY - diffY * 0.3) * scale;

    const adaptFontSize = tagData.fontSize * scale;

    return {
      ...tagData,
      rectTranslateX,
      rectTranslateY,
      adaptFontSize,
    };
  });

  const maxRight = borderRight * scale;
  const minLeft = borderLeft * scale;
  const minBottom = borderBottom * scale;
  const maxTop = borderTop * scale;

  const sceneWidth = maxRight - minLeft;
  const sceneHeight = maxTop - minBottom;

  return {
    transform: `translate(${-minLeft}, ${maxTop})`,
    viewBox: `0 0 ${sceneWidth} ${sceneHeight}`,
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
