import { FontFamilies } from 'constants/index';
import { getFontYFactor } from 'utilities/common/getFontYFactor';
import { getBorderCoordinates } from './getBorderCoordinates';
import {
  PositionedTagRectT,
  PositionedTagSvgDataT,
  RectPositionT,
} from 'types/types';

export type ViewBoxT = [number, number, number, number];

export function calcTagSvgData(
  tagData: Pick<PositionedTagRectT, 'rotate' | 'glyphsXOffset' | 'glyphsYOffset'> & RectPositionT,
  yFactor: number
) {
  const diffX = tagData.rectRight - tagData.rectLeft;
  const diffY = tagData.rectTop - tagData.rectBottom;
  const middleX = tagData.rectLeft + diffX / 2;
  const middleY = tagData.rectBottom + diffY / 2;
  const { glyphsXOffset, glyphsYOffset } = tagData;

  const rectTranslateX = tagData.rotate ? middleX - diffX * yFactor + glyphsYOffset : middleX + glyphsXOffset;
  const rectTranslateY = tagData.rotate ? -middleY + glyphsXOffset : -(middleY - diffY * yFactor) + glyphsYOffset;

  return {
    rectTranslateX,
    rectTranslateY,
  };
}

export function getTagsSvgData(data: ReadonlyArray<PositionedTagRectT>, { fontFamily }: {fontFamily: FontFamilies}): {
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
    return { ...tagData, ...calcTagSvgData(tagData, yFactor) };
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
