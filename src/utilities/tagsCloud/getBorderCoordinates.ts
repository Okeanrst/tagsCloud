import { PositionedTagRectT } from 'types/types';

type BorderCoordinatesT = {
  top: number;
  bottom: number;
  right: number;
  left: number;
};

export function getBorderCoordinates(tagsData: ReadonlyArray<PositionedTagRectT>): null | BorderCoordinatesT {
  const firstTagData = tagsData.find((tagData) => Boolean(tagData));

  if (!firstTagData) {
    return null;
  }

  let maxTop: number;
  let minBottom: number;
  let maxRight: number;
  let minLeft: number;

  ({ rectTop: maxTop, rectBottom: minBottom, rectLeft: minLeft, rectRight: maxRight } = firstTagData);

  tagsData.forEach((tagData) => {
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
