import IntersectionError from './IntersectionError';
import type { CoordinatePointT } from './types';

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

export type SceneEdgesT = {
  [X]: number;
  [MINUS_X]: number;
  [Y]: number;
  [MINUS_Y]: number;
};

export type PositionT = [x: number, y: number, value: boolean] | [x: number, y: number];

export class SceneMap {
  private sceneMap: SceneMapT = {
    [TOP_RIGHT_QUARTER]: [],
    [BOTTOM_RIGHT_QUARTER]: [],
    [BOTTOM_LEFT_QUARTER]: [],
    [TOP_LEFT_QUARTER]: [],
  };
  private rightEdge = 0;
  private leftEdge = 0;
  private topEdge = 0;
  private bottomEdge = 0;
  isSceneSizeFresh = true;

  constructor(positions: PositionT[] = []) {
    if (!positions.length) {
      return;
    }
    this.bulkOccupyPosition(positions);
    this.calcSceneEdges();
  }

  getSceneEdges(): SceneEdgesT {
    const { rightEdge, leftEdge, topEdge, bottomEdge } = this;
    return {
      [X]: rightEdge,
      [MINUS_X]: leftEdge,
      [Y]: topEdge,
      [MINUS_Y]: bottomEdge,
    };
  }

  cutOffEmptyRows() {
    // does not cut empty columns
    // TODO
    const getMapLastNotEmptyRowIndex = (map: RowT[]) => {
      let lastNotEmptyRowIndex = map.length - 1;
      for (let rowIndex = map.length - 1; rowIndex >= 0; rowIndex--) {
        if (map[rowIndex] && map[rowIndex].some(position => position)) {
          lastNotEmptyRowIndex = rowIndex;
          break;
        }
      }
      return lastNotEmptyRowIndex;
    };
    const processQuarterMap = (map: RowT[]) => {
      const lastNotEmptyRowIndex = getMapLastNotEmptyRowIndex(map);
      map.length = lastNotEmptyRowIndex + 1;
    };
    [TOP_RIGHT_QUARTER, BOTTOM_RIGHT_QUARTER, BOTTOM_LEFT_QUARTER, TOP_LEFT_QUARTER].forEach(quarter => {
      processQuarterMap(this.sceneMap[quarter]);
    });
  }

  calcSceneEdges(): void {
    // it is a bad idea to calc sceneEdges using array.length
    // because releasePosition uses false to reset position value which lead to
    // [false, false].length === 2
    this.cutOffEmptyRows();

    let topSize = 0;
    let bottomSize = 0;
    let leftSize = 0;
    let rightSize = 0;

    // Y
    if (this.sceneMap[TOP_RIGHT_QUARTER].length - 1 > topSize) {
      topSize = this.sceneMap[TOP_RIGHT_QUARTER].length - 1;
    }
    if (this.sceneMap[TOP_LEFT_QUARTER].length - 1 > topSize) {
      topSize = this.sceneMap[TOP_LEFT_QUARTER].length - 1;
    }
    this.topEdge = topSize;

    // -Y
    if (this.sceneMap[BOTTOM_RIGHT_QUARTER].length - 1 > bottomSize) {
      bottomSize = this.sceneMap[BOTTOM_RIGHT_QUARTER].length - 1;
    }
    if (this.sceneMap[BOTTOM_LEFT_QUARTER].length - 1 > bottomSize) {
      bottomSize = this.sceneMap[BOTTOM_LEFT_QUARTER].length - 1;
    }
    this.bottomEdge = !!bottomSize ? -bottomSize : 0;

    // X
    this.sceneMap[TOP_RIGHT_QUARTER].forEach((row: RowT) => {
      if (row.length - 1 > rightSize) {
        rightSize = row.length - 1;
      }
    });
    this.sceneMap[BOTTOM_RIGHT_QUARTER].forEach((row: RowT) => {
      if (row.length - 1 > rightSize) {
        rightSize = row.length - 1;
      }
    });
    this.rightEdge = rightSize;
    // -X
    this.sceneMap[TOP_LEFT_QUARTER].forEach((row: Array<boolean>) => {
      if (row.length - 1 > leftSize) {
        leftSize = row.length - 1;
      }
    });
    this.sceneMap[BOTTOM_LEFT_QUARTER].forEach((row: RowT) => {
      if (row.length - 1 > leftSize) {
        leftSize = row.length - 1;
      }
    });
    this.leftEdge = !!leftSize ? -leftSize : 0;

    this.isSceneSizeFresh = true;
  }

  private _setDataAtPosition(x: number, y: number, val: boolean): void {
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

  occupyPosition(x: number, y: number): void {
    if (x === 0 || y === 0) {
      throw new Error('occupyPosition error: x === 0 || y === 0');
    }
    if (this.getDataAtPosition(x, y)) {
      throw new IntersectionError(
        `The position (x: ${x}, y: ${y}) is occupied`,
      );
    }
    this._setDataAtPosition(x, y, true);
    this.isSceneSizeFresh = false;
  }

  bulkOccupyPosition(positionsToUpdate: PositionT[]) {
    const affectedPositions: [number, number][] = [];
    const initIsSceneSizeFresh = this.isSceneSizeFresh;
    let isSceneSizeFresh = false;
    const recoverClosedVacanciesState = () => {
      affectedPositions.forEach(position => this.releasePosition(...position));
      isSceneSizeFresh = initIsSceneSizeFresh;
    };

    positionsToUpdate.forEach(([col, row]) => {
      try {
        this.occupyPosition(col, row);
        affectedPositions.push([col, row]);
      } catch (err) {
        if (err instanceof IntersectionError) {
          recoverClosedVacanciesState();
        }
        throw err;
      }
    });
    this.isSceneSizeFresh = isSceneSizeFresh;
  }

  releasePosition(x: number, y: number): void {
    this._setDataAtPosition(x, y, false);
    this.isSceneSizeFresh = false;
  }

  getDataAtPosition(x: number, y: number): boolean | void {
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

  toPositions(): PositionT[] {
    const positions: [number, number][] = [];

    if (!this.isSceneSizeFresh) {
      this.calcSceneEdges();
    }

    SceneMap.traverseSceneMap(this, (row, col) => {
      if (row === 0 || col === 0) {
        return;
      }
      if (this.getDataAtPosition(col, row)) {
        positions.push([col, row]);
      }
    });
    return positions;
  }

  drawItself() {
    if (!this.isSceneSizeFresh) {
      this.calcSceneEdges();
    }

    let res = '';

    let prevRow: number;
    SceneMap.traverseSceneMap(this, (row, col) => {
      if (typeof prevRow !== 'undefined' && prevRow !== row) {
        res += '\n';
      }
      prevRow = row;
      if (row === 0) {
        res += '';
      } else {
        res += col === 0 ? '|' : this.getDataAtPosition(col, row) ? '⬛' : '⬜';
      }
    });

    // eslint-disable-next-line no-console
    console.log(res, '\n\n');
  }

  measureOwnDensity() {
    if (!this.isSceneSizeFresh) {
      this.calcSceneEdges();
    }
    let totalPositionCount = 0;
    let occupiedPositionCount = 0;
    SceneMap.traverseSceneMap(this, (row, col) => {
      if (row === 0 || col === 0) {
        return;
      }
      totalPositionCount++;
      if (this.getDataAtPosition(col, row)) {
        occupiedPositionCount++;
      }
    });
    return occupiedPositionCount / totalPositionCount;
  }

  static traverseSceneMap(map: SceneMap, cb: (row: number, column: number) => void) {
    // from to bottom
    const sceneEdges = map.getSceneEdges();
    const { [X]: rightCol, [MINUS_X]: leftCol, [Y]: topRow, [MINUS_Y]: bottomRow } = sceneEdges;
    for (let row = topRow; row >= bottomRow; row--) {
      for (let col = leftCol; col <= rightCol; col++) {
        cb(row, col);
      }
    }
  }

  static rectSizeToSceneMapSize(
    rectSize: number,
    sceneMapUnitSize: number,
  ): number {
    return Math.ceil(rectSize / sceneMapUnitSize);
  }

  static sceneMapSizeToRectSize(size: number, sceneMapUnitSize: number) {
    return size * sceneMapUnitSize;
  }

  static countPositions(beginPosition: number, endPosition: number): number {
    if (beginPosition > endPosition) {
      throw new Error('countPositions error: can not be begin > end');
    }
    if (beginPosition === 0 || endPosition === 0) {
      throw new Error('countPositions error: begin, end can not be zero');
    }
    return beginPosition < 0 && endPosition > 0
      ? endPosition - beginPosition
      : endPosition - beginPosition + 1;
  }

  static changePosition(currentPosition: number, diff: number): number {
    if (currentPosition === 0) {
      throw new Error('currentPosition can not be zero');
    }
    let res = currentPosition + diff;
    if (currentPosition > 0 && res <= 0) {
      res--;
    }
    if (currentPosition < 0 && res >= 0) {
      res++;
    }
    return res;
  }

  static countPositionsFroward(startPosition: number, count: number): number {
    if (count <= 0) {
      throw new Error('count must be positive');
    }
    if (startPosition === 0) {
      throw new Error('startPosition can not be zero');
    }
    return SceneMap.changePosition(startPosition, count - 1);
  }

  static countPositionsBackwards(startPosition: number, count: number): number {
    if (count <= 0) {
      throw new Error('count must be positive');
    }
    if (startPosition === 0) {
      throw new Error('startPosition can not be zero');
    }
    return SceneMap.changePosition(startPosition, -(count - 1));
  }

  static nextPosition(currentPosition: number): number {
    return SceneMap.changePosition(currentPosition, 1);
  }

  static prevPosition(currentPosition: number): number {
    return SceneMap.changePosition(currentPosition, -1);
  }

  static getNextPositionFromEdge(edge: number): number {
    return edge >= 0 ? edge + 1 : edge;
  }

  static getPrevPositionFromEdge(edge: number): number {
    return edge <= 0 ? edge - 1 : edge;
  }

  static getPositionRightEdge(position: number): number {
    return position > 0 ? position : position + 1;
  }

  static getPositionLeftEdge(position: number): number {
    return position > 0 ? position - 1 : position;
  }

  // result is not edge o position. It is a set of float numbers
  static calcSceneCenter(sceneEdges: SceneEdgesT): CoordinatePointT {
    const { [X]: rightEdge, [MINUS_X]: leftEdge, [Y]: topEdge, [MINUS_Y]: bottomEdge } = sceneEdges;
    return { x: leftEdge + (rightEdge - leftEdge) / 2, y: bottomEdge + (topEdge - bottomEdge) / 2 };
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
