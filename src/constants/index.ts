export const MIN_SCENE_MAP_RESOLUTION = 2;
export const MAX_SCENE_MAP_RESOLUTION = 300;
export const DEFAULT_SCENE_MAP_RESOLUTION = 4;
export const FONT_SIZE_TO_GLYPH_HEIGHT_RATIO = 1.2;
export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 300;
export const DEFAULT_MIN_FONT_SIZE = 8;
export const DEFAULT_MAX_FONT_SIZE = 160;
export const DEFAULT_TAG_BY_TAG_RENDER_INTERVAL = 5; // in hundreds of milliseconds
export const MIN_TAG_BY_TAG_RENDER_INTERVAL = 1;
export const MAX_TAG_BY_TAG_RENDER_INTERVAL = 20;

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

export enum FontFamilies {
  OPEN_SANS = 'Open Sans',
  SPACE_MONO = 'Space Mono',
}

export const OPEN_SANS_FONT = FontFamilies.OPEN_SANS;
export const SPACE_MONO_FONT = FontFamilies.SPACE_MONO;

export const FONT_Y_FACTOR_BY_FONT = {
  [OPEN_SANS_FONT]: 0.79,
  [SPACE_MONO_FONT]: 0.79,
};

export const DEFAULT_FONT_Y_FACTOR = 0.79;

export enum NOTIFICATIONS_TYPES {
  ERROR = 'error',
  SUCCESS = 'success',
}
