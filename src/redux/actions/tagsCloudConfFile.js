import {
  FETCH_DATA_REQUEST, FETCH_DATA_SUCCESS, FETCH_DATA_FAILURE,
} from './actionTypes';
import { createAction } from './helpers';
import { saveAs } from 'file-saver';
import validateTagsCloudRawData from './rawDataValidator';
import * as types from './actionTypes';

export function uploadCloudRawDataFile(data) {
  return (dispatch) => {
    dispatch(createAction(FETCH_DATA_REQUEST));

    parseTagsCloudConfigFile(data)
      .then(response => {
        dispatch(createAction(types.RESET_TAGS_CLOUD_DATA));
        dispatch(createAction(FETCH_DATA_SUCCESS, response));
      })
      .catch(error => {
        dispatch(createAction(FETCH_DATA_FAILURE));
      });
  };
}

function parseTagsCloudConfigFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result;
        const data = JSON.parse(text);
        if (!validateTagsCloudRawData(data)){
          throw new Error('Raw tagsCloud data is invalid');
        }
        resolve(data);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

export function downloadCloudRawDataFile(data) {
  const blob = new Blob([JSON.stringify(data)], {type: 'application/json;charset=utf-8'});
  saveAs(blob, 'Tags cloud data.json');
}