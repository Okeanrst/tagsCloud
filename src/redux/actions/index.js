import * as types from './actionTypes'
import api from '../../api';
import calcPositions from '../../utilities/positioningAlgorithm';
import { prepareData, prepareDataGlyphsMap } from '../../utilities/tagsCloud';

const createAction = (type, data) => ({type, data});

export function getData() {
  return (dispatch) => {
    dispatch(createAction(types.FETCH_DATA_REQUEST));
    return api.getData()
      .then(response => {
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