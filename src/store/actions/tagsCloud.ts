import * as actionTypes from './actionTypes';
import * as api from 'api';
import {
  SCENE_MAP_RESOLUTION,
  PickingStrategies,
  SortingClosedVacanciesStrategies,
  SortingEdgeVacanciesStrategies,
  DEFAULT_MIN_FONT_SIZE,
  DEFAULT_MAX_FONT_SIZE,
} from 'constants/index';
import { calcTagsPositions } from 'utilities/positioningAlgorithm/calcTagsPositions';
import { prepareData } from 'utilities/tagsCloud/tagsCloud';
import { getMaxSentimentScore } from 'utilities/tagsCloud/getMaxSentimentScore';
import { prepareRectAreasMaps } from 'utilities/prepareRectAreasMaps';
import { createAction } from './helpers';
import validateTagsCloudRawData from './rawDataValidator';

import { TagDataT } from 'types/types';
import { AppDispatchT, RootStateT } from '../types';

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

const calcTagsPositionsOptions = {
  drawFinishMap: false,
  drawVacanciesMap: false,
  drawStepMap: false,
  shouldTryAnotherAngle: false,
  addIfEmptyIndex: 5,
  pickingClosedVacancyStrategy: PickingStrategies.ASC,
  pickingEdgeVacancyStrategy: PickingStrategies.ASC,
  sortingClosedVacanciesStrategy: SortingClosedVacanciesStrategies.DISTANCE_FROM_CENTER,
  sortingEdgeVacanciesStrategy: SortingEdgeVacanciesStrategies.DISTANCE_FROM_CENTER,
  sceneMapResolution: SCENE_MAP_RESOLUTION,
};

export function buildTagsCloud(tagsData: ReadonlyArray<TagDataT>) {
  return (dispatch: AppDispatchT) => {
    dispatch(createAction(actionTypes.BUILD_TAGS_CLOUD_REQUEST));
    const maxSentimentScore = getMaxSentimentScore(tagsData);
    const preparedData = prepareData(tagsData, {
      minFontSize: DEFAULT_MIN_FONT_SIZE,
      maxFontSize: DEFAULT_MAX_FONT_SIZE,
      maxSentimentScore
    });
    return prepareRectAreasMaps(preparedData, SCENE_MAP_RESOLUTION)
      .then(tagsRectAreasMaps => {
        return calcTagsPositions(preparedData, tagsRectAreasMaps, [], calcTagsPositionsOptions);
      })
      .then(({ tagsPositions , sceneMapPositions }) => {
        dispatch(
          createAction(
            actionTypes.BUILD_TAGS_CLOUD_SUCCESS,
            { tagsPositions, sceneMap: sceneMapPositions },
          ),
        );
      })
      .catch(() => {
        dispatch(createAction(actionTypes.BUILD_TAGS_CLOUD_FAILURE));
      });
  };
}

export function incrementallyBuildTagsCloud(tagsData: ReadonlyArray<TagDataT>) {
  return (dispatch: AppDispatchT, getState: () => RootStateT) => {
    // ?
    // dispatch(createAction(actionTypes.BUILD_TAGS_CLOUD_REQUEST));
    // TODO
    const maxSentimentScore = -Infinity;
    const preparedData = prepareData(tagsData, {
      minFontSize: DEFAULT_MIN_FONT_SIZE,
      maxFontSize: DEFAULT_MAX_FONT_SIZE,
      maxSentimentScore
    });
    return prepareRectAreasMaps(preparedData, SCENE_MAP_RESOLUTION)
      .then(tagsRectAreasMaps => {
        const sceneMap = getState().tagsCloud.sceneMap ?? [];
        return calcTagsPositions(preparedData, tagsRectAreasMaps, sceneMap, calcTagsPositionsOptions);
      })
      .then(({ tagsPositions , sceneMapPositions }) => {
        /* dispatch(
          createAction(
            actionTypes.BUILD_TAGS_CLOUD_SUCCESS,
            { tagsPositions, sceneMap: sceneMapPositions },
          ),
        );*/
      })
      .catch(() => {
        // ?
        // dispatch(createAction(actionTypes.BUILD_TAGS_CLOUD_FAILURE));
      });
  };
}

export function toggleUseCanvas() {
  return createAction(actionTypes.USE_CANVAS_TOGGLE);
}

export function deleteDataItem(id: string) {
  return (dispatch: AppDispatchT) => {
    dispatch(createAction(actionTypes.DELETE_DATA_ITEM, id));
    dispatch(createAction(actionTypes.RESET_TAGS_CLOUD));
  };
}

export function editDataItem(data: TagDataT) {
  return (dispatch: AppDispatchT) => {
    dispatch(createAction(actionTypes.EDIT_DATA_ITEM, data));
    dispatch(createAction(actionTypes.RESET_TAGS_CLOUD));
  };
}

export function addDataItem(data: Partial<Omit<TagDataT, 'id'>>) {
  return (dispatch: AppDispatchT) => {
    const id = data.label + '_' + Date.now() + (Math.random() + '').slice(-3);
    dispatch(createAction(actionTypes.ADD_DATA_ITEM, { ...data, id }));
    dispatch(createAction(actionTypes.RESET_TAGS_CLOUD));
  };
}
