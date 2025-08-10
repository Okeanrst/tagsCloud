import React, { Component, SyntheticEvent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { createSelector } from 'reselect';
import { bindActionCreators } from 'redux';
import { FixedSizeList } from 'react-window';
import throttle from 'lodash.throttle';
import cx from 'classnames';
import { withStyles } from '@material-ui/core';
import FadeLoader from 'react-spinners/FadeLoader';
import withTriggerGettingRawData from 'decorators/withTriggerGettingRawData';
import { withRestScreenHeight } from 'decorators/withRestScreenHeight';
import * as actions from 'store/actions/tagsCloud';
import styles from './styles';
import { DeleteConfirmationModal } from 'components/modalWindows/DeleteConfirmationModal';
import { DeleteIcon } from 'ui/icons/DeleteIcon';
import { CopyIcon } from 'ui/icons/CopyIcon';
import { EditIcon } from 'ui/icons/EditIcon';
import { PlusIcon } from 'ui/icons/PlusIcon';
import { DownloadIcon } from 'ui/icons/DownloadIcon';
import { OutlinedButton } from 'ui/buttons/OutlinedButton';
import { downloadRawTagsCloudDataFile, uploadRawTagsCloudDataFile } from 'store/actions/tagsCloudDataFile';
import { TagFormModal } from 'components/modalWindows/TagFormModal';
import { PrimaryButton } from 'ui/buttons/PrimaryButton';
import { FileInput } from 'ui/FileInput';
import StyledSearchWithAutocomplete from './StyledSearchWithAutocomplete';
import { QueryStatuses } from 'constants/queryStatuses';

import type { TagDataT, ClassesT } from 'types/types';
import type { RootStateT, AppDispatchT } from 'store/types';

const { PENDING, SUCCESS } = QueryStatuses;

const getTagsData = (state: RootStateT) => state.tagsData.data;
const getSearchAutocompleteSuggestions = createSelector([getTagsData], (tagsRawData) =>
  tagsRawData ? tagsRawData.map((item) => ({ id: item.id, label: item.label })) : [],
);

const mapStateToProps = (state: RootStateT) => {
  const { tagsData } = state;
  const searchAutocompleteSuggestions = getSearchAutocompleteSuggestions(state);
  return { tagsData, searchAutocompleteSuggestions };
};

const mapDispatchToProps = (dispatch: AppDispatchT) =>
  bindActionCreators(
    {
      deleteTag: actions.deleteDataItem,
      addTag: actions.addDataItem,
      editTag: actions.editDataItem,
      deleteTagsData: actions.deleteTagsData,
      uploadTagsDataFile: uploadRawTagsCloudDataFile,
    },
    dispatch,
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

type PropsT = PropsFromRedux & {
  restScreenHeight: number;
  classes: ClassesT;
};

type StateT = {
  actionsBlockHeight: number;
  scrollToItem?: { index: number };
  tagFormData?: Partial<TagDataT>;
  tagIdToDelete?: string;
  isConfirmDeleteTagsDataShown: boolean;
};

const TAGS_LIST_ROW_HEIGHT = 35;
const TAGS_LIST_MARGIN_TOP = 24;

class TagsListEditor extends Component<PropsT, StateT> {
  state: StateT = {
    isConfirmDeleteTagsDataShown: false,
    actionsBlockHeight: 0,
  };
  actionsBlockRef = React.createRef<HTMLDivElement>();
  listRef = React.createRef<FixedSizeList>();

  componentDidMount() {
    window.addEventListener('resize', this.onActionsBlockResize);
    this.processActionsBlockHeight();
  }

  componentWillUnmount() {
    if (this.actionsBlockRef.current) {
      window.removeEventListener('resize', this.onActionsBlockResize);
    }
    this.onActionsBlockResize.cancel();
  }

  componentDidUpdate(prevProps: PropsT, prevState: StateT) {
    if (prevProps.restScreenHeight !== this.props.restScreenHeight) {
      this.processActionsBlockHeight();
    }
    const { scrollToItem } = this.state;
    if (scrollToItem && prevState.scrollToItem !== scrollToItem) {
      this.listRef.current?.scrollToItem(scrollToItem.index, 'center');
    }
  }

  onActionsBlockResize = throttle(() => {
    this.processActionsBlockHeight();
  }, 500);

  processActionsBlockHeight = () => {
    if (!this.actionsBlockRef.current) {
      this.setState({ actionsBlockHeight: 0 });
      return;
    }

    const { top, bottom } = this.actionsBlockRef.current?.getBoundingClientRect();
    this.setState({ actionsBlockHeight: bottom - top });
  };

  calcTagsListHeight = () => {
    const { restScreenHeight } = this.props;
    const { actionsBlockHeight } = this.state;
    const tagsListHeight =
      Math.floor((restScreenHeight - actionsBlockHeight - TAGS_LIST_MARGIN_TOP) / TAGS_LIST_ROW_HEIGHT) *
      TAGS_LIST_ROW_HEIGHT;
    return tagsListHeight < TAGS_LIST_ROW_HEIGHT * 5 ? TAGS_LIST_ROW_HEIGHT * 5 : tagsListHeight;
  };

  renderLoader = (loading: boolean) => {
    const { classes } = this.props;
    return (
      <div className={classes.loaderContainer}>
        <FadeLoader color="#123abc" loading={loading} />
      </div>
    );
  };

  uploadTagsDataFile = (e: SyntheticEvent<HTMLInputElement>) => {
    if (!(e.target instanceof HTMLInputElement) || !e.target.files || !e.target.files[0]) {
      return;
    }

    this.props.uploadTagsDataFile(e.target.files[0]);
  };

  downloadTagsDataFile = () => {
    const tagsData = this.props.tagsData.data;
    if (!tagsData) return;
    downloadRawTagsCloudDataFile(tagsData);
  };

  renderDownloadFileButton = (disabled: boolean) => {
    const { classes } = this.props;
    return (
      <PrimaryButton
        classes={{ root: this.props.classes.downloadButton }}
        disabled={disabled}
        onClick={this.downloadTagsDataFile}
      >
        <span className={classes.downloadLabel}>Download</span>
        <DownloadIcon className={classes.downloadIcon} />
      </PrimaryButton>
    );
  };

  resetIdForDelete = () => {
    this.setState({ tagIdToDelete: undefined });
  };

  renderConfirmDelete = (tagIdToDelete: string) => {
    const confirmQuestion = `Are you sure you want to delete tag with "${tagIdToDelete}" id?`;
    return (
      <DeleteConfirmationModal
        confirmQuestion={confirmQuestion}
        onBackdropClick={this.resetIdForDelete}
        onCancel={this.resetIdForDelete}
        onConfirm={() => {
          this.resetIdForDelete();
          this.props.deleteTag(tagIdToDelete);
        }}
      />
    );
  };

  renderConfirmDeleteTagsData = () => {
    const onCancel = () => {
      this.setState({ isConfirmDeleteTagsDataShown: false });
    };
    const confirmQuestion = `Are you sure you want to delete all tags?`;
    return (
      <DeleteConfirmationModal
        confirmQuestion={confirmQuestion}
        onBackdropClick={onCancel}
        onCancel={onCancel}
        onConfirm={() => {
          this.setState({ isConfirmDeleteTagsDataShown: false });
          this.props.deleteTagsData();
        }}
      />
    );
  };

  onDeleteTagsData = () => {
    this.setState({ isConfirmDeleteTagsDataShown: true });
  };

  onDelete = (e: SyntheticEvent<EventTarget>) => {
    if (this.state.tagIdToDelete !== undefined || !(e.currentTarget instanceof HTMLButtonElement)) {
      return;
    }
    const id = e.currentTarget.dataset.id;
    if (id !== undefined) {
      this.setState({ tagIdToDelete: id });
    }
  };

  onTagChange = (data: Pick<TagDataT, 'label' | 'color' | 'sentimentScore'>) => {
    const { tagFormData } = this.state;
    this.closeTagForm();
    if (!tagFormData) {
      return;
    }
    const tagId = tagFormData.id;
    tagId ? this.props.editTag({ ...tagFormData, ...data, id: tagId }) : this.props.addTag({ ...tagFormData, ...data });
  };

  onClone = (e: SyntheticEvent<EventTarget>) => {
    if (!(e.currentTarget instanceof HTMLButtonElement)) {
      return;
    }

    const targetId = e.currentTarget.dataset.id;
    const { tagsData } = this.props;
    const targetTagData = tagsData.data?.find((item) => item.id === targetId);

    if (!targetTagData) {
      return;
    }

    const { id, ...restProps } = targetTagData;

    const tagFormData = { ...restProps };
    this.setState({ tagFormData });
  };

  onAdd = () => {
    this.setState({ tagFormData: {} });
  };

  onEdit = (e: SyntheticEvent<EventTarget>) => {
    if (!(e.currentTarget instanceof HTMLButtonElement)) {
      return;
    }

    const id = e.currentTarget.dataset.id;
    const { tagsData } = this.props;
    const editedTagData = tagsData.data?.find((item) => item.id === id);
    this.setState({ tagFormData: editedTagData });
  };

  closeTagForm = () => {
    this.setState({ tagFormData: undefined });
  };

  onSearch = (target: string | null) => {
    const {
      tagsData: { data },
    } = this.props;
    const index = target && data ? data.findIndex((item) => target === item.label) : -1;
    if (index >= 0) {
      this.setState({ scrollToItem: { index } });
    }
  };

  renderTagForm = (data: Partial<TagDataT>) => (
    <TagFormModal
      formProps={{
        initValues: data,
        onCancel: this.closeTagForm,
        onSubmit: this.onTagChange,
      }}
      onBackdropClick={this.closeTagForm}
    />
  );

  renderListRow =
    (data: ReadonlyArray<TagDataT>, classes: ClassesT, highlightedIndex?: number) =>
    ({ index, style }: { index: number; style: {} }) => {
      const item = data[index];
      const itemStyle = highlightedIndex === index ? { ...style, backgroundColor: 'var(--grey300-color)' } : style;
      return (
        <li className={classes.tagsListRow} style={itemStyle}>
          <div className={classes.tagsListLabel} key="label">
            {item.label}
          </div>
          <div>{item.sentimentScore}</div>
          <button className={cx(classes.tagsListButton, classes.cloneButton)} data-id={item.id} onClick={this.onClone}>
            <CopyIcon />
          </button>
          <button className={cx(classes.tagsListButton, classes.editButton)} data-id={item.id} onClick={this.onEdit}>
            <EditIcon />
          </button>
          <button
            className={cx(classes.tagsListButton, classes.deleteButton)}
            data-id={item.id}
            onClick={this.onDelete}
          >
            <DeleteIcon />
          </button>
        </li>
      );
    };

  renderList = (data: ReadonlyArray<TagDataT>, height: number) => {
    const { classes } = this.props;
    return (
      <FixedSizeList
        className={classes.tagsList}
        height={height}
        itemCount={data.length}
        itemSize={TAGS_LIST_ROW_HEIGHT}
        ref={this.listRef}
        width="100%"
      >
        {this.renderListRow(data, classes, this.state.scrollToItem?.index)}
      </FixedSizeList>
    );
  };

  render() {
    const { tagsData, searchAutocompleteSuggestions, classes } = this.props;
    const { tagFormData } = this.state;
    const loading = tagsData.status === PENDING;
    const isDataReady = tagsData.status === SUCCESS;

    const tagsListHeight = this.calcTagsListHeight();

    return (
      <div className={classes.root}>
        {this.renderLoader(loading)}
        <div className={classes.actionsBlock} ref={this.actionsBlockRef}>
          <FileInput
            accept=".json"
            disabled={loading}
            placeholder="Choose tags cloud configuration file (*.json)"
            onChange={this.uploadTagsDataFile}
          />
          {this.renderDownloadFileButton(!isDataReady)}
          <PrimaryButton classes={{ root: classes.addNewButton }} disabled={!isDataReady} onClick={this.onAdd}>
            <span className={classes.addNewLabel}>Add new</span>
            <PlusIcon className={classes.addNewIcon} />
          </PrimaryButton>
          <OutlinedButton
            borderColor="var(--danger-color)"
            classes={{ root: classes.leanUpButton }}
            color="var(--danger-color)"
            onClick={this.onDeleteTagsData}
          >
            <span className={classes.leanUpLabel}>Clean up</span>
            <DeleteIcon className={classes.leanUpIcon} />
          </OutlinedButton>
          <StyledSearchWithAutocomplete
            disabled={!isDataReady}
            placeholder="Search a tag by label"
            suggestions={searchAutocompleteSuggestions}
            onSubmit={this.onSearch}
          />
        </div>
        {tagFormData && this.renderTagForm(tagFormData)}
        {tagsData.data && this.renderList(tagsData.data, tagsListHeight)}
        {this.state.tagIdToDelete !== undefined && this.renderConfirmDelete(this.state.tagIdToDelete)}
        {this.state.isConfirmDeleteTagsDataShown && this.renderConfirmDeleteTagsData()}
      </div>
    );
  }
}

const TagsListEditorWithRestScreenHeight = withStyles(styles)(withRestScreenHeight<PropsT>(TagsListEditor));

type TagsListEditorWithRestScreenHeightPropsT = React.ComponentProps<typeof TagsListEditorWithRestScreenHeight>;

export default connector(
  withTriggerGettingRawData<TagsListEditorWithRestScreenHeightPropsT>(TagsListEditorWithRestScreenHeight),
);
