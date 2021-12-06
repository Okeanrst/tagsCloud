import React, { useEffect } from 'react';
import getDisplayName from 'react-display-name';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from 'store/actions/tagsCloud';

import type { RootStateT } from 'store/types';

function withTriggerGettingRawData<T>(
  WrappedComponent: React.ComponentType<T>,
) {
  const EnhancedComponent = (props: T) => {
    const { rawData } = useSelector(
      (state: RootStateT): { rawData: RootStateT['rawData'] } => {
        return { rawData: state.rawData };
      },
    );
    const dispatch = useDispatch();

    useEffect(() => {
      if (!rawData.data && !rawData.isFetching) {
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
