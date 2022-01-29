import { OPEN_SANS_FONT } from 'constants/index';
import { prepareTagsData } from 'utilities/tagsCloud/tagsCloud';
import { formRectAreaMapKey, prepareRectAreasMaps } from 'utilities/prepareRectAreasMaps';
import { getMaxSentimentScore } from 'utilities/tagsCloud/getMaxSentimentScore';
import {
  calcTagsPositions,
  isVacancyLargeEnoughToFitRect,
  rotateRectArea,
  releaseRectAreaPositionsOnSceneMap,
} from '../calcTagsPositions';
import { PositionT, SceneMap } from '../sceneMap';
import entryData from './entryData.json';
import preparedData from './preparedData.json';
import tagsRectAreasMaps from './rectAreasMaps.json';
import fullSizeFilledRectAreasMaps from './fullSizeFilledRectAreasMaps.json';

jest.mock('utilities/common/getRandomRGBColor', () => {
  return {
    getRandomRGBColor: () => {
      return 'rgb(155, 155, 155)';
    },
  };
});

jest.mock('utilities/getGlyphsMap', () => {
  return {
    ...jest.requireActual('utilities/getGlyphsMap'),
    getRectAreaMap: () => {
      return {};
    },
  };
});

describe('positioningAlgorithm tests', () => {
  describe('prepareData tests', () => {
    it(`should return correct result`, () => {
      const maxSentimentScore = getMaxSentimentScore(entryData);
      expect(prepareTagsData(entryData, {minFontSize: 6, maxFontSize: 36, maxSentimentScore})).toMatchSnapshot();
    });
  });

  describe('prepareRectAreasMaps tests', () => {
    it(`should return array with correct value (right shape)`, async () => {
      const tagsRectAreasMaps = await prepareRectAreasMaps(preparedData, { resolution: 2, fontFamily: OPEN_SANS_FONT });
      expect(tagsRectAreasMaps).toStrictEqual(
        preparedData.map(({ label, fontSize }) => ({ key: formRectAreaMapKey(label, fontSize), map: null, mapMeta: null })),
      );
    });
  });

  describe('calcTagsPositions tests', () => {
    it(`return result is equal to snapshot`, async () => {
      const { tagsPositions } = await calcTagsPositions(preparedData, tagsRectAreasMaps, [], {sceneMapResolution: 2});
      expect(tagsPositions).toMatchSnapshot();
    });

    it(`no intersection`, async () => {
      const { tagsPositions } = await calcTagsPositions(preparedData, fullSizeFilledRectAreasMaps, [], {sceneMapResolution: 2});

      let intersection = 0;
      const map = new Map();
      tagsPositions.forEach(({ rectTop, rectBottom, rectRight, rectLeft }) => {
        const firstRow = SceneMap.getPrevPositionFromEdge(rectTop);
        const lastRow = SceneMap.getNextPositionFromEdge(rectBottom);
        const firstCol = SceneMap.getNextPositionFromEdge(rectLeft);
        const lastCol = SceneMap.getPrevPositionFromEdge(rectRight);
        for (let row = firstRow; row >= lastRow; row--) {
          for (let col = firstCol; col <= lastCol; col++) {
            const key = `${row},${col}`;
            if (map.has(key)) {
              intersection++;
            } else {
              map.set(key, true);
            }
          }
        }
      });
      expect(intersection).toBe(0);
    });
  });

  describe('isVacancyLargeEnoughToFitRect tests', () => {
    it(`should return correct result`, () => {
      const isLargeEnough = isVacancyLargeEnoughToFitRect({rows: 2, cols: 4}, {top: 4, bottom: 3, left: -Infinity, right: 5});
      expect(isLargeEnough).toBe(true);
    });
    it(`should return correct result (1)`, () => {
      const isLargeEnough = isVacancyLargeEnoughToFitRect({rows: 1, cols: 1}, {top: -1, bottom: -Infinity, left: -5, right: -5});
      expect(isLargeEnough).toBe(true);
    });
    it(`should return correct result (2)`, () => {
      const isLargeEnough = isVacancyLargeEnoughToFitRect({rows: 5, cols: 2}, {top: -1, bottom: -Infinity, left: -5, right: Infinity});
      expect(isLargeEnough).toBe(true);
    });
    it(`should return correct result (3)`, () => {
      const isLargeEnough = isVacancyLargeEnoughToFitRect({rows: 100, cols: 2000}, {right: Infinity, left: -Infinity, bottom: 2, top: Infinity});
      expect(isLargeEnough).toBe(true);
    });
    it(`should return falsy result for rotated vacancy (1)`, () => {
      const isLargeEnough = isVacancyLargeEnoughToFitRect({rows: 3, cols: 4}, {right: 4, left: -Infinity, bottom: 2, top: 3});
      expect(isLargeEnough).toBe(false);
    });
  });

  describe('rotateRectArea tests', () => {
    it(`should return correct result`, () => {
      expect(rotateRectArea({rows: 5, cols: 2})).toStrictEqual({rows: 2, cols: 5});
    });
  });

  describe('releaseRectAreaPositionsOnSceneMap tests', () => {
    it(`should return correct result`, () => {
      const sceneMapPositions: PositionT[] = [
        [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
        [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],
        [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3],
        [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4],
      ];
      const tagPosition = {bottom: 2, top: 4, left: 3, right: 6, rotate: false };
      const rectAreaMap = [[true, false, true, false], [true, true, true, true], [true, true, true, true]];
      const sceneMap = releaseRectAreaPositionsOnSceneMap(sceneMapPositions, tagPosition, rectAreaMap);
      expect(sceneMap.toPositions()).toStrictEqual([[1,4],[2,4],[4,4],[6,4],[1,3],[2,3],[1,2],[2,2],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1]]);
    });
  });
});
