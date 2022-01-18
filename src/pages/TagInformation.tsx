import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FadeLoader from 'react-spinners/FadeLoader';
import { makeStyles } from '@material-ui/core';
import { editDataItem } from 'store/actions/tagsCloud';
import withTriggerGettingRawData from 'decorators/withTriggerGettingRawData';
import { QueryStatuses } from 'constants/queryStatuses';
import { TextButton } from 'ui/buttons/TextButton';
import { TagFormModal } from 'components/modalWindows/TagFormModal';

import { TagDataT, ClassesT } from 'types/types';
import { RootStateT } from '../store/types';
import { connect, ConnectedProps, useDispatch } from 'react-redux';

const { PENDING, FAILURE, SUCCESS } = QueryStatuses;

const mapStateToProps = (state: RootStateT) => {
  const { tagsData } = state;
  return { tagsData };
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
  informationList: {
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
    paddingLeft: 0,
    listStyle: 'none',
    borderRadius: 0,
  },
  listItem: {
    display: 'flex',
    padding: '12px 20px',
    border: '1px solid rgba(0,0,0,.125)',
    borderWidth: '0 0 1px',
  },
  pageType: {
    padding: '0px',
    listStyle: 'none',
  },
  days: {
    padding: '0px',
    listStyle: 'none',
  },
  sentimentList: {
    listStyle: 'none',
    display: 'flex',
    alignItems: 'center',
    padding: '0px',
  },
  sentimentListItem: {
    borderRadius: '0.25rem',
    display: 'inline-block',
    padding: '0.25em 0.4em',
    fontSize: '75%',
    fontWeight: 700,
    lineHeight: 1,
    textAlign: 'center',
    verticalAlign: 'baseline',
    whiteSpace: 'nowrap',
    backgroundColor: '#6c757d',
    color: '#fff',
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
    <ul className={classes.sentimentList}>
      <li
        className={classes.sentimentListItem}
        key="negative"
      >
        negative
        {' '}
        {negative}
      </li>
      <li
        className={classes.sentimentListItem}
        key="neutral"
        style={{ marginLeft: '8px' }}
      >
        neutral
        {' '}
        {neutral}
      </li>
      <li
        className={classes.sentimentListItem}
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
  const { tagsData } = props;
  const navigate = useNavigate();
  const { id: tagId } = useParams();
  const dispatch = useDispatch();
  const [shouldShowDays, setShouldShowDays] = useState<boolean>(true);
  const [isTagFormModalShown, setIsTagFormModalShown] = useState<boolean>(false);
  const classes = useStyles();

  const tagData = tagsData.data ? tagsData.data.find(i => i.id === tagId) : null;

  const toggleShowingDays = useCallback(() => {
    setShouldShowDays(currentValue => !currentValue);
  }, []);

  useEffect(() => {
    if (
      !tagData &&
      (tagsData.status === FAILURE || tagsData.status === SUCCESS)
    ) {
      navigate('/notFound', { replace: true });
    }
  }, [tagData, tagsData.status, navigate]);

  const onEditClick = useCallback(() => {
    setIsTagFormModalShown(true);
  }, []);

  const closeTagFormModal = useCallback(() => {
    setIsTagFormModalShown(false);
  }, []);

  const onTagChange = useCallback((data: Pick<TagDataT, 'label' | 'color' | 'sentimentScore'>) => {
    setIsTagFormModalShown(false);
    if (!tagData) {
      return;
    }
    dispatch(editDataItem({ ...tagData, ...data }));
  }, [dispatch, tagData]);

  if (!tagData) return null;

  const informationListRenderers = getInformationListRenderers(
    tagData,
    toggleShowingDays,
    shouldShowDays,
    classes,
  );

  const loading = tagsData.status === PENDING;

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
      {isTagFormModalShown && (
        <TagFormModal
          formProps={{
            initValues: tagData,
            onCancel: closeTagFormModal,
            onSubmit: onTagChange
          }}
          onBackdropClick={closeTagFormModal}
        />
      )}
      <TextButton onClick={onEditClick}>
        Edit
      </TextButton>
      <ul className={classes.informationList}>
        {informationListRenderers.map(i => (
          <li
            className={classes.listItem}
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
