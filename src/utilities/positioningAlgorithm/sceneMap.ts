import IntersectionError from './IntersectionError';

enum QuarterType {
  TOP_RIGHT_QUARTER = 'xy',
  BOTTOM_RIGHT_QUARTER = 'x-y',
  BOTTOM_LEFT_QUARTER = '-x-y',
  TOP_LEFT_QUARTER = '-xy',
}

export enum Dimensions {
  X = 'x',
  MINUS_X = '-x',
  Y = 'y',
  MINUS_Y = '-y',
}

const { X, MINUS_X, MINUS_Y, Y } = Dimensions;

const {
  TOP_RIGHT_QUARTER,
  BOTTOM_RIGHT_QUARTER,
  BOTTOM_LEFT_QUARTER,
  TOP_LEFT_QUARTER,
} = QuarterType;

type RowT = Array<boolean>;

type SceneMapT = {
  [TOP_RIGHT_QUARTER]: Array<RowT>;
  [BOTTOM_RIGHT_QUARTER]: Array<RowT>;
  [BOTTOM_LEFT_QUARTER]: Array<RowT>;
  [TOP_LEFT_QUARTER]: Array<RowT>;
};

export type SceneSizeT = {
  [X]: number;
  [MINUS_X]: number;
  [Y]: number;
  [MINUS_Y]: number;
};

export class SceneMap {
  sceneMap: SceneMapT = {
    [TOP_RIGHT_QUARTER]: [],
    [BOTTOM_RIGHT_QUARTER]: [],
    [BOTTOM_LEFT_QUARTER]: [],
    [TOP_LEFT_QUARTER]: [],
  };
  sizeX = 0;
  sizeMinusX = 0;
  sizeY = 0;
  sizeMinusY = 0;

  getSceneSize(): SceneSizeT {
    const { sizeX, sizeMinusX, sizeY, sizeMinusY } = this;
    return {
      [X]: sizeX,
      [MINUS_X]: sizeMinusX,
      [Y]: sizeY,
      [MINUS_Y]: sizeMinusY,
    };
  }

  calcSceneSize(): void {
    // TODO
    // it is a bad idea to calc sceneSize using array.length
    // because releasePosition uses undefined to reset cell value which lead to
    // [undefined, undefined].length === 2
    // Y
    if (this.sceneMap[TOP_RIGHT_QUARTER].length - 1 > this.sizeY) {
      this.sizeY = this.sceneMap[TOP_RIGHT_QUARTER].length - 1;
    }
    if (this.sceneMap[TOP_LEFT_QUARTER].length - 1 > this.sizeY) {
      this.sizeY = this.sceneMap[TOP_LEFT_QUARTER].length - 1;
    }

    // -Y
    if (this.sceneMap[BOTTOM_RIGHT_QUARTER].length - 1 > this.sizeMinusY) {
      this.sizeMinusY = this.sceneMap[BOTTOM_RIGHT_QUARTER].length - 1;
    }
    if (this.sceneMap[BOTTOM_LEFT_QUARTER].length - 1 > this.sizeMinusY) {
      this.sizeMinusY = this.sceneMap[BOTTOM_LEFT_QUARTER].length - 1;
    }

    // X
    this.sceneMap[TOP_RIGHT_QUARTER].forEach((row: RowT) => {
      if (row.length - 1 > this.sizeX) {
        this.sizeX = row.length - 1;
      }
    });
    this.sceneMap[BOTTOM_RIGHT_QUARTER].forEach((row: RowT) => {
      if (row.length - 1 > this.sizeX) {
        this.sizeX = row.length - 1;
      }
    });
    // -X
    this.sceneMap['-xy'].forEach((row: Array<boolean>) => {
      if (row.length - 1 > this.sizeMinusX) {
        this.sizeMinusX = row.length - 1;
      }
    });
    this.sceneMap[BOTTOM_LEFT_QUARTER].forEach((row: RowT) => {
      if (row.length - 1 > this.sizeMinusX) {
        this.sizeMinusX = row.length - 1;
      }
    });
  }

  _setDataAtPosition(x: number, y: number, val: boolean): void {
    const xIsPositive = x >= 0;
    const yIsPositive = y >= 0;
    const quarter = calcQuarter(xIsPositive, yIsPositive);
    const row = Math.abs(y);
    const col = Math.abs(x);
    if (!Array.isArray(this.sceneMap[quarter][row])) {
      this.sceneMap[quarter][row] = [];
    }
    this.sceneMap[quarter][row][col] = val;
  }

  setDataAtPosition(x: number, y: number, val: boolean = true): void {
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new Error(
        'setDataAtPosition error: typeof x !== number || typeof y !== number',
      );
    }
    if (x === 0 || y === 0) {
      throw new Error('setDataAtPosition error: x === 0 || y === 0');
    }
    if (this.getDataAtPosition(x, y)) {
      throw new IntersectionError(
        `The position (x: ${x}, y: ${y}) is occupied`,
      );
    }
    this._setDataAtPosition(x, y, val);
  }

  releasePosition(x: number, y: number): void {
    this._setDataAtPosition(x, y, false);
  }

  getDataAtPosition(x: number, y: number): boolean | void {
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new Error(
        'getDataAtPosition error: typeof x !== number || typeof y !== number',
      );
    }
    if (x === 0 || y === 0) {
      throw new Error('getDataAtPosition error: x === 0 || y === 0');
    }
    const quarter = calcQuarter(x >= 0, y >= 0);
    const row = Math.abs(y);
    const col = Math.abs(x);
    if (!Array.isArray(this.sceneMap[quarter][row])) {
      return;
    }
    return this.sceneMap[quarter][row][col];
  }

  drawItself() {
    // from to bottom
    const sceneSize = this.getSceneSize();
    const topRow = sceneSize[Y];
    const bottomRow = -sceneSize[MINUS_Y];
    const leftCol = -sceneSize[MINUS_X];
    const rightCol = sceneSize[X];

    let res = '';

    for (let row = topRow; row >= bottomRow; row--) {
      for (let col = leftCol; col <= rightCol; col++) {
        if (row === 0) {
          res += '';
        } else {
          res +=
            col === 0 ? '|' : this.getDataAtPosition(col, row) ? '⬛' : '⬜';
        }
      }
      res += '\n';
    }

    // eslint-disable-next-line no-console
    console.log(res, '\n\n');
  }

  static rectSizeToSceneMapUnits(
    rectSize: number,
    sceneMapUnitSize: number,
  ): number {
    return Math.ceil(rectSize / sceneMapUnitSize);
  }

  static sceneMapUnitsToRect(mapVal: number, sceneMapUnitSize: number) {
    return mapVal * sceneMapUnitSize;
  }

  static countPositions(begin: number, end: number): number {
    if (begin > end) {
      throw new Error('countPositions error: can not be begin > end');
    }
    if (begin === 0 || end === 0) {
      throw new Error('countPositions error: begin, end can not be zero');
    }
    return begin < 0 && end > 0 ? end - begin : end - begin + 1;
  }

  static takePositionsFromFirst(first: number, count: number) {
    if (count <= 0) throw new Error('"count" must be positive');
    if (first === 0) throw new Error('"first" can not be zero');
    if (count === 1) return first;
    let res = first + count;
    if (!(first < 0 && res >= 0)) {
      res--;
    }
    return res;
  }

  static takePositionsFromLast(last: number, count: number): number {
    if (count <= 0) throw new Error('"count" must be positive');
    if (last === 0) throw new Error('"last" can not be zero');
    if (count === 1) return last;

    let res = last - count;
    if (res >= 0 || last < 0) {
      res++;
    }
    return res;
  }

  static nextPosition(cur: number): number {
    return cur === -1 ? cur + 2 : cur + 1;
  }

  static prevPosition(cur: number): number {
    return cur === 1 ? cur - 2 : cur - 1;
  }

  static changePosition(cur: number, diff: number): number {
    if (cur === 0) throw new Error('"cur" can not be zero');
    let res = cur + diff;
    if (cur > 0 && res <= 0) {
      res--;
    }
    if (cur < 0 && res >= 0) {
      res++;
    }
    return res;
  }
}

function calcQuarter(xIsPositive: boolean, yIsPositive: boolean): QuarterType {
  // return `${xIsPositive ? '' : '-'}x${yIsPositive ? '' : '-'}y`;
  if (xIsPositive && yIsPositive) {
    return TOP_RIGHT_QUARTER;
  } else if (xIsPositive && !yIsPositive) {
    return BOTTOM_RIGHT_QUARTER;
  } else if (!xIsPositive && !yIsPositive) {
    return BOTTOM_LEFT_QUARTER;
  } else {
    return TOP_LEFT_QUARTER;
  }
}
