import { FONT_FAMILY, FONT_Y_FACTOR, FONT_SIZE_TO_GLYPH_HEIGHT_RATIO } from 'constants/index';
import openSansGlyphsByChars from './glyphsByChars/openSans.json';

import {
  TwoDimensionalMapMetaT,
  TwoDimensionalMapT,
  RectAreaT,
} from 'types/types';

type RectAreaSize = { width: number; height: number };

type GlyphsByCharsT = {[key: string]: {xMin: number, yMin: number, xMax: number, yMax: number}};

const glyphsByCharsMap: {[key: string]: GlyphsByCharsT} = {
  [FONT_FAMILY]: openSansGlyphsByChars,
};

function calcRectAreaSize({ canvas, word, fontSize, resolution, fontFamily }: {
  canvas: HTMLCanvasElement,
  word: string;
  fontSize: number;
  resolution: number;
  fontFamily?: string;
}): ([RectAreaT, RectAreaSize, number] | null) {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const height = Math.ceil(fontSize * FONT_SIZE_TO_GLYPH_HEIGHT_RATIO / resolution) * resolution;

  ctx.font = `${fontSize}px "${fontFamily}"`;
  const wordWidth = ctx.measureText(word).width;
  const width = Math.ceil(wordWidth / resolution) * resolution;

  const rectArea = {
    rows: height / resolution,
    cols: width / resolution,
  };
  return [rectArea, { width, height }, wordWidth];
}

export function getRectAreaMap(
  canvas: HTMLCanvasElement,
  {
    word,
    fontSize,
    resolution,
    fontFamily = FONT_FAMILY,
  }: {
    word: string;
    fontSize: number;
    resolution: number;
    fontFamily?: string;
  },
  {
    returnFakeRectAreaMap,
    returnFullSizeRectAreaMap,
  }: {
    returnFakeRectAreaMap: boolean;
    returnFullSizeRectAreaMap: boolean;
  } = { returnFakeRectAreaMap: false, returnFullSizeRectAreaMap: false }
) {
  if (returnFakeRectAreaMap) {
    // for debug
    const rectAreaSize = calcRectAreaSize({ canvas, word, fontSize, resolution, fontFamily });

    if (!rectAreaSize) {
      return null;
    }

    const [rectArea] = rectAreaSize;

    const fakeRectMap: TwoDimensionalMapT = [];

    for (let row = 0; row < rectArea.rows; row++) {
      if (!fakeRectMap[row]) {
        fakeRectMap[row] = [];
      }
      for (let col = 0; col < rectArea.cols; col++) {
        fakeRectMap[row][col] = true;
      }
    }

    return {
      map: fakeRectMap,
      meta: {
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        glyphsXOffset: 0,
        glyphsYOffset: 0,
      },
    };
  }

  const glyphsMap = getGlyphsMap(canvas, {
    word,
    fontSize,
    fontFamily,
    resolution,
  });

  if (!glyphsMap) {
    return null;
  }

  const { glyphsXOffset, glyphsYOffset }= glyphsMap.meta;

  const fullSizeRectAreaMap = glyphsMap.map;

  if (returnFullSizeRectAreaMap) {
    // for debug
    return {
      map: fullSizeRectAreaMap,
      meta: {
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        glyphsXOffset,
        glyphsYOffset,
      },
    };
  }

  const {
    map: rectAreaMap,
    meta: {
      topCutOffRows,
      bottomCutOffRows,
    },
  } = cutOffMapEmptyArea(fullSizeRectAreaMap);

  if (false) {
    // eslint-disable-next-line no-console
    console.log('getRectAreaMap');
    // eslint-disable-next-line no-console
    console.log(word);
    // eslint-disable-next-line no-console
    console.log('fontSize', fontSize);
    // eslint-disable-next-line no-console
    console.log(visualizeMap(fullSizeRectAreaMap));
    // eslint-disable-next-line no-console
    console.log(visualizeMap(rectAreaMap));
  }

  return {
    map: rectAreaMap,
    meta: {
      marginTop: topCutOffRows,
      marginBottom: bottomCutOffRows,
      marginLeft: 0,
      marginRight: 0,
      glyphsXOffset,
      glyphsYOffset,
    },
  };
}

export function getGlyphsMap(
  canvas: HTMLCanvasElement,
  {
    word,
    fontSize,
    resolution,
    fontFamily,
  }: {
    word: string;
    fontSize: number;
    resolution: number;
    fontFamily: string;
  },
): ({
  map: TwoDimensionalMapT;
  rectArea: RectAreaT;
  meta: TwoDimensionalMapMetaT;
} | null) {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rectAreaSize = calcRectAreaSize({ canvas, word, fontSize, resolution, fontFamily });

  if (!Array.isArray(rectAreaSize)) {
    return null;
  }

  const [originRectArea, originSize] = rectAreaSize;

  const glyphsByChars = glyphsByCharsMap[fontFamily];

  const firstChar = word[0];

  const glyphProps = glyphsByChars?.[firstChar];

  const { xMin = 0, xMax = 0 } = glyphProps ?? {};

  let glyphsXOffset = 0;
  let leftExtraColumns = 1;
  let rightExtraColumns = 1;

  if (xMin < 0 && Math.abs(xMin / (-xMin + xMax)) > 0.1) {
    ctx.font = `${fontSize}px "${fontFamily}"`;
    const firstCharWidth = ctx.measureText(firstChar).width;
    glyphsXOffset = -xMin / (-xMin + xMax) * firstCharWidth;
    leftExtraColumns = Math.ceil(glyphsXOffset / resolution) + 1;
    rightExtraColumns = leftExtraColumns > 0 ? 0 : rightExtraColumns;
  }

  const extraColumns = leftExtraColumns + rightExtraColumns;
  const rectArea = { ...originRectArea, cols: originRectArea.cols + extraColumns };

  const { height } = originSize;
  const width = originSize.width + extraColumns * resolution;


  canvas.width = width;
  canvas.height = height;

  ctx.textBaseline = 'alphabetic';
  ctx.font = `${fontSize}px "${fontFamily}"`;

  ctx.fillText(word, leftExtraColumns * resolution, height * FONT_Y_FACTOR);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const { rows, cols } = rectArea;

  const glyphsMap: TwoDimensionalMapT = [];

  const emptyRows = Array.from({ length: rows }).fill(true);
  const emptyColumns = Array.from({ length: cols }).fill(true);

  const bytePerPixel = 4;
  const oneColShift = resolution * bytePerPixel;
  const oneRowShift = oneColShift * resolution * cols;
  const oneSubRowShift = oneColShift * cols;

  for (let row = 0; row < rows; row++) {
    const rowShift = oneRowShift * row;
    for (let col = 0; col < cols; col++) {
      const colShift = oneColShift * col;
      let checkIsPositionOccupied = false;
      subRowLoop:
      for (let subRow = 0; subRow < resolution; subRow++) {
        const subRowShift = oneSubRowShift * subRow;
        for (let subCol = 0; subCol < resolution; subCol++) {
          const subColShift = subCol * bytePerPixel;
          const shift = rowShift + colShift + subRowShift + subColShift;
          if (data[shift + 3]) {
            checkIsPositionOccupied = true;
            break subRowLoop;
          }
        }
      }

      if (!glyphsMap[row]) {
        glyphsMap[row] = [];
      }
      glyphsMap[row][col] = checkIsPositionOccupied;
      if (glyphsMap[row][col]) {
        emptyRows[row] = false;
        emptyColumns[col] = false;
      }
    }
  }

  let firstNotEmptyRow: number = 0;
  // Rows: forward direction
  for (let i = 0; i < emptyRows.length; i++) {
    if (!emptyRows[i]) {
      // till meet the first not empty position
      firstNotEmptyRow = i;
      break;
    }
  }
  let lastNotEmptyRow: number = emptyRows.length - 1;
  // Rows: reverse direction
  for (let i = emptyRows.length - 1; i >= 0; i--) {
    if (!emptyRows[i]) {
      lastNotEmptyRow = i;
      break;
    }
  }

  // Columns: forward direction
  let firstNotEmptyColumn: number = 0;
  for (let i = 0; i < emptyColumns.length; i++) {
    if (!emptyColumns[i]) {
      // till meet the first not empty position
      firstNotEmptyColumn = i;
      break;
    }
  }
  // Columns: reverse direction
  let lastNotEmptyColumn: number = emptyColumns.length - 1;
  for (let i = emptyColumns.length - 1; i >= 0; i--) {
    if (!emptyColumns[i]) {
      lastNotEmptyColumn = i;
      break;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  return {
    map: glyphsMap,
    meta: {
      firstNotEmptyRow,
      lastNotEmptyRow,
      firstNotEmptyColumn,
      lastNotEmptyColumn,
      glyphsXOffset,
      glyphsYOffset: 0,
    },
    rectArea,
  };
}

// not in use any more
// const glyphsMap = getHighResolutionGlyphsMap(...)
// const fullSizeRectMap = glyphsMapToRectMap(glyphsMap.map, rectArea, false);
export function getHighResolutionGlyphsMap(
  canvas: HTMLCanvasElement,
  {
    word,
    fontSize,
    width,
    height,
    fontFamily = FONT_FAMILY,
    xOffset = 0,
  }: {
    word: string;
    fontSize: number;
    width: number;
    height: number;
    fontFamily?: string;
    xOffset?: number;
  },
): {
  map: TwoDimensionalMapT;
  meta: TwoDimensionalMapMetaT;
} | null {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  canvas.width = width;
  canvas.height = height;

  ctx.textBaseline = 'alphabetic';
  ctx.font = `${fontSize}px "${fontFamily}"`;

  // TODO use opentype.js
  ctx.fillText(word, xOffset, height * FONT_Y_FACTOR);

  const sx = 0;
  const sy = 0;
  const sh = height;
  const sw = width;

  const imageData = ctx.getImageData(sx, sy, sw, sh);
  const data = imageData.data;

  // row and column are 1px size
  const rows = Math.floor(sh - sx);
  const cols = Math.floor(sw - sy);
  const glyphsMap: TwoDimensionalMapT = [];

  const emptyRows = Array.from({ length: rows }).fill(true);
  const emptyColumns = Array.from({ length: cols }).fill(true);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ind = cols * row + col;
      const firstByte = ind * 4;
      // const red = 255 - data[firstBt];
      // const green = 255 - data[firstBt + 1];
      // const blue = 255 - data[firstBt + 2];
      const opacity = data[firstByte + 3] / 255;

      if (!glyphsMap[row]) {
        glyphsMap[row] = [];
      }
      glyphsMap[row][col] = !!opacity;
      if (glyphsMap[row][col]) {
        emptyRows[row] = false;
        emptyColumns[col] = false;
      }
    }
  }

  let firstNotEmptyRow: number = 0;
  // Rows: forward direction
  for (let i = 0; i < emptyRows.length; i++) {
    if (!emptyRows[i]) {
      // till meet the first not empty position
      firstNotEmptyRow = i;
      break;
    }
  }
  let lastNotEmptyRow: number = emptyRows.length - 1;
  // Rows: reverse direction
  for (let i = emptyRows.length - 1; i >= 0; i--) {
    if (!emptyRows[i]) {
      lastNotEmptyRow = i;
      break;
    }
  }

  // Columns: forward direction
  let firstNotEmptyColumn: number = 0;
  for (let i = 0; i < emptyColumns.length; i++) {
    if (!emptyColumns[i]) {
      // till meet the first not empty position
      firstNotEmptyColumn = i;
      break;
    }
  }
  // Columns: reverse direction
  let lastNotEmptyColumn: number = emptyColumns.length - 1;
  for (let i = emptyColumns.length - 1; i >= 0; i--) {
    if (!emptyColumns[i]) {
      lastNotEmptyColumn = i;
      break;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (false) {
    // eslint-disable-next-line no-console
    console.log(word);
    // eslint-disable-next-line no-console
    console.log('fontSize', fontSize);
    // eslint-disable-next-line no-console
    console.log('rectArea', { cols, rows });
    // eslint-disable-next-line no-console
    console.log('meta', {
      firstNotEmptyRow,
      lastNotEmptyRow,
      firstNotEmptyColumn,
      lastNotEmptyColumn,
    });
    // eslint-disable-next-line no-console
    console.log(visualizeMap(glyphsMap));
  }

  return {
    map: glyphsMap,
    meta: {
      firstNotEmptyRow,
      lastNotEmptyRow,
      firstNotEmptyColumn,
      lastNotEmptyColumn,
      glyphsXOffset: 0,
      glyphsYOffset: 0,
    },
  };
}

// not in use any more
function glyphsMapToRectMap(
  glyphsMap: TwoDimensionalMapT,
  rectArea: RectAreaT,
  rotate: boolean,
): TwoDimensionalMapT {
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

  const rectMap: TwoDimensionalMapT = [];
  for (let row = 0; row < rectRows; row++) {
    for (let col = 0; col < rectCols; col++) {
      if (!rectMap[row]) {
        rectMap[row] = [];
      }
      rectMap[row][col] = isRectAreaBusy(col, row);
    }
  }

  return rectMap;
}

export function getRectAreaOfRectMap(map: Array<Array<boolean>>) {
  const rows = map.length;
  const cols = map[0]?.length ?? 0;
  return { rows, cols };
}

function cutOffMapEmptyArea(entryMap: Array<Array<boolean>>): {
  map: Array<Array<boolean>>;
  meta: {
    topCutOffRows: number;
    bottomCutOffRows: number;
    leftCutOffColumns: number;
    rightCutOffColumns: number;
  };
} {
  const { rows: entryMapRows, cols: entryMapCols } = getRectAreaOfRectMap(entryMap);

  const emptyRows = Array.from({ length: entryMapRows }).fill(true);
  const emptyColumns = Array.from({ length: entryMapCols }).fill(true);

  for (let row = 0; row < entryMapRows; row++) {
    for (let col = 0; col < entryMapCols; col++) {
      if (entryMap[row][col]) {
        emptyRows[row] = false;
        emptyColumns[col] = false;
      }
    }
  }

  let firstNotEmptyRow: number = 0;
  // Rows: forward direction
  for (let i = 0; i < emptyRows.length; i++) {
    if (!emptyRows[i]) {
      // till meet the first not empty position
      firstNotEmptyRow = i;
      break;
    }
  }
  let lastNotEmptyRow: number = emptyRows.length - 1;
  // Rows: reverse direction
  for (let i = emptyRows.length - 1; i >= 0; i--) {
    if (!emptyRows[i]) {
      lastNotEmptyRow = i;
      break;
    }
  }

  // Columns: forward direction
  let firstNotEmptyColumn: number = 0;
  for (let i = 0; i < emptyColumns.length; i++) {
    if (!emptyColumns[i]) {
      // till meet the first not empty position
      firstNotEmptyColumn = i;
      break;
    }
  }
  // Columns: reverse direction
  let lastNotEmptyColumn: number = emptyColumns.length - 1;
  for (let i = emptyColumns.length - 1; i >= 0; i--) {
    if (!emptyColumns[i]) {
      lastNotEmptyColumn = i;
      break;
    }
  }

  const map = [];
  let targetMapRow = 0;
  for (let row = 0; row < entryMapRows; row++) {
    if (row < firstNotEmptyRow || lastNotEmptyRow < row) {
      // not copy
      continue;
    }
    map[targetMapRow] = entryMap[row].slice(
      firstNotEmptyColumn,
      lastNotEmptyColumn + 1,
    );
    targetMapRow++;
  }

  return {
    map,
    meta: {
      topCutOffRows: firstNotEmptyRow,
      bottomCutOffRows: entryMapRows - 1 - lastNotEmptyRow,
      leftCutOffColumns: firstNotEmptyColumn,
      rightCutOffColumns: entryMapCols - 1 - lastNotEmptyColumn,
    },
  };
}

function visualizeMap(
  map: TwoDimensionalMapT,
  rowLength: number = 250,
): string {
  let res = '';
  const { cols, rows } = getRectAreaOfRectMap(map);
  const maxCol = rowLength < cols ? rowLength : cols;

  if (rowLength < cols) {
    // eslint-disable-next-line no-console
    console.warn('rowLength < cols, cols:', cols);
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < maxCol; col++) {
      res +=
        map[row] && map[row][col]
          ? '⬛'
          : map[row] === undefined || map[row][col] === undefined
          ? ''
          : '⬜';
    }
    res += '\n';
  }
  return res;
}
