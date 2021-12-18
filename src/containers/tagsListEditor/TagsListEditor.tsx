import React, { Component, SyntheticEvent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { createSelector } from 'reselect';
import { bindActionCreators } from 'redux';
import { FixedSizeList } from 'react-window';
import FadeLoader from 'react-spinners/FadeLoader';
import withTriggerGettingRawData from 'decorators/withTriggerGettingRawData';
import { withRestScreenHeight } from 'decorators/withRestScreenHeight';
import * as actions from 'store/actions/tagsCloud';
import styles from './styles';
import SmallModalWindow from 'components/modalWindows/SmallModalWindow';
import FullScreenModalWindow from 'components/modalWindows/FullScreenModalWindow';
import {
  downloadRawTagsCloudDataFile,
  uploadRawTagsCloudDataFile,
} from 'store/actions/tagsCloudDataFile';
import { TagForm } from './TagForm';
import SearchWithAutocomplete from './searchWithAutocomplete';
import { PENDING } from 'constants/queryStatuses';

import type { TagDataT } from 'types/types';
import type { RootStateT, AppDispatchT } from 'store/types';
import { withStyles } from '@material-ui/core';

type CreatedTagDataT = Partial<Omit<TagDataT, 'id'>>;

const getTagsRawData = (state: RootStateT) => state.rawData.data;
const getSearchAutocompleteSuggestions = createSelector(
  [getTagsRawData],
  tagsRawData =>
    tagsRawData
      ? tagsRawData.map(item => ({ id: item.id, label: item.label }))
      : [],
);

const mapStateToProps = (state: RootStateT) => {
  const { rawData } = state;
  const searchAutocompleteSuggestions = getSearchAutocompleteSuggestions(state);
  return { rawData, searchAutocompleteSuggestions };
};

const mapDispatchToProps = (dispatch: AppDispatchT) =>
  bindActionCreators(
    {
      deleteTag: actions.deleteDataItem,
      addTag: actions.addDataItem,
      editTag: actions.editDataItem,
      uploadCloudRawDataFile: uploadRawTagsCloudDataFile,
    },
    dispatch,
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

type ClassesT = { [key: string]: string };

type PropsT = PropsFromRedux & {
  restScreenHeight: number;
  classes: ClassesT;
};

type StateT = {
  tagsListHeight: number;
  scrollToItem?: { index: number };
  createdTagData?: CreatedTagDataT;
  editedTagData?: TagDataT;
  tagIdToDelete?: string;
};

const TAGS_LIST_ROW_HEIGHT = 35;

class TagsListEditor extends Component<PropsT, StateT> {
  state: StateT = { tagsListHeight: TAGS_LIST_ROW_HEIGHT };
  confFilesRef = React.createRef<HTMLDivElement>();
  listRef = React.createRef<FixedSizeList>();
  resizeTaskTimer: ReturnType<typeof setTimeout> | null = null;

  componentDidMount() {
    this.confFilesRef.current?.addEventListener(
      'resize',
      this.confFilesRefHandleResize,
    );

    const tagsListHeight = this.calcTagsListHeight();
    this.setState({ tagsListHeight });
  }

  componentWillUnmount() {
    if (this.confFilesRef.current) {
      this.confFilesRef.current?.removeEventListener(
        'resize',
        this.confFilesRefHandleResize,
      );
    }
    this.resizeTaskTimer && clearTimeout(this.resizeTaskTimer);
  }

  componentDidUpdate(prevProps: PropsT, prevState: StateT) {
    if (prevProps.restScreenHeight !== this.props.restScreenHeight) {
      const tagsListHeight = this.calcTagsListHeight();
      if (tagsListHeight !== this.state.tagsListHeight) {
        this.setState({ tagsListHeight });
      }
    }
    const { scrollToItem } = this.state;
    if (scrollToItem && prevState.scrollToItem !== scrollToItem) {
      this.listRef.current?.scrollToItem(scrollToItem.index, 'center');
    }
  }

  confFilesRefHandleResize = () => {
    const delay = 500;

    if (!this.resizeTaskTimer) {
      this.resizeTaskTimer = setTimeout(() => {
        this.resizeTaskTimer = null;
        const tagsListHeight = this.calcTagsListHeight();
        if (tagsListHeight !== this.state.tagsListHeight) {
          this.setState({ tagsListHeight });
        }
      }, delay);
    }
  };

  calcTagsListHeight = () => {
    if (!this.confFilesRef.current) {
      return 0;
    }

    const { top, bottom } = this.confFilesRef.current?.getBoundingClientRect();
    const restScreenHeight = this.props.restScreenHeight - (bottom - top);
    return restScreenHeight > TAGS_LIST_ROW_HEIGHT
      ? restScreenHeight
      : TAGS_LIST_ROW_HEIGHT;
  };

  renderLoader = (loading: boolean) => {
    const { classes } = this.props;
    return (
      <div className={classes.loaderContainer}>
        <FadeLoader
          color="#123abc"
          loading={loading}
        />
      </div>
    );
  };

  uploadCloudRawDataFile = (e: SyntheticEvent<HTMLInputElement>) => {
    if (
      !(e.target instanceof HTMLInputElement) ||
      !e.target.files ||
      !e.target.files[0]
    ) {
      return;
    }

    this.props.uploadCloudRawDataFile(e.target.files[0]);
  };

  renderFileUploader = (disabled: boolean) => {
    const { classes } = this.props;
    return (
      <div className={classes.fileUploader}>
        <label
          className={classes.fileUploaderLabel}
          htmlFor="cloud_conf_upload"
        >
          Choose tags cloud configuration file (*.json)
        </label>
        <input
          accept=".json"
          disabled={disabled}
          id="cloud_conf_upload"
          type="file"
          onChange={this.uploadCloudRawDataFile}
        />
      </div>
    );
  };

  downloadCloudRawDataFile = () => {
    const tagsCloudData = this.props.rawData.data;
    if (!tagsCloudData) return;
    downloadRawTagsCloudDataFile(tagsCloudData);
  };

  renderFileDownloader = (disabled: boolean) => (
    <button
      disabled={disabled}
      onClick={this.downloadCloudRawDataFile}
    >
      Download tags cloud as a file
    </button>
  );

  resetIdForDelete = () => {
    this.setState({ tagIdToDelete: undefined });
  };

  renderConfirmDelete = (tagIdToDelete: string) => {
    const { classes } = this.props;

    const onConfirm = () => {
      this.resetIdForDelete();
      this.props.deleteTag(tagIdToDelete);
    };

    const modalWindowBody = [
      <span
        className={classes.confirmDeleteQuestion}
        key="question"
      >
        Are you sure you want to delete tag with "
        {tagIdToDelete}
        " id?
      </span>,
      <div
        className={classes.confirmDeleteButtons}
        key="buttons"
      >
        <button
          key="cancel"
          onClick={this.resetIdForDelete}
        >
          cancel
        </button>
        <button
          key="delete"
          style={{ marginLeft: '24px' }}
          onClick={onConfirm}
        >
          delete
        </button>
      </div>,
    ];

    return (
      <SmallModalWindow onContainerClick={this.resetIdForDelete}>
        <div className={classes.confirmDelete}>
          {modalWindowBody}
        </div>
      </SmallModalWindow>
    );
  };

  onDelete = (e: SyntheticEvent<EventTarget>) => {
    if (
      this.state.tagIdToDelete !== undefined ||
      !(e.target instanceof HTMLButtonElement)
    ) {
      return;
    }
    const id = e.target.dataset.id;
    if (id !== undefined) {
      this.setState({ tagIdToDelete: id });
    }
  };

  onTagChange = (data: TagDataT | Omit<TagDataT, 'id'>) => {
    this.closeTagForm();
    'id' in data && data.id
      ? this.props.editTag(data)
      : this.props.addTag(data);
  };

  onClone = (e: SyntheticEvent<EventTarget>) => {
    if (!(e.target instanceof HTMLButtonElement)) {
      return;
    }

    const targetId = e.target.dataset.id;
    const { rawData } = this.props;
    const targetTagData = rawData.data?.find(item => item.id === targetId);

    if (!targetTagData) {
      return;
    }

    const { id, ...restProps } = targetTagData;

    const createdTagData = { ...restProps };
    this.setState({ createdTagData });
  };

  onAdd = () => {
    this.setState({ createdTagData: {} });
  };

  onEdit = (e: SyntheticEvent<EventTarget>) => {
    if (!(e.target instanceof HTMLButtonElement)) {
      return;
    }

    const id = e.target.dataset.id;
    const { rawData } = this.props;
    const editedTagData = rawData.data?.find(item => item.id === id);
    this.setState({ editedTagData });
  };

  closeTagForm = () => {
    this.setState({ editedTagData: undefined, createdTagData: undefined });
  };

  onSearch = (target: string | null) => {
    const {
      rawData: { data },
    } = this.props;
    const index =
      target && data ? data.findIndex(item => target === item.label) : -1;
    if (index >= 0) {
      this.setState({ scrollToItem: { index } });
    }
  };

  renderTagForm = (data: Partial<TagDataT>) => (
    <FullScreenModalWindow onContainerClick={this.closeTagForm}>
      <TagForm
        initValues={data}
        onCancel={this.closeTagForm}
        onSubmit={this.onTagChange}
      />
    </FullScreenModalWindow>
  );

  renderListRow =
    (data: ReadonlyArray<TagDataT>, classes: ClassesT) =>
    ({ index, style }: { index: number; style: {} }) => {
      const item = data[index];
      return (
        <li
          className={classes.tagsListRow}
          style={style}
        >
          <span
            className={classes.tagsListLabel}
            key="label"
          >
            {item.label}
          </span>
          <span key="sentimentScore">
            {item.sentimentScore}
          </span>
          <button
            className={classes.tagsListButton}
            data-id={item.id}
            key="clone"
            onClick={this.onClone}
          >
            clone
          </button>
          <button
            className={classes.tagsListButton}
            data-id={item.id}
            key="edit"
            onClick={this.onEdit}
          >
            edit
          </button>
          <button
            className={classes.tagsListButton}
            data-id={item.id}
            key="delete"
            onClick={this.onDelete}
          >
            delete
          </button>
        </li>
      );
    };

  renderList = (data: ReadonlyArray<TagDataT>, height: number) => {
    const { classes } = this.props;
    return (
      <FixedSizeList
        height={height}
        itemCount={data.length}
        itemSize={TAGS_LIST_ROW_HEIGHT}
        ref={this.listRef}
        width="100%"
      >
        {this.renderListRow(data, classes)}
      </FixedSizeList>
    );
  };

  render() {
    const { rawData, searchAutocompleteSuggestions, classes } = this.props;
    const { tagsListHeight, editedTagData, createdTagData } = this.state;
    const loading = rawData.status === PENDING;
    const tagFormData = createdTagData || editedTagData;

    return (
      <div>
        {this.renderLoader(loading)}
        <div
          className={classes.cloudConfFiles}
          key="cloudConfFiles"
          ref={this.confFilesRef}
        >
          {this.renderFileUploader(loading)}
          {this.renderFileDownloader(!rawData.data || loading)}
          <button onClick={this.onAdd}>Add new</button>
          <SearchWithAutocomplete
            placeholder="Search a tag by label"
            suggestions={searchAutocompleteSuggestions}
            onSubmit={this.onSearch}
          />
        </div>
        {tagFormData && this.renderTagForm(tagFormData)}
        {rawData.data && this.renderList(rawData.data, tagsListHeight)}
        {this.state.tagIdToDelete !== undefined &&
          this.renderConfirmDelete(this.state.tagIdToDelete)}
      </div>
    );
  }
}

const TagsListEditorWithRestScreenHeight = withStyles(styles)(
  withRestScreenHeight<PropsT>(TagsListEditor),
);

type TagsListEditorWithRestScreenHeightPropsT = React.ComponentProps<
  typeof TagsListEditorWithRestScreenHeight
>;

export default connector(
  withTriggerGettingRawData<TagsListEditorWithRestScreenHeightPropsT>(
    TagsListEditorWithRestScreenHeight,
  ),
);
