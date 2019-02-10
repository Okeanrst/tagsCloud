import {getBorderCoordinates} from './index';

export default function drawOnCanvas(data, canvas, allowedWidth, options = {}) {
  const { padding = 1.1, fontFamily = 'Open Sans', drawAxises = false } = options;
  const {
    top: maxTop, bottom: minBottom, right: maxRight, left: minLeft
  } = getBorderCoordinates(data);

  const sceneWidth = maxRight - minLeft;
  const sceneHeight = maxTop - minBottom;

  const scale = allowedWidth / (sceneWidth * padding);

  const canvasWidth = sceneWidth * padding * scale;
  const canvasHeight = sceneHeight * padding * scale;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const axisXOffset = - minLeft * scale + canvasWidth * (padding - 1)/2;
  const axisYOffset = maxTop * scale + canvasHeight * (padding - 1)/2;

  const ctx = canvas.getContext('2d');

  ctx.translate(axisXOffset, axisYOffset);

  if (drawAxises) {
    ctx.strokeStyle = 'black';
    //axisY
    ctx.strokeRect(0,  -maxTop * scale, 1, canvasHeight);
    //axisX
    ctx.strokeRect(minLeft * scale,  0, canvasWidth, 1);
  }

  const rotate = (deg) => ctx.rotate(Math.PI / 180 * deg);
  data.forEach(item => {
    const width = (item.rectRight - item.rectLeft);
    const height = (item.rectTop - item.rectBottom);
    ctx.strokeStyle = item.fill;
    ctx.strokeRect(item.rectLeft * scale, -item.rectTop * scale, width* scale, height* scale);

    ctx.textBaseline = "alphabetic";
    ctx.font = `${item.fontSize * scale}px ${fontFamily}`;
    ctx.fillStyle = item.fill;

    const wordWidth = ctx.measureText(item.label).width;

    if (item.rotate) {
      const dX = item.rectRight * scale;
      const dY = - item.rectTop * scale;
      ctx.translate(dX, dY);
      rotate(90);
      const xOffset = (height * scale - wordWidth) / 2;
      ctx.fillText(item.label, 0 + xOffset,  width * 0.8 * scale);
      rotate(-90);
      ctx.translate(-dX, -dY);
    } else {
      const xOffset = (width * scale - wordWidth) / 2;
      ctx.fillText(item.label, item.rectLeft * scale + xOffset,  (-item.rectTop + height * 0.8) * scale);
    }
  });

  const clearParams = [minLeft * scale, -maxTop * scale, sceneWidth * scale, sceneHeight * scale];
  const restoreCoords = [-axisXOffset, -axisYOffset];
  return {clearParams, restoreCoords, scale};
}