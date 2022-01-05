import React, { useEffect } from 'react';
import getDisplayName from 'react-display-name';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from 'store/actions/tagsCloud';
import { PENDING } from 'constants/queryStatuses';

import type { RootStateT } from 'store/types';

function withTriggerGettingRawData<T>(
  WrappedComponent: React.ComponentType<T>,
) {
  const EnhancedComponent = (props: T) => {
    const { tagsData } = useSelector(
      (state: RootStateT): { tagsData: RootStateT['tagsData'] } => {
        return { tagsData: state.tagsData };
      },
    );
    const dispatch = useDispatch();

    useEffect(() => {
      if (!tagsData.data && tagsData.status !== PENDING) {
        dispatch(actions.getData());
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <WrappedComponent {...props} />;
  };

  EnhancedComponent.displayName = `withRawData(${getDisplayName(
    WrappedComponent,
  )})`;

  return EnhancedComponent;
}

export default withTriggerGettingRawData;
