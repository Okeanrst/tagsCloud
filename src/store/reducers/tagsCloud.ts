import { RootStateT } from '../types';
import { QueryStatuses } from 'constants/queryStatuses';
import { AnyAction } from 'redux';
import {
  TAGS_CLOUD_BUILD_FAILURE,
  TAGS_CLOUD_BUILD_REQUEST,
  TAGS_CLOUD_BUILD_SUCCESS,
  TAGS_CLOUD_REMOVE_TAG,
  RESET_TAGS_CLOUD,
  INCREMENTAL_BUILD_TAGS_CLOUD_SUCCESS,
  TAGS_CLOUD_UPDATE_TAG,
  TAGS_CLOUD_UPDATE_TAG_COLOR,
  TAGS_CLOUD_BUILD_PROGRESS_UPDATE,
} from '../actionTypes';

const { PENDING, PRISTINE, SUCCESS, FAILURE } = QueryStatuses;

const initState: RootStateT['tagsCloud'] = {
  status: PRISTINE,
  tagsPositions: null,
  sceneMap: null,
  vacancies: null,
  progress: null,
};

export const tagsCloudReducer = (state: RootStateT['tagsCloud'] = { ...initState }, action: AnyAction) => {
  switch (action.type) {
    case TAGS_CLOUD_BUILD_REQUEST:
      return { ...state, status: PENDING };
    case TAGS_CLOUD_BUILD_SUCCESS:
      return { ...state, status: SUCCESS, progress: null, ...action.payload };
    case TAGS_CLOUD_BUILD_FAILURE:
      return { ...state, status: FAILURE, progress: null };
    case RESET_TAGS_CLOUD:
      return { ...initState };
    case TAGS_CLOUD_BUILD_PROGRESS_UPDATE:
      return { ...state, progress: { ...(state.progress ?? {}), ...(action.payload ?? {}) } };
    case INCREMENTAL_BUILD_TAGS_CLOUD_SUCCESS: {
      const tagsPositions: RootStateT['tagsCloud']['tagsPositions'] = [
        ...(state.tagsPositions ?? []),
        ...action.payload.tagsPositions,
      ];
      return { ...state, status: SUCCESS, ...action.payload, tagsPositions };
    }
    case TAGS_CLOUD_REMOVE_TAG: {
      const { tagId, sceneMap, vacancies } = action.payload;
      const tagsPositions = state.tagsPositions?.filter(({ id }) => id !== tagId);
      return { ...state, tagsPositions, sceneMap, vacancies };
    }
    case TAGS_CLOUD_UPDATE_TAG: {
      const { sceneMap, tagPosition, vacancies } = action.payload;
      if (!state.tagsPositions) {
        return state;
      }
      const tagsPositions = state.tagsPositions?.filter(({ id }) => id !== tagPosition.id);
      tagsPositions.push(tagPosition);
      return { ...state, tagsPositions, sceneMap, vacancies };
    }
    case TAGS_CLOUD_UPDATE_TAG_COLOR: {
      const { tagId, color } = action.payload;
      if (!state.tagsPositions) {
        return state;
      }
      const targetTagPositionIndex = state.tagsPositions.findIndex(({ id }) => id === tagId);
      if (targetTagPositionIndex === -1) {
        return state;
      }
      const targetTagPosition = state.tagsPositions[targetTagPositionIndex];
      const nestTagsPositions = [...state.tagsPositions];
      nestTagsPositions[targetTagPositionIndex] = { ...targetTagPosition, color };
      return { ...state, tagsPositions: nestTagsPositions };
    }
    default:
      return state;
  }
};
