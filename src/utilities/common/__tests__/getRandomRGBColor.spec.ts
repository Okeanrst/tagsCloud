import { getRandomRGBColor } from '../getRandomRGBColor';

describe('getRandomRGBColor tests', () => {
  it(`should return correct result`, () => {
    const color = getRandomRGBColor();
    expect(/^rgb\((0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d),(0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d),(0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d)\)$/.test(color)).toBe(true);
  });
});
