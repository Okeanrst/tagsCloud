import React, { useEffect, useState, useRef } from 'react';
import { makeStyles } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { RootStateT } from 'store/types';
import { round } from 'utilities/helpers/math';
import { QueryStatuses } from 'constants/queryStatuses';

const { SUCCESS } = QueryStatuses;

const TIMEOUT_TO_SHOW = 1000;

const useStyles = makeStyles({
  root: {
    minHeight: 36,
    fontSize: 24,
    lineHeight: '36px',
  },
});

export const TagsCloudBuildProgress = () => {
  const { status, progress } = useSelector((state: RootStateT) => state.tagsCloud);
  const [canBeShown, setCanBeShown] = useState(false);
  const classes = useStyles();
  const mountedAtRef = useRef<number | null>(null);

  const { tagsPositions: tagsPositionsProgress } = progress ?? {};

  useEffect(() => {
    mountedAtRef.current = Date.now();
    const timeout = setTimeout(() => {
      setCanBeShown(true);
    }, TIMEOUT_TO_SHOW);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  let progressNumber = status === SUCCESS ? 1 : 0;
  if (status !== SUCCESS && typeof tagsPositionsProgress === 'number') {
    progressNumber = tagsPositionsProgress;
  }

  return <div className={classes.root}>{canBeShown ? `${round(progressNumber * 100, 1)} %` : null}</div>;
};
