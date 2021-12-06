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

import type { TagDataT } from 'types/types';
import type { RootStateT, AppDispatchT } from 'store/types';

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

type PropsT = PropsFromRedux & {
  restScreenHeight: number;
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

  renderLoader = (loading: boolean) => (
    <div style={styles.loaderContainer}>
      <FadeLoader
        /*sizeUnit="px" size="50px"*/
        color="#123abc"
        loading={loading}
      />
    </div>
  );

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

  renderFileUploader = (disabled: boolean) => (
    <div style={styles.fileUploader}>
      <label htmlFor="cloud_conf_upload" style={styles.fileUploaderLabel}>
        Choose tags cloud configuration file (*.json)
      </label>
      <input
        id="cloud_conf_upload"
        type="file"
        onChange={this.uploadCloudRawDataFile}
        accept=".json"
        disabled={disabled}
      />
    </div>
  );

  downloadCloudRawDataFile = () => {
    const tagsCloudData = this.props.rawData.data;
    if (!tagsCloudData) return;
    downloadRawTagsCloudDataFile(tagsCloudData);
  };

  renderFileDownloader = (disabled: boolean) => (
    <button onClick={this.downloadCloudRawDataFile} disabled={disabled}>
      Download tags cloud as a file
    </button>
  );

  resetIdForDelete = () => {
    this.setState({ tagIdToDelete: undefined });
  };

  renderConfirmDelete = (tagIdToDelete: string) => {
    const onConfirm = () => {
      this.resetIdForDelete();
      this.props.deleteTag(tagIdToDelete);
    };

    const modalWindowBody = [
      <span key="question" style={styles.confirmDeleteQuestion}>
        Are you sure you want to delete tag with "{tagIdToDelete}" id?
      </span>,
      <div key="buttons" style={styles.confirmDeleteButtons}>
        <button onClick={this.resetIdForDelete} key="cancel">
          cancel
        </button>
        <button onClick={onConfirm} key="delete" style={{ marginLeft: '24px' }}>
          delete
        </button>
      </div>,
    ];

    return (
      <SmallModalWindow onContainerClick={this.resetIdForDelete}>
        <div style={styles.confirmDelete}>{modalWindowBody}</div>
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
    'id' in data ? this.props.editTag(data) : this.props.addTag(data);
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
        onSubmit={this.onTagChange}
        onCancel={this.closeTagForm}
        initValues={data}
      />
    </FullScreenModalWindow>
  );

  renderListRow =
    (data: ReadonlyArray<TagDataT>) =>
    ({ index, style }: { index: number; style: {} }) => {
      const item = data[index];
      return (
        <li style={{ ...styles.tagsListRow, ...style }}>
          <span key="label" style={styles.tagsListLabel}>
            {item.label}
          </span>
          <span key="sentimentScore">{item.sentimentScore}</span>
          <button
            data-id={item.id}
            onClick={this.onClone}
            style={styles.tagsListButton}
            key="clone"
          >
            clone
          </button>
          <button
            data-id={item.id}
            onClick={this.onEdit}
            style={styles.tagsListButton}
            key="edit"
          >
            edit
          </button>
          <button
            data-id={item.id}
            onClick={this.onDelete}
            style={styles.tagsListButton}
            key="delete"
          >
            delete
          </button>
        </li>
      );
    };

  renderList = (data: ReadonlyArray<TagDataT>, height: number) => {
    return (
      <FixedSizeList
        height={height}
        itemCount={data.length}
        itemSize={TAGS_LIST_ROW_HEIGHT}
        width="100%"
        ref={this.listRef}
      >
        {this.renderListRow(data)}
      </FixedSizeList>
    );
  };

  render() {
    const { rawData, searchAutocompleteSuggestions } = this.props;
    const { tagsListHeight, editedTagData, createdTagData } = this.state;
    const loading = rawData.isFetching;
    const tagFormData = createdTagData || editedTagData;

    return (
      <div>
        {this.renderLoader(loading)}
        <div
          key="cloudConfFiles"
          style={styles.cloudConfFiles}
          ref={this.confFilesRef}
        >
          {this.renderFileUploader(loading)}
          {this.renderFileDownloader(!!(!rawData.data || loading))}
          <button onClick={this.onAdd}>Add new</button>
          <SearchWithAutocomplete
            suggestions={searchAutocompleteSuggestions}
            placeholder="Search a tag by label"
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

const TagsListEditorWithRestScreenHeight =
  withRestScreenHeight<PropsT>(TagsListEditor);

type TagsListEditorWithRestScreenHeightPropsT = React.ComponentProps<
  typeof TagsListEditorWithRestScreenHeight
>;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withTriggerGettingRawData<TagsListEditorWithRestScreenHeightPropsT>(
    TagsListEditorWithRestScreenHeight,
  ),
);
