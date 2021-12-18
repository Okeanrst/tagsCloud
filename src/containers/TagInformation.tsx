import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import withTriggerGettingRawData from 'decorators/withTriggerGettingRawData';
import { PENDING } from 'constants/queryStatuses';

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

type ListItemsRowItemT = string | number | (() => React.ReactNode);

type ToggleShowingDaysT = () => void;

const renderIt = (it: ListItemsRowItemT) => {
  return typeof it === 'function' ? it() : it;
};

const renderDays = (days: TagDataT['days']) => {
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
    <ul style={styles.days}>
      {list}
    </ul>
  );
};

const renderSentiment = (sentiment?: TagDataT['sentiment']) => {
  const { negative = 0, neutral = 0, positive = 0 } = sentiment ?? {};
  return (
    <ul style={styles.sentiment}>
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

const renderPageType = (pageType?: TagDataT['pageType']) => {
  return (
    <ul style={styles.pageType}>
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
) => (
  <div
    key="daysPicker"
    style={styles.daysPicker}
    onClick={toggleShowingDays}
  >
    {icon}
  </div>
);

const getInformationListRenderers = (
  data: TagDataT,
  toggleShowingDays: ToggleShowingDaysT,
  shouldShowDays: boolean,
): ReadonlyArray<{
  key: string;
  rows: [ListItemsRowItemT, ListItemsRowItemT];
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
    { key: 'label', rows: ['label:', label] },
    { key: 'volume', rows: ['volume:', volume] },
    { key: 'type', rows: ['type:', type] },
    { key: 'sentimentScore', rows: ['sentimentScore:', sentimentScore] },
    {
      key: 'sentiment',
      rows: ['sentiment:', () => renderSentiment(sentiment)],
    },
    { key: 'burst', rows: ['burst:', burst ?? ''] },
    {
      key: 'daysPick',
      rows: [
        () => [
          'days: ',
          shouldShowDays
            ? renderDaysPicker('-', toggleShowingDays)
            : days?.length
            ? renderDaysPicker('+', toggleShowingDays)
            : 0,
        ],
        () => (shouldShowDays ? renderDays(days) : null),
      ],
    },
    {
      key: 'pageType',
      rows: ['pageType:', () => renderPageType(pageType)],
    },
  ];
};

const TagInformation = (props: PropsT) => {
  const { rawData } = props;
  const navigate = useNavigate();
  const { id: tagId } = useParams();
  const [shouldShowDays, setShouldShowDays] = useState<boolean>(true);

  const tagData = rawData.data ? rawData.data.find(i => i.id === tagId) : null;

  const toggleShowingDays = useCallback(() => {
    setShouldShowDays(currentValue => !currentValue);
  }, []);

  useEffect(() => {
    if (!tagData && rawData.status !== PENDING) {
      navigate('/notFound', { replace: true });
    }
  }, [tagData, rawData.status, navigate]);

  if (!tagData) return null;

  const informationListRenderers = getInformationListRenderers(
    tagData,
    toggleShowingDays,
    shouldShowDays,
  );

  return (
    <ul
      className="list-group list-group-flush"
      key="tagInformation"
      style={styles.containerStyle}
    >
      {informationListRenderers.map(i => (
        <li
          className="list-group-item"
          key={i.key}
          style={styles.listItems}
        >
          {i.rows && [
            <div
              key="0"
              style={{ display: 'flex', flex: 2 }}
            >
              {renderIt(i.rows[0])}
            </div>,
            <div
              key="1"
              style={{ flex: 10 }}
            >
              {renderIt(i.rows[1])}
            </div>,
          ]}
        </li>
      ))}
    </ul>
  );
};

const styles = {
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
};

export default connector(withTriggerGettingRawData<PropsT>(TagInformation));
