import { batch } from 'react-redux';
import throttle from 'lodash.throttle';
import * as actionTypes from './actionTypes';
import * as api from 'api';
import {
  calcTagsPositions,
  releaseRectAreaPositionsOnSceneMap,
  getSceneMapVacancies,
} from 'utilities/positioningAlgorithm/calcTagsPositions';
import { updateTagPosition } from 'utilities/positioningAlgorithm/updateTagPosition';
import { prepareTagsData } from 'utilities/prepareTagsData';
import { getMaxSentimentScore } from 'utilities/getMaxSentimentScore';
import { formRectAreaMapKey, prepareRectAreasMaps } from 'utilities/prepareRectAreasMaps';
import { selectTargetTagDataItem } from '../reducers/tagsData';
import { createAction } from './helpers';
import { validateTagCloudRawData } from './rawDataValidator';

import { TagDataT } from 'types/types';
import { AppDispatchT, RootStateT, GetStateT } from '../types';
import { AnyAction } from 'redux';
import { VacancyKinds, VacancyT } from 'utilities/positioningAlgorithm/types';

function selectMaxSentimentScore(state: RootStateT) {
  return getMaxSentimentScore(state.tagsData?.data ?? []);
}

const filterPreparedTagsDataWithoutRectAreasMaps = (
  preparedTagsData: ReturnType<typeof prepareTagsData>,
  rectAreasMapsData: RootStateT['rectAreasMapsData'],
) => {
  const rectAreasMapsKeys = new Set(rectAreasMapsData.map(({ key }) => key));
  return preparedTagsData.filter(({ label, fontSize }) => {
    return !rectAreasMapsKeys.has(formRectAreaMapKey(label, fontSize));
  });
};

const findUnusedRectAreasMapsKeys = (state: RootStateT) => {
  const usedKeys = new Set(
    state.tagsCloud?.tagsPositions?.map(({ label, fontSize }) => {
      return formRectAreaMapKey(label, fontSize);
    }) ?? [],
  );
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
    dispatch(createAction(actionTypes.TAGS_DATA_FETCH_REQUEST));
    return api
      .getData()
      .then((response) => {
        if (validateTagCloudRawData(response)) {
          throw new Error('Raw tag cloud data is invalid');
        }
        dispatch(createAction(actionTypes.TAGS_DATA_FETCH_SUCCESS, response));
      })
      .catch(() => {
        dispatch(createAction(actionTypes.TAGS_DATA_FETCH_FAILURE));
      });
  };
}

const formCalcTagsPositionsOptions = (settings: RootStateT['settings']) => {
  const { fontFamily, minFontSize, maxFontSize, ...restSettings } = settings;
  return restSettings;
};

export function buildTagsCloud(tagsData: ReadonlyArray<TagDataT>) {
  return (dispatch: AppDispatchT, getState: GetStateT) => {
    dispatch(createAction(actionTypes.TAGS_CLOUD_BUILD_REQUEST));
    const maxSentimentScore = getMaxSentimentScore(tagsData);
    const { settings } = getState();
    const { fontFamily, sceneMapResolution, minFontSize, maxFontSize } = settings;
    const preparedTagsData = prepareTagsData(tagsData, { minFontSize, maxFontSize, maxSentimentScore });
    const start = Date.now();
    const preparedTagsDataWithoutRectAreasMaps = filterPreparedTagsDataWithoutRectAreasMaps(
      preparedTagsData,
      getState().rectAreasMapsData,
    );
    return prepareRectAreasMaps(preparedTagsDataWithoutRectAreasMaps, {
      resolution: sceneMapResolution,
      fontFamily,
    })
      .then(async (tagsRectAreasMaps) => {
        dispatch(createAction(actionTypes.RECT_AREAS_MAPS_ADD_MAPS, tagsRectAreasMaps));

        const fullRectAreasMapsData = getState().rectAreasMapsData;
        const calcTagsPositionsOptions = formCalcTagsPositionsOptions(settings);

        let finished = false;
        let processedTags = 0;

        const dispatchProgress = throttle(() => {
          if (finished) {
            return;
          }
          dispatch(
            createAction(actionTypes.TAGS_CLOUD_BUILD_PROGRESS_UPDATE, {
              tagsPositions: processedTags / preparedTagsData.length,
            }),
          );
        }, 1000);

        try {
          return await calcTagsPositions({
            tagsData: preparedTagsData,
            tagsRectAreasMaps: fullRectAreasMapsData,
            sceneMapPositions: [],
            options: calcTagsPositionsOptions,
            onProgress: () => {
              processedTags += 1;
              dispatchProgress();
            },
          });
        } finally {
          finished = true;
        }
      })
      .then(({ tagsPositions, sceneMapPositions, vacancies }) => {
        dispatch(
          createAction(actionTypes.TAGS_CLOUD_BUILD_SUCCESS, { tagsPositions, sceneMap: sceneMapPositions, vacancies }),
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

    const { settings } = getState();
    const { fontFamily, sceneMapResolution, minFontSize, maxFontSize } = settings;

    const maxSentimentScore = selectMaxSentimentScore(getState());
    const preparedTagsData = prepareTagsData(tagsData, { minFontSize, maxFontSize, maxSentimentScore });
    const preparedTagsDataWithoutRectAreasMaps = filterPreparedTagsDataWithoutRectAreasMaps(
      preparedTagsData,
      getState().rectAreasMapsData,
    );
    return prepareRectAreasMaps(preparedTagsDataWithoutRectAreasMaps, {
      resolution: sceneMapResolution,
      fontFamily,
    })
      .then((tagsRectAreasMaps) => {
        dispatch(createAction(actionTypes.RECT_AREAS_MAPS_ADD_MAPS, tagsRectAreasMaps));
        const fullRectAreasMapsData = getState().rectAreasMapsData;
        const sceneMap = getState().tagsCloud.sceneMap ?? [];
        const calcTagsPositionsOptions = formCalcTagsPositionsOptions(settings);
        // return calcTagsPositions(preparedTagsData, fullRectAreasMapsData, sceneMap, {
        //   ...calcTagsPositionsOptions,
        //   addIfEmptyIndex: calcTagsPositionsOptions.addIfEmptyIndex - (getState().tagsCloud.tagsPositions?.length ?? 0),
        // });
        return calcTagsPositions({
          tagsData: preparedTagsData,
          tagsRectAreasMaps: fullRectAreasMapsData,
          sceneMapPositions: sceneMap,
          options: {
            ...calcTagsPositionsOptions,
            addIfEmptyIndex:
              calcTagsPositionsOptions.addIfEmptyIndex - (getState().tagsCloud.tagsPositions?.length ?? 0),
          },
        });
      })
      .then(({ tagsPositions, sceneMapPositions, vacancies }) => {
        dispatch(
          createAction(actionTypes.INCREMENTAL_BUILD_TAGS_CLOUD_SUCCESS, {
            tagsPositions,
            sceneMap: sceneMapPositions,
            vacancies,
          }),
        );
      })
      .catch(() => {
        dispatch(createAction(actionTypes.INCREMENTAL_BUILD_TAGS_CLOUD_FAILURE));
      });
  };
}

export function deleteTagsData() {
  return (dispatch: AppDispatchT) => {
    batch(() => {
      dispatch(createAction(actionTypes.TAGS_DATA_DELETE_ALL_DATA));
      dispatch(createAction(actionTypes.RESET_TAGS_CLOUD));
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

  const sceneMap = releaseRectAreaPositionsOnSceneMap(sceneMapPositions, targetTagPosition, rectAreaMap.map);

  const vacancies = getSceneMapVacancies(sceneMap);

  return createAction(actionTypes.TAGS_CLOUD_REMOVE_TAG, {
    tagId: targetId,
    sceneMap: sceneMap.toPositions(),
    vacancies,
  });
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

    dispatch(createAction(actionTypes.TAGS_DATA_DELETE_DATA_ITEM, targetId));

    if (
      itemSentimentScore >= currentMaxSentimentScore &&
      selectMaxSentimentScore(getState()) !== currentMaxSentimentScore
    ) {
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
    const { sentimentScore: currentSentimentScore, color: currentColor } = currentTagDataItem;
    const currentMaxSentimentScore = selectMaxSentimentScore(getState());
    let shouldResetTagsCloud =
      currentTagDataItem.label !== tagData.label || currentMaxSentimentScore < tagData.sentimentScore;
    dispatch(createAction(actionTypes.TAGS_DATA_EDIT_DATA_ITEM, tagData));

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
    } else if (currentColor !== tagData.color) {
      dispatch(createAction(actionTypes.TAGS_CLOUD_UPDATE_TAG_COLOR, { tagId: tagData.id, color: tagData.color }));
    }
  };
}

export function addDataItem(data: Omit<TagDataT, 'id'>) {
  return (dispatch: AppDispatchT, getState: GetStateT) => {
    const maxSentimentScore = selectMaxSentimentScore(getState());
    const shouldResetTagsCloud = maxSentimentScore < data.sentimentScore;

    const id = data.label + '_' + Date.now() + (Math.random() + '').slice(-3);
    dispatch(createAction(actionTypes.TAGS_DATA_ADD_DATA_ITEM, { ...data, id }));
    dispatch(createAction(actionTypes.INCREMENTAL_BUILD_ADD_TAG_ID, id));

    if (shouldResetTagsCloud) {
      dispatch(createAction(actionTypes.RESET_TAGS_CLOUD));
    }
  };
}

export function resetTagsCloud() {
  return createAction(actionTypes.RESET_TAGS_CLOUD);
}

export function changeTagPosition({
  tagId,
  vacancy,
  vacancyKind,
  isRotated,
}: {
  tagId: string;
  vacancy: VacancyT;
  vacancyKind: VacancyKinds;
  isRotated: boolean;
}) {
  return (dispatch: AppDispatchT, getState: GetStateT) => {
    const {
      tagsCloud: { sceneMap: sceneMapPositions, tagsPositions },
      rectAreasMapsData: rectAreasMaps,
      settings,
    } = getState();

    const result = updateTagPosition(
      {
        tagId,
        vacancy,
        vacancyKind,
        isRotated,
      },
      { sceneMapPositions, tagsPositions, rectAreasMaps, options: formCalcTagsPositionsOptions(settings) },
    );
    if (!result) {
      return null;
    }

    dispatch(createAction(actionTypes.TAGS_CLOUD_UPDATE_TAG, result));
  };
}
