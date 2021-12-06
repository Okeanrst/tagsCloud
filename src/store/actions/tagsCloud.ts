import * as actionTypes from './actionTypes';
import * as api from 'api';
import { calcTagsPositions } from 'utilities/positioningAlgorithm/calcTagsPositions';
import {
  prepareData,
  prepareDataGlyphsMap,
} from 'utilities/tagsCloud/tagsCloud';
import { createAction } from './helpers';
import validateTagsCloudRawData from './rawDataValidator';

import { TagDataT } from 'types/types';
import { AppDispatchT } from '../types';

export function getData() {
  return (dispatch: AppDispatchT) => {
    dispatch(createAction(actionTypes.FETCH_DATA_REQUEST));
    return api
      .getData()
      .then(response => {
        if (!validateTagsCloudRawData(response)) {
          throw new Error('Raw tagsCloud data is invalid');
        }
        dispatch(createAction(actionTypes.FETCH_DATA_SUCCESS, response));
      })
      .catch(() => {
        dispatch(createAction(actionTypes.FETCH_DATA_FAILURE));
      });
  };
}

export function buildTagsCloud(data: ReadonlyArray<TagDataT>) {
  return (dispatch: AppDispatchT) => {
    dispatch(createAction(actionTypes.PROCESS_DATA_REQUEST));
    const preparedData = prepareData(data);
    return prepareDataGlyphsMap(preparedData)
      .then(dataGlyphsMap => calcTagsPositions(preparedData, dataGlyphsMap))
      .then(preparedDataWithPositions => {
        dispatch(
          createAction(
            actionTypes.PROCESS_DATA_SUCCESS,
            preparedDataWithPositions,
          ),
        );
      })
      .catch(error => {
        debugger;
        dispatch(createAction(actionTypes.PROCESS_DATA_FAILURE));
      });
  };
}

export function toggleUseCanvas() {
  return createAction(actionTypes.USE_CANVAS_TOGGLE);
}

export function deleteDataItem(id: string) {
  return (dispatch: AppDispatchT) => {
    dispatch(createAction(actionTypes.DELETE_DATA_ITEM, id));
    dispatch(createAction(actionTypes.RESET_TAGS_CLOUD_DATA));
  };
}

export function editDataItem(data: TagDataT) {
  return (dispatch: AppDispatchT) => {
    dispatch(createAction(actionTypes.EDIT_DATA_ITEM, data));
    dispatch(createAction(actionTypes.RESET_TAGS_CLOUD_DATA));
  };
}

export function addDataItem(data: Partial<Omit<TagDataT, 'id'>>) {
  return (dispatch: AppDispatchT) => {
    const id = data.label + '_' + Date.now() + (Math.random() + '').slice(-3);
    dispatch(createAction(actionTypes.ADD_DATA_ITEM, { ...data, id }));
    dispatch(createAction(actionTypes.RESET_TAGS_CLOUD_DATA));
  };
}
