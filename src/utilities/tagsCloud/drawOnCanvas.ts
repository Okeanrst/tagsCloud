import { FontFamilies } from 'constants/index';
import { getFontYFactor } from 'utilities/common/getFontYFactor';
import { getSuitableSize } from 'utilities/common/getSuitableSize';
import { getAspectRatio } from 'utilities/common/getAspectRatio';
import { getBorderCoordinates } from './getBorderCoordinates';
import { PositionedTagRectT, SizeT, SceneFrameT } from 'types/types';

type OptionsT = {
  fontFamily: FontFamilies;
  drawAxles?: boolean;
  shouldDrawReactAreas: boolean;
};

type ClearParamsT = [number, number, number, number];
type RestoreCoordsT = [number, number];

export function drawOnCanvas({
  data,
  targetCanvas,
  availableSize,
  scale = 1,
  sceneFrame,
  options,
}: {
  data: ReadonlyArray<PositionedTagRectT>;
  targetCanvas: HTMLCanvasElement;
  availableSize: { width: number; height: number };
  scale?: number;
  sceneFrame: SceneFrameT;
  options: OptionsT;
}): {
  clearParams: ClearParamsT;
  restoreCoords: RestoreCoordsT | null;
  sizeFactor: number;
  offsetLeft: number;
  offsetTop: number;
} | null {
  const borderCoordinates = getBorderCoordinates(data);

  if (!borderCoordinates) {
    return null;
  }

  const { top: maxTop, bottom: minBottom, right: maxRight, left: minLeft } = borderCoordinates;

  const sceneWidth = maxRight - minLeft;
  const sceneHeight = maxTop - minBottom;

  const aspectRatio = getAspectRatio(sceneWidth, sceneHeight);

  const { width: targetCanvasWidth, height: targetCanvasHeight } = getSuitableSize({
    availableSize,
    aspectRatio,
    scale,
  });

  if (scale === 1) {
    const drawingSceneResult = drawScene({
      data,
      canvas: targetCanvas,
      canvasSize: { width: targetCanvasWidth, height: targetCanvasHeight },
      options,
    });
    return drawingSceneResult
      ? {
          ...drawingSceneResult,
          offsetLeft: 0,
          offsetTop: 0,
        }
      : null;
  }

  const fullSizeCanvas = document.createElement('canvas');

  const { left: sceneFrameLeft, top: sceneFrameTop, width: sceneFrameWidth, height: sceneFrameHeight } = sceneFrame;
  const fullSizeCanvasWidth = targetCanvasWidth / sceneFrameWidth;
  const fullSizeCanvasHeight = targetCanvasHeight / sceneFrameHeight;

  const drawingSceneResult = drawScene({
    data,
    canvas: fullSizeCanvas,
    // can be quite big
    canvasSize: { width: fullSizeCanvasWidth, height: fullSizeCanvasHeight },
    options,
  });

  if (!drawingSceneResult) {
    return null;
  }

  targetCanvas.width = targetCanvasWidth;
  targetCanvas.height = targetCanvasHeight;

  const targetCTX = targetCanvas.getContext('2d');
  if (!targetCTX) {
    return null;
  }

  targetCTX.drawImage(
    fullSizeCanvas,
    fullSizeCanvasWidth * sceneFrameLeft, // Source X
    fullSizeCanvasHeight * sceneFrameTop, // Source Y
    fullSizeCanvasWidth * sceneFrameWidth, // Source W
    fullSizeCanvasHeight * sceneFrameHeight, // Source H
    0, // Destination X
    0, // Destination Y
    targetCanvasWidth, // Destination W
    targetCanvasHeight, // Destination H
  );

  const { sizeFactor } = drawingSceneResult;

  const clearParams: ClearParamsT = [0, 0, targetCanvasWidth, targetCanvasHeight];
  return {
    clearParams,
    restoreCoords: null,
    sizeFactor,
    offsetLeft: fullSizeCanvasWidth * sceneFrameLeft,
    offsetTop: fullSizeCanvasHeight * sceneFrameTop,
  };
}

function drawScene({
  data,
  canvas,
  options,
  canvasSize: { width: canvasWidth, height: canvasHeight },
}: {
  data: ReadonlyArray<PositionedTagRectT>;
  canvas: HTMLCanvasElement;
  canvasSize: SizeT;
  options: OptionsT;
}): {
  clearParams: ClearParamsT;
  restoreCoords: RestoreCoordsT;
  sizeFactor: number;
} | null {
  const { fontFamily, drawAxles = false, shouldDrawReactAreas } = options;
  const borderCoordinates = getBorderCoordinates(data);

  if (!borderCoordinates) {
    return null;
  }

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const { top: maxTop, bottom: minBottom, right: maxRight, left: minLeft } = borderCoordinates;

  const sceneWidth = maxRight - minLeft;
  const sceneHeight = maxTop - minBottom;

  const sizeFactor = canvasWidth / sceneWidth;

  const axisXOffset = -minLeft * sizeFactor;
  const axisYOffset = maxTop * sizeFactor;

  ctx.translate(axisXOffset, axisYOffset);

  if (drawAxles) {
    ctx.strokeStyle = 'black';
    // axisY
    ctx.strokeRect(0, -maxTop * sizeFactor, 1, canvasHeight);
    // axisX
    ctx.strokeRect(minLeft * sizeFactor, 0, canvasWidth, 1);
  }

  const rotate = (deg: number) => ctx.rotate((Math.PI / 180) * deg);
  data.forEach((item) => {
    const width = item.rectRight - item.rectLeft;
    const height = item.rectTop - item.rectBottom;

    if (shouldDrawReactAreas) {
      ctx.strokeStyle = item.color;
      ctx.strokeRect(item.rectLeft * sizeFactor, -item.rectTop * sizeFactor, width * sizeFactor, height * sizeFactor);
    }

    ctx.textBaseline = 'alphabetic';
    ctx.font = `${item.fontSize * sizeFactor}px ${fontFamily}`;
    ctx.fillStyle = item.color;

    const wordWidth = ctx.measureText(item.label).width;

    if (item.rotate) {
      const dX = item.rectRight * sizeFactor;
      const dY = -item.rectTop * sizeFactor;
      ctx.translate(dX, dY);
      rotate(90);
      const xOffset = (height * sizeFactor - wordWidth) / 2 + item.glyphsXOffset * sizeFactor;
      const yOffset = width * getFontYFactor(fontFamily) * sizeFactor + item.glyphsYOffset * sizeFactor;
      ctx.fillText(item.label, xOffset, yOffset);
      rotate(-90);
      ctx.translate(-dX, -dY);
    } else {
      const xOffset =
        item.rectLeft * sizeFactor + (width * sizeFactor - wordWidth) / 2 + item.glyphsXOffset * sizeFactor;
      const yOffset =
        (-item.rectTop + height * getFontYFactor(fontFamily)) * sizeFactor + item.glyphsYOffset * sizeFactor;
      ctx.fillText(item.label, xOffset, yOffset);
    }
  });

  const clearParams: ClearParamsT = [
    minLeft * sizeFactor,
    -maxTop * sizeFactor,
    sceneWidth * sizeFactor,
    sceneHeight * sizeFactor,
  ];
  const restoreCoords: RestoreCoordsT = [-axisXOffset, -axisYOffset];
  return { clearParams, restoreCoords, sizeFactor };
}
