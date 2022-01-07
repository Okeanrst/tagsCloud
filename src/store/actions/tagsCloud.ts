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
import { calcTagsPositions, mapRectAreaMapOnRectPosition } from 'utilities/positioningAlgorithm/calcTagsPositions';
import { SceneMap } from 'utilities/positioningAlgorithm/sceneMap';
import { prepareTagsData } from 'utilities/tagsCloud/tagsCloud';
import { getMaxSentimentScore } from 'utilities/tagsCloud/getMaxSentimentScore';
import { formRectAreaMapKey, prepareRectAreasMaps } from 'utilities/prepareRectAreasMaps';
import { selectTargetTagDataItem } from '../reducers/tagsData';
import { createAction } from './helpers';
import validateTagsCloudRawData from './rawDataValidator';

import { TagDataT } from 'types/types';
import { AppDispatchT, RootStateT } from '../types';
import { AnyAction } from 'redux';

type GetStateT = () => RootStateT;

function selectMaxSentimentScore(state: RootStateT) {
  return getMaxSentimentScore(state.tagsData?.data ?? []);
}

const filterPreparedTagsDataWithoutRectAreasMaps = (
  preparedTagsData: ReturnType<typeof prepareTagsData>,
  rectAreasMapsData: RootStateT['rectAreasMapsData'],
) => {
  const rectAreasMapsKeys = new Set(rectAreasMapsData.map(({ key }) => key));
  return  preparedTagsData.filter(({ label, fontSize }) => {
    return !rectAreasMapsKeys.has(formRectAreaMapKey(label, fontSize));
  });
};

const findUnusedRectAreasMapsKeys = (state: RootStateT) => {
  const usedKeys = new Set(state.tagsCloud?.tagsPositions?.map(({ label, fontSize }) => {
    return formRectAreaMapKey(label, fontSize);
  }) ?? []);
  const unusedKeys: string[] = [];
  state.rectAreasMapsData.forEach(({ key }) => {
    if (!usedKeys.has(key)) {
      unusedKeys.push(key);
    }
  });
  return unusedKeys;
};

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

const preparedTagsDataOptions = {
  minFontSize: DEFAULT_MIN_FONT_SIZE,
  maxFontSize: DEFAULT_MAX_FONT_SIZE,
};

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
  return (dispatch: AppDispatchT, getState: GetStateT) => {
    dispatch(createAction(actionTypes.TAGS_CLOUD_BUILD_REQUEST));
    const maxSentimentScore = getMaxSentimentScore(tagsData);
    const preparedTagsData = prepareTagsData(tagsData, {
      ...preparedTagsDataOptions,
      maxSentimentScore
    });
    const preparedTagsDataWithoutRectAreasMaps = filterPreparedTagsDataWithoutRectAreasMaps(preparedTagsData, getState().rectAreasMapsData);
    return prepareRectAreasMaps(preparedTagsDataWithoutRectAreasMaps, SCENE_MAP_RESOLUTION)
      .then(tagsRectAreasMaps => {
        dispatch(createAction(actionTypes.RECT_AREAS_MAPS_ADD_MAPS, tagsRectAreasMaps));
        const fullRectAreasMapsData = getState().rectAreasMapsData;
        return calcTagsPositions(preparedTagsData, fullRectAreasMapsData, [], calcTagsPositionsOptions);
      })
      .then(({ tagsPositions , sceneMapPositions, vacancies }) => {
        dispatch(
          createAction(
            actionTypes.TAGS_CLOUD_BUILD_SUCCESS,
            { tagsPositions, sceneMap: sceneMapPositions, vacancies },
          ),
        );
        dispatch(createAction(actionTypes.RECT_AREAS_MAPS_REMOVE_MAPS, findUnusedRectAreasMapsKeys(getState())));
      })
      .catch(() => {
        dispatch(createAction(actionTypes.TAGS_CLOUD_BUILD_FAILURE));
      });
  };
}

export function incrementallyBuildTagsCloud(tagsData: ReadonlyArray<TagDataT>) {
  return (dispatch: AppDispatchT, getState: GetStateT) => {
    dispatch(createAction(actionTypes.INCREMENTAL_BUILD_TAGS_CLOUD_REQUEST));

    const maxSentimentScore = selectMaxSentimentScore(getState());
    const preparedTagsData = prepareTagsData(tagsData, {
      ...preparedTagsDataOptions,
      maxSentimentScore
    });
    const preparedTagsDataWithoutRectAreasMaps = filterPreparedTagsDataWithoutRectAreasMaps(preparedTagsData, getState().rectAreasMapsData);
    return prepareRectAreasMaps(preparedTagsDataWithoutRectAreasMaps, SCENE_MAP_RESOLUTION)
      .then(tagsRectAreasMaps => {
        dispatch(createAction(actionTypes.RECT_AREAS_MAPS_ADD_MAPS, tagsRectAreasMaps));
        const fullRectAreasMapsData = getState().rectAreasMapsData;
        const sceneMap = getState().tagsCloud.sceneMap ?? [];
        return calcTagsPositions(preparedTagsData, fullRectAreasMapsData, sceneMap, {
          ...calcTagsPositionsOptions,
          addIfEmptyIndex: calcTagsPositionsOptions.addIfEmptyIndex - (getState().tagsCloud.tagsPositions?.length ?? 0),
        });
      })
      .then(({ tagsPositions , sceneMapPositions, vacancies }) => {
        dispatch(
          createAction(
            actionTypes.INCREMENTAL_BUILD_TAGS_CLOUD_SUCCESS,
            { tagsPositions, sceneMap: sceneMapPositions, vacancies },
          ),
        );
      })
      .catch(() => {
        dispatch(createAction(actionTypes.INCREMENTAL_BUILD_TAGS_CLOUD_FAILURE));
      });
  };
}

export function toggleUseCanvas() {
  return createAction(actionTypes.USE_CANVAS_TOGGLE);
}

const createRemoveTagAction = (targetId: string, getState: GetStateT): AnyAction | null => {
  const targetTagPosition = getState().tagsCloud.tagsPositions?.find(({ id }) => id === targetId);
  if (!targetTagPosition) {
    return null;
  }
  const rectAreaMapKey = formRectAreaMapKey(targetTagPosition.label, targetTagPosition.fontSize);
  const rectAreaMap = getState().rectAreasMapsData.find(({ key }) => key === rectAreaMapKey);
  if (!rectAreaMap || !rectAreaMap.map) {
    return null;
  }

  const sceneMapPositions = getState().tagsCloud.sceneMap;
  if (!sceneMapPositions || !sceneMapPositions.length) {
    return null;
  }
  const sceneMap = new SceneMap(sceneMapPositions);

  const mappedPositions = mapRectAreaMapOnRectPosition(targetTagPosition, rectAreaMap.map, targetTagPosition.rotate);

  mappedPositions.forEach((mappedPosition) => {
    if (mappedPosition[2]) {
      const [x, y] = mappedPosition;
      sceneMap.releasePosition(x, y);
    }
  });
  return createAction(actionTypes.TAGS_CLOUD_REMOVE_TAG, { tagId: targetId, sceneMap: sceneMap.toPositions() });
};

export function deleteDataItem(targetId: string) {
  return (dispatch: AppDispatchT, getState: GetStateT) => {
    const targetTagDataItem = selectTargetTagDataItem(getState(), targetId);

    dispatch(createAction(actionTypes.INCREMENTAL_BUILD_REMOVE_TAG_ID, targetId));

    if (!targetTagDataItem) {
      return;
    }
    const itemSentimentScore = targetTagDataItem.sentimentScore;
    const currentMaxSentimentScore = selectMaxSentimentScore(getState());

    dispatch(createAction(actionTypes.DELETE_DATA_ITEM, targetId));

    if (itemSentimentScore >= currentMaxSentimentScore && selectMaxSentimentScore(getState()) !== currentMaxSentimentScore) {
      dispatch(createAction(actionTypes.RESET_TAGS_CLOUD));
    } else {
      const removeTagAction = createRemoveTagAction(targetId, getState);
      if (!removeTagAction) {
        return;
      }
      dispatch(removeTagAction);
    }
  };
}

export function editDataItem(tagData: TagDataT) {
  return (dispatch: AppDispatchT, getState: GetStateT) => {
    const currentTagDataItem = selectTargetTagDataItem(getState(), tagData.id);
    if (!currentTagDataItem) {
      return;
    }
    const currentSentimentScore = currentTagDataItem.sentimentScore;
    const currentMaxSentimentScore = selectMaxSentimentScore(getState());
    let shouldResetTagsCloud = currentMaxSentimentScore < tagData.sentimentScore;
    dispatch(createAction(actionTypes.EDIT_DATA_ITEM, tagData));

    shouldResetTagsCloud = shouldResetTagsCloud || selectMaxSentimentScore(getState()) !== currentMaxSentimentScore;

    if (shouldResetTagsCloud) {
      dispatch(createAction(actionTypes.RESET_TAGS_CLOUD));
    } else if (currentSentimentScore !== tagData.sentimentScore) {
      const removeTagAction = createRemoveTagAction(tagData.id, getState);
      if (!removeTagAction) {
        return;
      }
      dispatch(removeTagAction);
      dispatch(createAction(actionTypes.INCREMENTAL_BUILD_ADD_TAG_ID, tagData.id));
    }
  };
}

export function addDataItem(data: Omit<TagDataT, 'id'>) {
  return (dispatch: AppDispatchT, getState: GetStateT) => {
    const maxSentimentScore = selectMaxSentimentScore(getState());
    const shouldResetTagsCloud = maxSentimentScore < data.sentimentScore;

    const id = data.label + '_' + Date.now() + (Math.random() + '').slice(-3);
    dispatch(createAction(actionTypes.ADD_DATA_ITEM, { ...data, id }));
    dispatch(createAction(actionTypes.INCREMENTAL_BUILD_ADD_TAG_ID, id));

    if (shouldResetTagsCloud) {
      dispatch(createAction(actionTypes.RESET_TAGS_CLOUD));
    }
  };
}

export function resetTagsCloud() {
  return createAction(actionTypes.RESET_TAGS_CLOUD);
}
