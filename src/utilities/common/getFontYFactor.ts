import { FONT_Y_FACTOR_BY_FONT, FontFamilies, DEFAULT_FONT_Y_FACTOR } from 'constants/index';

export const getFontYFactor = (fontFamily: FontFamilies) => {
  return FONT_Y_FACTOR_BY_FONT[fontFamily] ?? DEFAULT_FONT_Y_FACTOR;
};
