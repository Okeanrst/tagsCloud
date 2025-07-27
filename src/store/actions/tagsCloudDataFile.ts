import { saveAs } from 'file-saver';
import { batch } from 'react-redux';
import { NOTIFICATIONS_TYPES } from 'constants/index';
import {
  TAGS_DATA_FETCH_FAILURE,
  TAGS_DATA_FETCH_REQUEST,
  TAGS_DATA_FETCH_SUCCESS,
  RESET_TAGS_CLOUD,
} from './actionTypes';
import { createAction } from './helpers';
import { validateTagCloudRawData } from './rawDataValidator';
import { addNotification } from './notifications';

import type { TagDataT } from 'types/types';
import type { AppDispatchT } from '../types';

export function uploadRawTagsCloudDataFile(file: File) {
  return (dispatch: AppDispatchT) => {
    batch(() => {
      dispatch(createAction(TAGS_DATA_FETCH_REQUEST));
      dispatch(createAction(RESET_TAGS_CLOUD));
    });

    parseRawTagsCloudDataFile(file)
      .then((fileContent) => {
        dispatch(createAction(TAGS_DATA_FETCH_SUCCESS, fileContent));
      })
      .catch(() => {
        batch(() => {
          dispatch(createAction(TAGS_DATA_FETCH_FAILURE));
          dispatch(
            addNotification({
              content: 'invalid file',
              type: NOTIFICATIONS_TYPES.ERROR,
              timeout: 5000,
            }),
          );
        });
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
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

export function downloadRawTagsCloudDataFile(data: any) {
  const blob = new Blob([JSON.stringify(data)], {
    type: 'application/json;charset=utf-8',
  });
  saveAs(blob, 'tagsCloudData.json');
}
