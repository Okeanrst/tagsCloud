import { SCENE_MAP_RESOLUTION } from 'constants/index';
import { splitAndPerformWork } from '../common/splitAndPerformWork';
import { SceneMap, Dimensions } from './sceneMap';
import EdgesManager, { edgesOrder, EDGE } from './edgesManager';
import VacanciesManager, { drawVacancy } from './vacanciesManager';
import IntersectionError from './IntersectionError';
import { getRectAreaOfRectMap } from '../getGlyphsMap';

import { IdRectAreaMapT, RectMapT } from 'types/types';
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

type RawPositionedTagRectT = TagRectT & RectPositionT & { rotate: boolean };

type LoopOrderParamT = {
  from: number;
  condition: (vacancyIndex: number) => boolean;
  diff: number;
};

type LoopParamsT = {
  [ASC]: LoopOrderParamT;
  [DESC]: LoopOrderParamT;
};

function creatRawPositionedTagRect(
  rect: TagRectT,
  { top, right, bottom, left }: RectPositionT,
  isRotated: boolean,
): RawPositionedTagRectT {
  if (process.env.NODE_ENV !== 'production' && (top < bottom || left > right)) {
    throw new Error(
      'creatRawPositionedTagRect error: top < bottom || left > right',
    );
  }
  return { ...rect, top, right, bottom, left, rotate: isRotated };
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

const rotateRectArea = (rectArea: RectAreaT) => {
  return { rows: rectArea.cols, cols: rectArea.rows };
};

export function calcTagsPositions(
  tagsData: ReadonlyArray<PreparedTagDataT>,
  tagsRectAreasMaps: ReadonlyArray<IdRectAreaMapT>,
  options?: Options,
): Promise<PositionedTagRectT[]> {
  return new Promise((resolve, reject) => {
    const rectAreaMapByIdMap = new Map(
      tagsRectAreasMaps.map(({ id, map, mapMeta }) => [id, { map, mapMeta }]),
    );

    try {
      const {
        pickingClosedVacancyStrategy = DESC,
        pickingEdgeVacancyStrategy = ASC,
      } = options ?? {};

      const sceneMapUnitSize = SCENE_MAP_RESOLUTION;

      const rectsData: ReadonlyArray<TagRectT> = tagsData
        .map(tagData => {
          const { map: rectAreaMap } = rectAreaMapByIdMap.get(tagData.id) ?? {};

          if (!rectAreaMap) {
            throw new Error(
              `rectAreaMap for rect with id: "${tagData.id}" is not found`,
            );
          }
          const { rows, cols } = getRectAreaOfRectMap(rectAreaMap);

          return {
            ...tagData,
            square: rows * cols,
          };
        })
        .sort((a, b) => b.square - a.square);

      const sceneMap = new SceneMap();
      const vacanciesManager = new VacanciesManager(sceneMap);
      const edgesManager = new EdgesManager();

      const positionedRectsData: RawPositionedTagRectT[] = [];

      const pickClosedVacancy = (rectArea: RectAreaT): RectPositionT | void => {
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
            isVacancyLargeEnoughToFitRect(rectArea, possiblySuitableVacancy)
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

        // vacancy square to rectArea square ratio limit to put at the center of a vacancy
        const SQUARE_RATION_LIMIT = 1.9;

        let left: number;
        let right: number;
        let top: number;
        let bottom: number;

        const rectAreaSquare = rectArea.rows * rectArea.cols;

        if (suitableVacancy.square / rectAreaSquare > SQUARE_RATION_LIMIT) {
          // from edge
          if (
            Math.abs(suitableVacancy.right) > Math.abs(suitableVacancy.left)
          ) {
            left = suitableVacancy.left;
            right = takePositionsFromFirst(suitableVacancy.left, rectArea.cols);
          } else {
            right = suitableVacancy.right;
            left = takePositionsFromLast(right, rectArea.cols);
          }
          if (
            Math.abs(suitableVacancy.bottom) > Math.abs(suitableVacancy.top)
          ) {
            top = suitableVacancy.top;
            bottom = takePositionsFromLast(top, rectArea.rows);
          } else {
            bottom = suitableVacancy.bottom;
            top = takePositionsFromFirst(bottom, rectArea.rows);
          }
        } else {
          // center
          const rowsDiffHalf = Math.round(
            (suitableVacancy.rows - rectArea.rows) / 2,
          );
          const colsDiffHalf = Math.round(
            (suitableVacancy.cols - rectArea.cols) / 2,
          );
          top = SceneMap.changePosition(suitableVacancy.top, -rowsDiffHalf);
          right = SceneMap.changePosition(suitableVacancy.right, -colsDiffHalf);
          bottom = takePositionsFromLast(top, rectArea.rows);
          left = takePositionsFromLast(right, rectArea.cols);
        }
        vacanciesManager.removeClosedVacancy(vacancyIndex);
        return { top, bottom, right, left };
      };

      const getEdgeVacanciesByEdge = (edge: EDGE) => {
        return {
          [TOP]: () => vacanciesManager.topEdgeVacancies,
          [BOTTOM]: () => vacanciesManager.bottomEdgeVacancies,
          [RIGHT]: () => vacanciesManager.rightEdgeVacancies,
          [LEFT]: () => vacanciesManager.leftEdgeVacancies,
        }[edge]();
      };

      const pickEdgeVacancy = (
        rectArea: RectAreaT,
        edge: EDGE,
        { force = false, threshold = 0.5 } = {},
      ) => {
        const vacancies = getEdgeVacanciesByEdge(edge);

        const baseSize =
          edge === TOP || edge === BOTTOM ? rectArea.cols : rectArea.rows;
        const oppositeSize =
          edge === TOP || edge === BOTTOM ? rectArea.rows : rectArea.cols;
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
            // put in the corner that is closer to the center of the coordinates
            switch (edge) {
              case TOP: {
                const preparedTopEdgeVacancy =
                  vacancy as PreparedTopEdgeVacancyT;
                if (
                  !force &&
                  howOpposStandForEdge(
                    preparedTopEdgeVacancy.bottom,
                    preparedTopEdgeVacancy.topEdge + 1,
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
                        preparedTopEdgeVacancy.rightEdge, // TODO + 1
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
                        preparedTopEdgeVacancy.leftEdge, // TODO - 1,
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
                    preparedBottomEdgeVacancy.bottomEdge - 1,
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
                        preparedBottomEdgeVacancy.rightEdge, // TODO +1
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
                        preparedBottomEdgeVacancy.leftEdge, // TODO -1
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
                    preparedRightEdgeVacancy.rightEdge + 1,
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
                        preparedRightEdgeVacancy.bottomEdge, // TODO -1
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
                        preparedRightEdgeVacancy.topEdge, // TODO +1
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
                    preparedLeftEdgeVacancy.leftEdge - 1,
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
                        preparedLeftEdgeVacancy.bottomEdge, // TODO -1
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
                        preparedLeftEdgeVacancy.topEdge, // TODO +1
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

      const updateSceneMap = (
        rectPosition: RectPositionT,
        rectAreaMap: RectMapT,
        isRectAreaRotated: boolean,
      ) => {
        const affectedPositions: [number, number][] = [];
        const recoverClosedVacanciesState = () => {
          affectedPositions.forEach(position =>
            sceneMap.releasePosition(...position),
          );
        };

        const rectArea = getRectAreaOfRectMap(rectAreaMap);

        const logDebugInformation = (mainInformation: string[] = []) => {
          // eslint-disable-next-line no-console
          console.log('updateSceneMap --------start');
          mainInformation.forEach(information => {
            // eslint-disable-next-line no-console
            console.log(information);
          });
          // eslint-disable-next-line no-console
          console.log('rectPosition:', rectPosition);
          // eslint-disable-next-line no-console
          console.log('rectAreaMap:', rectAreaMap);
          // eslint-disable-next-line no-console
          console.log('rectArea:', rectArea);
          // eslint-disable-next-line no-console
          console.log('isRectAreaRotated:', isRectAreaRotated);
          // eslint-disable-next-line no-console
          console.log('updateSceneMap --------end');
        };

        const getDataAtPosition = (row: number, column: number) => {
          if (
            process.env.NODE_ENV !== 'production' &&
            !Array.isArray(rectAreaMap[row])
          ) {
            logDebugInformation([
              'getDataAtPosition invariant: try to access rectAreaMap at row is out of range',
              `row: ${row}`,
            ]);
          }
          if (
            process.env.NODE_ENV !== 'production' &&
            Array.isArray(rectAreaMap[row]) &&
            rectAreaMap[row].length <= column
          ) {
            logDebugInformation([
              'getDataAtPosition invariant: try to access rectAreaMap at row is out of range',
              `row: ${row}, column: ${column}`,
            ]);
          }
          return rectAreaMap[row] && rectAreaMap[row][column];
        };

        try {
          const { top, right, bottom, left } = rectPosition;

          let innerRow = 0;
          let lastInnerRowPlusOne = 0;
          let lastInnerColPlusOne = 0;
          for (let row = top; row >= bottom; row--) {
            if (row === 0) {
              continue;
            }
            let innerCol = 0;
            for (let col = left; col <= right; col++) {
              if (col === 0) {
                continue;
              }

              const rectAreaMapValue = isRectAreaRotated
                ? getDataAtPosition(rectArea.rows - 1 - innerCol, innerRow)
                : getDataAtPosition(innerRow, innerCol);

              if (rectAreaMapValue) {
                sceneMap.setDataAtPosition(col, row);
                affectedPositions.push([col, row]);
              }
              innerCol++;
              lastInnerColPlusOne = innerCol;
            }
            innerRow++;
            lastInnerRowPlusOne = innerRow;
          }

          if (
            process.env.NODE_ENV !== 'production' &&
            ((!isRectAreaRotated &&
              Array.isArray(rectAreaMap[lastInnerRowPlusOne])) ||
              (isRectAreaRotated &&
                Array.isArray(
                  rectAreaMap[rectArea.rows - 1 - lastInnerColPlusOne],
                )))
          ) {
            logDebugInformation(['Not all rectAreaMap rows is used']);
          }
        } catch (err) {
          if (
            process.env.NODE_ENV !== 'production' &&
            err instanceof IntersectionError
          ) {
            logDebugInformation([`IntersectionError: ${err.message}`]);
          }

          if (err instanceof IntersectionError) {
            recoverClosedVacanciesState();
          }
          throw err;
        }

        needVacanciesRebuild = true;

        sceneMap.calcSceneSize();

        if (options?.drawStepMap) {
          sceneMap.drawItself();
        }
      };

      const placeRectOutsideScene = (rectArea: RectAreaT, edge: EDGE) => {
        const sceneSize = sceneMap.getSceneSize();
        const topBorder = sceneSize[Dimensions.Y];
        const bottomBorder = -sceneSize[Dimensions.MINUS_Y];
        const leftBorder = -sceneSize[Dimensions.MINUS_X];
        const rightBorder = sceneSize[Dimensions.X];

        const takePositionsFromFirst = SceneMap.takePositionsFromFirst;
        const takePositionsFromLast = SceneMap.takePositionsFromLast;
        const next = SceneMap.calcNextPositionFromEdge;
        const prev = SceneMap.calcPrevPositionFromPositionEdge;

        // stick to the right edge, we can make it randomly
        switch (edge) {
          case TOP: {
            const bottom = next(topBorder);
            const rectPos = {
              top: takePositionsFromFirst(bottom, rectArea.rows),
              right: rightBorder,
              bottom,
              left: takePositionsFromLast(rightBorder, rectArea.cols),
            };
            return rectPos;
          }
          case RIGHT: {
            const left = next(rightBorder);
            const rectPos = {
              top: takePositionsFromFirst(bottomBorder, rectArea.rows),
              right: takePositionsFromFirst(left, rectArea.cols),
              bottom: bottomBorder,
              left,
            };
            return rectPos;
          }
          case BOTTOM: {
            const top = prev(bottomBorder);
            const rectPos = {
              top,
              right: takePositionsFromFirst(leftBorder, rectArea.cols),
              bottom: takePositionsFromLast(top, rectArea.rows),
              left: leftBorder,
            };
            return rectPos;
          }
          case LEFT: {
            const right = prev(leftBorder);
            const rectPos = {
              top: topBorder,
              right,
              bottom: takePositionsFromLast(topBorder, rectArea.rows),
              left: takePositionsFromLast(right, rectArea.cols),
            };
            return rectPos;
          }
        }
      };

      let needVacanciesRebuild = false;
      const rebuildVacanciesMap = (
        isShouldCreateVacancyIfNoSuchKind: boolean,
      ) => {
        vacanciesManager.buildVacanciesMap(isShouldCreateVacancyIfNoSuchKind);

        // vacanciesManager.filterUnsuitableClosedVacancies(vacancyFilter);

        needVacanciesRebuild = false;

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
          // console.log('--------------------------------------------------------------------------------------------');
        }
      };

      let isPreviousRotated = true;

      const performWork = (rect: TagRectT, index: number): void => {
        const isShouldRotate = !isPreviousRotated;

        const { map: rectAreaMap } = rectAreaMapByIdMap.get(rect.id) ?? {};
        if (!rectAreaMap) {
          throw new Error(
            `rectAreaMap for rect with id: "${rect.id}" is not found`,
          );
        }
        const rectArea = isShouldRotate
          ? rotateRectArea(getRectAreaOfRectMap(rectAreaMap))
          : getRectAreaOfRectMap(rectAreaMap);

        const isRotated = isShouldRotate;

        isPreviousRotated = isRotated;

        if (index === 0) {
          const { rows, cols } = rectArea;

          const top = Math.ceil(rows / 2);
          const right = Math.ceil(cols / 2);
          const bottom = -rows + top;
          const left = -cols + right;

          const rectPosition = { top, right, bottom, left };

          updateSceneMap(rectPosition, rectAreaMap, isRotated);
          positionedRectsData.push(
            creatRawPositionedTagRect(rect, rectPosition, isRotated),
          );

          return;
        }

        const isShouldCreateVacancyIfNoSuchKind: boolean =
          index < (options?.addIfEmptyIndex ?? 5);

        const tryPickClosedVacancy = (): boolean => {
          let rectPosition = pickClosedVacancy(rectArea);
          if (!rectPosition && needVacanciesRebuild) {
            rebuildVacanciesMap(isShouldCreateVacancyIfNoSuchKind);
            rectPosition = pickClosedVacancy(rectArea);
          }

          if (rectPosition) {
            try {
              updateSceneMap(rectPosition, rectAreaMap, isRotated);
              positionedRectsData.push(
                creatRawPositionedTagRect(rect, rectPosition, isRotated),
              );
            } catch (e) {
              if (e instanceof IntersectionError) {
                if (needVacanciesRebuild) {
                  rebuildVacanciesMap(isShouldCreateVacancyIfNoSuchKind);
                }
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
            const rectPosition = pickEdgeVacancy(rectArea, edge, {
              force,
              threshold,
            });

            if (rectPosition) {
              try {
                updateSceneMap(rectPosition, rectAreaMap, isRotated);
                positionedRectsData.push(
                  creatRawPositionedTagRect(rect, rectPosition, isRotated),
                );

                rebuildVacanciesMap(isShouldCreateVacancyIfNoSuchKind);
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
          // place rect outside the Scene
          const sizeRatio = rectArea.cols / rectArea.rows;
          const edge = edgesManager.getNextEdge(sizeRatio);

          const rectPosition = placeRectOutsideScene(rectArea, edge);

          try {
            updateSceneMap(rectPosition, rectAreaMap, isRotated);
            positionedRectsData.push(
              creatRawPositionedTagRect(rect, rectPosition, isRotated),
            );

            rebuildVacanciesMap(isShouldCreateVacancyIfNoSuchKind);
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
        positionedRectsData.forEach((tagData) => {
          const top = tagData.top > 0 ? tagData.top : tagData.top + 1;
          const bottom =
            tagData.bottom > 0 ? tagData.bottom - 1 : tagData.bottom;
          const right = tagData.right > 0 ? tagData.right : tagData.right + 1;
          const left = tagData.left > 0 ? tagData.left - 1 : tagData.left;

          const { mapMeta: rectAreaMapMeta } =
            rectAreaMapByIdMap.get(tagData.id) ?? {};
          let marginRight;
          let marginLeft;
          let marginTop;
          let marginBottom;

          if (tagData.rotate) {
            // clockwise
            marginRight = rectAreaMapMeta?.marginTop ?? 0;
            marginLeft = rectAreaMapMeta?.marginBottom ?? 0;
            marginTop = rectAreaMapMeta?.marginLeft ?? 0;
            marginBottom = rectAreaMapMeta?.marginRight ?? 0;
          } else {
            ({
              marginRight = 0,
              marginLeft = 0,
              marginTop = 0,
              marginBottom = 0,
            } = rectAreaMapMeta ?? {});
          }

          Object.assign(tagData, {
            rectTop:
              SceneMap.sceneMapUnitsToRect(top, sceneMapUnitSize) +
              marginTop * SCENE_MAP_RESOLUTION,
            rectBottom:
              SceneMap.sceneMapUnitsToRect(bottom, sceneMapUnitSize) -
              marginBottom * SCENE_MAP_RESOLUTION,
            rectRight:
              SceneMap.sceneMapUnitsToRect(right, sceneMapUnitSize) +
              marginRight * SCENE_MAP_RESOLUTION,
            rectLeft:
              SceneMap.sceneMapUnitsToRect(left, sceneMapUnitSize) -
              marginLeft * SCENE_MAP_RESOLUTION,
          });
        });

        resolve(positionedRectsData as PositionedTagRectT[]);
      };

      splitAndPerformWork<void>(createWorkGenerator(rectsData, performWork), 50)
        .then(finish)
        .catch(error => reject(error));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      reject(e);
    }
  });
}
