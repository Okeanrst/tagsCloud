import { prepareData } from 'utilities/tagsCloud/tagsCloud';
import { calcTagsPositions } from '../calcTagsPositions';
import { prepareRectAreasMaps } from 'utilities/prepareRectAreasMaps';
import entryData from './entryData.json';
import preparedData from './preparedData.json';
import tagsRectAreasMaps from './rectAreasMaps.json';
import preparedDataWithPositions from './preparedDataWithPositions.json';

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
      expect(prepareData(entryData)).toStrictEqual(preparedData);
    });
  });

  describe('prepareRectAreasMaps tests', () => {
    it(`should return correct result`, async () => {
      await prepareRectAreasMaps(preparedData, 2);
    });
  });

  describe('calcTagsPositions tests', () => {
    it(`calcTagsPositions todo`, async () => {
      const tagsPositions = await calcTagsPositions(preparedData, tagsRectAreasMaps);
      expect(tagsPositions).toStrictEqual(preparedDataWithPositions);
    });
  });
});
