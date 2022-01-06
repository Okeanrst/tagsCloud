import { RootStateT } from '../types';
import { QueryStatuses } from 'constants/queryStatuses';
import { AnyAction } from 'redux';
import {
  BUILD_TAGS_CLOUD_FAILURE,
  BUILD_TAGS_CLOUD_REQUEST,
  BUILD_TAGS_CLOUD_SUCCESS,
  RESET_TAGS_CLOUD,
} from '../actions/actionTypes';

const { PENDING, PRISTINE, SUCCESS, FAILURE } = QueryStatuses;

export const tagsCloudReducer = (
  state: RootStateT['tagsCloud'] = { status: PRISTINE },
  action: AnyAction,
) => {
  switch (action.type) {
    case BUILD_TAGS_CLOUD_REQUEST:
      return { ...state, status: PENDING };
    case BUILD_TAGS_CLOUD_SUCCESS:
      return { ...state, status: SUCCESS, ...action.data };
    case BUILD_TAGS_CLOUD_FAILURE:
      return { ...state, status: FAILURE };
    case RESET_TAGS_CLOUD:
      return { ...state, status: PRISTINE, data: undefined };
    default:
      return state;
  }
};
