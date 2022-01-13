import React, { Component, SyntheticEvent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { createSelector } from 'reselect';
import { bindActionCreators } from 'redux';
import { FixedSizeList } from 'react-window';
import cx from 'classnames';
import FadeLoader from 'react-spinners/FadeLoader';
import withTriggerGettingRawData from 'decorators/withTriggerGettingRawData';
import { withRestScreenHeight } from 'decorators/withRestScreenHeight';
import * as actions from 'store/actions/tagsCloud';
import styles from './styles';
import FullScreenModalWindow from 'components/modalWindows/FullScreenModalWindow';
import {
  downloadRawTagsCloudDataFile,
  uploadRawTagsCloudDataFile,
} from 'store/actions/tagsCloudDataFile';
import TagForm from './TagForm';
import SearchWithAutocomplete from './searchWithAutocomplete';
import { QueryStatuses } from 'constants/queryStatuses';
import editIconSrc from './assets/edit.svg';
import copyIconSrc from './assets/copy.svg';
import trashIconSrc from './assets/trash.svg';

import type { TagDataT, ClassesT } from 'types/types';
import type { RootStateT, AppDispatchT } from 'store/types';
import { withStyles } from '@material-ui/core';

type CreatedTagDataT = Partial<Omit<TagDataT, 'id'>>;

const { PENDING } = QueryStatuses;

const getTagsData = (state: RootStateT) => state.tagsData.data;
const getSearchAutocompleteSuggestions = createSelector(
  [getTagsData],
  tagsRawData =>
    tagsRawData
      ? tagsRawData.map(item => ({ id: item.id, label: item.label }))
      : [],
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

  uploadTagsDataFile = (e: SyntheticEvent<HTMLInputElement>) => {
    if (
      !(e.target instanceof HTMLInputElement) ||
      !e.target.files ||
      !e.target.files[0]
    ) {
      return;
    }

    this.props.uploadTagsDataFile(e.target.files[0]);
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
          onChange={this.uploadTagsDataFile}
        />
      </div>
    );
  };

  downloadTagsDataFile = () => {
    const tagsData = this.props.tagsData.data;
    if (!tagsData) return;
    downloadRawTagsCloudDataFile(tagsData);
  };

  renderFileDownloader = (disabled: boolean) => (
    <button
      className={this.props.classes.downloadButton}
      disabled={disabled}
      onClick={this.downloadTagsDataFile}
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
      <FullScreenModalWindow onContainerClick={this.resetIdForDelete}>
        <div className={classes.confirmDelete}>
          {modalWindowBody}
        </div>
      </FullScreenModalWindow>
    );
  };

  onDelete = (e: SyntheticEvent<EventTarget>) => {
    if (
      this.state.tagIdToDelete !== undefined ||
      !(e.currentTarget instanceof HTMLButtonElement)
    ) {
      return;
    }
    const id = e.currentTarget.dataset.id;
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
    if (!(e.currentTarget instanceof HTMLButtonElement)) {
      return;
    }

    const targetId = e.currentTarget.dataset.id;
    const { tagsData } = this.props;
    const targetTagData = tagsData.data?.find(item => item.id === targetId);

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
    if (!(e.currentTarget instanceof HTMLButtonElement)) {
      return;
    }

    const id = e.currentTarget.dataset.id;
    const { tagsData } = this.props;
    const editedTagData = tagsData.data?.find(item => item.id === id);
    this.setState({ editedTagData });
  };

  closeTagForm = () => {
    this.setState({ editedTagData: undefined, createdTagData: undefined });
  };

  onSearch = (target: string | null) => {
    const {
      tagsData: { data },
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
          <div
            className={classes.tagsListLabel}
            key="label"
          >
            {item.label}
          </div>
          <div>
            {item.sentimentScore}
          </div>
          <button
            className={cx(classes.tagsListButton, classes.cloneButton)}
            data-id={item.id}
            key="clone"
            onClick={this.onClone}
          >
            <img
              alt="clone"
              src={copyIconSrc}
            />
          </button>
          <button
            className={cx(classes.tagsListButton, classes.editButton)}
            data-id={item.id}
            key="edit"
            onClick={this.onEdit}
          >
            <img
              alt="edit"
              src={editIconSrc}
            />
          </button>
          <button
            className={cx(classes.tagsListButton, classes.deleteButton)}
            data-id={item.id}
            key="delete"
            onClick={this.onDelete}
          >
            <img
              alt="delete"
              src={trashIconSrc}
            />
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
        {this.renderListRow(data, classes)}
      </FixedSizeList>
    );
  };

  render() {
    const { tagsData, searchAutocompleteSuggestions, classes } = this.props;
    const { tagsListHeight, editedTagData, createdTagData } = this.state;
    const loading = tagsData.status === PENDING;
    const tagFormData = createdTagData || editedTagData;

    return (
      <div>
        {this.renderLoader(loading)}
        <div
          className={classes.cloudConfFiles}
          ref={this.confFilesRef}
        >
          {this.renderFileUploader(loading)}
          {this.renderFileDownloader(!tagsData.data || loading)}
          <button
            className={classes.addNewButton}
            onClick={this.onAdd}
          >
            Add new
          </button>
          <SearchWithAutocomplete
            placeholder="Search a tag by label"
            suggestions={searchAutocompleteSuggestions}
            onSubmit={this.onSearch}
          />
        </div>
        {tagFormData && this.renderTagForm(tagFormData)}
        {tagsData.data && this.renderList(tagsData.data, tagsListHeight)}
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
