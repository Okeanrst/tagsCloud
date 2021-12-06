import { splitAndPerformWork } from '../common/splitAndPerformWork';
import { SceneMap, Dimensions } from './sceneMap';
import EdgesManager, { edgesOrder, EDGE } from './edgesManager';
import VacanciesManager, { drawVacancy } from './vacanciesManager';
import IntersectionError from './IntersectionError';
import { glyphsMapToRectMap } from '../tagsCloud/getGlyphsMap';

import { IdGlyphsMapT } from 'types/types';
import type {
  PreparedTagDataT,
  TagRectT,
  RectPositionT,
  PositionedTagRectT,
} from 'types/types';
import type {
  ClosedVacancyT,
  PreparedBottomEdgeVacancyT,
  PreparedTopEdgeVacancyT,
  PreparedLeftEdgeVacancyT,
  PreparedRightEdgeVacancyT,
} from './types';
import { RectAreaT } from 'types/types';

export enum PickingStrategies {
  ASC = 'ascendant',
  DESC = 'descendant',
}

export type Options = Readonly<{
  pickingClosedVacancyStrategy?: PickingStrategies;
  pickingEdgeVacancyStrategy?: PickingStrategies;
  drawFinishMap?: boolean;
  addIfEmptyIndex?: number;
  drawStepMap?: boolean;
  drawVacanciesMap?: boolean;
}>;

const { TOP, RIGHT, BOTTOM, LEFT } = EDGE;

const { ASC, DESC } = PickingStrategies;

type RawPositionedTagRectT = TagRectT & RectPositionT;

type LoopOrderParamT = {
  from: number;
  condition: (vacancyIndex: number) => boolean;
  diff: number;
};

type LoopParamsT = {
  [ASC]: LoopOrderParamT;
  [DESC]: LoopOrderParamT;
};

const INIT_MIN_SIZE = 10;

function creatLaidRect(
  rect: TagRectT,
  { top, right, bottom, left }: RectPositionT,
): RawPositionedTagRectT {
  if (process.env.NODE_ENV !== 'production' && (top < bottom || left > right)) {
    throw new Error('creatLaidRect error: top < bottom || left > right');
  }
  return { ...rect, top, right, bottom, left };
}

function isVacancyLargeEnoughToFitRect(
  rectArea: RectAreaT,
  vacancy: ClosedVacancyT,
) {
  return rectArea.rows <= vacancy.rows && rectArea.cols <= vacancy.cols;
}

function createWorkGenerator(
  rectsData: ReadonlyArray<TagRectT>,
  performWork: (rect: TagRectT, index: number) => void,
): () => Generator<void> {
  return function* workGenerator() {
    for (let i = 0; i < rectsData.length; i++) {
      yield performWork(rectsData[i], i);
    }
  };
}

const calcMinRectsSizes = (
  rectsData: ReadonlyArray<TagRectT>,
): { minRectCols: number; minRectRows: number } => {
  let minRectCols = Infinity;
  let minRectRows = Infinity;
  rectsData.forEach(i => {
    if (i.cols < minRectCols) {
      minRectCols = i.cols;
    }
    if (i.rows < minRectRows) {
      minRectRows = i.rows;
    }
  });
  if (
    process.env.NODE_ENV !== 'production' &&
    (!minRectCols ||
      !minRectRows ||
      !Number.isFinite(minRectCols) ||
      !Number.isFinite(minRectRows))
  ) {
    throw new Error('calcMinRectsSizes error');
  }
  return { minRectCols, minRectRows };
};

export function calcTagsPositions(
  tagsData: ReadonlyArray<PreparedTagDataT>,
  dataGlyphsMap: ReadonlyArray<IdGlyphsMapT>,
  options?: Options,
): Promise<PositionedTagRectT[]> {
  return new Promise((resolve, reject) => {
    try {
      const {
        pickingClosedVacancyStrategy = DESC,
        pickingEdgeVacancyStrategy = ASC,
      } = options ?? {};

      let minSize = INIT_MIN_SIZE;
      tagsData.forEach(i => {
        if (minSize > i.width) {
          minSize = i.width;
        }
        if (minSize > i.height) {
          minSize = i.height;
        }
      });

      const sceneMapUnitSize = minSize;

      const sortedTagsData = tagsData
        .map(i => ({
          ...i,
          square: i.width * i.height,
        }))
        .sort((a, b) => b.square - a.square);

      // rotate the odd elements
      const rectsData: ReadonlyArray<TagRectT> = sortedTagsData.map(
        (tagData, index) => {
          const trans = SceneMap.rectSizeToSceneMapUnits;
          if (index % 2) {
            const rows = trans(tagData.width, sceneMapUnitSize);
            const cols = trans(tagData.height, sceneMapUnitSize);
            const square = rows * cols;
            return {
              ...tagData,
              width: tagData.height,
              height: tagData.width,
              rows,
              cols,
              square,
              rotate: true,
            };
          } else {
            const rows = trans(tagData.height, sceneMapUnitSize);
            const cols = trans(tagData.width, sceneMapUnitSize);
            const square = rows * cols;
            return { ...tagData, rows, cols, square };
          }
        },
      );

      const sceneMap = new SceneMap();
      const vacanciesManager = new VacanciesManager(sceneMap);
      const edgesManager = new EdgesManager();

      const positionedRectsData: RawPositionedTagRectT[] = [];
      let needVacanciesRefresh = false;

      const pickClosedVacancy = (rect: TagRectT): RectPositionT | void => {
        const vacancies = vacanciesManager.closedVacancies;

        const loopParams = {
          [ASC]: {
            from: 0,
            condition: (i: number) => i < vacancies.length,
            diff: 1,
          },
          [DESC]: {
            from: vacancies.length - 1,
            condition: (i: number) => i >= 0,
            diff: -1,
          },
        };
        const { from, condition, diff } =
          loopParams[pickingClosedVacancyStrategy];

        let suitableVacancy;
        let vacancyIndex: number = -1;
        for (let i = from; condition(i); i += diff) {
          const possiblySuitableVacancy = vacancies[i];
          if (
            possiblySuitableVacancy &&
            isVacancyLargeEnoughToFitRect(rect, possiblySuitableVacancy)
          ) {
            suitableVacancy = vacancies[i];
            vacancyIndex = i;
            break;
          }
        }

        if (vacancyIndex === -1 || !suitableVacancy) {
          return;
        }

        const takePositionsFromFirst = SceneMap.takePositionsFromFirst;
        const takePositionsFromLast = SceneMap.takePositionsFromLast;

        const RATION_LIMIT = 1.9;

        let left: number;
        let right: number;
        let top: number;
        let bottom: number;
        if (suitableVacancy.square / rect.square > RATION_LIMIT) {
          //с края
          if (
            Math.abs(suitableVacancy.right) > Math.abs(suitableVacancy.left)
          ) {
            left = suitableVacancy.left;
            right = takePositionsFromFirst(suitableVacancy.left, rect.cols);
          } else {
            right = suitableVacancy.right;
            left = takePositionsFromLast(right, rect.cols);
          }
          if (
            Math.abs(suitableVacancy.bottom) > Math.abs(suitableVacancy.top)
          ) {
            top = suitableVacancy.top;
            bottom = takePositionsFromLast(top, rect.rows);
          } else {
            bottom = suitableVacancy.bottom;
            top = takePositionsFromFirst(bottom, rect.rows);
          }
        } else {
          // центр
          const rowsDiffHalf = Math.round(
            (suitableVacancy.rows - rect.rows) / 2,
          );
          const colsDiffHalf = Math.round(
            (suitableVacancy.cols - rect.cols) / 2,
          );
          top = SceneMap.changePosition(suitableVacancy.top, -rowsDiffHalf);
          right = SceneMap.changePosition(suitableVacancy.right, -colsDiffHalf);
          bottom = takePositionsFromLast(top, rect.rows);
          left = takePositionsFromLast(right, rect.cols);
        }
        vacanciesManager.removeClosedVacancy(vacancyIndex);
        return { top, bottom, right, left };
      };

      const edgeVacanciesByEdge = {
        [TOP]: vacanciesManager.topEdgeVacancies,
        [BOTTOM]: vacanciesManager.bottomEdgeVacancies,
        [RIGHT]: vacanciesManager.rightEdgeVacancies,
        [LEFT]: vacanciesManager.leftEdgeVacancies,
      };

      const pickEdgeVacancy = (
        rect: TagRectT,
        edge: EDGE,
        { force = false, threshold = 0.5 } = {},
      ) => {
        const vacancies = edgeVacanciesByEdge[edge];

        const baseSize =
          edge === TOP || edge === BOTTOM ? rect.cols : rect.rows;
        const oppositeSize =
          edge === TOP || edge === BOTTOM ? rect.rows : rect.cols;
        const takePositionsFromFirst = SceneMap.takePositionsFromFirst;
        const takePositionsFromLast = SceneMap.takePositionsFromLast;
        const countPositions = SceneMap.countPositions;

        const howOpposStandForEdge = (begin: number, end: number) =>
          countPositions(begin, end) / oppositeSize;

        const howBaseStandForEdge = (begin?: number, end?: number): number => {
          if (typeof begin === 'undefined' || typeof end === 'undefined') {
            return 1;
          }
          return countPositions(begin, end) / baseSize;
        };

        const loopParams: LoopParamsT = {
          [ASC]: {
            from: 0,
            condition: (vacancyIndex: number) => {
              return vacancyIndex < vacancies.length;
            },
            diff: 1,
          },
          [DESC]: {
            from: vacancies.length - 1,
            condition: (vacancyIndex: number) => {
              return vacancyIndex >= 0;
            },
            diff: -1,
          },
        };
        const { from, condition, diff } =
          loopParams[pickingEdgeVacancyStrategy];

        for (let i = from; condition(i); i += diff) {
          const vacancy = vacancies[i];

          if (vacancy.baseSize >= baseSize) {
            // кладем в угол, который ближе к центру коорд
            switch (edge) {
              case TOP: {
                const preparedTopEdgeVacancy =
                  vacancy as PreparedTopEdgeVacancyT;
                if (
                  !force &&
                  howOpposStandForEdge(
                    preparedTopEdgeVacancy.bottom,
                    preparedTopEdgeVacancy.topEdge,
                  ) < threshold
                ) {
                  continue;
                }
                let right;
                let left;
                if (
                  !Number.isFinite(preparedTopEdgeVacancy.right) &&
                  !Number.isFinite(preparedTopEdgeVacancy.left)
                ) {
                  const half = baseSize / 2;
                  left = Math.ceil(-half);
                  right = Math.ceil(half);
                } else {
                  if (
                    Math.abs(preparedTopEdgeVacancy.right) >
                    Math.abs(preparedTopEdgeVacancy.left)
                  ) {
                    left = preparedTopEdgeVacancy.left;
                    right = takePositionsFromFirst(left, baseSize);

                    if (
                      !force &&
                      howBaseStandForEdge(
                        left,
                        preparedTopEdgeVacancy.rightEdge,
                      ) < threshold
                    ) {
                      continue;
                    }
                  } else {
                    right = preparedTopEdgeVacancy.right;
                    left = takePositionsFromLast(right, baseSize);

                    if (
                      !force &&
                      howBaseStandForEdge(
                        preparedTopEdgeVacancy.leftEdge,
                        right,
                      ) < threshold
                    ) {
                      continue;
                    }
                  }
                }
                return {
                  top: takePositionsFromFirst(
                    preparedTopEdgeVacancy.bottom,
                    oppositeSize,
                  ),
                  right,
                  bottom: vacancy.bottom,
                  left,
                };
              }
              case BOTTOM: {
                const preparedBottomEdgeVacancy =
                  vacancy as PreparedBottomEdgeVacancyT;
                if (
                  !force &&
                  howOpposStandForEdge(
                    preparedBottomEdgeVacancy.bottomEdge,
                    preparedBottomEdgeVacancy.top,
                  ) < threshold
                ) {
                  continue;
                }
                let right;
                let left;
                if (
                  !Number.isFinite(preparedBottomEdgeVacancy.right) &&
                  !Number.isFinite(preparedBottomEdgeVacancy.left)
                ) {
                  const half = baseSize / 2;
                  left = Math.ceil(-half);
                  right = Math.ceil(half);
                } else {
                  if (
                    Math.abs(preparedBottomEdgeVacancy.right) >
                    Math.abs(preparedBottomEdgeVacancy.left)
                  ) {
                    left = preparedBottomEdgeVacancy.left;
                    right = takePositionsFromFirst(left, baseSize);

                    if (
                      !force &&
                      howBaseStandForEdge(
                        left,
                        preparedBottomEdgeVacancy.rightEdge,
                      ) < threshold
                    ) {
                      continue;
                    }
                  } else {
                    right = preparedBottomEdgeVacancy.right;
                    left = takePositionsFromLast(right, baseSize);

                    if (
                      !force &&
                      howBaseStandForEdge(
                        preparedBottomEdgeVacancy.leftEdge,
                        right,
                      ) < threshold
                    ) {
                      continue;
                    }
                  }
                }
                return {
                  top: preparedBottomEdgeVacancy.top,
                  right,
                  bottom: takePositionsFromLast(
                    preparedBottomEdgeVacancy.top,
                    oppositeSize,
                  ),
                  left,
                };
              }
              case RIGHT: {
                const preparedRightEdgeVacancy =
                  vacancy as PreparedRightEdgeVacancyT;
                if (
                  !force &&
                  howOpposStandForEdge(
                    preparedRightEdgeVacancy.left,
                    preparedRightEdgeVacancy.rightEdge,
                  ) < threshold
                ) {
                  continue;
                }
                let top;
                let bottom;
                if (
                  !Number.isFinite(preparedRightEdgeVacancy.bottom) &&
                  !Number.isFinite(preparedRightEdgeVacancy.top)
                ) {
                  const half = baseSize / 2;
                  top = Math.ceil(half);
                  bottom = Math.ceil(-half);
                } else {
                  if (
                    Math.abs(preparedRightEdgeVacancy.bottom) >
                    Math.abs(preparedRightEdgeVacancy.top)
                  ) {
                    top = preparedRightEdgeVacancy.top;
                    bottom = takePositionsFromLast(top, baseSize);

                    if (
                      !force &&
                      howBaseStandForEdge(
                        preparedRightEdgeVacancy.bottomEdge,
                        top,
                      ) < threshold
                    ) {
                      continue;
                    }
                  } else {
                    bottom = preparedRightEdgeVacancy.bottom;
                    top = takePositionsFromFirst(bottom, baseSize);

                    if (
                      !force &&
                      howBaseStandForEdge(
                        bottom,
                        preparedRightEdgeVacancy.topEdge,
                      ) < threshold
                    ) {
                      continue;
                    }
                  }
                }
                return {
                  top,
                  right: takePositionsFromFirst(
                    preparedRightEdgeVacancy.left,
                    oppositeSize,
                  ),
                  bottom,
                  left: preparedRightEdgeVacancy.left,
                };
              }
              case LEFT: {
                const preparedLeftEdgeVacancy =
                  vacancy as PreparedLeftEdgeVacancyT;
                if (
                  !force &&
                  howOpposStandForEdge(
                    preparedLeftEdgeVacancy.leftEdge,
                    preparedLeftEdgeVacancy.right,
                  ) < threshold
                ) {
                  continue;
                }
                let top;
                let bottom;
                if (
                  !Number.isFinite(preparedLeftEdgeVacancy.bottom) &&
                  !Number.isFinite(preparedLeftEdgeVacancy.top)
                ) {
                  const half = baseSize / 2;
                  top = Math.ceil(half);
                  bottom = Math.ceil(-half);
                } else {
                  if (
                    Math.abs(preparedLeftEdgeVacancy.bottom) >
                    Math.abs(preparedLeftEdgeVacancy.top)
                  ) {
                    top = preparedLeftEdgeVacancy.top;
                    bottom = takePositionsFromLast(top, baseSize);

                    if (
                      !force &&
                      howBaseStandForEdge(
                        preparedLeftEdgeVacancy.bottomEdge,
                        top,
                      ) < threshold
                    ) {
                      continue;
                    }
                  } else {
                    bottom = preparedLeftEdgeVacancy.bottom;
                    top = takePositionsFromFirst(bottom, baseSize);

                    if (
                      !force &&
                      howBaseStandForEdge(
                        bottom,
                        preparedLeftEdgeVacancy.topEdge,
                      ) < threshold
                    ) {
                      continue;
                    }
                  }
                }
                return {
                  top,
                  right: preparedLeftEdgeVacancy.right,
                  bottom,
                  left: takePositionsFromLast(
                    preparedLeftEdgeVacancy.right,
                    oppositeSize,
                  ),
                };
              }
            }
          }
        }
      };

      const updateSceneMap = (rect: RawPositionedTagRectT) => {
        const affectedPositions: [number, number][] = [];
        const recoverClosedVacanciesState = () => {
          affectedPositions.forEach(position =>
            sceneMap.releasePosition(...position),
          );
        };

        let rectMap;
        if (dataGlyphsMap) {
          const glyphsMap = dataGlyphsMap.find(
            itemMap => itemMap.id === rect.id,
          );
          if (glyphsMap && glyphsMap.map) {
            rectMap = glyphsMapToRectMap(
              glyphsMap.map,
              { rows: rect.rows, cols: rect.cols },
              !!rect.rotate,
            );
          } else if (process.env.NODE_ENV !== 'production') {
            throw new Error('rectMap is empty');
          }
        }

        try {
          const { top, right, bottom, left } = rect;

          let innerRow = 0;
          for (let row = top; row >= bottom; row--) {
            if (row === 0) continue;
            let innerCol = 0;
            for (let col = left; col <= right; col++) {
              if (col === 0) continue;
              if (
                !rectMap ||
                (rectMap[innerRow] && rectMap[innerRow][innerCol])
              ) {
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

        if (options?.drawStepMap) {
          console.clear();
          sceneMap.drawItself();
        }
      };

      const layRect = (rect: RawPositionedTagRectT) => {
        updateSceneMap(rect);
        positionedRectsData.push(rect);
      };

      const placeRectOutsideScene = (rect: TagRectT, edge: EDGE) => {
        const sceneSize = sceneMap.getSceneSize();
        const topBorder = sceneSize[Dimensions.Y];
        const bottomBorder = -sceneSize[Dimensions.MINUS_Y];
        const leftBorder = -sceneSize[Dimensions.MINUS_X];
        const rightBorder = sceneSize[Dimensions.X];

        const takePositionsFromFirst = SceneMap.takePositionsFromFirst;
        const takePositionsFromLast = SceneMap.takePositionsFromLast;
        const next = SceneMap.nextPosition;
        const prev = SceneMap.prevPosition;

        // придерживаемся правого края, можно рандом
        switch (edge) {
          case TOP: {
            const bottom = next(topBorder);
            const rectPos = {
              top: takePositionsFromFirst(bottom, rect.rows),
              right: rightBorder,
              bottom,
              left: takePositionsFromLast(rightBorder, rect.cols),
            };
            return rectPos;
          }
          case RIGHT: {
            const left = next(rightBorder);
            const rectPos = {
              top: takePositionsFromFirst(bottomBorder, rect.rows),
              right: takePositionsFromFirst(left, rect.cols),
              bottom: bottomBorder,
              left,
            };
            return rectPos;
          }
          case BOTTOM: {
            const top = prev(bottomBorder);
            const rectPos = {
              top,
              right: takePositionsFromFirst(leftBorder, rect.cols),
              bottom: takePositionsFromLast(top, rect.rows),
              left: leftBorder,
            };
            return rectPos;
          }
          case LEFT: {
            const right = prev(leftBorder);
            const rectPos = {
              top: topBorder,
              right,
              bottom: takePositionsFromLast(topBorder, rect.rows),
              left: takePositionsFromLast(right, rect.cols),
            };
            return rectPos;
          }
        }
      };

      const updateVacancies = (isShouldCreateVacancyIfNoSuchKind: boolean) => {
        vacanciesManager.buildVacanciesMap(isShouldCreateVacancyIfNoSuchKind);
        const { minRectCols, minRectRows } = calcMinRectsSizes(rectsData);

        const vacancyApprover = (vacancy: ClosedVacancyT | void) => {
          return (
            !!vacancy &&
            isVacancyLargeEnoughToFitRect(
              { cols: minRectCols, rows: minRectRows },
              vacancy,
            )
          );
        };

        // TBD it seems to be useless
        vacanciesManager.filterUnsuitableClosedVacancies(vacancyApprover);

        if (options?.drawVacanciesMap) {
          const sceneSize = sceneMap.getSceneSize();
          vacanciesManager.topEdgeVacancies.forEach(v =>
            drawVacancy(v, sceneSize),
          );
          vacanciesManager.bottomEdgeVacancies.forEach(v =>
            drawVacancy(v, sceneSize),
          );
          vacanciesManager.rightEdgeVacancies.forEach(v =>
            drawVacancy(v, sceneSize),
          );
          vacanciesManager.leftEdgeVacancies.forEach(v =>
            drawVacancy(v, sceneSize),
          );

          vacanciesManager.closedVacancies.forEach(vacancy => {
            if (!vacancy) {
              return;
            }
            drawVacancy(vacancy, sceneSize);
          });
          //console.log('--------------------------------------------------------------------------------------------');
        }
      };

      const performWork = (rect: TagRectT, index: number): void => {
        if (index === 0) {
          const { rows, cols } = rect;
          const laidRectData = {
            top: Math.ceil(rows / 2),
            right: Math.ceil(cols / 2),
            bottom: -Math.ceil(rows / 2),
            left: -Math.ceil(cols / 2),
          };
          layRect(creatLaidRect(rect, laidRectData));
          return;
        }

        const isShouldCreateVacancyIfNoSuchKind: boolean =
          index < (options?.addIfEmptyIndex ?? 5);

        const tryPickClosedVacancy = (): boolean => {
          let rectPosition = pickClosedVacancy(rect);
          if (!rectPosition && needVacanciesRefresh) {
            updateVacancies(isShouldCreateVacancyIfNoSuchKind);
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

          return false;
        };

        if (tryPickClosedVacancy()) {
          return;
        }

        const INIT_THRESHOLD = 0.75;
        const MAX_THRESHOLD = 0.51;
        const THRESHOLD_CHANGING_STEP = 0.25;

        for (
          let threshold = INIT_THRESHOLD;
          threshold >= MAX_THRESHOLD;
          threshold -= THRESHOLD_CHANGING_STEP
        ) {
          const spentEdges = [];
          for (let i = 0; i < edgesOrder.length; i++) {
            const edge = edgesManager.getNextVacanciesEdge(spentEdges);
            spentEdges.push(edge);
            const force = threshold <= 0;
            const rectPosition = pickEdgeVacancy(rect, edge, {
              force,
              threshold,
            });

            if (rectPosition) {
              try {
                layRect(creatLaidRect(rect, rectPosition));
                updateVacancies(isShouldCreateVacancyIfNoSuchKind);
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
            updateVacancies(isShouldCreateVacancyIfNoSuchKind);
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
      };

      const finish = () => {
        if (options?.drawFinishMap) {
          sceneMap.drawItself();
        }
        positionedRectsData.forEach(tagData => {
          const top = tagData.top > 0 ? tagData.top : tagData.top + 1;
          const bottom =
            tagData.bottom > 0 ? tagData.bottom - 1 : tagData.bottom;
          const right = tagData.right > 0 ? tagData.right : tagData.right + 1;
          const left = tagData.left > 0 ? tagData.left - 1 : tagData.left;

          Object.assign(tagData, {
            rectTop: SceneMap.sceneMapUnitsToRect(top, sceneMapUnitSize),
            rectBottom: SceneMap.sceneMapUnitsToRect(bottom, sceneMapUnitSize),
            rectRight: SceneMap.sceneMapUnitsToRect(right, sceneMapUnitSize),
            rectLeft: SceneMap.sceneMapUnitsToRect(left, sceneMapUnitSize),
          });
        });

        resolve(positionedRectsData as PositionedTagRectT[]);
      };

      splitAndPerformWork<void>(createWorkGenerator(rectsData, performWork), 50)
        .then(finish)
        .catch(error => reject(error));
    } catch (e) {
      reject(e);
    }
  });
}
