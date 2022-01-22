import { saveAs } from 'file-saver';
import {
  FETCH_DATA_REQUEST,
  FETCH_DATA_SUCCESS,
  FETCH_DATA_FAILURE,
  RESET_TAGS_CLOUD,
} from './actionTypes';
import { createAction } from './helpers';
import { validateTagCloudRawData } from './rawDataValidator';

import type { TagDataT } from 'types/types';
import type { AppDispatchT } from '../types';

export function uploadRawTagsCloudDataFile(file: File) {
  return (dispatch: AppDispatchT) => {
    dispatch(createAction(FETCH_DATA_REQUEST));

    parseRawTagsCloudDataFile(file)
      .then(fileContent => {
        dispatch(createAction(RESET_TAGS_CLOUD));
        dispatch(createAction(FETCH_DATA_SUCCESS, fileContent));
      })
      .catch(() => {
        dispatch(createAction(FETCH_DATA_FAILURE));
      });
  };
}

function parseRawTagsCloudDataFile(file: File): Promise<TagDataT> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (reader.result === null) {
          throw new Error('TagsCloudData file is empty');
        }
        const text = reader.result as string;
        const data = JSON.parse(text);
        if (validateTagCloudRawData(data)) {
          throw new Error('Raw tag cloud data is invalid');
        }
        resolve(data as TagDataT);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = e => reject(e);
    reader.readAsText(file);
  });
}

export function downloadRawTagsCloudDataFile(data: any) {
  const blob = new Blob([JSON.stringify(data)], {
    type: 'application/json;charset=utf-8',
  });
  saveAs(blob, 'tagsCloudData.json');
}
