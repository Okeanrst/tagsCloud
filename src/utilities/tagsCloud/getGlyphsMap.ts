import { GlyphsMapT, RectAreaT, RectMapT } from 'types/types';

type OptionsT = {
  fontFamily?: string;
  fontK?: number;
};

export function getGlyphsMap(
  canvas: HTMLCanvasElement,
  word: string,
  fontSize: number,
  { fontFamily = 'Open Sans', fontK = 1.1 }: OptionsT = {},
): GlyphsMapT | null {
  const height = fontSize * fontK;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  ctx.font = `${fontSize}px ${fontFamily}`;
  const wordWidth = ctx.measureText(word).width;

  canvas.width = wordWidth * 1.1;
  canvas.height = height * 1.1;

  ctx.textBaseline = 'alphabetic';
  ctx.font = `${fontSize}px ${fontFamily}`;

  const sx = 0;
  const sy = 0;
  const sh = height;
  const sw = wordWidth;

  ctx.fillText(word, 0, height * 0.8);

  const imageData = ctx.getImageData(sx, sy, sw, sh);
  const data = imageData.data;

  const rows = Math.floor(sh - sx);
  const cols = Math.floor(sw - sy);
  const map: GlyphsMapT = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ind = cols * row + col;
      const firstByte = ind * 4;
      //const red = 255 - data[firstBt];
      //const green = 255 - data[firstBt + 1];
      //const blue = 255 - data[firstBt + 2];
      const opacity = data[firstByte + 3] / 255;

      if (!map[row]) {
        map[row] = [];
      }
      map[row][col] = !!opacity;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (false) {
    console.log(word);
    console.log(visualizeMap(map, { cols, rows }, 196));
  }
  return map;
}

export function glyphsMapToRectMap(
  glyphsMap: GlyphsMapT,
  rectArea: RectAreaT,
  rotate: boolean,
): RectMapT {
  const { rows: rectRows, cols: rectCols } = rectArea;
  const glyphsRows = rotate ? glyphsMap[0].length : glyphsMap.length;
  const glyphsCols = rotate ? glyphsMap.length : glyphsMap[0].length;

  const horizRatio = glyphsRows / rectRows;
  const vertRatio = glyphsCols / rectCols;

  const isRectAreaBusy = (rectCol: number, rectRow: number) => {
    const rowStart = Math.floor(horizRatio * rectRow);
    let rowFinish = Math.floor(horizRatio * (rectRow + 1));

    const colStart = Math.floor(vertRatio * rectCol);
    let colFinish = Math.floor(vertRatio * (rectCol + 1));

    //if (rowFinish > glyphsRows || colFinish > glyphsCols) debugger
    if (rowFinish > glyphsRows) {
      rowFinish = glyphsRows + 1;
    }
    if (colFinish > glyphsCols) {
      colFinish = glyphsCols + 1;
    }

    for (let row = rowStart; row < rowFinish; row++) {
      for (let col = colStart; col < colFinish; col++) {
        if (
          (rotate && glyphsMap[col] && glyphsMap[col][row]) ||
          (glyphsMap[row] && glyphsMap[row][col])
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const rectMap: RectMapT = [];
  for (let row = 0; row < rectRows; row++) {
    for (let col = 0; col < rectCols; col++) {
      if (!rectMap[row]) {
        rectMap[row] = [];
      }
      rectMap[row][col] = isRectAreaBusy(col, row);
    }
  }
  if (false) {
    // TODO rowLength ?
    console.log(visualizeMap(rectMap, { cols: rectCols, rows: rectRows }, 196));
  }

  return rectMap;
}

function visualizeMap(
  map: RectMapT,
  { cols, rows }: RectAreaT,
  rowLength: number,
): string {
  let res = '';
  const maxCol = rowLength < cols ? rowLength : cols;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < maxCol; col++) {
      res +=
        map[row] && map[row][col]
          ? '#'
          : map[row] === undefined || map[row][col] === undefined
          ? '_'
          : '.';
    }
    res += '\n';
  }
  return res;
}