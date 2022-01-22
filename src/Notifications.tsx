import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import cx from 'classnames';
import { makeStyles } from '@material-ui/core';
import { deleteNotification } from 'store/actions/notifications';
import { NOTIFICATIONS_TYPES } from 'constants/index';
import { Button } from 'ui/buttons/Button';
import { CloseIcon } from 'components/CloseIcon';
import { RootStateT } from 'store/types';

const useStyles = makeStyles({
  root: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    right: 'auto',
    transform: 'translateX(-50%)',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingRight: '12px',
    paddingLeft: '24px',
    borderRadius: '4px',
  },
  closeButton: {
    minWidth: 'auto!important',
    marginLeft: '24px',
  },
  closeIcon: {
    width: '24px',
    height: '24px',
  },
  error: {
    color: 'white',
    backgroundColor: 'var(--error-color)',
  },
  success: {
    color: 'white',
    backgroundColor: 'var(--success-color)',
  },
});

export const Notifications = () => {
  const { notifications } = useSelector((state: RootStateT) => {
    return { notifications: state.notifications };
  });
  const dispatch = useDispatch();
  const classes = useStyles();
  const [notification] = notifications;

  useEffect(() => {
    const { timeout, id } = notification ?? {};
    let timeoutId: ReturnType<typeof setTimeout>;
    if (typeof timeout === 'number') {
      timeoutId = setTimeout(() => {
        dispatch(deleteNotification(id));
      }, timeout);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [notification, dispatch]);

  const onCloseClick = useCallback(() => {
    dispatch(deleteNotification(notification?.id));
  },[dispatch, notification]);

  if (!notification) {
    return null;
  }
  const { content, type } = notification;

  const classesByType = {
    [NOTIFICATIONS_TYPES.ERROR]: classes.error,
    [NOTIFICATIONS_TYPES.SUCCESS]: classes.success,
  };

  return (
    <div className={cx(classes.root, classesByType[type])}>
      <div>
        {content}
        <Button
          classes={{ root: classes.closeButton }}
          onClick={onCloseClick}
        >
          <CloseIcon className={classes.closeIcon} />
        </Button>
      </div>
    </div>
  );
};
