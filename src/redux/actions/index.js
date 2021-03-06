import * as types from './actionTypes';
import api from '../../api';
import calcPositions from '../../utilities/positioningAlgorithm';
import { prepareData, prepareDataGlyphsMap } from '../../utilities/tagsCloud';
import { createAction } from './helpers';
import validateTagsCloudRawData from './rawDataValidator';

export function getData() {
  return (dispatch) => {
    dispatch(createAction(types.FETCH_DATA_REQUEST));
    return api.getData()
      .then(response => {
        if (!validateTagsCloudRawData(response)){
          throw new Error('Raw tagsCloud data is invalid');
        }
        dispatch(createAction(types.FETCH_DATA_SUCCESS, response));
      })
      .catch(error => {
        dispatch(createAction(types.FETCH_DATA_FAILURE));
      });
  };
}

export function buildTagsCloud(data) {
  return (dispatch) => {
    dispatch(createAction(types.PROCESS_DATA_REQUEST));
    const preparedData = prepareData(data);
    return prepareDataGlyphsMap(preparedData)
      .then(dataGlyphsMap => calcPositions(preparedData, dataGlyphsMap))
      .then(response => {
        dispatch(createAction(types.PROCESS_DATA_SUCCESS, response));
      })
      .catch(error => {
        dispatch(createAction(types.PROCESS_DATA_FAILURE));
      });
  };
}

export function toggleUseCanvas() {
  return createAction(types.USE_CANVAS_TOGGLE);
}

export function deleteDataItem(id) {
  return (dispatch) => {
    dispatch(createAction(types.DELETE_DATA_ITEM, id));
    dispatch(createAction(types.RESET_TAGS_CLOUD_DATA));
  };
}

export function editDataItem(data) {
  return (dispatch) => {
    dispatch(createAction(types.EDIT_DATA_ITEM, data));
    dispatch(createAction(types.RESET_TAGS_CLOUD_DATA));
  };
}

export function addDataItem(data) {
  return (dispatch) => {
    const id = data.label + '_' + Date.now() + (Math.random() + '').slice(-3);
    dispatch(createAction(types.ADD_DATA_ITEM, {...data, id}));
    dispatch(createAction(types.RESET_TAGS_CLOUD_DATA));
  };
}