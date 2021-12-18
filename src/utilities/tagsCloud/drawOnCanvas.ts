import { getBorderCoordinates } from './tagsCloud';
import { PositionedTagRectT } from 'types/types';
import { FONT_FAMILY } from 'constants/index';
import { getSuitableSize } from 'utilities/tagsCloud/getSuitableSize';

type OptionsT = {
  fontFamily?: string;
  drawAxles?: boolean;
};

type ClearParamsT = [number, number, number, number];
type RestoreCoordsT = [number, number];

export function drawOnCanvas(
  data: ReadonlyArray<PositionedTagRectT>,
  canvas: HTMLCanvasElement,
  availableSize: { width: number; height: number },
  options?: OptionsT,
): {
  clearParams: ClearParamsT;
  restoreCoords: RestoreCoordsT;
  scale: number;
} | null {
  const { fontFamily = FONT_FAMILY, drawAxles = false } = options ?? {};
  const borderCoordinates = getBorderCoordinates(data);

  if (!borderCoordinates) {
    return null;
  }

  const {
    top: maxTop,
    bottom: minBottom,
    right: maxRight,
    left: minLeft,
  } = borderCoordinates;

  const sceneWidth = maxRight - minLeft;
  const sceneHeight = maxTop - minBottom;

  const aspectRatio = sceneWidth / sceneHeight;

  const { width: canvasWidth, height: canvasHeight } = getSuitableSize(
    availableSize,
    aspectRatio,
  );

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const scale = canvasWidth / sceneWidth;

  const axisXOffset = -minLeft * scale;
  const axisYOffset = maxTop * scale;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  ctx.translate(axisXOffset, axisYOffset);

  if (drawAxles) {
    ctx.strokeStyle = 'black';
    // axisY
    ctx.strokeRect(0, -maxTop * scale, 1, canvasHeight);
    // axisX
    ctx.strokeRect(minLeft * scale, 0, canvasWidth, 1);
  }

  const rotate = (deg: number) => ctx.rotate((Math.PI / 180) * deg);
  data.forEach(item => {
    const width = item.rectRight - item.rectLeft;
    const height = item.rectTop - item.rectBottom;
    ctx.strokeStyle = item.fill;
    ctx.strokeRect(
      item.rectLeft * scale,
      -item.rectTop * scale,
      width * scale,
      height * scale,
    );

    ctx.textBaseline = 'alphabetic';
    ctx.font = `${item.fontSize * scale}px ${fontFamily}`;
    ctx.fillStyle = item.fill;

    const wordWidth = ctx.measureText(item.label).width;

    if (item.rotate) {
      const dX = item.rectRight * scale;
      const dY = -item.rectTop * scale;
      ctx.translate(dX, dY);
      rotate(90);
      const xOffset = (height * scale - wordWidth) / 2;
      ctx.fillText(item.label, 0 + xOffset, width * 0.8 * scale);
      rotate(-90);
      ctx.translate(-dX, -dY);
    } else {
      const xOffset = (width * scale - wordWidth) / 2;
      ctx.fillText(
        item.label,
        item.rectLeft * scale + xOffset,
        (-item.rectTop + height * 0.8) * scale,
      );
    }
  });

  const clearParams: ClearParamsT = [
    minLeft * scale,
    -maxTop * scale,
    sceneWidth * scale,
    sceneHeight * scale,
  ];
  const restoreCoords: RestoreCoordsT = [-axisXOffset, -axisYOffset];
  return { clearParams, restoreCoords, scale };
}
