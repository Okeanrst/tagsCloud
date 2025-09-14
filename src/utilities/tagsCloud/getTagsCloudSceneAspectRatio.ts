import { getAspectRatio } from 'utilities/common/getAspectRatio';
import { getBorderCoordinates } from './getBorderCoordinates';
import { PositionedTagRectT } from 'types/types';

export const getTagsCloudSceneAspectRatio = (data: ReadonlyArray<PositionedTagRectT>) => {
  const borderCoordinates = getBorderCoordinates(data);

  if (!borderCoordinates) {
    return null;
  }
  const { top: borderTop, bottom: borderBottom, right: borderRight, left: borderLeft } = borderCoordinates;
  const maxRight = borderRight;
  const minLeft = borderLeft;
  const minBottom = borderBottom;
  const maxTop = borderTop;

  const sceneWidth = maxRight - minLeft;
  const sceneHeight = maxTop - minBottom;

  return getAspectRatio(sceneWidth, sceneHeight);
};
