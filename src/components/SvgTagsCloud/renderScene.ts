import { clamp } from 'utilities/helpers/clamp';
import { ScaleT } from 'types/types';

export type RenderSceneT = { left: number; top: number; width: number; height: number };

// RenderScene parameter are normalized; number from 0 to 1
// where left, width is a fraction of the full width (no scale) of the scene
// where top, height is a fraction of the full height (no scale) of the scene

const getDefaultRenderScene = (): RenderSceneT => ({ left: 0, top: 0, width: 1, height: 1 });

export const getNextRenderScene = ({
  originSceneAspectRatio,
  nextSceneAspectRatio,
  renderScene: rawRenderScene,
  scale,
  nextScale,
}: {
  originSceneAspectRatio: number;
  nextSceneAspectRatio: number;
  renderScene: RenderSceneT | null;
  scale: ScaleT | null;
  nextScale: ScaleT | null;
}): RenderSceneT => {
  if (!nextScale || nextScale.value === 1) {
    return getDefaultRenderScene();
  }

  const { value: scaleValue = 1 } = scale ?? {};
  const {
    value: nextScaleValue,
    point: { relativeX: nextPointX, relativeY: nextPointY },
  } = nextScale;

  const renderScene = rawRenderScene ?? getDefaultRenderScene();

  if (scaleValue === nextScaleValue) {
    // 1. move mode
    const { point: { relativeX: pointX = 0.5, relativeY: pointY = 0.5 } = {} } = scale ?? {};
    const { left, top, width, height } = renderScene;
    const getNextPosition = ({
      currentPosition,
      diff,
      size,
    }: {
      currentPosition: number;
      diff: number;
      size: number;
    }) => clamp(currentPosition + size * diff, 0, 1 - size);
    return {
      ...renderScene,
      left: getNextPosition({ currentPosition: left, size: width, diff: nextPointX - pointX }),
      top: getNextPosition({ currentPosition: top, size: height, diff: nextPointY - pointY }),
    };
  }

  // 2. scale mode

  // nextScale point is inside current renderScene
  // so its position (in current renderScene coordinate system) must be transformed to no scale Scene coordinate system
  const { left, top, width, height } = renderScene;
  const noScaleNextPoint = {
    x: left + width * nextPointX,
    y: top + height * nextPointY,
  };

  // scale factor
  let nextWidth = 1 / nextScaleValue;
  let nextHeight = 1 / nextScaleValue;

  // aspect ratio change factor
  // kind of scale due to aspect ratio change
  const aspectRatioChangeFactor = nextSceneAspectRatio / originSceneAspectRatio;
  // base size obtained by scaling don't change
  // we increase one of the sides, the one that increased due to the change in aspect ratio
  if (aspectRatioChangeFactor > 1) {
    // scene becomes wider
    nextWidth = nextWidth * aspectRatioChangeFactor;
  } else if (aspectRatioChangeFactor < 1) {
    // scene becomes higher
    nextHeight = nextHeight / aspectRatioChangeFactor;
  }

  const getFramePosition = ({ pointPosition, ratio, size }: { pointPosition: number; ratio: number; size: number }) => {
    // before point from left to right
    const beforePointSize = size * ratio;
    return clamp(pointPosition - beforePointSize, 0, 1);
  };
  return {
    left: getFramePosition({ pointPosition: noScaleNextPoint.x, ratio: nextPointX, size: nextWidth }),
    top: getFramePosition({ pointPosition: noScaleNextPoint.y, ratio: nextPointY, size: nextHeight }),
    width: nextWidth,
    height: nextHeight,
  };
};
