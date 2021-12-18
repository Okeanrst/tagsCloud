import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FadeLoader from 'react-spinners/FadeLoader';
import { makeStyles } from '@material-ui/core';
import withTriggerGettingRawData from 'decorators/withTriggerGettingRawData';
import { PENDING, FAILURE, SUCCESS } from 'constants/queryStatuses';

import { TagDataT } from '../types/types';
import { RootStateT } from '../store/types';
import { connect, ConnectedProps } from 'react-redux';

const mapStateToProps = (state: RootStateT) => {
  const { rawData } = state;
  return { rawData };
};

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

type PropsT = PropsFromRedux;

type ListItemsColumnItemT = string | number | void | (() => React.ReactNode);

type ToggleShowingDaysT = () => void;

const useStyles = makeStyles({
  root: {
    position: 'relative',
  },
  loaderContainer: {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    zIndex: 1,
  },
  listItems: { display: 'flex' },
  containerStyle: { listStyle: 'none' },
  pageType: { listStyle: 'none', padding: '0px' },
  days: { listStyle: 'none', padding: '0px' },
  sentiment: {
    listStyle: 'none',
    display: 'flex',
    alignItems: 'center',
    padding: '0px',
  },
  daysPicker: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '50%',
    height: '1.5em',
    width: '1.5em',
    backgroundColor: '#e3f2fd',
    marginLeft: '1.5em',
  },
});

type ClassesT = ReturnType<typeof useStyles>;

const renderCell = (it: ListItemsColumnItemT) => {
  return typeof it === 'function' ? it() : it ?? null;
};

const renderDays = (days: TagDataT['days'], classes: ClassesT) => {
  if (!days?.length) {
    return null;
  }
  const list = days.map((i, index: number) => {
    return (
      <li key={index}>
        {`${new Date(i.date).toLocaleDateString()} - ${i.volume}`}
      </li>
    );
  });
  return (
    <ul className={classes.days}>
      {list}
    </ul>
  );
};

const renderSentiment = (
  sentiment: TagDataT['sentiment'],
  classes: ClassesT,
) => {
  const { negative = 0, neutral = 0, positive = 0 } = sentiment ?? {};
  return (
    <ul className={classes.sentiment}>
      <li
        className="badge badge-secondary"
        key="negative"
      >
        negative
        {' '}
        {negative}
      </li>
      <li
        className="badge badge-secondary"
        key="neutral"
        style={{ marginLeft: '8px' }}
      >
        neutral
        {' '}
        {neutral}
      </li>
      <li
        className="badge badge-secondary"
        key="positive"
        style={{ marginLeft: '8px' }}
      >
        positive
        {' '}
        {positive}
      </li>
    </ul>
  );
};

const renderPageType = (pageType: TagDataT['pageType'], classes: ClassesT) => {
  return (
    <ul className={classes.pageType}>
      {pageType
        ? (Object.keys(pageType) as Array<keyof typeof pageType>).map(i => (
          <li key={i}>
            {`${i}: ${pageType[i]}`}
          </li>
          ))
        : null}
    </ul>
  );
};

const renderDaysPicker = (
  icon: string,
  toggleShowingDays: ToggleShowingDaysT,
  classes: ClassesT,
) => (
  <div
    className={classes.daysPicker}
    key="daysPicker"
    onClick={toggleShowingDays}
  >
    {icon}
  </div>
);

const getInformationListRenderers = (
  data: TagDataT,
  toggleShowingDays: ToggleShowingDaysT,
  shouldShowDays: boolean,
  classes: ClassesT,
): ReadonlyArray<{
  key: string;
  cells: [ListItemsColumnItemT, ListItemsColumnItemT];
}> => {
  const {
    label,
    volume,
    type,
    sentiment,
    sentimentScore,
    burst,
    days,
    pageType,
  } = data;

  return [
    { key: 'label', cells: ['label:', label] },
    { key: 'volume', cells: ['volume:', volume] },
    { key: 'type', cells: ['type:', type] },
    { key: 'sentimentScore', cells: ['sentimentScore:', sentimentScore] },
    {
      key: 'sentiment',
      cells: ['sentiment:', () => renderSentiment(sentiment, classes)],
    },
    { key: 'burst', cells: ['burst:', burst ?? ''] },
    {
      key: 'daysPick',
      cells: [
        () => [
          'days: ',
          shouldShowDays
            ? renderDaysPicker('-', toggleShowingDays, classes)
            : days?.length
            ? renderDaysPicker('+', toggleShowingDays, classes)
            : 0,
        ],
        () => (shouldShowDays ? renderDays(days, classes) : null),
      ],
    },
    {
      key: 'pageType',
      cells: ['pageType:', () => renderPageType(pageType, classes)],
    },
  ];
};

const TagInformation = (props: PropsT) => {
  const { rawData } = props;
  const navigate = useNavigate();
  const { id: tagId } = useParams();
  const [shouldShowDays, setShouldShowDays] = useState<boolean>(true);
  const classes = useStyles();

  const tagData = rawData.data ? rawData.data.find(i => i.id === tagId) : null;

  const toggleShowingDays = useCallback(() => {
    setShouldShowDays(currentValue => !currentValue);
  }, []);

  useEffect(() => {
    if (
      !tagData &&
      (rawData.status === FAILURE || rawData.status === SUCCESS)
    ) {
      navigate('/notFound', { replace: true });
    }
  }, [tagData, rawData.status, navigate]);

  if (!tagData) return null;

  const informationListRenderers = getInformationListRenderers(
    tagData,
    toggleShowingDays,
    shouldShowDays,
    classes,
  );

  const loading = rawData.status === PENDING;

  return (
    <div className={classes.root}>
      {loading ? (
        <div className={classes.loaderContainer}>
          <FadeLoader
            color="#123abc"
            loading={loading}
          />
        </div>
      ) : null}
      <ul
        className={[
          'list-group',
          'list-group-flush',
          classes.containerStyle,
        ].join(' ')}
        key="tagInformation"
      >
        {informationListRenderers.map(i => (
          <li
            className={['list-group-item', classes.listItems].join(' ')}
            key={i.key}
          >
            {i.cells && [
              <div
                key="0"
                style={{ display: 'flex', flex: 2 }}
              >
                {renderCell(i.cells[0])}
              </div>,
              <div
                key="1"
                style={{ flex: 10 }}
              >
                {renderCell(i.cells[1])}
              </div>,
            ]}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default connector(withTriggerGettingRawData<PropsT>(TagInformation));
