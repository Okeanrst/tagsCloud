import { prepareData } from 'utilities/tagsCloud/tagsCloud';
import { prepareRectAreasMaps } from 'utilities/prepareRectAreasMaps';
import { calcTagsPositions } from '../calcTagsPositions';
import { SceneMap } from '../sceneMap';
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
      expect(prepareData(entryData, {minFontSize: 6, maxFontSize: 36})).toMatchSnapshot();
    });
  });

  describe('prepareRectAreasMaps tests', () => {
    it(`should return array with correct value (right shape)`, async () => {
      const tagsRectAreasMaps = await prepareRectAreasMaps(preparedData, 2);
      expect(tagsRectAreasMaps).toStrictEqual(
        preparedData.map(({ id }) => ({ id, map: null, mapMeta: null })),
      );
    });
  });

  describe('calcTagsPositions tests', () => {
    it(`return result is equal to snapshot`, async () => {
      const tagsPositions = await calcTagsPositions(preparedData, tagsRectAreasMaps);
      expect(tagsPositions).toMatchSnapshot();
    });

    it(`no intersection`, async () => {
      const tagsPositions = await calcTagsPositions(preparedData, fullSizeFilledRectAreasMaps);

      let intersection = 0;
      const map = new Map();
      tagsPositions.forEach(({ rectTop, rectBottom, rectRight, rectLeft }) => {
        const firstRow = SceneMap.calcPrevPositionFromEdge(rectTop);
        const lastRow = SceneMap.calcNextPositionFromEdge(rectBottom);
        const firstCol = SceneMap.calcNextPositionFromEdge(rectLeft);
        const lastCol = SceneMap.calcPrevPositionFromEdge(rectRight);
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
});
