import { SceneMap, Dimensions } from './sceneMap';

import type {
  VacancyT,
  PreparedTopEdgeVacancyT,
  PreparedBottomEdgeVacancyT,
  PreparedLeftEdgeVacancyT,
  PreparedRightEdgeVacancyT,
  ClosedVacancyT,
} from './types';
import type { SceneSizeT } from './sceneMap';

type LineT = { begin: number; end: number };

type OppositeLineT = LineT & { val: any };

type RawPreparedVacancyT = VacancyT & {
  baseSize?: number;
  topEdge?: number;
  rightEdge?: number;
  bottomEdge?: number;
  leftEdge?: number;
};
type RawClosedVacancyT = VacancyT & Partial<ClosedVacancyT>;

const { Y, X, MINUS_Y, MINUS_X } = Dimensions;

function deduplicateBaseLines(lines: Array<LineT>) {
  const DELIMITER = '***';

  const linesAddresses = lines.map(({ begin, end }) => {
    return `${begin}${DELIMITER}${end}`;
  });

  return Array.from(new Set(linesAddresses)).map(str => {
    const parts = str.split(DELIMITER);
    // restore
    return { begin: +parts[0], end: +parts[1] };
  });
}

export default class VacanciesManager {
  closedVacancies: Array<ClosedVacancyT | void> = [];
  topEdgeVacancies: PreparedTopEdgeVacancyT[] = [];
  rightEdgeVacancies: PreparedRightEdgeVacancyT[] = [];
  bottomEdgeVacancies: PreparedBottomEdgeVacancyT[] = [];
  leftEdgeVacancies: PreparedLeftEdgeVacancyT[] = [];
  sceneMap: SceneMap;

  constructor(sceneMap: SceneMap) {
    this.sceneMap = sceneMap;
  }

  buildVacanciesMap(isShouldCreateVacancyIfNoSuchKind = false) {
    const rawClosedVacancies: Array<RawClosedVacancyT> = [];
    const rawTopEdgeVacancies: Array<RawPreparedVacancyT> = [];
    const rawRightEdgeVacancies: Array<RawPreparedVacancyT> = [];
    const rawBottomEdgeVacancies: Array<RawPreparedVacancyT> = [];
    const rawLeftEdgeVacancies: Array<RawPreparedVacancyT> = [];

    const sceneSize = this.sceneMap.getSceneSize();
    // bottom to top, left to right
    const sceneTopRow = sceneSize[Y];
    const sceneBottomRow = -sceneSize[MINUS_Y];
    const sceneLeftCol = -sceneSize[MINUS_X];
    const sceneRightCol = sceneSize[X];

    const accumulated: { [key: number]: any } = {};

    const next = SceneMap.nextPosition;
    const prev = SceneMap.prevPosition;
    const change = SceneMap.changePosition;

    function extractVacancies(columnsToClose: number[], curRow: number) {
      // отфильтровываем рядом стоящие, идущие на закрытие (будет сохранена самая правая колонка)
      const deduplicatedColumnsToClose = columnsToClose.filter(
        (curItemCol: number, index: number) => {
          const nextItemCol = columnsToClose[index + 1];
          return nextItemCol !== next(curItemCol);
        },
      );

      const baseLines: Array<LineT> = [];

      const spreadLine = (begin: number, end: number): LineT => {
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

      deduplicatedColumnsToClose.forEach(column => {
        baseLines.push(spreadLine(column, column));
      });

      const deduplicatedBaseLines = deduplicateBaseLines(baseLines);

      const oppositeLines: Array<OppositeLineT> = [];
      deduplicatedBaseLines.forEach(line => {
        let begin = line.begin;
        let end = line.end;
        let prevColVal = accumulated[begin];
        for (let col = line.begin; col <= line.end; col = next(col)) {
          if (accumulated[col] !== prevColVal) {
            oppositeLines.push({ begin, end, val: prevColVal });
            begin = col;
          }
          prevColVal = accumulated[col];
          end = col;
        }

        oppositeLines.push({ begin, end, val: prevColVal });
      });

      // spread opposite line
      oppositeLines.forEach(line => {
        let begin = prev(line.begin);
        while (accumulated[begin] >= line.val) {
          line.begin = begin;
          begin = prev(begin);
        }
        let end = next(line.end);
        while (accumulated[end] >= line.val) {
          line.end = end;
          end = next(end);
        }
      });

      oppositeLines.forEach(line => {
        let top = prev(curRow);
        let right = line.end;
        let bottom = change(curRow, -line.val);
        let left = line.begin;
        const vacancy: RawPreparedVacancyT = { top, right, bottom, left };

        let closed = true;
        if (top === sceneTopRow) {
          vacancy.topEdge = sceneTopRow;
          vacancy.top = Infinity;
          rawTopEdgeVacancies.push(vacancy);
          closed = false;
        }
        if (right === sceneRightCol) {
          vacancy.rightEdge = sceneRightCol;
          vacancy.right = Infinity;
          rawRightEdgeVacancies.push(vacancy);
          closed = false;
        }
        if (bottom === sceneBottomRow) {
          vacancy.bottomEdge = sceneBottomRow;
          vacancy.bottom = -Infinity;
          rawBottomEdgeVacancies.push(vacancy);
          closed = false;
        }
        if (left === sceneLeftCol) {
          vacancy.leftEdge = sceneLeftCol;
          vacancy.left = -Infinity;
          rawLeftEdgeVacancies.push(vacancy);
          closed = false;
        }
        if (closed) {
          rawClosedVacancies.push(vacancy);
        }
      });
    }

    for (let col = sceneLeftCol; col <= sceneRightCol; col = next(col)) {
      accumulated[col] = 0;
    }
    for (let row = sceneBottomRow; row <= sceneTopRow; row = next(row)) {
      const currentRow: { [key: number]: boolean | void } = {};
      const columnsToClose: number[] = [];
      for (let col = sceneLeftCol; col <= sceneRightCol; col = next(col)) {
        currentRow[col] = this.sceneMap.getDataAtPosition(col, row);
        if (currentRow[col] && accumulated[col]) {
          columnsToClose.push(col);
        }
      }

      extractVacancies(columnsToClose, row);

      for (let col = sceneLeftCol; col <= sceneRightCol; col = next(col)) {
        if (currentRow[col]) {
          accumulated[col] = 0;
        } else {
          accumulated[col]++;
        }
      }
    }

    const toCloseCols = [];
    for (let col = sceneLeftCol; col <= sceneRightCol; col = next(col)) {
      if (accumulated[col]) {
        toCloseCols.push(col);
      }
    }
    extractVacancies(toCloseCols, next(sceneTopRow));

    if (isShouldCreateVacancyIfNoSuchKind) {
      if (!rawTopEdgeVacancies.length) {
        rawTopEdgeVacancies.push({
          top: Infinity,
          bottom: next(sceneTopRow),
          right: Infinity,
          left: -Infinity,
          topEdge: sceneTopRow,
        });
      }
      if (!rawBottomEdgeVacancies.length) {
        rawBottomEdgeVacancies.push({
          top: prev(sceneBottomRow),
          bottom: -Infinity,
          right: Infinity,
          left: -Infinity,
          bottomEdge: sceneBottomRow,
        });
      }
      if (!rawRightEdgeVacancies.length) {
        rawRightEdgeVacancies.push({
          top: Infinity,
          bottom: -Infinity,
          right: Infinity,
          left: next(sceneRightCol),
          rightEdge: sceneRightCol,
        });
      }
      if (!rawLeftEdgeVacancies.length) {
        rawLeftEdgeVacancies.push({
          top: Infinity,
          bottom: -Infinity,
          right: prev(sceneLeftCol),
          left: -Infinity,
          leftEdge: sceneLeftCol,
        });
      }
    }

    rawClosedVacancies.forEach(v => prepareClosedVacancy(v));
    const closedVacancies = rawClosedVacancies as ClosedVacancyT[];
    closedVacancies.sort((a, b) => a.square - b.square);
    this.closedVacancies = closedVacancies;

    rawTopEdgeVacancies.forEach(v => {
      v.baseSize = calcEdgeVacancyBaseSize(v);
    });
    this.topEdgeVacancies = rawTopEdgeVacancies as PreparedTopEdgeVacancyT[];
    this.topEdgeVacancies.sort((a, b) => a.baseSize - b.baseSize);

    rawRightEdgeVacancies.forEach(v => {
      v.baseSize = calcEdgeVacancyBaseSize(v, false);
    });
    this.rightEdgeVacancies =
      rawRightEdgeVacancies as PreparedRightEdgeVacancyT[];
    this.rightEdgeVacancies.sort((a, b) => a.baseSize - b.baseSize);

    rawBottomEdgeVacancies.forEach(v => {
      v.baseSize = calcEdgeVacancyBaseSize(v);
    });
    this.bottomEdgeVacancies =
      rawBottomEdgeVacancies as PreparedBottomEdgeVacancyT[];
    this.bottomEdgeVacancies.sort((a, b) => a.baseSize - b.baseSize);

    rawLeftEdgeVacancies.forEach(v => {
      v.baseSize = calcEdgeVacancyBaseSize(v, false);
    });
    this.leftEdgeVacancies = rawLeftEdgeVacancies as PreparedLeftEdgeVacancyT[];
    this.leftEdgeVacancies.sort((a, b) => a.baseSize - b.baseSize);
  }

  removeClosedVacancy(index: number) {
    this.closedVacancies[index] = undefined;
  }

  filterUnsuitableClosedVacancies(
    vacancyFilter: (vacancy: ClosedVacancyT | void) => boolean,
  ) {
    this.closedVacancies = this.closedVacancies.filter(vacancy =>
      vacancyFilter(vacancy),
    );
  }
}

export function drawVacancy(vacancy: VacancyT, sceneSize: SceneSizeT): void {
  if (!vacancy) return;

  const v = vacancy;
  const isInfinite = (n: number) => !Number.isFinite(n);
  if (
    [v.top, v.bottom, v.left, v.right].filter(i => isInfinite(i)).length >= 3
  ) {
    return;
  }
  // сверху вниз
  const sceneTopRow = sceneSize[Y];
  const sceneBottomRow = -sceneSize[MINUS_Y];
  const sceneLeftCol = -sceneSize[MINUS_X];
  const sceneRightCol = sceneSize[X];

  let res = '';

  const isBelongVacancy = (x: number, y: number) => {
    return v.top >= y && v.bottom <= y && v.left <= x && v.right >= x;
  };

  for (let row = sceneTopRow; row >= sceneBottomRow; row--) {
    for (let col = sceneLeftCol; col <= sceneRightCol; col++) {
      if (row === 0) {
        res += '-';
      } else {
        res += col === 0 ? '|' : isBelongVacancy(col, row) ? '#' : '•';
      }
    }
    res += '\n';
  }

  console.log(res, '\n\n');
}

const calcEdgeVacancyBaseSize = (
  vacancy: VacancyT,
  isHorizontal: boolean = true,
) => {
  return isHorizontal
    ? vacancy.right - vacancy.left + 1
    : vacancy.top - vacancy.bottom + 1;
};

function prepareClosedVacancy(vacancy: VacancyT): ClosedVacancyT {
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

  if (debug && (rows <= 0 || cols <= 0)) {
    throw new Error('prepareClosedVacancy error: rows <= 0 || cols <= 0');
  }
  return Object.assign(vacancy, { rows, cols, square: rows * cols });
}
