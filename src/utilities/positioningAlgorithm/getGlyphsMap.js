export function getGlyphsMap(canvas, word, fontSize, wordWidth, {fontFamily = 'OpenSans', fontK = 1.12} = {}) {
  const height = fontSize * fontK;

  canvas.width = wordWidth * 1.1;
  canvas.height = height * 1.1;

  const ctx = canvas.getContext('2d');

  ctx.textBaseline = "alphabetic";
  ctx.font = `${fontSize}px ${fontFamily}`;

  const sx = 0;
  const sy = 0;
  const sh = height;
  const sw = wordWidth/*ctx.measureText(word).width*/;

  ctx.fillText(word, 0, height * 0.8);

  const imageData = ctx.getImageData(sx, sy, sw, sh);
  const data = imageData.data;

  const rows = Math.floor(sh - sx);
  const cols = Math.floor(sw - sy);
  let last = 0;
  const map = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {

      const ind = cols * row + col;
      last = ind;
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

  if (true) {
    console.log(visualizeMap(map, {cols, rows}));
  }
  return map;
}

export function glyphsMapToRectMap(glyphsMap, rect, rotate) {
  const {rows: rectRows, cols: rectCols} = rect;
  const glyphsRows = rotate ? glyphsMap[0].length : glyphsMap.length;
  const glyphsCols = rotate ? glyphsMap.length : glyphsMap[0].length;

  const horizRatio = glyphsRows/rectRows;
  const vertRatio = glyphsCols/rectCols;

  const isRectSquareBusy = (col, row) => {
    const rowStart = Math.round(glyphsRows / vertRatio * (row - 1));
    let rowFinish = Math.round(glyphsRows / vertRatio * (row));

    const colStart = Math.round(glyphsCols / horizRatio * (col - 1));
    let colFinish = Math.round(glyphsCols / horizRatio * col);

    //if (rowFinish > glyphsRows || colFinish > glyphsCols) debugger
    if (rowFinish > glyphsRows) {
      rowFinish = glyphsRows + 1
    }
    if (colFinish > glyphsCols) {
      colFinish = glyphsCols + 1
    }

    for (let row = rowStart; row < rowFinish; row++) {
      for (let col = colStart; col < colFinish; col++) {
        if (glyphsMap[row - 1] && glyphsMap[row - 1][col - 1]) {
          return true;
        }
      }
    }
    return false;
  }

  const rectMap = [];
  for (let row = 1; row <= rectRows; row++) {
    for (let col = 1; col <= rectCols; col++) {
      if (!rectMap[row]) {
        rectMap[row] = [];
      }
      rectMap[row][col] = isRectSquareBusy(col, row);
    }
  }
  if (true) {
    console.log(visualizeMap(rectMap, {cols: rectCols, rows: rectRows}));
  }
  debugger
  return rectMap;
}

function visualizeMap(map, {cols, rows}) {
  let res = '';
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {

      res += map[row] && map[row][col] ? '#' : '.';
    }
    res += '\n'
  }
  return res;
}

/*const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const word = 'Alphabetic';
ctx.font = `${30}px ${'OpenSans'}`;
const wordWidth = ctx.measureText(word).width;

getGlyphsMap(canvas, word, 30, wordWidth);*/