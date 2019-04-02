// @flow
import splitAndPerformWork from '../common/splitAndPerformWork';
import SceneMap, { dimensions } from './sceneMap';
import EdgesManager from './edgesManager';
import VacanciesManager from './vacanciesManager';
import { edgesOrder, edges } from './edgesManager';
import IntersectionError from './IntersectionError';
import { glyphsMapToRectMap } from '../tagsCloud/getGlyphsMap';

import type { PrepareDataItem } from '../tagsCloud';
import type { GlyphsMap } from '../tagsCloud/getGlyphsMap';


const { TOP, RIGHT, BOTTOM, LEFT } = edges;

const ASC = 'ascendant';
const DESC = 'descendant';

export const pickingStrategies = {ASC, DESC};

export type Options = {
  pickingClosedVacancyStrategy: string,
  pickingEdgeVacancyStrategy: string,
  drawFinishMap: boolean,
  addIfEmptyIndex?: number,
  drawStepMap: boolean,
  drawVacanciesMap: boolean,
};

type IdGlyphsMap = {
  id: string,
  map: GlyphsMap,
}

export default function (data: Array<PrepareDataItem>, dataGlyphsMap?: Array<IdGlyphsMap>, options: Options = {}):Promise {
  return new Promise(function(resolve, reject) {
    try {
      const {
        pickingClosedVacancyStrategy = DESC, pickingEdgeVacancyStrategy = ASC,
      } = options;

      let minSize = 10;
      data.forEach(i => {
        if (minSize > i.width) {
          minSize = i.width;
        }
        if (minSize > i.height) {
          minSize = i.height;
        }
      });

      const ratio = minSize;

      const augmentedData = data.map(i => ({...i, square: i.width * i.height}));

      const sortedData = augmentedData.sort((a, b) => b.square - a.square);

      //rotate the odd elements
      const rectsData = sortedData.map((i, ind) => {
        const trans = SceneMap.rectSizeToPositionUnits;
        if (ind % 2) {
          const rows = trans(i.width, ratio);
          const cols = trans(i.height, ratio);
          const square = rows * cols;
          return {...i, width: i.height, height: i.width, rows, cols, square, rotate: true};
        } else {
          const rows = trans(i.height, ratio);
          const cols = trans(i.width, ratio);
          const square = rows * cols;
          return {...i, rows, cols, square};
        }
      });

      const sceneMap = new SceneMap();
      const vacanciesManager = new VacanciesManager(sceneMap);
      const edgesManager = new EdgesManager();

      const laidRectsData = [];
      let needVacanciesRefresh = false;

      const work = (rect, ind) => {
        if (ind === 0) {
          const {rows, cols} = rect;
          const laidRectData = {
            top: Math.ceil(rows / 2),
            right: Math.ceil(cols / 2),
            bottom: -Math.ceil(rows / 2),
            left: -Math.ceil(cols / 2)
          };
          layRect(creatLaidRect(rect, laidRectData));
          return;
        }

        const addIfEmpty = ind < options.addIfEmptyIndex || 5;

        const tryPickClosedVacancy = () => {
          let rectPosition = pickClosedVacancy(rect);
          if (!rectPosition && needVacanciesRefresh) {
            updateVacancies(addIfEmpty);
            needVacanciesRefresh = false;
            rectPosition = pickClosedVacancy(rect);
          }

          if (rectPosition) {
            try {
              layRect(creatLaidRect(rect, rectPosition));
              needVacanciesRefresh = true;
            } catch (e) {
              if (e instanceof IntersectionError) {
                return tryPickClosedVacancy();
              } else {
                throw e;
              }
            }
            return true;
          }
        }

        if (tryPickClosedVacancy()) {
          return;
        }

        for (let threshold = 0.75; threshold >= 0.51; threshold -= 0.25) {
          const spentEdges = [];
          for (let i = 0; i < edgesOrder.length; i++) {
            const edge = edgesManager.getNextVacanciesEdge(spentEdges);
            spentEdges.push(edge);
            const force = threshold <= 0;
            const rectPosition = pickEdgeVacancy(rect, edge, {force, threshold});

            if (rectPosition) {
              try {
                layRect(creatLaidRect(rect, rectPosition));
                updateVacancies(addIfEmpty);
                needVacanciesRefresh = false;
                return;
              } catch (e) {
                if (!(e instanceof IntersectionError)) {
                  throw e;
                }
              }
            }
          }
        }

        {
          const sizeRatio = rect.cols / rect.rows;
          const edge = edgesManager.getNextEdge(sizeRatio);

          const rectPosition = placeRectOutsideScene(rect, edge);

          try {
            layRect(creatLaidRect(rect, rectPosition));
            updateVacancies(addIfEmpty);
            needVacanciesRefresh = false;
            edgesManager.confirmEdgeUsage(edge);
            return;
          } catch (e) {
            if (!(e instanceof IntersectionError)) {
              throw e;
            }
          }
        }

        if (process.env.NODE_ENV !== 'production') {
          throw new Error('it is impossible to find rect position');
        }
      }


      function* generateWorks() {
        for (let i = 0; i < rectsData.length; i++) {
          yield () => work(rectsData[i], i);
        }
      }

      splitAndPerformWork(generateWorks, 50)
        .then(finish)
        .catch(error => reject(error));

      function finish() {
        if (options.drawFinishMap) {
          sceneMap.drawItself();
        }
        const res = laidRectsData.map(i => {
          const top = i.top > 0 ? i.top : i.top + 1;
          const bottom = i.bottom > 0 ? i.bottom - 1 : i.bottom;
          const right = i.right > 0 ? i.right : i.right + 1;
          const left = i.left > 0 ? i.left - 1 : i.left;
          i.rectTop = SceneMap.sceneMapToRect(top, ratio);
          i.rectBottom = SceneMap.sceneMapToRect(bottom, ratio);
          i.rectRight = SceneMap.sceneMapToRect(right, ratio);
          i.rectLeft = SceneMap.sceneMapToRect(left, ratio);

          return i;
        });

        resolve(res);
      }

      function updateVacancies(addIfEmpty) {
        vacanciesManager.findVacancies(addIfEmpty);
        const {minRectCols, minRectRows} = calcMinRectsSizes(rectsData);
        const getVacancyApprover = (minRectCols, minRectRows) => vacancy => (
          isVacancySuitable({cols: minRectCols, rows: minRectRows}, vacancy)
        );
        vacanciesManager.filterUnsuitableClosedVacancies(getVacancyApprover(minRectCols, minRectRows));

        if (options.drawVacanciesMap) {
          const sceneSize = sceneMap.getSceneSize();
          vacanciesManager.topEdgeVacancies.forEach(v => VacanciesManager.drawVacancy(v, sceneSize));
          vacanciesManager.bottomEdgeVacancies.forEach(v => VacanciesManager.drawVacancy(v, sceneSize));
          vacanciesManager.rightEdgeVacancies.forEach(v => VacanciesManager.drawVacancy(v, sceneSize));
          vacanciesManager.leftEdgeVacancies.forEach(v => VacanciesManager.drawVacancy(v, sceneSize));

          vacanciesManager.closedVacancies.forEach(v => VacanciesManager.drawVacancy(v, sceneSize));
          //console.log('--------------------------------------------------------------------------------------------');
        }
      }

      function pickClosedVacancy(rect) {
        const vacancies = vacanciesManager.closedVacancies;

        const loopParams = {
          [ASC]: {from: 0, condition: i => i < vacancies.length, diff: 1},
          [DESC]: {from: vacancies.length - 1, condition: i => i >= 0, diff: -1},
        };
        const {from, condition, diff} = loopParams[pickingClosedVacancyStrategy];

        let vacancy;
        let vacancyIndex;
        for (let i = from; condition(i); i += diff) {
          if (vacancies[i] && isVacancySuitable(rect, vacancies[i])) {
            vacancy = vacancies[i];
            vacancyIndex = i;
            break;
          }
        }
        if (!vacancy) return;

        const takePositionsFromFirst = SceneMap.takePositionsFromFirst;
        const takePositionsFromLast = SceneMap.takePositionsFromLast;

        let rectPos = {};
        if (vacancy.square / rect.square > 1.9) {
          //с края
          if (Math.abs(vacancy.right) > Math.abs(vacancy.left)) {
            rectPos.left = vacancy.left;
            rectPos.right = takePositionsFromFirst(vacancy.left, rect.cols);
          } else {
            rectPos.right = vacancy.right;
            rectPos.left = takePositionsFromLast(rectPos.right, rect.cols);
          }
          if (Math.abs(vacancy.bottom) > Math.abs(vacancy.top)) {
            rectPos.top = vacancy.top;
            rectPos.bottom = takePositionsFromLast(rectPos.top, rect.rows);
          } else {
            rectPos.bottom = vacancy.bottom;
            rectPos.top = takePositionsFromFirst(rectPos.bottom, rect.rows);
          }
        } else {
          // центр
          const rowsDiffHalf = Math.round((vacancy.rows - rect.rows) / 2);
          const colsDiffHalf = Math.round((vacancy.cols - rect.cols) / 2);
          const top = SceneMap.changePosition(vacancy.top, -rowsDiffHalf);
          const right = SceneMap.changePosition(vacancy.right, -colsDiffHalf);
          rectPos = {
            top,
            bottom: takePositionsFromLast(top, rect.rows),
            right,
            left: takePositionsFromLast(right, rect.cols),
          };
        }
        vacanciesManager.removeClosedVacancy(vacancyIndex);
        return rectPos;
      }

      function getEdgeVacancies(edge) {
        const map = {
          [TOP]: () => vacanciesManager.topEdgeVacancies,
          [BOTTOM]: () => vacanciesManager.bottomEdgeVacancies,
          [RIGHT]: () => vacanciesManager.rightEdgeVacancies,
          [LEFT]: () => vacanciesManager.leftEdgeVacancies,
        };
        return map[edge]();
      };

      function pickEdgeVacancy(rect, edge, {force = false, threshold = 0.5} = {}) {
        const vacancies = getEdgeVacancies(edge);

        const baseSize = edge === TOP || edge === BOTTOM ? rect.cols : rect.rows;
        const oppositeSize = edge === TOP || edge === BOTTOM ? rect.rows : rect.cols;
        const takePositionsFromFirst = SceneMap.takePositionsFromFirst;
        const takePositionsFromLast = SceneMap.takePositionsFromLast;
        const countPositions = SceneMap.countPositions;

        const howOpposStandForEdge = (begin, end) => countPositions(begin, end) / oppositeSize;

        const howBaseStandForEdge = (begin, end) => {
          if (!begin || !end) {
            return 1;
          }
          const res = countPositions(begin, end) / baseSize;
          return res;
        }
        const loopParams = {
          [ASC]: {from: 0, condition: i => i < vacancies.length, diff: 1},
          [DESC]: {from: vacancies.length - 1, condition: i => i >= 0, diff: -1},
        };
        const {from, condition, diff} = loopParams[pickingEdgeVacancyStrategy];

        for (let i = from; condition(i); i += diff) {
          const vacancy = vacancies[i];

          if (vacancy.baseSize >= baseSize) {
            //кладем в угол, который ближе к центру коорд
            switch (edge) {
              case TOP: {
                if (!force && howOpposStandForEdge(vacancy.bottom, vacancy.topEdge) < threshold) {
                  continue;
                }
                let right;
                let left;
                if (!Number.isFinite(vacancy.right) && !Number.isFinite(vacancy.left)) {
                  const half = baseSize / 2;
                  left = Math.ceil(-half);
                  right = Math.ceil(half);
                } else {
                  if (Math.abs(vacancy.right) > Math.abs(vacancy.left)) {
                    left = vacancy.left;
                    right = takePositionsFromFirst(left, baseSize);

                    if (!force && howBaseStandForEdge(left, vacancy.rightEdge) < threshold) {
                      continue;
                    }
                  } else {
                    right = vacancy.right;
                    left = takePositionsFromLast(right, baseSize);

                    if (!force && howBaseStandForEdge(vacancy.leftEdge, right) < threshold) {
                      continue;
                    }
                  }
                }
                return {top: takePositionsFromFirst(vacancy.bottom, oppositeSize), right, bottom: vacancy.bottom, left};
              }
              case BOTTOM: {
                if (!force && howOpposStandForEdge(vacancy.bottomEdge, vacancy.top) < threshold) {
                  continue;
                }
                let right;
                let left;
                if (!Number.isFinite(vacancy.right) && !Number.isFinite(vacancy.left)) {
                  const half = baseSize / 2;
                  left = Math.ceil(-half);
                  right = Math.ceil(half);
                } else {
                  if (Math.abs(vacancy.right) > Math.abs(vacancy.left)) {
                    left = vacancy.left;
                    right = takePositionsFromFirst(left, baseSize);

                    if (!force && howBaseStandForEdge(left, vacancy.rightEdge) < threshold) {
                      continue;
                    }
                  } else {
                    right = vacancy.right;
                    left = takePositionsFromLast(right, baseSize);

                    if (!force && howBaseStandForEdge(vacancy.leftEdge, right) < threshold) {
                      continue;
                    }
                  }
                }
                return {top: vacancy.top, right, bottom: takePositionsFromLast(vacancy.top, oppositeSize), left};
              }
              case RIGHT: {
                if (!force && howOpposStandForEdge(vacancy.left, vacancy.rightEdge) < threshold) {
                  continue;
                }
                let top;
                let bottom;
                if (!Number.isFinite(vacancy.bottom) && !Number.isFinite(vacancy.top)) {
                  const half = baseSize / 2;
                  top = Math.ceil(half);
                  bottom = Math.ceil(-half);
                } else {
                  if (Math.abs(vacancy.bottom) > Math.abs(vacancy.top)) {
                    top = vacancy.top;
                    bottom = takePositionsFromLast(top, baseSize);

                    if (!force && howBaseStandForEdge(vacancy.bottomEdge, top) < threshold) {
                      continue;
                    }
                  } else {
                    bottom = vacancy.bottom;
                    top = takePositionsFromFirst(bottom, baseSize);

                    if (!force && howBaseStandForEdge(bottom, vacancy.topEdge) < threshold) {
                      continue;
                    }
                  }
                }
                return {top, right: takePositionsFromFirst(vacancy.left, oppositeSize), bottom, left: vacancy.left};
              }
              case LEFT: {
                if (!force && howOpposStandForEdge(vacancy.leftEdge, vacancy.right) < threshold) {
                  continue;
                }
                let top;
                let bottom;
                if (!Number.isFinite(vacancy.bottom) && !Number.isFinite(vacancy.top)) {
                  const half = baseSize / 2;
                  top = Math.ceil(half);
                  bottom = Math.ceil(-half);
                } else {
                  if (Math.abs(vacancy.bottom) > Math.abs(vacancy.top)) {
                    top = vacancy.top;
                    bottom = takePositionsFromLast(top, baseSize);

                    if (!force && howBaseStandForEdge(vacancy.bottomEdge, top) < threshold) {
                      continue;
                    }
                  } else {
                    bottom = vacancy.bottom;
                    top = takePositionsFromFirst(bottom, baseSize);

                    if (!force && howBaseStandForEdge(bottom, vacancy.topEdge) < threshold) {
                      continue;
                    }
                  }
                }
                return {top, right: vacancy.right, bottom, left: takePositionsFromLast(vacancy.right, oppositeSize)};
              }
            }
          }
        }
      }

      function updateSceneMap(rect) {
        const affectedPositions = [];
        const recoverClosedVacanciesState = () => {
          affectedPositions.forEach(i => sceneMap.releasePosition(...i));
        }

        let rectMap;
        if (dataGlyphsMap) {
          const glyphsMap = dataGlyphsMap.find(itemMap => itemMap.id === rect.id);
          if (glyphsMap) {
            rectMap = glyphsMapToRectMap(glyphsMap.map, {rows: rect.rows, cols: rect.cols}, !!rect.rotate);
          } else if (process.env.NODE_ENV !== 'production') {
            throw new Error('rectMap is empty');
          }
        }

        try {
          const {top, right, bottom, left} = rect;

          let innerRow = 0;
          for (let row = top; row >= bottom; row--) {
            if (row === 0) continue;
            let innerCol = 0;
            for (let col = left; col <= right; col++) {
              if (col === 0) continue;
              if (!rectMap || rectMap[innerRow] && rectMap[innerRow][innerCol]) {
                sceneMap.setDataAtPosition(col, row);
                affectedPositions.push([col, row]);
              }
              innerCol++;
            }
            innerRow++;
          }
        } catch (e) {
          if (e instanceof IntersectionError) {
            recoverClosedVacanciesState();
          }
          throw e;
        }

        sceneMap.calcSceneSize();

        if (options.drawStepMap) {
          console.clear();
          sceneMap.drawItself();
        }
      }

      function layRect(rect) {
        updateSceneMap(rect);
        laidRectsData.push(rect);
      }

      function creatLaidRect(rect, {top, right, bottom, left}) {
        if (process.env.NODE_ENV !== 'production' && (top < bottom || left > right)) {
          throw new Error('creatLaidRect error: top < bottom || left > right')
        }
        return {...rect, top, right, bottom, left}
      };

      function placeRectOutsideScene(rect, edge) {
        const sceneSize = sceneMap.getSceneSize();
        const topBorder = sceneSize[dimensions.Y];
        const bottomBorder = -sceneSize[dimensions.MINUS_Y];
        const leftBorder = -sceneSize[dimensions.MINUS_X];
        const rightBorder = sceneSize[dimensions.X];

        const takePositionsFromFirst = SceneMap.takePositionsFromFirst;
        const takePositionsFromLast = SceneMap.takePositionsFromLast;
        const next = SceneMap.nextPosition;
        const prev = SceneMap.prevPosition;

        //придерживаемся правого края, можно рандом
        switch (edge) {
          case TOP: {
            const bottom = next(topBorder);
            const rectPos = {
              top: takePositionsFromFirst(bottom, rect.rows),
              right: rightBorder,
              bottom,
              left: takePositionsFromLast(rightBorder, rect.cols)
            };
            return rectPos;
          }
          case RIGHT: {
            const left = next(rightBorder);
            const rectPos = {
              top: takePositionsFromFirst(bottomBorder, rect.rows),
              right: takePositionsFromFirst(left, rect.cols),
              bottom: bottomBorder,
              left
            };
            return rectPos;
          }
          case BOTTOM: {
            const top = prev(bottomBorder);
            const rectPos = {
              top,
              right: takePositionsFromFirst(leftBorder, rect.cols),
              bottom: takePositionsFromLast(top, rect.rows),
              left: leftBorder
            };
            return rectPos;
          }
          case LEFT: {
            const right = prev(leftBorder);
            const rectPos = {
              top: topBorder,
              right,
              bottom: takePositionsFromLast(topBorder, rect.rows),
              left: takePositionsFromLast(right, rect.cols)
            };
            return rectPos;
          }
        }
      }

      function isVacancySuitable(rect, vacancy) {
        return rect.rows <= vacancy.rows && rect.cols <= vacancy.cols;
      }

      function calcMinRectsSizes(rectsData) {
        let minRectCols;
        let minRectRows;
        rectsData.forEach(i => {
          if (minRectCols === undefined || i.cols < minRectCols) {
            minRectCols = i.cols;
          }
          if (minRectRows === undefined || i.rows < minRectRows) {
            minRectRows = i.rows;
          }
        });
        if (process.env.NODE_ENV !== 'production' && (!minRectCols || !minRectRows)) {
          throw new Error('calcMinRectsSizes error')
        }
        return {minRectCols, minRectRows};
      }
    } catch (e) {
      reject(e);
    }
  });
}