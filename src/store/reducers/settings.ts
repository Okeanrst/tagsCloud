import {
  OPEN_SANS_FONT,
  PickingStrategies,
  DEFAULT_SCENE_MAP_RESOLUTION,
  SortingClosedVacanciesStrategies,
  SortingEdgeVacanciesStrategies,
  DEFAULT_MIN_FONT_SIZE,
  DEFAULT_MAX_FONT_SIZE,
} from 'constants/index';
import { RootStateT } from '../types';
import { AnyAction } from 'redux';
import { SETTINGS_UPDATE } from '../actions/actionTypes';

const initState: RootStateT['settings'] = {
  fontFamily: OPEN_SANS_FONT,
  shouldDrawFinalMap: false,
  shouldDrawStepMap: false,
  shouldDrawVacanciesMap: false,
  shouldDrawFinalVacanciesMap: false,
  shouldTryAnotherAngle: false,
  addIfEmptyIndex: 5,
  pickingClosedVacancyStrategy: PickingStrategies.ASC,
  pickingEdgeVacancyStrategy: PickingStrategies.ASC,
  sortingClosedVacanciesStrategy: SortingClosedVacanciesStrategies.DISTANCE_FROM_CENTER,
  sortingEdgeVacanciesStrategy: SortingEdgeVacanciesStrategies.DISTANCE_FROM_CENTER,
  sceneMapResolution: DEFAULT_SCENE_MAP_RESOLUTION,
  minFontSize: DEFAULT_MIN_FONT_SIZE,
  maxFontSize: DEFAULT_MAX_FONT_SIZE,
};

export const settingsReducer = (
  state: RootStateT['settings'] = { ...initState },
  action: AnyAction,
) => {
  switch (action.type) {
    case SETTINGS_UPDATE:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};
