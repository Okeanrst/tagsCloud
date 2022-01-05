export const FONT_FAMILY = 'Open Sans';
// export const FONT_FAMILY = 'Space Mono';
export const SCENE_MAP_RESOLUTION = 4;
export const FONT_Y_FACTOR = 0.79;
export const FONT_SIZE_TO_GLYPH_HEIGHT_RATIO = 1.2;
export const DEFAULT_MIN_FONT_SIZE = 8;
export const DEFAULT_MAX_FONT_SIZE = 300;

export enum PickingStrategies {
  ASC = 'ascendant',
  DESC = 'descendant',
}

export enum SortingClosedVacanciesStrategies {
  SQUARE = 'square',
  DISTANCE_FROM_CENTER = 'distanceFromCenter',
}

export enum SortingEdgeVacanciesStrategies {
  DISTANCE_FROM_CENTER = 'distanceFromCenter',
  BASE_SIZE = 'baseSize',
}
