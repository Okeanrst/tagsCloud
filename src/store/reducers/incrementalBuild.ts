import { RootStateT } from '../types';
import { QueryStatuses } from 'constants/queryStatuses';
import { AnyAction } from 'redux';
import {
  INCREMENTAL_BUILD_TAGS_CLOUD_REQUEST,
  INCREMENTAL_BUILD_TAGS_CLOUD_SUCCESS,
  INCREMENTAL_BUILD_TAGS_CLOUD_FAILURE,
  INCREMENTAL_BUILD_ADD_TAG_ID,
  INCREMENTAL_BUILD_REMOVE_TAG_ID,
  RESET_TAGS_CLOUD,
} from '../actions/actionTypes';

const { PENDING, PRISTINE, SUCCESS, FAILURE } = QueryStatuses;

const initState: RootStateT['incrementalBuild'] = { status: PRISTINE, tagsIds: [] };

export const incrementalBuildReducer = (
  state: RootStateT['incrementalBuild'] = { ...initState },
  action: AnyAction,
) => {
  switch (action.type) {
    case INCREMENTAL_BUILD_TAGS_CLOUD_REQUEST:
      return { ...state, status: PENDING };
    case INCREMENTAL_BUILD_TAGS_CLOUD_SUCCESS:
      return { status: SUCCESS, tagsIds: [] };
    case INCREMENTAL_BUILD_TAGS_CLOUD_FAILURE:
      return { ...state, status: FAILURE };
    case INCREMENTAL_BUILD_ADD_TAG_ID: {
      const tagsIds = [...state.tagsIds, action.payload];
      return { ...state, status: PRISTINE, tagsIds };
    }
    case INCREMENTAL_BUILD_REMOVE_TAG_ID: {
      const tagsIds = state.tagsIds.filter((tagId) => action.payload !== tagId);
      return { ...state, status: PRISTINE, tagsIds };
    }
    case RESET_TAGS_CLOUD:
      return { ...initState };
    default:
      return state;
  }
};
