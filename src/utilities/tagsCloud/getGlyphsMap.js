// @flow

export type GlyphsMap = Array<Array<boolean>>;

export function getGlyphsMap(canvas, word, fontSize, {fontFamily = 'Open Sans', fontK = 1.1} = {}):GlyphsMap {
  const height = fontSize * fontK;

  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px ${fontFamily}`;
  const wordWidth = ctx.measureText(word).width;

  canvas.width = wordWidth * 1.1;
  canvas.height = height * 1.1;

  ctx.textBaseline = "alphabetic";
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
  const map = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ind = cols * row + col;
      const firstBt = ind * 4;
      //const red = 255 - data[firstBt];
      //const green = 255 - data[firstBt + 1];
      //const blue = 255 - data[firstBt + 2];
      const opacity = data[firstBt + 3] / 255;

      if (!map[row]) {
        map[row] = [];
      }
      map[row][col] = !!opacity;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (false) {
    console.log(word);
    console.log(visualizeMap(map, {cols, rows}, 196));
  }
  return map;
}

export function glyphsMapToRectMap(glyphsMap, rect, rotate) {
  const {rows: rectRows, cols: rectCols} = rect;
  const glyphsRows = rotate ? glyphsMap[0].length : glyphsMap.length;
  const glyphsCols = rotate ? glyphsMap.length : glyphsMap[0].length;

  const horizRatio = glyphsRows/rectRows;
  const vertRatio = glyphsCols/rectCols;

  const isRectSquareBusy = (rectCol, rectRow) => {
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
        if ((rotate && (glyphsMap[col] && glyphsMap[col][row])) || (glyphsMap[row] && glyphsMap[row][col])) {
          return true;
        }
      }
    }
    return false;
  }

  const rectMap = [];
  for (let row = 0; row < rectRows; row++) {
    for (let col = 0; col < rectCols; col++) {
      if (!rectMap[row]) {
        rectMap[row] = [];
      }
      rectMap[row][col] = isRectSquareBusy(col, row);
    }
  }
  if (false) {
    console.log(visualizeMap(rectMap, {cols: rectCols, rows: rectRows}));
  }

  return rectMap;
}

function visualizeMap(map, {cols, rows}, rowLength) {
  let res = '';
  const maxCol = rowLength < cols ? rowLength : cols;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < maxCol; col++) {
      res += map[row] && map[row][col] ? '#' : map[row] === undefined || map[row][col] === undefined ? '_' : '.';
    }
    res += '\n'
  }
  return res;
}