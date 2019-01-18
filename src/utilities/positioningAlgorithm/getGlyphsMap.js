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
    let res = '';
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {

        res += map[row][col] ? '#' : '.';
      }
      res += '\n'
    }
    console.log(res)
  }
  return map;
}

export function glyphsMapToRectMap(glyphsMap, rect, rotate) {
  const {rows: rectRows, cols: rectCols} = rect;
  const glyphsRows = glyphsMap.length;
  const glyphsCols = glyphsMap[0].length;

  const horizRatio = rotate ? glyphsCols/rectRows : glyphsRows/rectRows;
  const vertRatio = rotate ? glyphsRows/rectCols : glyphsCols/rectCols;

  const isRectSquareBusy = (col, row) => {
    const rowStart = Math.round((rotate ? glyphsCols : glyphsRows) * vertRatio * (row - 1));
    const rowFinish = Math.round((rotate ? glyphsCols : glyphsRows) * vertRatio * row);

    const colStart = Math.round((rotate ? glyphsRows : glyphsCols) * horizRatio * (col - 1));
    const colFinish = Math.round((rotate ? glyphsRows : glyphsCols) * horizRatio * col);

    for (let row = rowStart; row < rowFinish; row++) {
      for (let col = colStart; col < colFinish; col++) {
        if (glyphsMap[row] && glyphsMap[row][col]) {
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
  return rectMap;
}

/*const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const word = 'Alphabetic';
ctx.font = `${30}px ${'OpenSans'}`;
const wordWidth = ctx.measureText(word).width;

getGlyphsMap(canvas, word, 30, wordWidth);*/