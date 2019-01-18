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

  if (false) {
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

  const isRectSquareBusy = (rectCol, rectRow) => {
    const rowStart = Math.round(vertRatio * rectRow);
    let rowFinish = Math.round(vertRatio * (rectRow + 1));

    const colStart = Math.round(horizRatio * rectCol);
    let colFinish = Math.round(horizRatio * (rectCol + 1));

    //if (rowFinish > glyphsRows || colFinish > glyphsCols) debugger
    if (rowFinish > glyphsRows) {
      rowFinish = glyphsRows + 1
    }
    if (colFinish > glyphsCols) {
      colFinish = glyphsCols + 1
    }

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
  if (false) {
    console.log(visualizeMap(rectMap, {cols: rectCols, rows: rectRows}));
  }

  return rectMap;
}

function visualizeMap(map, {cols, rows}) {
  let res = '';
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {

      res += map[row] && map[row][col] ? '#' : map[row] === undefined || map[row][col] === undefined ? '_' : '.';
    }
    res += '\n'
  }
  return res;
}