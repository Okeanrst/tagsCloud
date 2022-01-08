import {
  PickingStrategies,
  SortingClosedVacanciesStrategies,
  SortingEdgeVacanciesStrategies
} from 'constants/index';
import { splitAndPerformWork } from '../common/splitAndPerformWork';
import { formRectAreaMapKey } from '../prepareRectAreasMaps';
import { SceneMap, Dimensions, PositionT } from './sceneMap';
import { EdgesManager, edgesOrder, EDGE } from './edgesManager';
import { VacanciesManager, drawVacancy } from './vacanciesManager';
import IntersectionError from './IntersectionError';
import { getRectAreaOfRectMap } from '../getGlyphsMap';

import { IdRectAreaMapT, TwoDimensionalMapT } from 'types/types';
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

export type Options = Readonly<{
  pickingClosedVacancyStrategy?: PickingStrategies;
  pickingEdgeVacancyStrategy?: PickingStrategies;
  drawFinishMap?: boolean;
  addIfEmptyIndex?: number;
  drawStepMap?: boolean;
  drawVacanciesMap?: boolean;
  shouldTryAnotherAngle?: boolean;
  sortingClosedVacanciesStrategy?: SortingClosedVacanciesStrategies;
  sortingEdgeVacanciesStrategy?: SortingEdgeVacanciesStrategies;
  sceneMapResolution: number;
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

type PerformWorkT = (
  rect: TagRectT,
  parameters: {
    index: number;
    shouldTryAnotherAngle?: boolean;
    isRotated: boolean;
  },
) => { status: true; isRotated: boolean } | { status: false };

const mapRectAreaMapOnRectPosition = (
  rectPosition: RectPositionT,
  rectAreaMap: TwoDimensionalMapT,
  isRectAreaRotated: boolean,
) => {
  const mappedPositions: [number, number, any][] = [];
  const rectArea = getRectAreaOfRectMap(rectAreaMap);

  const logDebugInformation = (mainInformation: string[] = []) => {
    if (['production', 'test'].includes(process.env.NODE_ENV)) {
      return;
    }

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
      !Array.isArray(rectAreaMap[row])
    ) {
      logDebugInformation([
        'getDataAtPosition invariant: try to access rectAreaMap at row is out of range',
        `row: ${row}`,
      ]);
      throw new Error('Try to access rectAreaMap at row is out of range');
    }
    if (
      Array.isArray(rectAreaMap[row]) &&
      rectAreaMap[row].length <= column
    ) {
      logDebugInformation([
        'getDataAtPosition invariant: try to access rectAreaMap at row is out of range',
        `row: ${row}, column: ${column}`,
      ]);
      throw new Error('Try to access rectAreaMap at row is out of range');
    }
    return rectAreaMap[row] && rectAreaMap[row][column];
  };

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

      mappedPositions.push([col, row, rectAreaMapValue]);
      innerCol++;
      lastInnerColPlusOne = innerCol;
    }
    innerRow++;
    lastInnerRowPlusOne = innerRow;
  }

  if (
    ((!isRectAreaRotated &&
        Array.isArray(rectAreaMap[lastInnerRowPlusOne])) ||
      (isRectAreaRotated &&
        Array.isArray(
          rectAreaMap[rectArea.rows - 1 - lastInnerColPlusOne],
        )))
  ) {
    logDebugInformation(['Not all rectAreaMap rows is used']);
  }
  return mappedPositions;
};

export const releaseRectAreaPositionsOnSceneMap = (
  sceneMapPositions: PositionT[],
  targetTagPosition: PositionedTagRectT,
  rectAreaMap: TwoDimensionalMapT,
) => {
  const sceneMap = new SceneMap(sceneMapPositions);

  const mappedPositions = mapRectAreaMapOnRectPosition(targetTagPosition, rectAreaMap, targetTagPosition.rotate);

  mappedPositions.forEach((mappedPosition) => {
    if (mappedPosition[2]) {
      const [x, y] = mappedPosition;
      sceneMap.releasePosition(x, y);
    }
  });
  return sceneMap.toPositions();
};

function creatRawPositionedTagRect(
  rect: TagRectT,
  { top, right, bottom, left }: RectPositionT,
  isRotated: boolean,
): RawPositionedTagRectT {
  if (
    !['production', 'test'].includes(process.env.NODE_ENV) &&
    (top < bottom || left > right)
  ) {
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

const pickClosedVacancy = (
  rectArea: RectAreaT,
  vacancies: (ClosedVacancyT | void)[],
  { pickingStrategy }: {pickingStrategy: PickingStrategies}
): { rectPosition: RectPositionT, vacancyIndex: number } | void => {
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
    loopParams[pickingStrategy];

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

  const countPositionsFroward = SceneMap.countPositionsFroward;
  const countPositionsBackwards = SceneMap.countPositionsBackwards;

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
      right = countPositionsFroward(suitableVacancy.left, rectArea.cols);
    } else {
      right = suitableVacancy.right;
      left = countPositionsBackwards(right, rectArea.cols);
    }
    if (
      Math.abs(suitableVacancy.bottom) > Math.abs(suitableVacancy.top)
    ) {
      top = suitableVacancy.top;
      bottom = countPositionsBackwards(top, rectArea.rows);
    } else {
      bottom = suitableVacancy.bottom;
      top = countPositionsFroward(bottom, rectArea.rows);
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
    bottom = countPositionsBackwards(top, rectArea.rows);
    left = countPositionsBackwards(right, rectArea.cols);
  }
  return { rectPosition: { top, bottom, right, left }, vacancyIndex };
};

function createWorkGenerator(
  rectsData: ReadonlyArray<TagRectT>,
  performWork: PerformWorkT,
): () => Generator<ReturnType<PerformWorkT>, any, ReturnType<PerformWorkT>> {
  return function* workGenerator() {
    let isPreviousRotated = true;
    for (let i = 0; i < rectsData.length; i++) {
      const result: ReturnType<PerformWorkT> = yield performWork(rectsData[i], {
        index: i,
        shouldTryAnotherAngle: true,
        isRotated: !isPreviousRotated,
      });
      if (result && !result.status) {
        throw new Error('performWork return status false');
      } else if (result) {
        isPreviousRotated = result.isRotated;
      }
    }
  };
}

const rotateRectArea = (rectArea: RectAreaT) => {
  return { rows: rectArea.cols, cols: rectArea.rows };
};

export function calcTagsPositions(
  tagsData: ReadonlyArray<PreparedTagDataT>,
  tagsRectAreasMaps: ReadonlyArray<IdRectAreaMapT>,
  sceneMapPositions: PositionT[],
  options: Options,
): Promise<{
  tagsPositions: PositionedTagRectT[];
  sceneMapPositions: PositionT[];
  vacancies: {
    closedVacancies: ClosedVacancyT[];
    topEdgeVacancies: PreparedTopEdgeVacancyT[];
    bottomEdgeVacancies: PreparedBottomEdgeVacancyT[];
    leftEdgeVacancies: PreparedLeftEdgeVacancyT[];
    rightEdgeVacancies: PreparedRightEdgeVacancyT[];
  };
}> {
  return new Promise((resolve, reject) => {
    const rectAreaMapByKey = new Map(
      tagsRectAreasMaps.map(({ key, map, mapMeta }) => [key, { map, mapMeta }]),
    );

    const isFromScratch = !sceneMapPositions.length;

    try {
      const {
        pickingClosedVacancyStrategy = DESC,
        pickingEdgeVacancyStrategy = ASC,
        sortingEdgeVacanciesStrategy,
        sortingClosedVacanciesStrategy,
        sceneMapResolution: sceneMapUnitSize,
      } = options;

      const rectsData: ReadonlyArray<TagRectT> = tagsData
        .map(tagData => {
          const { map: rectAreaMap } = rectAreaMapByKey.get(formRectAreaMapKey(tagData.label, tagData.fontSize)) ?? {};

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

      const sceneMap = new SceneMap(sceneMapPositions);
      const vacanciesManager = new VacanciesManager(sceneMap, {
        sortingEdgeVacanciesStrategy,
        sortingClosedVacanciesStrategy,
        shouldCreateVacancyIfNoSuchKind: 0 < (options?.addIfEmptyIndex ?? 5),
      });
      if (!isFromScratch) {
        vacanciesManager.buildVacanciesMap();
      }
      const edgesManager = new EdgesManager();

      const positionedRectsData: RawPositionedTagRectT[] = [];

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

        const rowsToColsRation = rectArea.rows / rectArea.cols;

        const baseSize =
          edge === TOP || edge === BOTTOM ? rectArea.cols : rectArea.rows;
        const oppositeSize =
          edge === TOP || edge === BOTTOM ? rectArea.rows : rectArea.cols;
        const countPositionsFroward = SceneMap.countPositionsFroward;
        const countPositionsBackwards = SceneMap.countPositionsBackwards;
        const countPositions = SceneMap.countPositions;

        const howOppositeSizeStandForEdge = (begin: number, end: number) =>
          countPositions(begin, end) / oppositeSize;

        const howBaseSizeStandForEdge = (begin?: number, end?: number): number => {
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

          if (vacancy.baseSize < baseSize) {
            continue;
          }

          let top;
          let bottom;
          let right;
          let left;

          // put in the corner that is closer to the center of the coordinates
          switch (edge) {
            case TOP: {
              const preparedTopEdgeVacancy = vacancy as PreparedTopEdgeVacancyT;
              // the case of shouldCreateVacancyIfNoSuchKind condition
              const isVacancyOutsideScene = preparedTopEdgeVacancy.topEdgeRow < preparedTopEdgeVacancy.bottom;

              if (!force && isVacancyOutsideScene && rowsToColsRation > 1) {
                // so as not to put the rect perpendicular to the scene edge
                continue;
              }

              if (
                !isVacancyOutsideScene &&
                !force &&
                howOppositeSizeStandForEdge(
                  preparedTopEdgeVacancy.bottom,
                  preparedTopEdgeVacancy.topEdgeRow,
                ) < threshold
              ) {
                continue;
              }

              if (
                !Number.isFinite(preparedTopEdgeVacancy.right) &&
                !Number.isFinite(preparedTopEdgeVacancy.left)
              ) {
                // on either side of 0
                const half = baseSize / 2;
                left = Math.ceil(-half);
                right = countPositionsFroward(left, baseSize);
              } else {
                if (
                  Math.abs(preparedTopEdgeVacancy.right) >
                  Math.abs(preparedTopEdgeVacancy.left)
                ) {
                  // right is infinite so stick the left edgeVacancy side
                  left = preparedTopEdgeVacancy.left;

                  if (
                    !force &&
                    howBaseSizeStandForEdge(
                      left,
                      preparedTopEdgeVacancy.rightEdgeColumn,
                    ) < threshold
                  ) {
                    continue;
                  }
                  right = countPositionsFroward(left, baseSize);
                } else {
                  // to the right edgeVacancy side
                  right = preparedTopEdgeVacancy.right;

                  if (
                    !force &&
                    howBaseSizeStandForEdge(
                      preparedTopEdgeVacancy.leftEdgeColumn,
                      right,
                    ) < threshold
                  ) {
                    // seems strange but it is crucial
                    continue;
                  }
                  left = countPositionsBackwards(right, baseSize);
                }
              }

              if (Number.isFinite(preparedTopEdgeVacancy.bottom)) {
                bottom = preparedTopEdgeVacancy.bottom;
              } else {
                // because vacancy is top edge then both top and bottom are infinite
                const sceneEdges = sceneMap.getSceneEdges();
                bottom = SceneMap.calcNextPositionFromEdge(sceneEdges[Dimensions.MINUS_Y]);
              }
              top = countPositionsFroward(bottom, oppositeSize);
              break;
            }
            case BOTTOM: {
              const preparedBottomEdgeVacancy = vacancy as PreparedBottomEdgeVacancyT;
              const isVacancyOutsideScene = preparedBottomEdgeVacancy.bottomEdgeRow > preparedBottomEdgeVacancy.top;

              if (!force && isVacancyOutsideScene && rowsToColsRation > 1) {
                continue;
              }

              if (
                !isVacancyOutsideScene &&
                !force &&
                howOppositeSizeStandForEdge(
                  preparedBottomEdgeVacancy.bottomEdgeRow,
                  preparedBottomEdgeVacancy.top,
                ) < threshold
              ) {
                continue;
              }

              if (
                !Number.isFinite(preparedBottomEdgeVacancy.right) &&
                !Number.isFinite(preparedBottomEdgeVacancy.left)
              ) {
                const half = baseSize / 2;
                left = Math.ceil(-half);
                right = countPositionsFroward(left, baseSize);
              } else {
                if (
                  Math.abs(preparedBottomEdgeVacancy.right) >
                  Math.abs(preparedBottomEdgeVacancy.left)
                ) {
                  left = preparedBottomEdgeVacancy.left;

                  if (
                    !force &&
                    howBaseSizeStandForEdge(
                      left,
                      preparedBottomEdgeVacancy.rightEdgeColumn,
                    ) < threshold
                  ) {
                    continue;
                  }
                  right = countPositionsFroward(left, baseSize);
                } else {
                  right = preparedBottomEdgeVacancy.right;

                  if (
                    !force &&
                    howBaseSizeStandForEdge(
                      preparedBottomEdgeVacancy.leftEdgeColumn,
                      right,
                    ) < threshold
                  ) {
                    continue;
                  }
                  left = countPositionsBackwards(right, baseSize);
                }
              }

              if (Number.isFinite(vacancy.top)) {
                top = preparedBottomEdgeVacancy.top;
              } else {
                // because vacancy is bottom edge then both top and bottom are infinite
                const sceneEdges = sceneMap.getSceneEdges();
                top = SceneMap.calcPrevPositionFromEdge(sceneEdges[Dimensions.Y]);
              }
              bottom = countPositionsBackwards(top, oppositeSize);
              break;
            }
            case RIGHT: {
              const preparedRightEdgeVacancy = vacancy as PreparedRightEdgeVacancyT;
              const isVacancyOutsideScene = preparedRightEdgeVacancy.rightEdgeColumn < preparedRightEdgeVacancy.left;

              if (!force && isVacancyOutsideScene && rowsToColsRation < 1) {
                continue;
              }

              if (
                !isVacancyOutsideScene &&
                !force &&
                howOppositeSizeStandForEdge(
                  preparedRightEdgeVacancy.left,
                  preparedRightEdgeVacancy.rightEdgeColumn,
                ) < threshold
              ) {
                continue;
              }

              if (
                !Number.isFinite(preparedRightEdgeVacancy.bottom) &&
                !Number.isFinite(preparedRightEdgeVacancy.top)
              ) {
                const half = baseSize / 2;
                top = Math.ceil(half);
                bottom = countPositionsBackwards(top, baseSize);
              } else {
                if (
                  Math.abs(preparedRightEdgeVacancy.bottom) >
                  Math.abs(preparedRightEdgeVacancy.top)
                ) {
                  top = preparedRightEdgeVacancy.top;

                  if (
                    !force &&
                    howBaseSizeStandForEdge(
                      preparedRightEdgeVacancy.bottomEdgeRow,
                      top,
                    ) < threshold
                  ) {
                    continue;
                  }
                  bottom = countPositionsBackwards(top, baseSize);
                } else {
                  bottom = preparedRightEdgeVacancy.bottom;

                  if (
                    !force &&
                    howBaseSizeStandForEdge(
                      bottom,
                      preparedRightEdgeVacancy.topEdgeRow,
                    ) < threshold
                  ) {
                    continue;
                  }
                  top = countPositionsFroward(bottom, baseSize);
                }
              }

              if (Number.isFinite(preparedRightEdgeVacancy.left)) {
                left = preparedRightEdgeVacancy.left;
              } else {
                // because vacancy is right edge then both right and left are infinite
                const sceneEdges = sceneMap.getSceneEdges();
                left = SceneMap.calcNextPositionFromEdge(sceneEdges[Dimensions.MINUS_X]);
              }
              right = countPositionsFroward(left, oppositeSize);
              break;
            }
            case LEFT: {
              const preparedLeftEdgeVacancy = vacancy as PreparedLeftEdgeVacancyT;
              const isVacancyOutsideScene = preparedLeftEdgeVacancy.right < preparedLeftEdgeVacancy.leftEdgeColumn;

              if (!force && isVacancyOutsideScene && rowsToColsRation < 1) {
                continue;
              }

              if (
                !isVacancyOutsideScene &&
                !force &&
                howOppositeSizeStandForEdge(
                  preparedLeftEdgeVacancy.leftEdgeColumn,
                  preparedLeftEdgeVacancy.right,
                ) < threshold
              ) {
                continue;
              }

              if (
                !Number.isFinite(preparedLeftEdgeVacancy.bottom) &&
                !Number.isFinite(preparedLeftEdgeVacancy.top)
              ) {
                const half = baseSize / 2;
                top = Math.ceil(half);
                bottom = countPositionsBackwards(top, baseSize);
              } else {
                if (
                  Math.abs(preparedLeftEdgeVacancy.bottom) >
                  Math.abs(preparedLeftEdgeVacancy.top)
                ) {
                  top = preparedLeftEdgeVacancy.top;
                  if (
                    !force &&
                    howBaseSizeStandForEdge(
                      preparedLeftEdgeVacancy.bottomEdgeRow,
                      top,
                    ) < threshold
                  ) {
                    continue;
                  }
                  bottom = countPositionsBackwards(top, baseSize);
                } else {
                  bottom = preparedLeftEdgeVacancy.bottom;

                  if (
                    !force &&
                    howBaseSizeStandForEdge(
                      bottom,
                      preparedLeftEdgeVacancy.topEdgeRow,
                    ) < threshold
                  ) {
                    continue;
                  }
                  top = countPositionsFroward(bottom, baseSize);
                }
              }

              if (Number.isFinite(preparedLeftEdgeVacancy.right)) {
                right = preparedLeftEdgeVacancy.right;
              } else {
                // because vacancy is left edge then both left and right are infinite
                const sceneEdges = sceneMap.getSceneEdges();
                right = SceneMap.calcPrevPositionFromEdge(sceneEdges[Dimensions.X]);
              }
              left = countPositionsBackwards(right, oppositeSize);
              break;
            }
          }

          return { top, right, bottom, left };
        }
      };

      const updateSceneMap = (
        rectPosition: RectPositionT,
        rectAreaMap: TwoDimensionalMapT,
        isRectAreaRotated: boolean,
      ) => {
        const mappedPositions = mapRectAreaMapOnRectPosition(rectPosition, rectAreaMap, isRectAreaRotated);

        sceneMap.bulkOccupyPosition(mappedPositions.filter(([,, value]) => value));

        vacanciesManager.needVacanciesRebuild = true;

        sceneMap.calcSceneEdges();

        if (options?.drawStepMap) {
          sceneMap.drawItself();
        }
      };

      const placeRectOutsideScene = (rectArea: RectAreaT, edge: EDGE) => {
        const sceneEdges = sceneMap.getSceneEdges();
        const { X, MINUS_X, MINUS_Y, Y } = Dimensions;
        const { [X]: rightEdge, [MINUS_X]: leftEdge, [Y]: topEdge, [MINUS_Y]: bottomEdge } = sceneEdges;

        const countPositionsFroward = SceneMap.countPositionsFroward;
        const countPositionsBackwards = SceneMap.countPositionsBackwards;
        const next = SceneMap.calcNextPositionFromEdge;
        const prev = SceneMap.calcPrevPositionFromEdge;

        // stick to the right edge, we can make it randomly
        switch (edge) {
          case TOP: {
            const bottom = next(topEdge);
            return {
              top: countPositionsFroward(bottom, rectArea.rows),
              right: rightEdge,
              bottom,
              left: countPositionsBackwards(rightEdge, rectArea.cols),
            };
          }
          case RIGHT: {
            const left = next(rightEdge);
            return {
              top: countPositionsFroward(bottomEdge, rectArea.rows),
              right: countPositionsFroward(left, rectArea.cols),
              bottom: bottomEdge,
              left,
            };
          }
          case BOTTOM: {
            const top = prev(bottomEdge);
            return {
              top,
              right: countPositionsFroward(leftEdge, rectArea.cols),
              bottom: countPositionsBackwards(top, rectArea.rows),
              left: leftEdge,
            };
          }
          case LEFT: {
            const right = prev(leftEdge);
            return {
              top: topEdge,
              right,
              bottom: countPositionsBackwards(topEdge, rectArea.rows),
              left: countPositionsBackwards(right, rectArea.cols),
            };
          }
        }
      };

      const rebuildVacanciesMap = (
        shouldCreateVacancyIfNoSuchKind: boolean,
      ) => {
        vacanciesManager.buildVacanciesMap({ shouldCreateVacancyIfNoSuchKind });

        // vacanciesManager.filterUnsuitableClosedVacancies(vacancyFilter);

        if (options?.drawVacanciesMap) {
          const sceneEdges = sceneMap.getSceneEdges();
           vacanciesManager.topEdgeVacancies.forEach(v =>
            drawVacancy(v, sceneEdges),
          );
           vacanciesManager.bottomEdgeVacancies.forEach(v =>
            drawVacancy(v, sceneEdges),
          );
          vacanciesManager.rightEdgeVacancies.forEach(v =>
            drawVacancy(v, sceneEdges),
          );
          vacanciesManager.leftEdgeVacancies.forEach(v =>
            drawVacancy(v, sceneEdges),
          );

          vacanciesManager.closedVacancies.forEach(vacancy => {
            if (!vacancy) {
              return;
            }
            drawVacancy(vacancy, sceneEdges);
          });
          // console.log('--------------------------------------------------------------------------------------------');
        }
      };

      const performWork: PerformWorkT = (
        rect,
        { index, shouldTryAnotherAngle = true, isRotated },
      ) => {
        const { map: rectAreaMap } = rectAreaMapByKey.get(formRectAreaMapKey(rect.label, rect.fontSize)) ?? {};
        if (!rectAreaMap) {
          throw new Error(
            `rectAreaMap for rect with id: "${rect.id}" is not found`,
          );
        }
        const rectArea = isRotated
          ? rotateRectArea(getRectAreaOfRectMap(rectAreaMap))
          : getRectAreaOfRectMap(rectAreaMap);

        if (index === 0 && isFromScratch) {
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

          return { status: true, isRotated };
        }

        const shouldCreateVacancyIfNoSuchKind: boolean = index < (options?.addIfEmptyIndex ?? 5);

        const tryPickClosedVacancy = (): boolean => {
          let rectPosition;
          let pickedVacancyIndex;
          ({
            rectPosition,
            vacancyIndex: pickedVacancyIndex
          } = pickClosedVacancy(rectArea, vacanciesManager.closedVacancies, { pickingStrategy: pickingClosedVacancyStrategy }) ?? {});
          if (!rectPosition && vacanciesManager.needVacanciesRebuild) {
            rebuildVacanciesMap(shouldCreateVacancyIfNoSuchKind);
            ({
              rectPosition,
              vacancyIndex: pickedVacancyIndex
            } = pickClosedVacancy(rectArea, vacanciesManager.closedVacancies, { pickingStrategy: pickingClosedVacancyStrategy }) ?? {});
          }

          if (rectPosition && pickedVacancyIndex) {
            try {
              updateSceneMap(rectPosition, rectAreaMap, isRotated);
              positionedRectsData.push(
                creatRawPositionedTagRect(rect, rectPosition, isRotated),
              );
            } catch (e) {
              if (e instanceof IntersectionError && vacanciesManager.needVacanciesRebuild) {
                rebuildVacanciesMap(shouldCreateVacancyIfNoSuchKind);
                return tryPickClosedVacancy();
              } else {
                throw e;
              }
            }
            vacanciesManager.removeClosedVacancy(pickedVacancyIndex);
            return true;
          }

          return false;
        };

        if (tryPickClosedVacancy()) {
          return { status: true, isRotated };
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

                rebuildVacanciesMap(shouldCreateVacancyIfNoSuchKind);
                return { status: true, isRotated };
              } catch (e) {
                if (!(e instanceof IntersectionError)) {
                  throw e;
                }
              }
            }
          }
        }

        if (options?.shouldTryAnotherAngle && shouldTryAnotherAngle) {
          // try to rotate the rect before putting it outside the scene
          if (performWork(rect, { index, shouldTryAnotherAngle: false, isRotated: !isRotated }).status) {
            return { status: true, isRotated };
          }
        } else if (options?.shouldTryAnotherAngle && !shouldTryAnotherAngle) {
          // return to continue the initial try (just below this place to placeRectOutsideScene)
          return { status: false };
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

            rebuildVacanciesMap(shouldCreateVacancyIfNoSuchKind);
            edgesManager.confirmEdgeUsage(edge);
            return { status: true, isRotated };
          } catch (e) {
            if (!(e instanceof IntersectionError)) {
              throw e;
            }
          }
        }

        if (!['production', 'test'].includes(process.env.NODE_ENV)) {
          throw new Error('it is impossible to find rect position');
        }
        return { status: false };
      };

      const finish = () => {
        if (options?.drawFinishMap) {
          sceneMap.drawItself();
        }
        positionedRectsData.forEach(tagData => {
          const top = tagData.top > 0 ? tagData.top : tagData.top + 1;
          const bottom = tagData.bottom > 0 ? tagData.bottom - 1 : tagData.bottom;
          const right = tagData.right > 0 ? tagData.right : tagData.right + 1;
          const left = tagData.left > 0 ? tagData.left - 1 : tagData.left;

          const { mapMeta: rectAreaMapMeta } =
            rectAreaMapByKey.get(formRectAreaMapKey(tagData.label, tagData.fontSize)) ?? {};
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
              marginTop * sceneMapUnitSize,
            rectBottom:
              SceneMap.sceneMapUnitsToRect(bottom, sceneMapUnitSize) -
              marginBottom * sceneMapUnitSize,
            rectRight:
              SceneMap.sceneMapUnitsToRect(right, sceneMapUnitSize) +
              marginRight * sceneMapUnitSize,
            rectLeft:
              SceneMap.sceneMapUnitsToRect(left, sceneMapUnitSize) -
              marginLeft * sceneMapUnitSize,
            glyphsXOffset: rectAreaMapMeta?.glyphsXOffset ?? 0,
            glyphsYOffset: rectAreaMapMeta?.glyphsYOffset ?? 0,
          });
        });

        if (vacanciesManager.needVacanciesRebuild) {
          vacanciesManager.buildVacanciesMap();
        }

        const vacancies = {
          closedVacancies: vacanciesManager.closedVacancies.filter(v => !!v) as ClosedVacancyT[],
          topEdgeVacancies: vacanciesManager.topEdgeVacancies,
          bottomEdgeVacancies: vacanciesManager.bottomEdgeVacancies,
          leftEdgeVacancies: vacanciesManager.leftEdgeVacancies,
          rightEdgeVacancies: vacanciesManager.rightEdgeVacancies,
        };

        resolve({
          tagsPositions: positionedRectsData as PositionedTagRectT[],
          sceneMapPositions: sceneMap.toPositions(),
          vacancies,
        });
      };

      splitAndPerformWork<ReturnType<PerformWorkT>>(
        createWorkGenerator(rectsData, performWork),
        50,
      )
        .then(finish)
        .catch(error => reject(error));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      reject(e);
    }
  });
}
