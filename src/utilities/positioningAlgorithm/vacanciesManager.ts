import type { SceneEdgesT } from './sceneMap';
import { Dimensions, SceneMap } from './sceneMap';
import { SortingClosedVacanciesStrategies, SortingEdgeVacanciesStrategies } from 'constants/index';

import type {
  ClosedVacancyT,
  CoordinatePointT,
  PreparedBottomEdgeVacancyT,
  PreparedEdgeVacancyT,
  PreparedLeftEdgeVacancyT,
  PreparedRightEdgeVacancyT,
  PreparedTopEdgeVacancyT,
  VacancyT,
} from './types';

type OptionsT = {
  sortingClosedVacanciesStrategy: SortingClosedVacanciesStrategies;
  sortingEdgeVacanciesStrategy: SortingEdgeVacanciesStrategies;
  shouldCreateVacancyIfNoSuchKind: boolean;
  shouldDeduplicate: boolean;
};

type LineT = { begin: number; end: number };

type VacancyRectAreaT = { beginColumn: number; endColumn: number, rows: any };

type RawPreparedVacancyT = VacancyT & {
  baseSize?: number;
  distanceFromCenter?: number;
  topEdgeRow?: number;
  rightEdgeColumn?: number;
  bottomEdgeRow?: number;
  leftEdgeColumn?: number;
};
type RawClosedVacancyT = VacancyT & Partial<ClosedVacancyT>;

const { Y, X, MINUS_Y, MINUS_X } = Dimensions;

function deduplicateLines(lines: Array<LineT>) {
  const DELIMITER = '***';

  const linesAddresses = lines.map(({ begin, end }) => {
    return `${begin}${DELIMITER}${end}`;
  });

  return Array.from(new Set(linesAddresses)).map(str => {
    const parts = str.split(DELIMITER);
    return { begin: +parts[0], end: +parts[1] };
  });
}

function deduplicateVacancyRectAreas(vacancyRectArea: VacancyRectAreaT[]): VacancyRectAreaT[] {
  const DELIMITER = '***';

  const linesAddresses = vacancyRectArea.map(({ beginColumn, endColumn, rows }) => {
    return `${beginColumn}${DELIMITER}${endColumn}${DELIMITER}${rows}`;
  });

  return Array.from(new Set(linesAddresses)).map(str => {
    const parts = str.split(DELIMITER);
    return { beginColumn: +parts[0], endColumn: +parts[1], rows: +parts[2] };
  });
}

const DEFAULT_OPTIONS = {
  sortingClosedVacanciesStrategy: SortingClosedVacanciesStrategies.DISTANCE_FROM_CENTER,
  sortingEdgeVacanciesStrategy: SortingEdgeVacanciesStrategies.DISTANCE_FROM_CENTER,
  shouldCreateVacancyIfNoSuchKind: false,
  shouldDeduplicate: true
};

export class VacanciesManager {
  private _closedVacancies: Array<ClosedVacancyT | void> = [];
  private _topEdgeVacancies: PreparedTopEdgeVacancyT[] = [];
  private _rightEdgeVacancies: PreparedRightEdgeVacancyT[] = [];
  private _bottomEdgeVacancies: PreparedBottomEdgeVacancyT[] = [];
  private _leftEdgeVacancies: PreparedLeftEdgeVacancyT[] = [];
  private sceneMap: SceneMap;
  private readonly _options: OptionsT = DEFAULT_OPTIONS;
  needVacanciesRebuild = false;

  constructor(sceneMap: SceneMap, options?: Partial<OptionsT>) {
    this.sceneMap = sceneMap;
    this._options = { ...DEFAULT_OPTIONS, ...(options ?? {}) };
  }

  get closedVacancies() {
    return this._closedVacancies;
  }

  get topEdgeVacancies() {
    return this._topEdgeVacancies;
  }

  get rightEdgeVacancies() {
    return this._rightEdgeVacancies;
  }

  get bottomEdgeVacancies() {
    return this._bottomEdgeVacancies;
  }

  get leftEdgeVacancies() {
    return this._leftEdgeVacancies;
  }

  buildVacanciesMap(options?: Partial<OptionsT>) {
    const {
      shouldCreateVacancyIfNoSuchKind,
      shouldDeduplicate,
      sortingClosedVacanciesStrategy,
      sortingEdgeVacanciesStrategy,
    } = { ...this._options, ...options };

    const rawClosedVacancies: Array<RawClosedVacancyT> = [];
    const rawTopEdgeVacancies: Array<RawPreparedVacancyT> = [];
    const rawRightEdgeVacancies: Array<RawPreparedVacancyT> = [];
    const rawBottomEdgeVacancies: Array<RawPreparedVacancyT> = [];
    const rawLeftEdgeVacancies: Array<RawPreparedVacancyT> = [];

    const sceneEdges = this.sceneMap.getSceneEdges();
    // bottom to top, left to right
    const sceneTopRow = SceneMap.calcPrevPositionFromEdge(sceneEdges[Y]);
    const sceneBottomRow = SceneMap.calcNextPositionFromEdge(sceneEdges[MINUS_Y]);
    const sceneLeftCol = SceneMap.calcNextPositionFromEdge(sceneEdges[MINUS_X]);
    const sceneRightCol = SceneMap.calcPrevPositionFromEdge(sceneEdges[X]);

    const next = SceneMap.nextPosition;
    const prev = SceneMap.prevPosition;
    const countPositionsBackwards = SceneMap.countPositionsBackwards;

    const accumulated: { [key: number]: number } = {};

    function extractVacancies(columnsToClose: number[], row: number): void {
      const columnsToCloseSet = new Set(columnsToClose);
      const deduplicatedColumnsToClose = [...columnsToCloseSet];

      const spreadHorizontalLine = (begin: number, end: number): LineT => {
        const line: LineT = { begin, end };

        begin = prev(begin);
        while (accumulated[begin]) {
          line.begin = begin;
          begin = prev(begin);
        }
        end = next(end);
        while (accumulated[end]) {
          line.end = end;
          end = next(end);
        }
        return line;
      };

      const horizontalLines: Array<LineT> = deduplicatedColumnsToClose.filter(column => !!accumulated[column]).map(column => {
        return spreadHorizontalLine(column, column);
      });

      const deduplicatedHorizontalLines = deduplicateLines(horizontalLines);

      const vacancyRectAreas: Array<VacancyRectAreaT> = [];
      deduplicatedHorizontalLines.forEach(line => {
        let beginColumn = line.begin;
        let endColumn = line.end;
        let prevColVal = accumulated[beginColumn];
        for (let col = line.begin; col <= line.end; col = next(col)) {
          if (accumulated[col] !== prevColVal) {
            vacancyRectAreas.push({ beginColumn, endColumn, rows: prevColVal });
            if (!columnsToCloseSet.has(col)) {
              break;
            }
            beginColumn = col;
          }
          prevColVal = accumulated[col];
          endColumn = col;
        }

        vacancyRectAreas.push({ beginColumn, endColumn, rows: prevColVal });
      });

      const deduplicatedVacancyRectAreas = deduplicateVacancyRectAreas(vacancyRectAreas);

      // to spread rect area horizontally
      deduplicatedVacancyRectAreas.forEach(line => {
        let beginColumn = prev(line.beginColumn);
        while (accumulated[beginColumn] >= line.rows) {
          line.beginColumn = beginColumn;
          beginColumn = prev(beginColumn);
        }
        let endColumn = next(line.endColumn);
        while (accumulated[endColumn] >= line.rows) {
          line.endColumn = endColumn;
          endColumn = next(endColumn);
        }
      });

      deduplicatedVacancyRectAreas.forEach(vacancyRectArea => {
        let top = row;
        let right = vacancyRectArea.endColumn;
        let bottom = countPositionsBackwards(row, vacancyRectArea.rows);
        let left = vacancyRectArea.beginColumn;
        const vacancy: RawPreparedVacancyT = { top, right, bottom, left };

        let closed = true;
        if (top === sceneTopRow) {
          vacancy.topEdgeRow = sceneTopRow;
          vacancy.top = Infinity;
          rawTopEdgeVacancies.push(vacancy);
          closed = false;
        }
        if (right === sceneRightCol) {
          vacancy.rightEdgeColumn = sceneRightCol;
          vacancy.right = Infinity;
          rawRightEdgeVacancies.push(vacancy);
          closed = false;
        }
        if (bottom === sceneBottomRow) {
          vacancy.bottomEdgeRow = sceneBottomRow;
          vacancy.bottom = -Infinity;
          rawBottomEdgeVacancies.push(vacancy);
          closed = false;
        }
        if (left === sceneLeftCol) {
          vacancy.leftEdgeColumn = sceneLeftCol;
          vacancy.left = -Infinity;
          rawLeftEdgeVacancies.push(vacancy);
          closed = false;
        }
        if (closed) {
          rawClosedVacancies.push(vacancy);
        }
      });
    }

    // set init value to each column
    for (let col = sceneLeftCol; col <= sceneRightCol; col = next(col)) {
      accumulated[col] = 0;
    }
    let prevRow: number;
    for (let row = sceneBottomRow; row <= sceneTopRow; row = next(row)) {
      const currentRow: { [key: number]: boolean | void } = {};
      const columnsToClose: number[] = [];
      for (let col = sceneLeftCol; col <= sceneRightCol; col = next(col)) {
        currentRow[col] = this.sceneMap.getDataAtPosition(col, row);
        if (currentRow[col] && accumulated[col]) {
          columnsToClose.push(col);
        }
      }

      // @ts-ignore
      if (typeof prevRow !== 'undefined' && columnsToClose.length) {
        // works with data since previous row is processed
        extractVacancies(columnsToClose, prevRow);
      }
      prevRow = row;

      for (let col = sceneLeftCol; col <= sceneRightCol; col = next(col)) {
        if (currentRow[col]) {
          accumulated[col] = 0;
        } else {
          accumulated[col]++;
        }
      }
    }

    // to process all accumulated vacancies
    const columnsToClose = [];
    for (let col = sceneLeftCol; col <= sceneRightCol; col = next(col)) {
      columnsToClose.push(col);
    }
    extractVacancies(columnsToClose, sceneTopRow);

    if (shouldCreateVacancyIfNoSuchKind) {
      if (!rawTopEdgeVacancies.length) {
        rawTopEdgeVacancies.push({
          top: Infinity,
          bottom: next(sceneTopRow),
          right: Infinity,
          left: -Infinity,
          topEdgeRow: sceneTopRow,
        });
      }
      if (!rawBottomEdgeVacancies.length) {
        rawBottomEdgeVacancies.push({
          top: prev(sceneBottomRow),
          bottom: -Infinity,
          right: Infinity,
          left: -Infinity,
          bottomEdgeRow: sceneBottomRow,
        });
      }
      if (!rawRightEdgeVacancies.length) {
        rawRightEdgeVacancies.push({
          top: Infinity,
          bottom: -Infinity,
          right: Infinity,
          left: next(sceneRightCol),
          rightEdgeColumn: sceneRightCol,
        });
      }
      if (!rawLeftEdgeVacancies.length) {
        rawLeftEdgeVacancies.push({
          top: Infinity,
          bottom: -Infinity,
          right: prev(sceneLeftCol),
          left: -Infinity,
          leftEdgeColumn: sceneLeftCol,
        });
      }
    }

    const sceneCenter = SceneMap.calcSceneCenter(sceneEdges);

    const deduplicatedRawClosedVacancies = shouldDeduplicate ? deduplicateVacancies(rawClosedVacancies) : rawClosedVacancies;
    deduplicatedRawClosedVacancies.forEach(v => prepareClosedVacancy(v, sceneCenter));
    const _closedVacancies = deduplicatedRawClosedVacancies as ClosedVacancyT[];

    if (sortingClosedVacanciesStrategy === SortingClosedVacanciesStrategies.DISTANCE_FROM_CENTER) {
      _closedVacancies.sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);
    } else if (sortingClosedVacanciesStrategy === SortingClosedVacanciesStrategies.SQUARE) {
      _closedVacancies.sort((a, b) => a.square - b.square);
    }
    this._closedVacancies = _closedVacancies;

    const processRawEdgeVacancies = (rawEdgeVacancies: RawPreparedVacancyT[]) => {
      const deduplicatedRawEdgeVacancies = shouldDeduplicate ? deduplicateVacancies(rawEdgeVacancies) : rawEdgeVacancies;
      deduplicatedRawEdgeVacancies.forEach(v => {
        v.baseSize = calcEdgeVacancyBaseSize(v);
        v.distanceFromCenter = calcEdgeVacancyDistanceFromCenter(v, sceneCenter);
      });
      return deduplicatedRawEdgeVacancies;
    };

    const sortEdgeVacancies = (edgeVacancies: PreparedEdgeVacancyT[]) => {
      if (sortingEdgeVacanciesStrategy === SortingEdgeVacanciesStrategies.BASE_SIZE) {
        edgeVacancies.sort(compareEdgeVacanciesByBaseSize);
      } else if (sortingEdgeVacanciesStrategy === SortingEdgeVacanciesStrategies.DISTANCE_FROM_CENTER) {
        edgeVacancies.sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);
      }
    };

    this._topEdgeVacancies = processRawEdgeVacancies(rawTopEdgeVacancies) as PreparedTopEdgeVacancyT[];
    sortEdgeVacancies(this._topEdgeVacancies);

    this._rightEdgeVacancies = processRawEdgeVacancies(rawRightEdgeVacancies) as PreparedRightEdgeVacancyT[];
    sortEdgeVacancies(this._rightEdgeVacancies);

    this._bottomEdgeVacancies = processRawEdgeVacancies(rawBottomEdgeVacancies) as PreparedBottomEdgeVacancyT[];
    sortEdgeVacancies(this._bottomEdgeVacancies);

    this._leftEdgeVacancies = processRawEdgeVacancies(rawLeftEdgeVacancies) as PreparedLeftEdgeVacancyT[];
    sortEdgeVacancies(this._leftEdgeVacancies);

    this.needVacanciesRebuild = false;
  }

  removeClosedVacancy(index: number) {
    if (!this._closedVacancies[index]) {
      throw new Error(`vacancy index ${index} does not exist`);
    }
    this._closedVacancies[index] = undefined;
  }

  filterUnsuitableClosedVacancies(
    vacancyFilter: (vacancy: ClosedVacancyT | void) => boolean,
  ) {
    this._closedVacancies = this._closedVacancies.filter(vacancy =>
      vacancyFilter(vacancy),
    );
  }
}

export function drawVacancy(vacancy: VacancyT, sceneEdges: SceneEdgesT): void {
  if (!vacancy) return;

  const v = vacancy;

  // from top to down
  const sceneTopRow = sceneEdges[Y];
  const sceneBottomRow = sceneEdges[MINUS_Y];
  const sceneLeftCol = sceneEdges[MINUS_X];
  const sceneRightCol = sceneEdges[X];

  let res = '';

  const isBelongToVacancy = (x: number, y: number) => {
    return v.top >= y && v.bottom <= y && v.left <= x && v.right >= x;
  };

  for (let row = sceneTopRow; row >= sceneBottomRow; row--) {
    for (let col = sceneLeftCol; col <= sceneRightCol; col++) {
      if (row === 0) {
        res += '';
      } else {
        res += col === 0 ? '|' : isBelongToVacancy(col, row) ? '⬛' : '⬜';
      }
    }
    res += '\n';
  }

  // eslint-disable-next-line no-console
  console.log(res, '\n\n');
}

const calcEdgeVacancyBaseSize = (
  vacancy: VacancyT,
  isHorizontal: boolean = true,
) => {
  const countPositions = SceneMap.countPositions;
  return isHorizontal ? countPositions(vacancy.left, vacancy.right) : countPositions(vacancy.bottom, vacancy.top);
};

function prepareClosedVacancy(vacancy: VacancyT, sceneCenter: CoordinatePointT): ClosedVacancyT {
  const v = vacancy;
  const debug = process.env.NODE_ENV !== 'production';
  if (
    debug &&
    (isNaN(v.top) || isNaN(v.right) || isNaN(v.bottom) || isNaN(v.left))
  ) {
    throw new Error(
      'prepareClosedVacancy error: isNaN(top) || isNaN(right) || isNaN(bottom) || isNaN(left)',
    );
  }
  const rows = SceneMap.countPositions(vacancy.bottom, vacancy.top);
  const cols = SceneMap.countPositions(vacancy.left, vacancy.right);
  const distanceFromCenter = calcClosedVacancyDistanceFromCenter(vacancy, sceneCenter);

  if (debug && (rows <= 0 || cols <= 0)) {
    throw new Error('prepareClosedVacancy error: rows <= 0 || cols <= 0');
  }
  return Object.assign(vacancy, { rows, cols, square: rows * cols, distanceFromCenter });
}

function compareEdgeVacanciesByBaseSize(a: PreparedEdgeVacancyT, b: PreparedEdgeVacancyT) {
  return a.baseSize - b.baseSize;
}

function calcDistance(a: CoordinatePointT, b: CoordinatePointT): number {
  return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5;
}

function calcClosedVacancyDistanceFromCenter(vacancy: VacancyT, center: CoordinatePointT): number {
  const { left, right, bottom, top } = vacancy;
  const vacancyCenter = {
    x: left + (right - left) / 2,
    y: bottom + (top - bottom) / 2,
  };
  return calcDistance(vacancyCenter, center);
}

function calcShiftFromCenter(begin: number, end: number) {
  const isBeginFinite = Number.isFinite(begin);
  const isEndFinite = Number.isFinite(end);
  if (!isBeginFinite && !isEndFinite) {
    return 0;
  } else if (isBeginFinite && isEndFinite) {
    return begin + (end - begin) / 2;
  } else if (isBeginFinite) {
    return begin;
  } else {
    return end;
  }
}

function calcEdgeVacancyDistanceFromCenter(vacancy: VacancyT, center: CoordinatePointT): number {
  const { left, right, bottom, top } = vacancy;
  const vacancyCenter = {
    x: calcShiftFromCenter(left, right),
    y: calcShiftFromCenter(bottom, top),
  };
  return calcDistance(vacancyCenter, center);
}

function deduplicateVacancies<T extends VacancyT>(vacancies: T[]): T[] {
  const map = new Map<string, T>(vacancies.map((vacancy): [string, T] => {
    const { left, right, bottom, top } = vacancy;
    return [`${left},${right},${bottom},${top}`, vacancy];
  }));
  return [...map.values()];
}
