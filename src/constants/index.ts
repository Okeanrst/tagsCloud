export const FONT_FAMILY = 'Open Sans';
// export const FONT_FAMILY = 'Space Mono';
export const SCENE_MAP_RESOLUTION = 2;
export const FONT_Y_FACTOR = 0.8;

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
