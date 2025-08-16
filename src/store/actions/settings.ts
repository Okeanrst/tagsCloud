import { batch } from 'react-redux';
import { AppDispatchT, GetStateT, RootStateT } from '../types';
import { omit } from 'utilities/helpers/omit';
import { createAction } from './helpers';
import * as actionTypes from './actionTypes';
import { resetTagsCloud } from './tagsCloud';

type SettingsT = Partial<RootStateT['settings']>;

const SETTINGS_NOT_AFFECTING_CLOUD: (keyof RootStateT['settings'])[] = ['tagByTagRenderInterval'];

const shouldResetTagsCloud = (currentSettings: SettingsT, nextSettings: SettingsT) => {
  const targetNextSettings = omit(nextSettings, SETTINGS_NOT_AFFECTING_CLOUD);
  return Object.entries(targetNextSettings).some(([key, value]) => currentSettings[key as keyof SettingsT] !== value);
};

export function updateSettings(data: SettingsT) {
  return (dispatch: AppDispatchT, getState: GetStateT) => {
    const { settings: currentSettings } = getState();
    const { fontFamily, sceneMapResolution } = currentSettings;

    batch(() => {
      if ('fontFamily' in data && fontFamily !== data.fontFamily) {
        dispatch(createAction(actionTypes.FONT_LOAD_RESET));
      }
      if (
        ('fontFamily' in data && fontFamily !== data.fontFamily) ||
        ('sceneMapResolution' in data && sceneMapResolution !== data.sceneMapResolution)
      ) {
        dispatch(createAction(actionTypes.RECT_AREAS_MAPS_RESET));
      }

      if (shouldResetTagsCloud(currentSettings, data)) {
        dispatch(resetTagsCloud());
      }

      dispatch(createAction(actionTypes.SETTINGS_UPDATE, data));
    });
  };
}
