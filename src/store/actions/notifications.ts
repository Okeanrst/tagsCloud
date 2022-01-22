import { NOTIFICATIONS_PUSH, NOTIFICATIONS_DELETE } from './actionTypes';
import { NotificationT } from '../types';
import { createAction } from './helpers';

export const deleteNotification = (id: string) => {
  return { type: NOTIFICATIONS_DELETE, payload: id };
};

export const addNotification = ({ content, type, timeout }: Pick<NotificationT, 'content' | 'type' | 'timeout'>) => {
  return createAction(NOTIFICATIONS_PUSH, [{ content, id: Math.random(), type, timeout }]);
};
