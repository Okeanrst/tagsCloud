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
} from '../actions/actionTypes';

const { PENDING, PRISTINE, SUCCESS, FAILURE } = QueryStatuses;

const initState: RootStateT['tagsCloud'] = { status: PRISTINE, tagsPositions: null, sceneMap: null };

export const tagsCloudReducer = (
  state: RootStateT['tagsCloud'] = { ...initState },
  action: AnyAction,
) => {
  switch (action.type) {
    case TAGS_CLOUD_BUILD_REQUEST:
      return { ...state, status: PENDING };
    case TAGS_CLOUD_BUILD_SUCCESS:
      return { ...state, status: SUCCESS, ...action.payload };
    case TAGS_CLOUD_BUILD_FAILURE:
      return { ...state, status: FAILURE };
    case RESET_TAGS_CLOUD:
      return { ...initState };
    case INCREMENTAL_BUILD_TAGS_CLOUD_SUCCESS: {
      const tagsPositions: RootStateT['tagsCloud']['tagsPositions'] = [
        ...(state.tagsPositions ?? []),
        ...action.payload.tagsPositions,
      ];
      return { ...state, status: SUCCESS, ...action.payload, tagsPositions };
    }
    case TAGS_CLOUD_REMOVE_TAG: {
      const { tagId, sceneMap } = action.payload;
      const tagsPositions = state.tagsPositions?.filter(({ id }) => id !== tagId);
      return { ...state, tagsPositions, sceneMap };
    }
    default:
      return state;
  }
};