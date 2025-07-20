import React, { useEffect } from 'react';
import getDisplayName from 'react-display-name';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from 'store/actions/tagsCloud';
import { QueryStatuses } from 'constants/queryStatuses';

import type { RootStateT } from 'store/types';

const { PRISTINE } = QueryStatuses;

function withTriggerGettingRawData<T extends {}>(
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
      if (tagsData.status === PRISTINE) {
        dispatch(actions.getData());
      }
    }, [dispatch, tagsData]);

    return <WrappedComponent {...props} />;
  };

  EnhancedComponent.displayName = `withRawData(${getDisplayName(
    WrappedComponent,
  )})`;

  return EnhancedComponent;
}

export default withTriggerGettingRawData;
